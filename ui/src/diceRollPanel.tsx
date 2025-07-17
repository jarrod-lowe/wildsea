import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { GraphQLSubscription } from "@aws-amplify/api-graphql";
import { DiceRoll, Subscription as GQLSubscription } from "../../appsync/graphql";
import { diceRolledSubscription } from "../../appsync/schema";

interface DiceRollPanelProps {
  gameId: string;
}

export const DiceRollPanel: React.FC<DiceRollPanelProps> = ({ gameId }) => {
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
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
      console.log('Subscribing to dice rolls for game:', gameId);
      const client = generateClient();
      const subscription = client.graphql<GraphQLSubscription<GQLSubscription>>({
        query: diceRolledSubscription,
        variables: { gameId },
      }).subscribe({
        next: ({ data }) => {
          console.log('Received dice roll data:', data);
          if (data?.diceRolled) {
            console.log('Adding dice roll to panel:', data.diceRolled);
            setDiceRolls(prev => [data.diceRolled!, ...prev].slice(0, 50)); // Keep last 50 rolls
            
            // Shake button if panel is closed
            if (!isVisible) {
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
      console.log('Dice roll subscription established');
    } catch (error) {
      console.error('Error subscribing to dice rolls:', error);
    }
  };

  const togglePanel = () => {
    setIsVisible(!isVisible);
    setShouldShake(false); // Stop shaking when panel is opened
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
          <h3 id="dice-rolls-title">Dice Rolls</h3>
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
        >
          {diceRolls.length === 0 ? (
            <p className="no-rolls">No dice rolls yet</p>
          ) : (
            diceRolls.map((roll, index) => (
              <div 
                key={`${roll.gameId}-${roll.playerId}-${index}`} 
                className="dice-roll-item"
                role="listitem"
              >
                <p>{JSON.stringify(roll, null, 2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
      
      {!isVisible && (
        <button 
          className={`dice-roll-toggle ${shouldShake ? 'shake' : ''}`}
          onClick={togglePanel}
          aria-label={`Show dice rolls panel${diceRolls.length > 0 ? ` (${diceRolls.length} rolls)` : ''}`}
          aria-expanded="false"
          aria-controls="dice-rolls-panel"
        >
          🎲
        </button>
      )}
    </>
  );
};