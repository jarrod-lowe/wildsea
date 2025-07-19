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

const formatDiceDetails = (diceList: any[]) => {
  if (diceList.length === 1) {
    return diceList[0].value.toString();
  }
  
  const values = diceList.map(die => die.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return `${values.join(' + ')} = ${sum}`;
};

interface DiceRollFormatterProps {
  roll: DiceRoll;
}

export const DiceRollFormatter: React.FC<DiceRollFormatterProps> = ({ roll }) => {
  const intl = useIntl();
  const gradeInfo = formatGrade(roll.grade, roll.rollType, intl);
  const playerName = roll.playerName;
  
  return (
    <div className="dice-roll-formatted">
      <div className="roll-header">
        {playerName} {intl.formatMessage({ id: 'diceRoll.rolled' })}{roll.action ? ` ${roll.action}` : ''}
      </div>
      
      {roll.rollType === RollTypes.SUM ? (
        <div className="roll-result">
          {gradeInfo.emoji} {intl.formatMessage({ id: 'diceRoll.total' }, { value: roll.value })}
        </div>
      ) : (
        <div className="roll-result">
          🎯 {intl.formatMessage({ id: 'diceRoll.target' }, { target: roll.target })} → {intl.formatMessage({ id: 'diceRoll.result' }, { value: roll.value })} → <span className={gradeInfo.className}>{gradeInfo.emoji} {gradeInfo.text}</span>
        </div>
      )}
      
      <div className="roll-details">
        {formatDiceDetails(roll.diceList)}
      </div>
    </div>
  );
};

export { formatGrade, formatDiceDetails };