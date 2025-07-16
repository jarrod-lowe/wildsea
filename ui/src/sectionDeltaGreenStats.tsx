import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionItem } from './components/SectionItem';

interface DeltaGreenStatItem extends BaseSectionItem {
  score: number;
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

  const handleScoreChange = async (
        item: DeltaGreenStatItem,
        newScore: number,
        content: SectionTypeDeltaGreenStats,
        setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    const clampedScore = Math.max(0, Math.min(18, newScore));
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, score: clampedScore };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const handleDistinguishingFeaturesChange = async (
        item: DeltaGreenStatItem,
        newFeatures: string,
        content: SectionTypeDeltaGreenStats,
        setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    const truncatedFeatures = newFeatures.slice(0, 40);
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, distinguishingFeatures: truncatedFeatures };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const renderItems = (
        content: SectionTypeDeltaGreenStats,
        mayEditSheet: boolean,
        setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    // Create data attributes from current stats for derived attributes to read
    const statsDataAttributes: { [key: string]: number } = {};
    content.items.forEach(item => {
      const abbrev = item.name.match(/\(([^)]+)\)/)?.[1];
      if (abbrev) {
        statsDataAttributes[`data-stat-${abbrev.toLowerCase()}`] = item.score;
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
        {content.items.map(item => (
          <div key={item.id} className="stats-row">
            <div className="stats-col-statistic">{item.name}</div>
            <div className="stats-col-score">
              <input
                type="number"
                min="0"
                max="18"
                value={item.score}
                onChange={(e) => handleScoreChange(item, parseInt(e.target.value) || 0, content, setContent, updateSection)}
                disabled={!mayEditSheet}
              />
            </div>
            <div className="stats-col-x5">{item.score * 5}</div>
            <div className="stats-col-features">
              {mayEditSheet ? (
                <input
                  type="text"
                  value={item.distinguishingFeatures}
                  onChange={(e) => handleDistinguishingFeaturesChange(item, e.target.value, content, setContent, updateSection)}
                  maxLength={40}
                  placeholder={intl.formatMessage({ id: "deltaGreenStats.distinguishingFeaturesPlaceholder" })}
                />
              ) : (
                <span>{item.distinguishingFeatures}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditForm = (content: SectionTypeDeltaGreenStats, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenStats>>) => {
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
      newItems[index] = { ...newItems[index], [field]: value };
      setContent({ ...content, items: newItems });
    };

    return (
      <div className="delta-green-stats-items-edit">
        {content.items.map((item, index) => (
          <div key={item.id} className="delta-green-stats-item-edit">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.statistic" })}
            />
            <input
              type="number"
              min="0"
              max="18"
              value={item.score}
              onChange={(e) => handleItemChange(index, 'score', parseInt(e.target.value) || 0)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.score" })}
            />
            <input
              type="text"
              value={item.distinguishingFeatures}
              onChange={(e) => handleItemChange(index, 'distinguishingFeatures', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenStats.distinguishingFeatures" })}
              maxLength={40}
            />
            <button onClick={() => handleRemoveItem(index)}>
              <FormattedMessage id="sectionObject.removeItem" />
            </button>
          </div>
        ))}
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionObject.addItem" />
        </button>
      </div>
    );
  };

  return <BaseSection<DeltaGreenStatItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
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