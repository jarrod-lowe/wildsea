import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../../appsync/schema";
import { RollDiceInput, DiceRoll } from "../../../appsync/graphql";
import { RollTypes, Grades } from "../../../graphql/lib/constants/rollTypes";
import { DiceRollFormatter } from './DiceRollFormatter';

interface DiceRollModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  gameId: string;
  skillValue: number;
  initialAction: string;
  onRollComplete?: (result: DiceRoll) => void;
  onBehalfOf?: string;
  customActionsAfterRoll?: React.ReactNode | ((rollResult: DiceRoll) => React.ReactNode);
  prePopulatedResult?: DiceRoll;
  messageType?: string;
}

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
  isOpen,
  onRequestClose,
  gameId,
  skillValue,
  initialAction,
  onRollComplete,
  onBehalfOf,
  customActionsAfterRoll,
  prePopulatedResult,
  messageType
}) => {
  const intl = useIntl();
  const [action, setAction] = useState(initialAction);
  const [target, setTarget] = useState(skillValue);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<DiceRoll | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showSkulls, setShowSkulls] = useState(false);
  const rollButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const triggerAnimationForGrade = (grade: string) => {
    if (grade === Grades.CRITICAL_SUCCESS) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 5000);
    } else if (grade === Grades.FUMBLE) {
      setShowSkulls(true);
      setTimeout(() => setShowSkulls(false), 5000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAction(initialAction);
      setTarget(skillValue);
      setShowFireworks(false);
      setShowSkulls(false);
      setIsRolling(false);

      if (prePopulatedResult) {
        setRollResult(prePopulatedResult);
        triggerAnimationForGrade(prePopulatedResult.grade);
      } else {
        setRollResult(null);
      }

      setTimeout(() => {
        rollButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen, skillValue, initialAction, prePopulatedResult]);



  const targetOptions = [-40, -30, -20, -10, 0, 10, 20, 30, 40].map(modifier => {
    const value = Math.max(0, Math.min(99, skillValue + modifier));
    return { modifier, value };
  });

  const handleRoll = async () => {
    setIsRolling(true);
    try {
      const client = generateClient();
      const input: RollDiceInput = {
        gameId,
        dice: [{ type: 'd100', size: 100 }],
        rollType: RollTypes.DELTA_GREEN,
        target,
        action: action.trim() || undefined,
        onBehalfOf: onBehalfOf || undefined,
        messageType: messageType || 'deltaGreen',
      };
      
      const result = await client.graphql({
        query: rollDiceMutation,
        variables: { input },
      });

      if ('data' in result && result.data?.rollDice) {
        const rollResult = result.data.rollDice;
        setRollResult(rollResult);
        triggerAnimationForGrade(rollResult.grade);
        if (onRollComplete) {
          onRollComplete(rollResult);
        }
      }
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const handleClose = () => {
    if (!isRolling) {
      onRequestClose();
    }
  };



  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={isRolling ? () => {} : onRequestClose}
      contentLabel={intl.formatMessage({ id: 'diceRollModal.title' })}
      className="dice-roll-modal"
      overlayClassName="modal-overlay"
    >
        <div className="modal-header">
          <h2 id="dice-roll-modal-title">
            <FormattedMessage id="diceRollModal.title" />
          </h2>
        </div>

        <div className="modal-body">
          {!rollResult ? (
            <form onSubmit={(e) => { e.preventDefault(); handleRoll(); }}>
              <div className="form-group">
                <label htmlFor="action-input">
                  <FormattedMessage id="diceRollModal.action" />
                </label>
                <input
                  id="action-input"
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={isRolling}
                  placeholder={intl.formatMessage({ id: 'diceRollModal.actionPlaceholder' })}
                  aria-describedby="action-help"
                />
                <div id="action-help" className="form-help">
                  <FormattedMessage id="diceRollModal.actionHelp" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="target-select">
                  <FormattedMessage id="diceRollModal.target" />
                </label>
                <select
                  id="target-select"
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value))}
                  disabled={isRolling}
                  aria-describedby="target-help"
                >
                  {targetOptions.map(({ modifier, value }) => (
                    <option key={modifier} value={value}>
                      {value}% {modifier !== 0 && `(${modifier > 0 ? '+' : ''}${modifier}%)`}
                    </option>
                  ))}
                </select>
                <div id="target-help" className="form-help">
                  <FormattedMessage 
                    id="diceRollModal.targetHelp" 
                    values={{ skillValue: skillValue }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  ref={rollButtonRef}
                  type="submit"
                  className="btn-standard"
                  disabled={isRolling}
                >
                  {isRolling ? (
                    <FormattedMessage id="diceRollModal.rolling" />
                  ) : (
                    <FormattedMessage id="diceRollModal.roll" />
                  )}
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="btn-secondary"
                  onClick={handleClose}
                  disabled={isRolling}
                >
                  <FormattedMessage id="diceRollModal.close" />
                </button>
              </div>
            </form>
          ) : (
            <div className="roll-result-container">
              <h3>
                <FormattedMessage id="diceRollModal.result" />
              </h3>
              <DiceRollFormatter roll={rollResult} />

              {(() => {
                if (!customActionsAfterRoll) return null;

                const actions = typeof customActionsAfterRoll === 'function'
                  ? customActionsAfterRoll(rollResult)
                  : customActionsAfterRoll;

                return actions ? (
                  <div className="custom-actions-panel">
                    {actions}
                  </div>
                ) : null;
              })()}

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={handleClose}
                  autoFocus={true}
                >
                  <FormattedMessage id="diceRollModal.close" />
                </button>
              </div>

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
          )}
        </div>
    </Modal>
  );
};