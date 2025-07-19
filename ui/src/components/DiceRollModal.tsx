import React, { useState, useRef, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../../appsync/schema";
import { RollDiceInput, DiceRoll } from "../../../appsync/graphql";
import { RollTypes } from "../../../graphql/lib/constants/rollTypes";
import { DiceRollFormatter } from './DiceRollFormatter';

interface DiceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  skillName: string;
  skillValue: number;
  onRollComplete?: (grade: string) => void;
}

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
  isOpen,
  onClose,
  gameId,
  skillName,
  skillValue,
  onRollComplete
}) => {
  const intl = useIntl();
  const [action, setAction] = useState(`for ${skillName}`);
  const [target, setTarget] = useState(skillValue);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<DiceRoll | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAction(`for ${skillName}`);
      setTarget(skillValue);
      setRollResult(null);
      setIsRolling(false);
      
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input') as HTMLElement;
        firstInput?.focus();
      }, 100);
    }
  }, [isOpen, skillName, skillValue]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRolling) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isRolling, onClose]);

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
      };
      
      const result = await client.graphql({
        query: rollDiceMutation,
        variables: { input },
      });

      if ('data' in result && result.data?.rollDice) {
        const rollResult = result.data.rollDice;
        setRollResult(rollResult);
        if (onRollComplete) {
          onRollComplete(rollResult.grade);
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
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isRolling) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dice-roll-modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content dice-roll-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="dice-roll-modal-title">
            <FormattedMessage id="diceRollModal.title" />
          </h2>
          <button
            ref={closeButtonRef}
            className="modal-close-button"
            onClick={handleClose}
            disabled={isRolling}
            aria-label={intl.formatMessage({ id: 'diceRollModal.close' })}
          >
            ×
          </button>
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
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRolling}
                  aria-describedby="roll-button-help"
                >
                  {isRolling ? (
                    <FormattedMessage id="diceRollModal.rolling" />
                  ) : (
                    <FormattedMessage id="diceRollModal.roll" />
                  )}
                </button>
                <div id="roll-button-help" className="form-help">
                  <FormattedMessage id="diceRollModal.rollHelp" />
                </div>
              </div>
            </form>
          ) : (
            <div className="roll-result-container">
              <h3>
                <FormattedMessage id="diceRollModal.result" />
              </h3>
              <DiceRollFormatter roll={rollResult} />
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleClose}
                  autoFocus
                >
                  <FormattedMessage id="diceRollModal.close" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};