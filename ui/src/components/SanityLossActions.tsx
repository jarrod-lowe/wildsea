import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../../appsync/schema";
import { RollDiceInput } from "../../../appsync/graphql";
import { RollTypes } from "../../../graphql/lib/constants/rollTypes";

interface SanityLossActionsProps {
  gameId: string;
  onBehalfOf?: string;
  onSanityLoss: (amount: number) => void;
  onCloseAndShowNewRoll?: (rollResult: any) => void;
}

interface SanityLossOption {
  dice: string;
  size: number;
  label: string;
}

const sanityLossOptions: SanityLossOption[] = [
  { dice: '1d4', size: 4, label: '1d4' },
  { dice: '1d6', size: 6, label: '1d6' },
  { dice: '1d8', size: 8, label: '1d8' },
  { dice: '1d10', size: 10, label: '1d10' },
  { dice: '1d20', size: 20, label: '1d20' },
];

export const SanityLossActions: React.FC<SanityLossActionsProps> = ({
  gameId,
  onBehalfOf,
  onSanityLoss,
  onCloseAndShowNewRoll
}) => {
  const intl = useIntl();
  const [isRolling, setIsRolling] = useState(false);

  const handleSanityLossRoll = async (option: SanityLossOption) => {
    setIsRolling(true);
    try {
      const client = generateClient();
      const input: RollDiceInput = {
        gameId,
        dice: [{ type: option.dice, size: option.size }],
        rollType: RollTypes.SUM,
        target: 0,
        action: intl.formatMessage({ id: 'sanityLoss.action' }),
        onBehalfOf: onBehalfOf || undefined,
        messageType: 'deltaGreen',
      };
      
      const result = await client.graphql({
        query: rollDiceMutation,
        variables: { input },
      });

      if ('data' in result && result.data?.rollDice) {
        const diceRollResult = result.data.rollDice;
        const totalRoll = diceRollResult.value || 0;
        
        // Apply the sanity loss immediately
        onSanityLoss(totalRoll);
        
        // Close current modal and show new roll if callback provided
        if (onCloseAndShowNewRoll) {
          onCloseAndShowNewRoll(diceRollResult);
        }
      }
    } catch (error) {
      console.error('Error rolling for sanity loss:', error);
      alert(intl.formatMessage({ id: 'sanityLoss.rollError' }));
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="sanity-loss-panel">
      <h4>
        <FormattedMessage id="sanityLoss.title" />
      </h4>
      <p className="sanity-loss-description">
        <FormattedMessage id="sanityLoss.description" />
      </p>

      <div className="sanity-loss-buttons">
        {sanityLossOptions.map((option) => (
          <button
            key={option.dice}
            className="btn-sanity-loss"
            onClick={() => handleSanityLossRoll(option)}
            disabled={isRolling}
            title={intl.formatMessage({ id: 'sanityLoss.rollTitle' }, { dice: option.label })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};