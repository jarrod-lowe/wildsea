import React, { useState } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { DiceRollModal } from './components/DiceRollModal';
import { SectionEditForm } from './components/SectionEditForm';

interface DeltaGreenStatItem extends BaseSectionItem {
  score: number | string;
  distinguishingFeatures: string;
};

type SectionTypeDeltaGreenStats = BaseSectionContent<DeltaGreenStatItem>;

const DEFAULT_STATS = [
  { name: 'Strength (STR)', abbreviation: 'STR' },
  { name: 'Constitution (CON)', abbreviation: 'CON' },
  { name: 'Dexterity (DEX)', abbreviation: 'DEX' },
  { name: 'Intelligence (INT)', abbreviation: 'INT' },
  { name: 'Power (POW)', abbreviation: 'POW' },
  { name: 'Charisma (CHA)', abbreviation: 'CHA' },
];

export const SectionDeltaGreenStats: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{ name: string; value: number; actionText: string } | null>(null);

  const handleDiceClick = (statName: string, statValue: number) => {
    const actionText = intl.formatMessage({ id: 'deltaGreenStats.actionWith' }, { statName });
    setSelectedStat({ name: statName, value: statValue, actionText });
    setDiceModalOpen(true);
  };

  const renderItems = (
        content: SectionTypeDeltaGreenStats,
        _mayEditSheet: boolean,
        _setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>,
        _updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
        _isEditing: boolean,
    ) => {
    // Create data attributes from current stats for derived attributes to read
    const statsDataAttributes: { [key: string]: number } = {};
    content.items.forEach(item => {
      // Find the corresponding stat definition to get the abbreviation
      const statDef = DEFAULT_STATS.find(stat => stat.name === item.name);
      if (statDef) {
        const numericScore = typeof item.score === 'string' ? parseInt(item.score) || 0 : item.score;
        statsDataAttributes[`data-stat-${statDef.abbreviation.toLowerCase()}`] = numericScore;
      }
    });

    return (
      <div className="delta-green-stats-grid" {...statsDataAttributes}>
        <div className="stats-header">
          <div className="stats-col-statistic">{intl.formatMessage({ id: "deltaGreenStats.statistic" })}</div>
          <div className="stats-col-score">{intl.formatMessage({ id: "deltaGreenStats.score" })}</div>
          <div className="stats-col-x5">{intl.formatMessage({ id: "deltaGreenStats.x5" })}</div>
          <div className="stats-col-features">{intl.formatMessage({ id: "deltaGreenStats.distinguishingFeatures" })}</div>
        </div>
        {content.items.map(item => {
          const numericScore = typeof item.score === 'string' ? parseInt(item.score) || 0 : item.score;
          return (
            <div key={item.id} className="stats-row">
              <div className="stats-col-statistic">{item.name}</div>
              <div className="stats-col-score">
                <span>{numericScore}</span>
              </div>
              <div className="stats-col-x5">
                <span className="x5-display">{numericScore * 5}</span>
                {numericScore > 0 && (
                  <button
                    className="dice-button"
                    onClick={() => handleDiceClick(item.name, numericScore * 5)}
                    aria-label={intl.formatMessage({ id: 'deltaGreenStats.rollDice' }, { statName: item.name })}
                    title={intl.formatMessage({ id: 'deltaGreenStats.rollDice' }, { statName: item.name })}
                  >
                    {intl.formatMessage({ id: 'dice.icon' })}
                  </button>
                )}
              </div>
              <div className="stats-col-features">
                <span>{item.distinguishingFeatures}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEditForm = (content: SectionTypeDeltaGreenStats, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>, handleUpdate: () => void, handleCancel: () => void) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { 
        id: uuidv4(), 
        name: '', 
        description: '', 
        score: 10, 
        distinguishingFeatures: '' 
      }];
      setContent({ ...content, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = content.items.filter((_, i) => i !== index);
      setContent({ ...content, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
      const newItems = [...content.items];
      
      // Handle score field with proper validation
      if (field === 'score') {
        if (typeof value === 'string') {
          // Allow empty string for editing, but validate on conversion
          if (value === '') {
            newItems[index] = { ...newItems[index], [field]: '' as any };
          } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              // Clamp to valid range (0-18)
              const clampedValue = Math.max(0, Math.min(18, numValue));
              newItems[index] = { ...newItems[index], [field]: clampedValue };
            }
          }
        } else {
          // Handle direct number input
          const clampedValue = Math.max(0, Math.min(18, value as number));
          newItems[index] = { ...newItems[index], [field]: clampedValue };
        }
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      
      setContent({ ...content, items: newItems });
    };

    const handleScoreBlur = (index: number, value: string) => {
      // Convert empty string to 0 on blur
      if (value === '') {
        handleItemChange(index, 'score', 0);
      }
    };

    return (
      <SectionEditForm
        content={content}
        setContent={setContent}
        renderItemEdit={(item, index) => (
          <>
            <input
              type="text"
              value={item.name || ''}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.statistic" })}
            />
            <input
              type="number"
              min="0"
              max="18"
              value={item.score === '' ? '' : (item.score || 0)}
              onChange={(e) => handleItemChange(index, 'score', e.target.value)}
              onBlur={(e) => handleScoreBlur(index, e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.score" })}
            />
            <input
              type="text"
              value={item.distinguishingFeatures || ''}
              onChange={(e) => handleItemChange(index, 'distinguishingFeatures', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.distinguishingFeatures" })}
              maxLength={40}
            />
          </>
        )}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
        handleUpdate={handleUpdate}
        handleCancel={handleCancel}
      />
    );
  };

  return (
    <>
      <BaseSection<DeltaGreenStatItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />
      {selectedStat && (
        <DiceRollModal
          isOpen={diceModalOpen}
          onRequestClose={() => setDiceModalOpen(false)}
          gameId={props.section.gameId}
          skillValue={selectedStat.value}
          initialAction={selectedStat.actionText}
        />
      )}
    </>
  );
};

export const createDefaultDeltaGreenStatsContent = (): SectionTypeDeltaGreenStats => ({
  showEmpty: false,
  items: DEFAULT_STATS.map(stat => ({
    id: uuidv4(),
    name: stat.name,
    description: '',
    score: 10,
    distinguishingFeatures: '',
  }))
});