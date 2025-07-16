import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';

interface DeltaGreenSkillItem extends BaseSectionItem {
  used: boolean;
  roll: number;
  hasUsedFlag: boolean;
};

type SectionTypeDeltaGreenSkills = BaseSectionContent<DeltaGreenSkillItem>;

const DEFAULT_SKILLS = [
  { name: 'Accounting', roll: 10 },
  { name: 'Alertness', roll: 20 },
  { name: 'Anthropology', roll: 0 },
  { name: 'Archeology', roll: 0 },
  { name: 'Art: ART', roll: 0 },
  { name: 'Artillery', roll: 0 },
  { name: 'Athletics', roll: 30 },
  { name: 'Bureaucracy', roll: 10 },
  { name: 'Computer Science', roll: 0 },
  { name: 'Craft: CRAFT', roll: 0 },
  { name: 'Criminology', roll: 10 },
  { name: 'Demolitions', roll: 0 },
  { name: 'Disguise', roll: 10 },
  { name: 'Dodge', roll: 30 },
  { name: 'Drive', roll: 20 },
  { name: 'Firearms', roll: 20 },
  { name: 'First Aid', roll: 10 },
  { name: 'Forensics', roll: 0 },
  { name: 'Heavy Machinery', roll: 10 },
  { name: 'Heavy Weapons', roll: 0 },
  { name: 'History', roll: 10 },
  { name: 'HUMINT', roll: 10 },
  { name: 'Language: LANGUAGE', roll: 0 },
  { name: 'Law', roll: 0 },
  { name: 'Medicine', roll: 0 },
  { name: 'Melee Weapons', roll: 30 },
  { name: 'Military Science: SUBJECT', roll: 0 },
  { name: 'Navigate', roll: 10 },
  { name: 'Occult', roll: 10 },
  { name: 'Persuade', roll: 20 },
  { name: 'Pharmacy', roll: 0 },
  { name: 'Pilot: AIRCRAFT', roll: 0 },
  { name: 'Psychotherapy', roll: 10 },
  { name: 'Ride', roll: 10 },
  { name: 'Science: SUBJECT', roll: 0 },
  { name: 'Search', roll: 20 },
  { name: 'SIGINT', roll: 0 },
  { name: 'Stealth', roll: 10 },
  { name: 'Surgery', roll: 0 },
  { name: 'Survival', roll: 10 },
  { name: 'Swim', roll: 20 },
  { name: 'Unarmed Combat', roll: 40 },
  { name: 'Unnatural', roll: 0, hasUsedFlag: false },
];

export const SectionDeltaGreenSkills: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();

  const handleUsedToggle = async (
    item: DeltaGreenSkillItem,
    content: SectionTypeDeltaGreenSkills,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, used: !item.used };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const renderItems = (
    content: SectionTypeDeltaGreenSkills,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
  ) => {
    const filteredItems = content.showEmpty 
      ? content.items 
      : content.items.filter(item => item.roll > 0);
    
    const sortedItems = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));

    const hasAnyUsedFlags = sortedItems.some(item => item.hasUsedFlag !== false);

    return (
      <div className={`delta-green-skills-grid ${!hasAnyUsedFlags ? 'no-used-column' : ''}`}>
        {sortedItems.map(item => (
          <div key={item.id} className="skills-item">
            {hasAnyUsedFlags && (
              <div className="skills-col-used">
                {item.hasUsedFlag !== false ? (
                  <input
                    type="checkbox"
                    checked={item.used}
                    onChange={() => handleUsedToggle(item, content, setContent, updateSection)}
                    disabled={!mayEditSheet}
                  />
                ) : (
                  <span></span>
                )}
              </div>
            )}
            <div className="skills-col-name">{item.name}</div>
            <div className="skills-col-roll">
              <span className="roll-display">{item.roll}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditForm = (content: SectionTypeDeltaGreenSkills, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { 
        id: uuidv4(), 
        name: '', 
        description: '', 
        roll: 0, 
        used: false,
        hasUsedFlag: true
      }];
      setContent({ ...content, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = content.items.filter((_, i) => i !== index);
      setContent({ ...content, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number | boolean) => {
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setContent({ ...content, items: newItems });
    };

    return (
      <div className="delta-green-skills-items-edit">
        <div className="show-empty-toggle">
          <label>
            <input
              type="checkbox"
              checked={content.showEmpty}
              onChange={() => setContent({ ...content, showEmpty: !content.showEmpty })}
            />
            <FormattedMessage id="sectionObject.showEmpty" />
          </label>
        </div>
        {content.items.map((item, index) => (
          <div key={item.id} className="delta-green-skills-item-edit">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "deltaGreenSkills.skill" })}
            />
            <div className="roll-input-with-controls">
              <input
                type="number"
                min="0"
                max="99"
                value={item.roll}
                onChange={(e) => handleItemChange(index, 'roll', parseInt(e.target.value) || 0)}
                placeholder={intl.formatMessage({ id: "deltaGreenSkills.roll" })}
              />
              <div className="roll-controls">
                <button
                  type="button"
                  onClick={() => handleItemChange(index, 'roll', Math.max(0, item.roll - 10))}
                  disabled={item.roll <= 0}
                  className="adjust-btn small"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => handleItemChange(index, 'roll', Math.max(0, item.roll - 1))}
                  disabled={item.roll <= 0}
                  className="adjust-btn small"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleItemChange(index, 'roll', Math.min(99, item.roll + 1))}
                  disabled={item.roll >= 99}
                  className="adjust-btn small"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleItemChange(index, 'roll', Math.min(99, item.roll + 10))}
                  disabled={item.roll >= 99}
                  className="adjust-btn small"
                >
                  +10
                </button>
              </div>
            </div>
            <label>
              <input
                type="checkbox"
                checked={item.hasUsedFlag !== false}
                onChange={(e) => handleItemChange(index, 'hasUsedFlag', e.target.checked)}
              />
              <FormattedMessage id="deltaGreenSkills.hasUsedFlag" />
            </label>
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

  return <BaseSection<DeltaGreenSkillItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};

export const createDefaultDeltaGreenSkillsContent = (): SectionTypeDeltaGreenSkills => ({
  showEmpty: false,
  items: DEFAULT_SKILLS.map(skill => ({
    id: uuidv4(),
    name: skill.name,
    description: '',
    roll: skill.roll,
    used: false,
    hasUsedFlag: skill.hasUsedFlag !== false,
  }))
});
