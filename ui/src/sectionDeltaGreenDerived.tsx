import React, { useEffect } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';

interface DeltaGreenDerivedItem extends BaseSectionItem {
  attributeType: 'HP' | 'WP' | 'SAN' | 'BP';
  current: number;
  maximum?: number;
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
  const intl = useIntl();

  const handleCurrentChange = async (
    item: DeltaGreenDerivedItem,
    newCurrent: number,
    content: SectionTypeDeltaGreenDerived,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    let clampedCurrent = Math.max(0, newCurrent);
    if (item.maximum !== undefined) {
      clampedCurrent = Math.min(item.maximum, clampedCurrent);
    }
    
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, current: clampedCurrent };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const updateDerivedMaximums = async (
    content: SectionTypeDeltaGreenDerived,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    derivedCalcs: any
  ) => {
    const newItems = content.items.map(item => {
      const calc = derivedCalcs[item.attributeType];
      if (calc) {
        const updatedItem = { ...item };
        if (calc.max !== undefined) {
          updatedItem.maximum = calc.max;
          // Only update current if it's currently at the old maximum or this is initial setup
          if (item.current === item.maximum || item.current === 0) {
            updatedItem.current = calc.current;
          }
        } else if (item.attributeType === 'BP') {
          // BP has no maximum, just update current
          updatedItem.current = calc.current;
        }
        return updatedItem;
      }
      return item;
    });
    
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const renderItems = (
    content: SectionTypeDeltaGreenDerived,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const stats = getStatsFromDataAttributes();
    const derivedCalcs = stats ? calculateDerivedAttributes(stats) : null;

    // Auto-update maximums when stats change
    useEffect(() => {
      if (derivedCalcs && mayEditSheet) {
        updateDerivedMaximums(content, setContent, updateSection, derivedCalcs);
      }
    }, [JSON.stringify(stats)]);

    const sanItem = content.items.find(item => item.attributeType === 'SAN');
    const bpItem = content.items.find(item => item.attributeType === 'BP');
    const hasDisorder = sanItem && bpItem && sanItem.current <= bpItem.current;

    return (
      <div className="delta-green-derived-grid">
        <div className="derived-header">
          <div className="derived-col-attribute">{intl.formatMessage({ id: "deltaGreenDerived.derivedAttribute" })}</div>
          <div className="derived-col-maximum">{intl.formatMessage({ id: "deltaGreenDerived.maximum" })}</div>
          <div className="derived-col-current">{intl.formatMessage({ id: "deltaGreenDerived.current" })}</div>
        </div>
        {content.items.map(item => {
          const calc = derivedCalcs?.[item.attributeType];
          const displayMax = calc?.max ?? item.maximum;
          const isDisorderRow = hasDisorder && (item.attributeType === 'SAN' || item.attributeType === 'BP');
          
          return (
            <div key={item.id} className={`derived-row ${isDisorderRow ? 'disorder-warning' : ''}`}>
              <div className="derived-col-attribute">{item.name}</div>
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
                    >
                      −
                    </button>
                  )}
                  <input
                    type="number"
                    min="0"
                    max={item.maximum}
                    value={item.current}
                    onChange={(e) => handleCurrentChange(item, parseInt(e.target.value) || 0, content, setContent, updateSection)}
                    disabled={!mayEditSheet || item.attributeType === 'BP'}
                    className="current-input"
                  />
                  {mayEditSheet && item.attributeType !== 'BP' && (
                    <button 
                      onClick={() => handleCurrentChange(item, item.current + 1, content, setContent, updateSection)}
                      disabled={item.maximum !== undefined && item.current >= item.maximum}
                      className="adjust-btn"
                    >
                      +
                    </button>
                  )}
                </div>
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

  const renderEditForm = (content: SectionTypeDeltaGreenDerived, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenDerived>>) => {
    return (
      <div className="delta-green-derived-edit">
        <p><FormattedMessage id="deltaGreenDerived.editNote" /></p>
      </div>
    );
  };

  return <BaseSection<DeltaGreenDerivedItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};

export const createDefaultDeltaGreenDerivedContent = (sheet?: any): SectionTypeDeltaGreenDerived => {
  // Try to get stats from data attributes (will be null on initial creation)
  const stats = getStatsFromDataAttributes();
  const derivedCalcs = stats ? calculateDerivedAttributes(stats) : null;

  return {
    showEmpty: false,
    items: [
      {
        id: uuidv4(),
        name: 'Hit Points (HP)',
        description: '',
        attributeType: 'HP',
        current: derivedCalcs?.HP?.current || 10,
        maximum: derivedCalcs?.HP?.max || 10,
      },
      {
        id: uuidv4(),
        name: 'Willpower Points (WP)',
        description: '',
        attributeType: 'WP',
        current: derivedCalcs?.WP?.current || 10,
        maximum: derivedCalcs?.WP?.max || 10,
      },
      {
        id: uuidv4(),
        name: 'Sanity Points (SAN)',
        description: '',
        attributeType: 'SAN',
        current: derivedCalcs?.SAN?.current || 50,
        maximum: derivedCalcs?.SAN?.max || 50,
      },
      {
        id: uuidv4(),
        name: 'Breaking Point (BP)',
        description: '',
        attributeType: 'BP',
        current: derivedCalcs?.BP?.current || 40,
      },
    ]
  };
};