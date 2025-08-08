import React, { useRef, useCallback, useState } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { getDeltaGreenDerivedSeed } from './seed';
import { SupportedLanguage } from './translations';
import { DiceRollModal } from './components/DiceRollModal';

interface DeltaGreenDerivedItem extends BaseSectionItem {
  attributeType: 'HP' | 'WP' | 'SAN' | 'BP';
  current: number;
}

type SectionTypeDeltaGreenDerived = BaseSectionContent<DeltaGreenDerivedItem>;

const getStatsFromDataAttributes = () => {
  const statsContainer = document.querySelector('.delta-green-stats-grid');
  if (!statsContainer) return null;
  
  const stats: { [key: string]: number } = {};
  stats.STR = parseInt(statsContainer.getAttribute('data-stat-str') || '0');
  stats.CON = parseInt(statsContainer.getAttribute('data-stat-con') || '0');
  stats.POW = parseInt(statsContainer.getAttribute('data-stat-pow') || '0');
  
  return stats;
};

const calculateDerivedAttributes = (stats: { [key: string]: number }) => {
  const str = stats.STR || 0;
  const con = stats.CON || 0;
  const pow = stats.POW || 0;
  
  return {
    HP: { max: Math.ceil((str + con) / 2), current: Math.ceil((str + con) / 2) },
    WP: { max: pow, current: pow },
    SAN: { max: pow * 5, current: pow * 5 },
    BP: { current: (pow * 5) - pow }
  };
};

export const SectionDeltaGreenDerived: React.FC<SectionDefinition> = (props) => {
  const { section, userSubject } = props;
  const intl = useIntl();
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{ name: string; value: number; actionText: string } | null>(null);
  
  // Track previous stats to detect changes
  const prevStatsRef = useRef<string>();
  // Track pending updates to prevent race conditions
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDiceClick = (statName: string, statValue: number) => {
    setSelectedStat({ name: statName, value: statValue, actionText: statName });
    setDiceModalOpen(true);
  };

  const handleCurrentChange = useCallback((
    item: DeltaGreenDerivedItem,
    newCurrent: number,
    content: SectionTypeDeltaGreenDerived,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    // Get current calculated maximum
    const stats = getStatsFromDataAttributes();
    const derivedCalcs = stats ? calculateDerivedAttributes(stats) : null;
    const calc = derivedCalcs?.[item.attributeType];
    const currentMax = calc && 'max' in calc ? calc.max : undefined;
    
    let clampedCurrent = Math.max(0, newCurrent);
    if (currentMax !== undefined) {
      clampedCurrent = Math.min(currentMax, clampedCurrent);
    }
    
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const { maximum, ...itemWithoutMaximum } = item as any; // Remove maximum field if it exists
    const updatedItem = { ...itemWithoutMaximum, current: clampedCurrent };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    
    // Update local state immediately for responsive UI
    setContent(newContent);
    
    // Debounce the backend update to prevent race conditions
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(async () => {
      await updateSection({ content: JSON.stringify(newContent) });
    }, 150); // Short delay for buttons
  }, []);

  const renderItems = (
    content: SectionTypeDeltaGreenDerived,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    _isEditing: boolean,
  ) => {
    const stats = getStatsFromDataAttributes();
    const derivedCalcs = stats ? calculateDerivedAttributes(stats) : null;

    // Auto-clamp and sync on every render if needed (not ideal but works)
    if (derivedCalcs && mayEditSheet) {
      const currentStatsString = JSON.stringify(derivedCalcs);
      const hasStatsChanged = prevStatsRef.current !== currentStatsString;
      
      if (hasStatsChanged) {
        prevStatsRef.current = currentStatsString;
        
        let hasCurrentValueChanges = false;
        const newItems = content.items.map(item => {
          const calc = derivedCalcs[item.attributeType];
          const currentMax = calc && 'max' in calc ? calc.max : undefined;
          const { maximum, ...itemWithoutMaximum } = item as any; // Remove maximum field if it exists
          
          if (currentMax !== undefined && item.current > currentMax) {
            hasCurrentValueChanges = true;
            return { ...itemWithoutMaximum, current: currentMax };
          }
          return itemWithoutMaximum;
        });
        
        // Update if current values changed OR if stats changed (to sync maximums)
        if (hasCurrentValueChanges || hasStatsChanged) {
          const newContent = { ...content, items: newItems };
          setContent(newContent);
          updateSection({ content: JSON.stringify(newContent) });
        }
      }
    }

    const sanItem = content.items.find(item => item.attributeType === 'SAN');
    const bpItem = content.items.find(item => item.attributeType === 'BP');
    const bpCurrent = derivedCalcs?.BP?.current ?? bpItem?.current ?? 0;
    const hasDisorder = sanItem && sanItem.current <= bpCurrent;

    return (
      <div className="delta-green-derived-grid">
        <div className="derived-header">
          <div className="derived-col-attribute">{intl.formatMessage({ id: "deltaGreenDerived.derivedAttribute" })}</div>
          <div className="derived-col-maximum">{intl.formatMessage({ id: "deltaGreenDerived.maximum" })}</div>
          <div className="derived-col-current">{intl.formatMessage({ id: "deltaGreenDerived.current" })}</div>
          <div className="derived-col-roll"></div>
        </div>
        {content.items.map(item => {
          const calc = derivedCalcs?.[item.attributeType];
          const displayMax = calc && 'max' in calc ? calc.max : undefined;
          const displayCurrent = item.attributeType === 'BP' ? (calc?.current ?? item.current) : item.current;
          const isDisorderRow = hasDisorder && (item.attributeType === 'SAN' || item.attributeType === 'BP');
          
          const inputId = `derived-current-${item.id}`;
          
          return (
            <div key={item.id} className={`derived-row ${isDisorderRow ? 'disorder-warning' : ''}`}>
              <div className="derived-col-attribute">
                <label htmlFor={inputId}>{item.name}</label>
              </div>
              <div className="derived-col-maximum">
                {item.attributeType === 'BP' ? '—' : displayMax}
              </div>
              <div className="derived-col-current">
                <div className="current-controls">
                  {mayEditSheet && item.attributeType !== 'BP' && (
                    <button 
                      onClick={() => handleCurrentChange(item, item.current - 1, content, setContent, updateSection)}
                      disabled={item.current <= 0}
                      className="adjust-btn"
                      aria-label={intl.formatMessage({ id: 'sectionDeltaGreenDerived.decrease' }, { name: item.name })}
                    >
                      <FormattedMessage id="sectionDeltaGreenDerived.decrementSymbol" />
                    </button>
                  )}
                  <input
                    id={inputId}
                    type="number"
                    min="0"
                    max={displayMax}
                    value={displayCurrent}
                    onChange={(e) => handleCurrentChange(item, parseInt(e.target.value) || 0, content, setContent, updateSection)}
                    disabled={!mayEditSheet || item.attributeType === 'BP'}
                    className="current-input"
                  />
                  {mayEditSheet && item.attributeType !== 'BP' && (
                    <button 
                      onClick={() => handleCurrentChange(item, item.current + 1, content, setContent, updateSection)}
                      disabled={displayMax !== undefined && item.current >= displayMax}
                      className="adjust-btn"
                      aria-label={intl.formatMessage({ id: 'sectionDeltaGreenDerived.increase' }, { name: item.name })}
                    >
                      <FormattedMessage id="sectionDeltaGreenDerived.incrementSymbol" />
                    </button>
                  )}
                </div>
              </div>
              <div className="derived-col-roll">
                {item.attributeType === 'SAN' && displayCurrent > 0 && mayEditSheet && (
                  <button
                    className="dice-button"
                    onClick={() => handleDiceClick(item.name, displayCurrent)}
                    aria-label={intl.formatMessage({ id: 'deltaGreenStats.rollDice' }, { statName: item.name })}
                    title={intl.formatMessage({ id: 'deltaGreenStats.rollDice' }, { statName: item.name })}
                  >
                    {intl.formatMessage({ id: 'dice.icon' })}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div className={`disorder-notice ${hasDisorder ? 'disorder' : 'sane'}`}>
          {hasDisorder ? (
            <FormattedMessage id="deltaGreenDerived.disorderWarning" />
          ) : (
            <FormattedMessage id="deltaGreenDerived.saneStatus" />
          )}
        </div>
      </div>
    );
  };

  const renderEditForm = (_content: SectionTypeDeltaGreenDerived, _setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>, handleUpdate: () => void, handleCancel: () => void) => {
    return (
      <div className="delta-green-derived-edit">
        <p><FormattedMessage id="deltaGreenDerived.editNote" /></p>
        <div className="section-edit-buttons">
          <button className="btn-standard btn-small" onClick={handleUpdate}>
            <FormattedMessage id="save" />
          </button>
          <button className="btn-secondary btn-small" onClick={handleCancel}>
            <FormattedMessage id="cancel" />
          </button>
        </div>
      </div>
    );
  };

  // Determine if we need to pass onBehalfOf
  const shouldUseOnBehalfOf = userSubject !== section.userId;
  const onBehalfOfValue = shouldUseOnBehalfOf ? section.userId : undefined;

  return (
    <>
      <BaseSection<DeltaGreenDerivedItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />
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

export const createDefaultDeltaGreenDerivedContent = (_sheet?: any, language?: SupportedLanguage): SectionTypeDeltaGreenDerived => {
  // Try to get stats from data attributes (will be null on initial creation)
  const stats = getStatsFromDataAttributes();
  const derivedCalcs = stats ? calculateDerivedAttributes(stats) : null;
  const derivedData = getDeltaGreenDerivedSeed(language || 'en');

  return {
    showEmpty: false,
    items: derivedData.map(derived => {
      let defaultCurrent = 10; // fallback default
      
      // Set appropriate defaults based on attribute type
      if (derivedCalcs) {
        const calc = derivedCalcs[derived.attributeType];
        defaultCurrent = calc?.current || (calc && 'max' in calc ? calc.max : derived.defaultCurrent);
      } else {
        // Use seed data default when stats aren't available
        defaultCurrent = derived.defaultCurrent;
      }

      return {
        id: uuidv4(),
        name: derived.name,
        description: '',
        attributeType: derived.attributeType,
        current: defaultCurrent,
      };
    })
  };
};