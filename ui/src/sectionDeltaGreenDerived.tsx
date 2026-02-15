import React, { useRef, useCallback, useState, useEffect } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { getDeltaGreenDerivedSeed } from './seed';
import { SupportedLanguage } from './translations';
import { DiceRollModal } from './components/DiceRollModal';
import { SanityLossActions } from './components/SanityLossActions';
import { useCharacterDeath } from './contexts/CharacterDeathContext';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface DeltaGreenDerivedItem extends BaseSectionItem {
  attributeType: 'HP' | 'WP' | 'SAN' | 'BP';
  current: number;
}

type SectionTypeDeltaGreenDerived = BaseSectionContent<DeltaGreenDerivedItem> & {
  sanityModifier?: number;
};

const getStatsFromDataAttributes = () => {
  const statsContainer = document.querySelector('.delta-green-stats-grid') as HTMLElement;
  if (!statsContainer) return null;

  const stats: { [key: string]: number } = {};
  stats.STR = Number.parseInt(statsContainer.dataset.statStr || '0');
  stats.CON = Number.parseInt(statsContainer.dataset.statCon || '0');
  stats.POW = Number.parseInt(statsContainer.dataset.statPow || '0');

  return stats;
};

export const getAdaptationStatusFromDataAttributes = () => {
  const sanLossContainer = document.querySelector('.delta-green-sanloss-section') as HTMLElement;
  if (!sanLossContainer) return { violence: false, helplessness: false };

  return {
    violence: sanLossContainer.dataset.adaptedViolence === 'true',
    helplessness: sanLossContainer.dataset.adaptedHelplessness === 'true'
  };
};

export const calculateDerivedAttributes = (stats: { [key: string]: number }, sanityModifier: number = 0) => {
  const str = stats.STR || 0;
  const con = stats.CON || 0;
  const pow = stats.POW || 0;

  const baseSanMax = pow * 5;
  const adjustedSanMax = Math.max(0, baseSanMax - sanityModifier);

  return {
    HP: { max: Math.ceil((str + con) / 2), current: Math.ceil((str + con) / 2) },
    WP: { max: pow, current: pow },
    SAN: { max: adjustedSanMax, current: adjustedSanMax },
    BP: { current: adjustedSanMax - pow }
  };
};

export const SectionDeltaGreenDerived: React.FC<SectionDefinition> = (props) => {
  const { section, userSubject } = props;
  const intl = useIntl();
  const { setCharacterDead } = useCharacterDeath();
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{ name: string; value: number; actionText: string; attributeType?: string } | null>(null);
  const [sanityLossResult, setSanityLossResult] = useState<any>(null);

  // Track previous stats to detect changes
  const prevStatsRef = useRef<string | undefined>(undefined);
  // Track pending updates to prevent race conditions
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Store the current update functions for sanity loss
  const sanityUpdateRef = useRef<{ updateSection?: (section: Partial<SheetSection>) => Promise<void>, setContent?: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>, content?: SectionTypeDeltaGreenDerived } | undefined>(undefined);

  // Set initial death state on mount
  useEffect(() => {
    try {
      const content: SectionTypeDeltaGreenDerived = JSON.parse(section.content || '{}');
      const hpItem = content.items?.find(item => item.attributeType === 'HP');
      if (hpItem !== undefined) {
        setCharacterDead(section.userId, hpItem.current === 0);
      }
    } catch (error) {
      console.error('Error parsing section content for death state:', error);
    }
  }, []); // Only on mount

  const handleDiceClick = (statName: string, statValue: number, attributeType?: string) => {
    setSelectedStat({ name: statName, value: statValue, actionText: statName, attributeType });
    setDiceModalOpen(true);
  };


  const handleSanityLoss = useCallback((amount: number) => {
    const { updateSection, setContent, content } = sanityUpdateRef.current || {};
    
    if (updateSection && setContent && content) {
      // Find the SAN item and update its current value
      const sanItem = content.items.find(item => item.attributeType === 'SAN');
      
      if (sanItem) {
        const newCurrent = Math.max(0, sanItem.current - amount);
        
        const newItems = content.items.map(item => 
          item.attributeType === 'SAN' 
            ? { ...item, current: newCurrent }
            : item
        );
        const newContent = { ...content, items: newItems };
        
        // Update local state immediately for responsive UI
        setContent(newContent);
        
        // Update the section in the backend
        updateSection({ content: JSON.stringify(newContent) });
      }
    }
  }, []);

  const handleCloseAndShowNewRoll = useCallback((rollResult: any) => {
    // Close the current modal
    setDiceModalOpen(false);
    // Show the sanity loss result in a new modal
    setSanityLossResult(rollResult);
  }, []);

  const createSanityLossActions = useCallback((
    gameId: string,
    onBehalfOf: string | undefined,
    onSanityLoss: (amount: number) => void,
    onCloseAndShowNewRoll: (rollResult: any) => void
  ) => {
    return (rollResult: any) => {
      const adaptationStatus = getAdaptationStatusFromDataAttributes();
      return (
        <SanityLossActions
          gameId={gameId}
          onBehalfOf={onBehalfOf}
          onSanityLoss={onSanityLoss}
          onCloseAndShowNewRoll={onCloseAndShowNewRoll}
          isAdaptedToViolence={adaptationStatus.violence}
          isAdaptedToHelplessness={adaptationStatus.helplessness}
          rollResult={rollResult}
        />
      );
    };
  }, []);

  const handleCurrentChange = useCallback((
    item: DeltaGreenDerivedItem,
    newCurrent: number,
    content: SectionTypeDeltaGreenDerived,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    // Get current calculated maximum
    const stats = getStatsFromDataAttributes();
    const derivedCalcs = stats ? calculateDerivedAttributes(stats, content.sanityModifier || 0) : null;
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

    // Push death state to context when HP changes
    if (item.attributeType === 'HP') {
      setCharacterDead(section.userId, clampedCurrent === 0);
    }

    // Debounce the backend update to prevent race conditions
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      await updateSection({ content: JSON.stringify(newContent) });
    }, 150); // Short delay for buttons
  }, [section.userId, setCharacterDead]);

  const renderItems = (
    content: SectionTypeDeltaGreenDerived,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    _isEditing: boolean,
  ) => {
    // Store current update functions for sanity loss
    sanityUpdateRef.current = { updateSection, setContent, content };

    const stats = getStatsFromDataAttributes();
    const derivedCalcs = stats ? calculateDerivedAttributes(stats, content.sanityModifier || 0) : null;

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

    const wpItem = content.items.find(item => item.attributeType === 'WP');
    const isWpDepleted = wpItem?.current === 0;

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
          const isWpDepletedRow = isWpDepleted && item.attributeType === 'WP';

          const inputId = `derived-current-${item.id}`;

          return (
            <div key={item.id} className={`derived-row ${isDisorderRow ? 'disorder-warning' : ''} ${isWpDepletedRow ? 'wp-depleted' : ''}`}>
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
                    onChange={(e) => handleCurrentChange(item, Number.parseInt(e.target.value) || 0, content, setContent, updateSection)}
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
                    onClick={() => handleDiceClick(item.name, displayCurrent, item.attributeType)}
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

  const renderEditForm = (content: SectionTypeDeltaGreenDerived, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>, handleUpdate: () => void, handleCancel: () => void) => {
    const currentModifier = content.sanityModifier || 0;

    return (
      <div className="delta-green-derived-edit">
        <div className="section-item-edit">
          <FormattedMessage id="deltaGreenDerived.editNote" />
        </div>
        <div className="section-item-edit">
          <div className="preset-weapon-row">
            <label htmlFor="sanity-modifier" className="preset-label">
              <FormattedMessage id="deltaGreenDerived.sanityModifier" />
              <Tippy
                content={intl.formatMessage({ id: 'deltaGreenDerived.sanityModifierHelp' })}
                trigger="click"
                arrow={true}
                placement="top"
              >
                <button
                  className="btn-icon info"
                  aria-label={intl.formatMessage({ id: 'showInfo.sanityModifier' })}
                >
                  ℹ
                </button>
              </Tippy>
            </label>
            <div className="score-inline-controls">
              <button
                onClick={() => {
                  const newModifier = Math.max(0, currentModifier - 1);
                  setContent({ ...content, sanityModifier: newModifier });
                }}
                disabled={currentModifier <= 0}
                className="adjust-btn small"
                aria-label={intl.formatMessage({ id: 'deltaGreenDerived.decreaseModifier' })}
              >
                <FormattedMessage id="sectionDeltaGreenDerived.decrementSymbol" />
              </button>
              <input
                id="sanity-modifier"
                type="number"
                min="0"
                value={currentModifier}
                onChange={(e) => {
                  const newModifier = Math.max(0, Number.parseInt(e.target.value) || 0);
                  setContent({ ...content, sanityModifier: newModifier });
                }}
                className="score-input-inline"
              />
              <button
                onClick={() => {
                  const newModifier = currentModifier + 1;
                  setContent({ ...content, sanityModifier: newModifier });
                }}
                className="adjust-btn small"
                aria-label={intl.formatMessage({ id: 'deltaGreenDerived.increaseModifier' })}
              >
                <FormattedMessage id="sectionDeltaGreenDerived.incrementSymbol" />
              </button>
            </div>
          </div>
        </div>
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
          customActionsAfterRoll={selectedStat.attributeType === 'SAN'
            ? createSanityLossActions(
                props.section.gameId,
                onBehalfOfValue,
                handleSanityLoss,
                handleCloseAndShowNewRoll
              )
            : undefined}
        />
      )}
      {sanityLossResult && (
        <DiceRollModal
          isOpen={true}
          onRequestClose={() => setSanityLossResult(null)}
          gameId={props.section.gameId}
          skillValue={0}
          initialAction="Sanity Loss"
          prePopulatedResult={sanityLossResult}
        />
      )}
    </>
  );
};

export const createDefaultDeltaGreenDerivedContent = (_sheet?: any, language?: SupportedLanguage): SectionTypeDeltaGreenDerived => {
  // Try to get stats from data attributes (will be null on initial creation)
  const stats = getStatsFromDataAttributes();
  const derivedCalcs = stats ? calculateDerivedAttributes(stats, 0) : null;
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