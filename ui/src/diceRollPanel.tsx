import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { GraphQLSubscription, GraphqlSubscriptionResult } from "@aws-amplify/api-graphql";
import { DiceRoll, Subscription as GQLSubscription } from "../../appsync/graphql";
import { diceRolledSubscription, rollDiceMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { RollTypes, Grades } from "../../graphql/lib/constants/rollTypes";
import { RollDiceInput } from "../../appsync/graphql";
import { DiceRollFormatter, formatGrade } from './components/DiceRollFormatter';

interface DiceRollPanelProps {
  gameId: string;
}


export const DiceRollPanel: React.FC<DiceRollPanelProps> = ({ gameId }) => {
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [newRollIds, setNewRollIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showSkulls, setShowSkulls] = useState(false);
  const [showButtonFireworks, setShowButtonFireworks] = useState(false);
  const [showButtonSkulls, setShowButtonSkulls] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const intl = useIntl();

  useEffect(() => {
    if (gameId) {
      subscribeToDiceRolls();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [gameId]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else if (!isVisible && closeButtonRef.current) {
      // Remove focus when panel is hidden to prevent aria-hidden focus conflict
      closeButtonRef.current.blur();
    }
  }, [isVisible]);

  const subscribeToDiceRolls = async () => {
    try {
      const client = generateClient();
      const subscription = (client.graphql<GraphQLSubscription<GQLSubscription>>({
        query: diceRolledSubscription,
        variables: { gameId },
      }) as GraphqlSubscriptionResult<GQLSubscription>).subscribe({
        next: ({ data }) => {
          if (data?.diceRolled) {
            const newRoll = data.diceRolled!;
            const rollId = `${newRoll.gameId}-${newRoll.playerId}-${newRoll.rolledAt}`;
            
            setDiceRolls(prev => [newRoll, ...prev].slice(0, 50)); // Keep last 50 rolls
            
            // Mark as new roll for animation
            setNewRollIds(prev => new Set(prev).add(rollId));
            
            // Remove new roll animation after it completes
            setTimeout(() => {
              setNewRollIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(rollId);
                return newSet;
              });
            }, 500); // Match CSS animation duration
            
            // Trigger special animations for critical success or fumble
            if (newRoll.grade === Grades.CRITICAL_SUCCESS) {
              setIsVisible(currentIsVisible => {
                if (currentIsVisible) {
                  setShowFireworks(true);
                  setTimeout(() => setShowFireworks(false), 5000);
                } else {
                  setShowButtonFireworks(true);
                  setTimeout(() => setShowButtonFireworks(false), 5000);
                }
                return currentIsVisible;
              });
            } else if (newRoll.grade === Grades.FUMBLE) {
              setIsVisible(currentIsVisible => {
                if (currentIsVisible) {
                  setShowSkulls(true);
                  setTimeout(() => setShowSkulls(false), 5000);
                } else {
                  setShowButtonSkulls(true);
                  setTimeout(() => setShowButtonSkulls(false), 5000);
                }
                return currentIsVisible;
              });
            }
            
            // Increment unread count and shake button if panel is closed
            setIsVisible(currentIsVisible => {
              if (!currentIsVisible) {
                setUnreadCount(prev => prev + 1);
                setShouldShake(true);
                setTimeout(() => setShouldShake(false), 600); // Duration matches CSS animation
              }
              return currentIsVisible; // Don't change the visibility state
            });
          }
        },
        error: (error) => {
          console.error('Dice roll subscription error:', error);
        },
      });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error subscribing to dice rolls:', error);
    }
  };

  const togglePanel = () => {
    setIsVisible(!isVisible);
    setShouldShake(false); // Stop shaking when panel is opened
    setUnreadCount(0); // Reset unread count when panel is opened/closed
  };

  const rollSimpleDice = async (dieSize: number) => {
    try {
      const client = generateClient();
      const input: RollDiceInput = {
        gameId,
        dice: [{ type: `d${dieSize}`, size: dieSize }],
        rollType: RollTypes.SUM,
        target: 0, // Not used for sum rolls
        messageType: 'neutral',
      };
      
      await client.graphql({
        query: rollDiceMutation,
        variables: { input },
      });
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  };

  return (
    <>
      <div 
        id="dice-rolls-panel"
        className={`dice-roll-panel ${isVisible ? 'visible' : 'hidden'}`}
        role="region"
        aria-label="Dice rolls panel"
        {...(!isVisible && { inert: true })}
      >
        <div className="dice-roll-header">
          <h3 id="dice-rolls-title"><FormattedMessage id="diceRollPanel.title" /></h3>
          <button 
            ref={closeButtonRef}
            className="panel-close-button"
            onClick={togglePanel}
            aria-label={intl.formatMessage({ id: 'diceRollPanel.hidePanel' })}
          >
            <FormattedMessage id="diceRollPanel.closeButton" />
          </button>
        </div>
        <div 
          className="dice-roll-content"
          role="log"
          aria-labelledby="dice-rolls-title"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="dice-roll-list-container">
            {diceRolls.length === 0 ? (
              <p className="no-rolls" role="status"><FormattedMessage id="diceRollPanel.noRolls" /></p>
            ) : (
              <ul className="dice-roll-list" role="list" aria-label={intl.formatMessage({ id: 'diceRollPanel.recentRolls' })}>
                {diceRolls.map((roll) => {
                  const rollId = `${roll.gameId}-${roll.playerId}-${roll.rolledAt}`;
                  const isNew = newRollIds.has(rollId);
                  const gradeInfo = formatGrade(roll.grade, roll.rollType, intl);
                  return (
                    <li 
                      key={rollId} 
                      className={`dice-roll-item ${gradeInfo.borderClassName} ${isNew ? 'slide-in' : ''}`}
                      role="listitem"
                      aria-label={intl.formatMessage({ id: 'diceRollPanel.rollBy' }, { playerName: roll.playerName })}
                    >
                      <DiceRollFormatter roll={roll} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          <div className="simple-dice-buttons">
            <div className="dice-button-row">
              {[4, 6, 8, 10, 12, 20, 100].map((dieSize) => (
                <button
                  key={dieSize}
                  className="simple-dice-button"
                  onClick={() => rollSimpleDice(dieSize)}
                  aria-label={intl.formatMessage({ id: 'diceRollPanel.rollDie' }, { size: dieSize })}
                >
                  d{dieSize}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Panel animations */}
        {showFireworks && (
          <div className="panel-animation fireworks-animation" aria-hidden="true">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`firework firework-${i + 1}`}>
                <FormattedMessage id="diceRoll.animation.firework" />
              </div>
            ))}
          </div>
        )}
        
        {showSkulls && (
          <div className="panel-animation skulls-animation" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`skull skull-${i + 1}`}>
                <FormattedMessage id="diceRoll.animation.skull" />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!isVisible && (
        <button 
          className={`dice-roll-toggle ${shouldShake ? 'shake' : ''}`}
          onClick={togglePanel}
          aria-label={unreadCount > 0 
            ? `${intl.formatMessage({ id: 'diceRollPanel.showPanel' })} (${intl.formatMessage({ id: 'diceRollPanel.newRolls' }, { count: unreadCount })})`
            : intl.formatMessage({ id: 'diceRollPanel.showPanel' })
          }
          aria-expanded="false"
          aria-controls="dice-rolls-panel"
          aria-describedby={unreadCount > 0 ? "dice-roll-count" : undefined}
        >
          🎲
          {unreadCount > 0 && (
            <span id="dice-roll-count" className="roll-count" aria-hidden="true">
              {unreadCount}
            </span>
          )}
          
          {/* Button animations */}
          {showButtonFireworks && (
            <div className="button-animation button-fireworks-animation" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`button-firework button-firework-${i + 1}`}>
                  <FormattedMessage id="diceRoll.animation.firework" />
                </div>
              ))}
            </div>
          )}
          
          {showButtonSkulls && (
            <div className="button-animation button-skulls-animation" aria-hidden="true">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`button-skull button-skull-${i + 1}`}>
                  <FormattedMessage id="diceRoll.animation.skull" />
                </div>
              ))}
            </div>
          )}
        </button>
      )}
    </>
  );
};