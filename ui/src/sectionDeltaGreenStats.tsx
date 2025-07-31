import React, { useState } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { DiceRollModal } from './components/DiceRollModal';
import { SectionEditForm } from './components/SectionEditForm';
import { getDeltaGreenStatsSeed } from './seed';
import { SupportedLanguage } from './translations';

interface DeltaGreenStatItem extends BaseSectionItem {
  score: number | string;
  distinguishingFeatures: string;
  abbreviation: string;
};

type SectionTypeDeltaGreenStats = BaseSectionContent<DeltaGreenStatItem>;

const ScoreInlineControls: React.FC<{
  item: DeltaGreenStatItem;
  index: number;
  handleItemChange: (index: number, field: string, value: any) => void;
  handleScoreBlur: (index: number, value: string) => void;
  intl: any;
}> = ({ item, index, handleItemChange, handleScoreBlur, intl }) => {
  const numericScore = typeof item.score === 'string' ? parseInt(item.score) || 0 : item.score;
  return (
    <>
      <button
        type="button"
        onClick={() => handleItemChange(index, 'score', Math.max(0, numericScore - 1))}
        disabled={numericScore <= 0}
        className="adjust-btn small"
        aria-label={intl.formatMessage({ id: 'sectionDeltaGreenStats.decrease' }, { name: item.name })}
      >
        <FormattedMessage id="sectionDeltaGreenStats.decrementSymbol" />
      </button>
      <input
        type="number"
        min="0"
        max="18"
        value={item.score === '' ? '' : (item.score || 0)}
        onChange={(e) => handleItemChange(index, 'score', e.target.value)}
        onBlur={(e) => handleScoreBlur(index, e.target.value)}
        placeholder={intl.formatMessage({ id: "deltaGreenStats.score" })}
        aria-label={intl.formatMessage({ id: "deltaGreenStats.score" })}
        className="score-input-inline"
      />
      <button
        type="button"
        onClick={() => handleItemChange(index, 'score', Math.min(18, numericScore + 1))}
        disabled={numericScore >= 18}
        className="adjust-btn small"
        aria-label={intl.formatMessage({ id: 'sectionDeltaGreenStats.increase' }, { name: item.name })}
      >
        <FormattedMessage id="sectionDeltaGreenStats.incrementSymbol" />
      </button>
    </>
  );
};

// This function will be used to get the language-appropriate stats
const getDefaultStats = (language?: SupportedLanguage) => {
  return getDeltaGreenStatsSeed(language || 'en');
};

export const SectionDeltaGreenStats: React.FC<SectionDefinition> = (props) => {
  const { section, userSubject } = props;
  const intl = useIntl();
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{ name: string; value: number; actionText: string } | null>(null);

  const handleDiceClick = (statName: string, statValue: number) => {
    // Use just the stat name without "with" prefix for the action
    setSelectedStat({ name: statName, value: statValue, actionText: statName });
    setDiceModalOpen(true);
  };

  const renderItems = (
        content: SectionTypeDeltaGreenStats,
        mayEditSheet: boolean,
        _setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>,
        _updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
        _isEditing: boolean,
    ) => {
    // Create data attributes from current stats for derived attributes to read
    const statsDataAttributes: { [key: string]: number } = {};
    content.items.forEach(item => {
      if (item.abbreviation) {
        const numericScore = typeof item.score === 'string' ? parseInt(item.score) || 0 : item.score;
        statsDataAttributes[`data-stat-${item.abbreviation.toLowerCase()}`] = numericScore;
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
                    disabled={!mayEditSheet}
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
        distinguishingFeatures: '',
        abbreviation: ''
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
              aria-label={intl.formatMessage({ id: "deltaGreenStats.statistic" })}
            />
            <div className="score-inline-controls">
              <ScoreInlineControls 
                item={item}
                index={index}
                handleItemChange={handleItemChange}
                handleScoreBlur={handleScoreBlur}
                intl={intl}
              />
            </div>
            <input
              type="text"
              value={item.distinguishingFeatures || ''}
              onChange={(e) => handleItemChange(index, 'distinguishingFeatures', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.distinguishingFeatures" })}
              aria-label={intl.formatMessage({ id: "deltaGreenStats.distinguishingFeatures" })}
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

  // Determine if we need to pass onBehalfOf
  const shouldUseOnBehalfOf = userSubject !== section.userId;
  const onBehalfOfValue = shouldUseOnBehalfOf ? section.userId : undefined;

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
          onBehalfOf={onBehalfOfValue}
        />
      )}
    </>
  );
};

export const createDefaultDeltaGreenStatsContent = (language?: SupportedLanguage): SectionTypeDeltaGreenStats => {
  const stats = getDefaultStats(language);
  return {
    showEmpty: false,
    items: stats.map(stat => ({
      id: uuidv4(),
      name: stat.name,
      description: '',
      score: 10,
      distinguishingFeatures: '',
      abbreviation: stat.abbreviation,
    }))
  };
};