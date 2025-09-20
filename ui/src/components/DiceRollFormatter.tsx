import React from 'react';
import { useIntl } from 'react-intl';
import { DiceRoll } from "../../../appsync/graphql";
import { RollTypes, Grades } from "../../../graphql/lib/constants/rollTypes";

const formatGrade = (grade: string, rollType: string, intl: any) => {
  if (rollType === RollTypes.SUM) {
    return { emoji: '🎲', text: '', className: 'grade-neutral', borderClassName: 'border-neutral' };
  }
  
  switch (grade) {
    case Grades.CRITICAL_SUCCESS:
      return { emoji: '🔥', text: intl.formatMessage({ id: 'diceRoll.grade.CRITICAL_SUCCESS' }), className: 'grade-critical-success', borderClassName: 'border-critical-success' };
    case Grades.SUCCESS:
      return { emoji: '✅', text: intl.formatMessage({ id: 'diceRoll.grade.SUCCESS' }), className: 'grade-success', borderClassName: 'border-success' };
    case Grades.FAILURE:
      return { emoji: '❌', text: intl.formatMessage({ id: 'diceRoll.grade.FAILURE' }), className: 'grade-failure', borderClassName: 'border-failure' };
    case Grades.FUMBLE:
      return { emoji: '💀', text: intl.formatMessage({ id: 'diceRoll.grade.FUMBLE' }), className: 'grade-fumble', borderClassName: 'border-fumble' };
    default:
      return { emoji: '🎲', text: '', className: 'grade-neutral', borderClassName: 'border-neutral' };
  }
};

const formatDiceDetails = (diceList: any[], grade: string, target?: number, action?: string, proxyRoll?: boolean, rolledBy?: string, intl?: any) => {
  const values = diceList.map(die => die.value);
  const sum = values.reduce((a, b) => a + b, 0);
  
  let rollPart;
  if (diceList.length === 1) {
    rollPart = `${sum}`;
  } else {
    rollPart = `${values.join(' + ')} = ${sum}`;
  }
  
  let result;
  if (target !== undefined && target !== null) {
    result = `${rollPart} vs. ${target}; ${grade}`;
  } else {
    result = `${rollPart}; ${grade}`;
  }
  
  // Add proxy roll suffix if present
  if (proxyRoll && rolledBy && intl) {
    const proxyText = intl.formatMessage({ id: 'diceRoll.proxyBy' }, { rollerName: rolledBy });
    result = `${result} ${proxyText}`;
  }
  
  // Add action prefix if present
  if (action && action.trim() !== '') {
    result = `${action}: ${result}`;
  }
  
  return result;
};

const getTranslationKey = (roll: DiceRoll, intl: any) => {
  // Use messageType for the translation key
  const messageType = roll.messageType || 'neutral';
  // Level is the grade, lowercased (e.g., 'success', 'failure', 'neutral', etc)
  const level = (roll.grade || 'neutral').toLowerCase();
  // Compose the base key
  const baseKey = `result.${messageType}.${level}`;

  // Count available translations for this key pattern
  let count = 0;
  let testKey = `${baseKey}.${count}`;
  while (intl.messages[testKey]) {
    count++;
    testKey = `${baseKey}.${count}`;
  }

  if (count === 0) {
    // Fallback if no translations found
    return null;
  }

  // Use modulo to select from available translations
  const selectedIndex = (roll.messageIndex || 0) % count;
  return `${baseKey}.${selectedIndex}`;
};

interface DiceRollFormatterProps {
  roll: DiceRoll;
}

export const DiceRollFormatter: React.FC<DiceRollFormatterProps> = ({ roll }) => {
  const intl = useIntl();
  const gradeInfo = formatGrade(roll.grade, roll.rollType, intl);

  // Get the dynamic message translation using messageType and grade
  const translationKey = getTranslationKey(roll, intl);

  let dynamicMessage = '';
  if (translationKey) {
    try {
      dynamicMessage = intl.formatMessage(
        { id: translationKey },
        {
          name: roll.playerName,
          roll: roll.value,
          target: roll.target,
          action: roll.action,
        }
      );
    } catch (error) {
      // Fallback to old format if translation fails
      dynamicMessage = `${roll.playerName} rolled ${roll.value}`;
    }
  } else {
    // Fallback to old format if no translation found
    dynamicMessage = `${roll.playerName} rolled ${roll.value}`;
  }

  const hasTarget = roll.rollType !== RollTypes.SUM;

  return (
    <div className="dice-roll-formatted">
      <div className="roll-header">
        {dynamicMessage}
      </div>

      <div className="roll-details">
        {formatDiceDetails(roll.diceList, gradeInfo.text, hasTarget ? roll.target : undefined, roll.action || undefined, roll.proxyRoll, roll.rolledBy, intl)}
      </div>
    </div>
  );
};

export { formatGrade, formatDiceDetails };