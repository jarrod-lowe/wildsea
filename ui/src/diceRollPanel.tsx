import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { GraphQLSubscription } from "@aws-amplify/api-graphql";
import { DiceRoll, Subscription as GQLSubscription } from "../../appsync/graphql";
import { diceRolledSubscription } from "../../appsync/schema";
import { FormattedMessage } from 'react-intl';

interface DiceRollPanelProps {
  gameId: string;
}

const formatGrade = (grade: string, rollType: string) => {
  if (rollType === 'sum') {
    return { emoji: '🎲', text: '', className: 'grade-neutral' };
  }
  
  switch (grade) {
    case 'CRITICAL_SUCCESS':
      return { emoji: '🔥', text: 'CRITICAL SUCCESS', className: 'grade-critical-success' };
    case 'SUCCESS':
      return { emoji: '✅', text: 'SUCCESS', className: 'grade-success' };
    case 'FAILURE':
      return { emoji: '❌', text: 'FAILURE', className: 'grade-failure' };
    case 'FUMBLE':
      return { emoji: '💀', text: 'FUMBLE', className: 'grade-fumble' };
    default:
      return { emoji: '🎲', text: '', className: 'grade-neutral' };
  }
};

const formatDiceDetails = (diceList: any[]) => {
  if (diceList.length === 1) {
    return diceList[0].value.toString();
  }
  
  const values = diceList.map(die => die.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return `${values.join(' + ')} = ${sum}`;
};

const formatDiceRoll = (roll: DiceRoll) => {
  const gradeInfo = formatGrade(roll.grade, roll.rollType);
  const playerName = roll.playerName;
  
  return (
    <div className="dice-roll-formatted">
      <div className="roll-header">
        {playerName} rolled{roll.action ? ` ${roll.action}` : ''}
      </div>
      
      {roll.rollType === 'sum' ? (
        <div className="roll-result">
          {gradeInfo.emoji} Total: {roll.value}
        </div>
      ) : (
        <div className="roll-result">
          🎯 Target: {roll.target} → Rolled: {roll.value} → <span className={gradeInfo.className}>{gradeInfo.emoji} {gradeInfo.text}</span>
        </div>
      )}
      
      <div className="roll-details">
        {formatDiceDetails(roll.diceList)}
      </div>
    </div>
  );
};

export const DiceRollPanel: React.FC<DiceRollPanelProps> = ({ gameId }) => {
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [newRollIds, setNewRollIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

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

  const subscribeToDiceRolls = async () => {
    try {
      const client = generateClient();
      const subscription = client.graphql<GraphQLSubscription<GQLSubscription>>({
        query: diceRolledSubscription,
        variables: { gameId },
      }).subscribe({
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
            
            // Increment unread count and shake button if panel is closed
            if (!isVisible) {
              setUnreadCount(prev => prev + 1);
              setShouldShake(true);
              setTimeout(() => setShouldShake(false), 600); // Duration matches CSS animation
            }
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

  return (
    <>
      <div 
        id="dice-rolls-panel"
        className={`dice-roll-panel ${isVisible ? 'visible' : 'hidden'}`}
        role="region"
        aria-label="Dice rolls panel"
        aria-hidden={!isVisible}
      >
        <div className="dice-roll-header">
          <h3 id="dice-rolls-title"><FormattedMessage id="diceRollPanel.title" /></h3>
          <button 
            className="panel-close-button"
            onClick={togglePanel}
            aria-label="Hide dice rolls panel"
          >
            ×
          </button>
        </div>
        <div 
          className="dice-roll-content"
          role="log"
          aria-labelledby="dice-rolls-title"
          aria-live="polite"
          aria-relevant="additions"
        >
          {diceRolls.length === 0 ? (
            <p className="no-rolls" role="status"><FormattedMessage id="diceRollPanel.noRolls" /></p>
          ) : (
            <ul className="dice-roll-list" role="list" aria-label="Recent dice rolls">
              {diceRolls.map((roll) => {
                const rollId = `${roll.gameId}-${roll.playerId}-${roll.rolledAt}`;
                const isNew = newRollIds.has(rollId);
                return (
                  <li 
                    key={rollId} 
                    className={`dice-roll-item ${isNew ? 'slide-in' : ''}`}
                    role="listitem"
                    aria-label={`Dice roll by ${roll.playerName}`}
                  >
                    {formatDiceRoll(roll)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      
      {!isVisible && (
        <button 
          className={`dice-roll-toggle ${shouldShake ? 'shake' : ''}`}
          onClick={togglePanel}
          aria-label={`Show dice rolls panel${unreadCount > 0 ? ` (${unreadCount} new rolls)` : ''}`}
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
        </button>
      )}
    </>
  );
};