import React, { useState } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { DiceRollModal } from './components/DiceRollModal';
import { SectionEditForm } from './components/SectionEditForm';
import { Grades } from "../../graphql/lib/constants/rollTypes";

// Color scaling function for skill proficiency (0-99 scale)
// Returns WCAG AAA compliant light colors from red to green with better breakpoint
const getSkillBackgroundColor = (rollValue: number): string => {
  if (rollValue <= 0) return 'transparent';
  
  // Normalize the value to 0-1 range, with breakpoint at 40%
  const normalized = Math.min(rollValue, 99) / 99;
  
  // Simple red to green gradient: Red (0°) to Green (120°)
  // But adjust the curve to make higher skills more distinct
  const adjustedProgress = normalized >= 0.4 
    ? 0.5 + (normalized - 0.4) * 0.833 // 40-99% maps to 50-100% of color range
    : normalized * 1.25; // 0-40% maps to 0-50% of color range
  
  const hue = Math.min(adjustedProgress, 1) * 120; // 0 to 120 degrees (red to green)
  const saturation = 40; // Moderate saturation for readability
  const lightness = 85; // High lightness for WCAG AAA compliance
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

interface DeltaGreenSkillItem extends BaseSectionItem {
  used: boolean;
  roll: number | string;
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
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; value: number; item: DeltaGreenSkillItem; actionText: string } | null>(null);
  const [currentContent, setCurrentContent] = useState<SectionTypeDeltaGreenSkills | null>(null);
  const [currentUpdateSection, setCurrentUpdateSection] = useState<((updatedSection: Partial<SheetSection>) => Promise<void>) | null>(null);

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

  const handleDiceClick = (
    skillName: string, 
    skillValue: number, 
    item: DeltaGreenSkillItem,
    content: SectionTypeDeltaGreenSkills,
    _setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>
  ) => {
    const actionText = intl.formatMessage({ id: 'deltaGreenSkills.actionFor' }, { skillName });
    setSelectedSkill({ name: skillName, value: skillValue, item, actionText });
    setCurrentContent(content);
    setCurrentUpdateSection(() => updateSection);
    setDiceModalOpen(true);
  };

  const handleRollComplete = async (grade: string) => {
    if (!selectedSkill || !currentContent || !currentUpdateSection) return;
    
    // Mark skill as used if it was a failure or fumble AND the skill has a used flag
    if ((grade === Grades.FAILURE || grade === Grades.FUMBLE) && selectedSkill.item.hasUsedFlag !== false) {
      const newItems = [...currentContent.items];
      const itemIndex = newItems.findIndex(i => i.id === selectedSkill.item.id);
      if (itemIndex !== -1) {
        const updatedItem = { ...selectedSkill.item, used: true };
        newItems[itemIndex] = updatedItem;
        const newContent = { ...currentContent, items: newItems };
        
        // We need to call setContent from the BaseSection, but we don't have access to it here
        // Instead, we'll update the section directly
        await currentUpdateSection({ content: JSON.stringify(newContent) });
      }
    }
  };

  const handlePostSessionUpgrades = async (
    content: SectionTypeDeltaGreenSkills,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const newItems = content.items.map(item => {
      if (item.used && item.hasUsedFlag !== false) {
        const numericRoll = typeof item.roll === 'string' ? parseInt(item.roll) || 0 : item.roll;
        return {
          ...item,
          roll: Math.min(99, numericRoll + 1),
          used: false
        };
      }
      return item;
    });
    
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) });
  };

  const renderItems = (
    content: SectionTypeDeltaGreenSkills,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    _isEditing: boolean,
  ) => {
    const filteredItems = content.showEmpty 
      ? content.items 
      : content.items.filter(item => {
          const numericRoll = typeof item.roll === 'string' ? parseInt(item.roll) || 0 : item.roll;
          return numericRoll > 0;
        });
    
    const sortedItems = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));

    const hasAnyUsedFlags = sortedItems.some(item => item.hasUsedFlag !== false);
    const hasAnyUsedSkills = sortedItems.some(item => item.used && item.hasUsedFlag !== false);

    return (
      <>
        <div className={`delta-green-skills-grid ${!hasAnyUsedFlags ? 'no-used-column' : ''}`}>
          {sortedItems.map(item => {
            const numericRoll = typeof item.roll === 'string' ? parseInt(item.roll) || 0 : item.roll;
            return (
              <div 
                key={item.id} 
                className="skills-item"
                style={{ backgroundColor: getSkillBackgroundColor(numericRoll) }}
              >
                {hasAnyUsedFlags && (
                  <div className="skills-col-used">
                    {item.hasUsedFlag !== false ? (
                      <input
                        type="checkbox"
                        checked={item.used}
                        onChange={() => handleUsedToggle(item, content, setContent, updateSection)}
                        disabled={!mayEditSheet}
                        aria-label={intl.formatMessage(
                          { id: "deltaGreenSkills.hasFailed" },
                          { skillName: item.name }
                        )}
                      />
                    ) : (
                      <span></span>
                    )}
                  </div>
                )}
                <div className="skills-col-name">{item.name}</div>
                <div className="skills-col-roll">
                  <span className="roll-display">{numericRoll}%</span>
                  {numericRoll > 0 && (
                    <button
                      className="dice-button"
                      onClick={() => handleDiceClick(item.name, numericRoll, item, content, setContent, updateSection)}
                      aria-label={intl.formatMessage({ id: 'deltaGreenSkills.rollDice' }, { skillName: item.name })}
                      title={intl.formatMessage({ id: 'deltaGreenSkills.rollDice' }, { skillName: item.name })}
                    >
                      {intl.formatMessage({ id: 'dice.icon' })}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {mayEditSheet && (
          <div className="post-session-upgrades">
            <button
              className="btn-standard btn-small"
              onClick={() => handlePostSessionUpgrades(content, setContent, updateSection)}
              title={intl.formatMessage({ id: 'deltaGreenSkills.postSessionUpgrades.tooltip' })}
              disabled={!hasAnyUsedSkills}
            >
              <FormattedMessage id="deltaGreenSkills.postSessionUpgrades.button" />
            </button>
          </div>
        )}
      </>
    );
  };

  const renderEditForm = (content: SectionTypeDeltaGreenSkills, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenSkills>>, handleUpdate: () => void, handleCancel: () => void) => {
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
      
      // Handle roll field with proper validation
      if (field === 'roll') {
        if (typeof value === 'string') {
          // Allow empty string for editing, but validate on conversion
          if (value === '') {
            newItems[index] = { ...newItems[index], [field]: '' as any };
          } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              // Clamp to valid range (0-99)
              const clampedValue = Math.max(0, Math.min(99, numValue));
              newItems[index] = { ...newItems[index], [field]: clampedValue };
            }
          }
        } else {
          // Handle direct number input
          const clampedValue = Math.max(0, Math.min(99, value as number));
          newItems[index] = { ...newItems[index], [field]: clampedValue };
        }
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      
      setContent({ ...content, items: newItems });
    };

    const handleRollBlur = (index: number, value: string) => {
      // Convert empty string to 0 on blur
      if (value === '') {
        handleItemChange(index, 'roll', 0);
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
              placeholder={intl.formatMessage({ id: "deltaGreenSkills.skill" })}
              aria-label={intl.formatMessage({ id: "deltaGreenSkills.skill" })}
            />
            <div className="roll-input-with-controls">
              <input
                type="number"
                min="0"
                max="99"
                value={item.roll === '' ? '' : (item.roll || 0)}
                onChange={(e) => handleItemChange(index, 'roll', e.target.value)}
                onBlur={(e) => handleRollBlur(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenSkills.roll" })}
                aria-label={intl.formatMessage({ id: "deltaGreenSkills.roll" })}
              />
              <div className="roll-controls">
                {(() => {
                  const numericRoll = typeof item.roll === 'string' ? parseInt(item.roll) || 0 : item.roll;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'roll', Math.max(0, numericRoll - 10))}
                        disabled={numericRoll <= 0}
                        className="adjust-btn small"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'roll', Math.max(0, numericRoll - 1))}
                        disabled={numericRoll <= 0}
                        className="adjust-btn small"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'roll', Math.min(99, numericRoll + 1))}
                        disabled={numericRoll >= 99}
                        className="adjust-btn small"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'roll', Math.min(99, numericRoll + 10))}
                        disabled={numericRoll >= 99}
                        className="adjust-btn small"
                      >
                        +10
                      </button>
                    </>
                  );
                })()}
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
      <BaseSection<DeltaGreenSkillItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />
      {selectedSkill && (
        <DiceRollModal
          isOpen={diceModalOpen}
          onRequestClose={() => setDiceModalOpen(false)}
          gameId={props.section.gameId}
          skillValue={selectedSkill.value}
          initialAction={selectedSkill.actionText}
          onRollComplete={handleRollComplete}
        />
      )}
    </>
  );
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
