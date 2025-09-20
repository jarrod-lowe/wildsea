import React, { useState, useRef, useCallback } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionEditForm } from './components/SectionEditForm';
import { DiceRollModal } from './components/DiceRollModal';
import { useToast } from './notificationToast';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../appsync/schema";
import { RollDiceInput } from "../../appsync/graphql";
import { RollTypes } from "../../graphql/lib/constants/rollTypes";
import Tippy from '@tippyjs/react';
import ReactMarkdown from 'react-markdown';
import 'tippy.js/dist/tippy.css';

interface DeltaGreenWeaponItem extends BaseSectionItem {
  skillId: string;
  baseRange: string;
  damage: string;
  armorPiercing: string;
  lethality: string;
  killRadius: string;
  ammo: string;
}

type SectionTypeDeltaGreenWeapons = BaseSectionContent<DeltaGreenWeaponItem>;

// Function to get skills from DOM data attributes (similar to stats in derived section)
const getSkillsFromDataAttributes = (): { id: string; name: string; roll: number }[] => {
  const skillsContainer = document.querySelector('.delta-green-skills-grid');
  if (!skillsContainer) return [];

  const skills: { id: string; name: string; roll: number }[] = [];
  const skillElements = skillsContainer.querySelectorAll('.skills-item');

  skillElements.forEach((element, index) => {
    const nameElement = element.querySelector('.skills-col-name');
    const rollElement = element.querySelector('.roll-display');

    if (nameElement && rollElement) {
      const name = nameElement.textContent?.trim() || '';
      const rollText = rollElement.textContent?.trim() || '0%';
      const roll = parseInt(rollText.replace('%', '')) || 0;

      if (name && roll > 0) {
        skills.push({
          id: `skill-${index}`,
          name,
          roll
        });
      }
    }
  });

  return skills;
};

// Function to parse dice notation (e.g., "2d6+3", "1d8", "3d10-1")
const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } | null => {
  if (!notation || notation.toLowerCase() === 'n/a') return null;

  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return null;

  const count = parseInt(match[1]) || 1;
  const sides = parseInt(match[2]) || 6;
  const modifier = match[3] ? parseInt(match[3]) : 0;

  return { count, sides, modifier };
};

// Function to calculate lethality failure damage
const calculateLethalityFailureDamage = (rollValue: number): number => {
  return Math.floor(rollValue / 10) + (rollValue % 10);
};

export const SectionDeltaGreenWeapons: React.FC<SectionDefinition> = (props) => {
  const { section, userSubject } = props;
  const intl = useIntl();
  const toast = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<{
    name: string;
    value: number;
    item: DeltaGreenWeaponItem;
    actionText: string;
    rollType: 'skill' | 'damage' | 'lethality';
  } | null>(null);
  const [lastRollResult, setLastRollResult] = useState<any | null>(null);

  const handleRollComplete = (result: any) => {
    setLastRollResult(result);
  };

  const handleFieldChange = useCallback(async (
    item: DeltaGreenWeaponItem,
    field: string,
    newValue: string,
    content: SectionTypeDeltaGreenWeapons,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, [field]: newValue };
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
    }, 300);
  }, []);

  const handleAmmoDecrement = useCallback(async (
    item: DeltaGreenWeaponItem,
    content: SectionTypeDeltaGreenWeapons,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const currentAmmo = parseInt(item.ammo) || 0;
    if (currentAmmo > 0) {
      await handleFieldChange(item, 'ammo', (currentAmmo - 1).toString(), content, setContent, updateSection);
    }
  }, [handleFieldChange]);

  const handleSkillRoll = (item: DeltaGreenWeaponItem) => {
    const skills = getSkillsFromDataAttributes();
    const skill = skills.find(s => s.id === item.skillId || s.name === item.skillId);

    if (skill) {
      setSelectedWeapon({
        name: `${item.name} (${skill.name})`,
        value: skill.roll,
        item,
        actionText: intl.formatMessage({ id: 'deltaGreenWeapons.skillRoll' }, { weapon: item.name }),
        rollType: 'skill'
      });
      setDiceModalOpen(true);
    } else {
      toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.noSkillFound' }), 'error');
    }
  };

  const handleDamageRoll = async (item: DeltaGreenWeaponItem) => {
    const diceData = parseDiceNotation(item.damage);
    if (!diceData) {
      toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.invalidDamage' }), 'error');
      return;
    }

    try {
      const client = generateClient();
      const input: RollDiceInput = {
        gameId: section.gameId,
        dice: [{
          type: `${diceData.count}d${diceData.sides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? '+' : '') + diceData.modifier : ''}`,
          size: diceData.sides,
          modifier: diceData.modifier
        }],
        rollType: RollTypes.SUM,
        target: 0,
        action: intl.formatMessage({ id: 'deltaGreenWeapons.damageRoll' }, { weapon: item.name }),
        onBehalfOf: userSubject || undefined,
      };

      const result = await client.graphql({
        query: rollDiceMutation,
        variables: { input },
      });

      if ('data' in result && result.data?.rollDice) {
        const rollResult = result.data.rollDice;

        // Show the damage roll result in the modal
        setSelectedWeapon({
          name: `${item.name} (Damage)`,
          value: 0, // Not used for damage rolls
          item,
          actionText: intl.formatMessage({ id: 'deltaGreenWeapons.damageRoll' }, { weapon: item.name }),
          rollType: 'damage'
        });
        setLastRollResult(rollResult);
        setDiceModalOpen(true);
      }
    } catch (error) {
      console.error('Error rolling damage:', error);
      toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.rollError' }), 'error');
    }
  };

  const handleLethalityRoll = (item: DeltaGreenWeaponItem) => {
    const lethalityMatch = item.lethality.match(/(\d+)%?/);
    if (lethalityMatch) {
      const lethalityValue = parseInt(lethalityMatch[1]);
      setSelectedWeapon({
        name: `${item.name} (Lethality)`,
        value: lethalityValue,
        item,
        actionText: intl.formatMessage({ id: 'deltaGreenWeapons.lethalityRoll' }, { weapon: item.name }),
        rollType: 'lethality'
      });
      setDiceModalOpen(true);
    } else {
      toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.invalidLethality' }), 'error');
    }
  };


  const renderItems = (
    content: SectionTypeDeltaGreenWeapons,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    _isEditing: boolean,
  ) => {
    const skills = getSkillsFromDataAttributes();

    return (
      <>
        <div className="weapons-note">
          <FormattedMessage id="deltaGreenWeapons.armorNote" />
        </div>
        <div className="weapons-table-container">
          <div
            className="weapons-table"
            role="table"
            aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.tableLabel' })}
          >
          <div className="weapons-header" role="rowgroup">
            <div className="weapon-col-name" role="columnheader"><FormattedMessage id="deltaGreenWeapons.weaponName" /></div>
            <div className="weapon-col-skill" role="columnheader"><FormattedMessage id="deltaGreenWeapons.skill" /></div>
            <div className="weapon-col-range" role="columnheader"><FormattedMessage id="deltaGreenWeapons.baseRange" /></div>
            <div className="weapon-col-damage" role="columnheader"><FormattedMessage id="deltaGreenWeapons.damage" /></div>
            <div className="weapon-col-ap" role="columnheader"><FormattedMessage id="deltaGreenWeapons.armorPiercing" /></div>
            <div className="weapon-col-lethality" role="columnheader"><FormattedMessage id="deltaGreenWeapons.lethality" /></div>
            <div className="weapon-col-radius" role="columnheader"><FormattedMessage id="deltaGreenWeapons.killRadius" /></div>
            <div className="weapon-col-ammo" role="columnheader"><FormattedMessage id="deltaGreenWeapons.ammo" /></div>
          </div>
          {content.items
            .filter(item => content.showEmpty || item.name !== '')
            .map(item => {
              const skill = skills.find(s => s.id === item.skillId || s.name === item.skillId);
              const hasValidAmmo = item.ammo && item.ammo !== 'N/A' && !isNaN(parseInt(item.ammo));
              const hasValidDamage = item.damage && item.damage !== 'N/A' && parseDiceNotation(item.damage);
              const hasValidLethality = item.lethality && item.lethality !== 'N/A' && item.lethality.match(/\d+%?/);

              return (
                <div key={item.id} className="weapon-row" role="row">
                  <div className="weapon-col-name" data-label="Name" role="cell">
                    <span className="weapon-name">{item.name}</span>
                    {item.description && (
                      <Tippy
                        content={<ReactMarkdown>{item.description}</ReactMarkdown>}
                        interactive={true}
                        trigger="click"
                        arrow={true}
                        placement="top"
                        className="markdown-tippy"
                      >
                        <button
                          className="btn-icon info"
                          aria-label={intl.formatMessage({ id: 'showInfo.itemDescription' })}
                        >
                          ℹ
                        </button>
                      </Tippy>
                    )}
                  </div>
                  <div className="weapon-col-skill" data-label="Skill" role="cell">
                    {skill ? (
                      <div className="weapon-skill">
                        <span>{skill.name} ({skill.roll}%)</span>
                        {mayEditSheet && (
                          <button
                            className="dice-button"
                            onClick={() => handleSkillRoll(item)}
                            aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.rollSkill' }, { weapon: item.name })}
                            title={intl.formatMessage({ id: 'deltaGreenWeapons.rollSkill' }, { weapon: item.name })}
                          >
                            🎲
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="no-skill">—</span>
                    )}
                  </div>
                  <div className="weapon-col-range" data-label="Range" role="cell">
                    <span>{item.baseRange || 'N/A'}</span>
                  </div>
                  <div className="weapon-col-damage" data-label="Damage" role="cell">
                    <div className="weapon-damage">
                      <span>{item.damage || 'N/A'}</span>
                      {mayEditSheet && hasValidDamage && (
                        <button
                          className="dice-button"
                          onClick={() => handleDamageRoll(item)}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.rollDamage' }, { weapon: item.name })}
                          title={intl.formatMessage({ id: 'deltaGreenWeapons.rollDamage' }, { weapon: item.name })}
                        >
                          🎲
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="weapon-col-ap" data-label="AP" role="cell">
                    <span>{item.armorPiercing || 'N/A'}</span>
                  </div>
                  <div className="weapon-col-lethality" data-label="Lethality" role="cell">
                    <div className="weapon-lethality">
                      <span>{item.lethality || 'N/A'}</span>
                      {mayEditSheet && hasValidLethality && (
                        <button
                          className="dice-button"
                          onClick={() => handleLethalityRoll(item)}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.rollLethality' }, { weapon: item.name })}
                          title={intl.formatMessage({ id: 'deltaGreenWeapons.rollLethality' }, { weapon: item.name })}
                        >
                          🎲
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="weapon-col-radius" data-label="Radius" role="cell">
                    <span>{item.killRadius || 'N/A'}</span>
                  </div>
                  <div className="weapon-col-ammo" data-label="Ammo" role="cell">
                    <div className="weapon-ammo">
                      <span>{item.ammo || 'N/A'}</span>
                      {mayEditSheet && hasValidAmmo && (
                        <button
                          className="adjust-btn small"
                          onClick={() => handleAmmoDecrement(item, content, setContent, updateSection)}
                          disabled={parseInt(item.ammo) <= 0}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.decrementAmmo' }, { weapon: item.name })}
                          title={intl.formatMessage({ id: 'deltaGreenWeapons.decrementAmmo' }, { weapon: item.name })}
                        >
                          -1
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {diceModalOpen && selectedWeapon && (
          <DiceRollModal
            isOpen={diceModalOpen}
            onRequestClose={() => {
              setDiceModalOpen(false);
              setLastRollResult(null);
            }}
            gameId={section.gameId}
            skillValue={selectedWeapon.value}
            initialAction={selectedWeapon.actionText}
            onRollComplete={handleRollComplete}
            onBehalfOf={userSubject}
            prePopulatedResult={selectedWeapon.rollType === 'damage' ? lastRollResult : undefined}
            customActionsAfterRoll={
              selectedWeapon.rollType === 'lethality' &&
              lastRollResult &&
              (lastRollResult.grade === 'FAILURE' || lastRollResult.grade === 'FUMBLE') ? (
                <div className="lethality-failure-damage">
                  <strong>
                    {intl.formatMessage(
                      { id: 'deltaGreenWeapons.lethalityFailure' },
                      {
                        weapon: selectedWeapon.item.name,
                        damage: calculateLethalityFailureDamage(lastRollResult.value)
                      }
                    )}
                  </strong>
                </div>
              ) : undefined
            }
          />
        )}
      </>
    );
  };

  const renderEditForm = (
    content: SectionTypeDeltaGreenWeapons,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>,
    handleUpdate: () => void,
    handleCancel: () => void
  ) => {
    const skills = getSkillsFromDataAttributes();

    const handleAddItem = () => {
      const newItems = [...content.items, {
        id: uuidv4(),
        name: '',
        description: '',
        skillId: '',
        baseRange: 'N/A',
        damage: 'N/A',
        armorPiercing: 'N/A',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: 'N/A'
      }];
      setContent({ ...content, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = content.items.filter((_, i) => i !== index);
      setContent({ ...content, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: string) => {
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setContent({ ...content, items: newItems });
    };

    return (
      <div className="weapon-edit-form">
        <SectionEditForm
          content={content}
          setContent={setContent}
          renderItemEdit={(item, index) => (
          <>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.weaponName" })}</label>
              <input
                type="text"
                value={item.name || ''}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.weaponName" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.weaponName" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "sectionObject.itemDescription" })}</label>
              <textarea
                value={item.description || ''}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
                aria-label={intl.formatMessage({ id: "sectionObject.itemDescription" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.skill" })}</label>
              <select
                value={item.skillId || ''}
                onChange={(e) => handleItemChange(index, 'skillId', e.target.value)}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.skill" })}
              >
                <option value="">{intl.formatMessage({ id: "deltaGreenWeapons.selectSkill" })}</option>
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name} ({skill.roll}%)</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.baseRange" })}</label>
              <input
                type="text"
                value={item.baseRange || ''}
                onChange={(e) => handleItemChange(index, 'baseRange', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.baseRange" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.baseRange" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.damage" })}</label>
              <input
                type="text"
                value={item.damage || ''}
                onChange={(e) => handleItemChange(index, 'damage', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.damage" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.damage" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.armorPiercing" })}</label>
              <input
                type="text"
                value={item.armorPiercing || ''}
                onChange={(e) => handleItemChange(index, 'armorPiercing', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.armorPiercing" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.armorPiercing" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.lethality" })}</label>
              <input
                type="text"
                value={item.lethality || ''}
                onChange={(e) => handleItemChange(index, 'lethality', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.lethality" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.lethality" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.killRadius" })}</label>
              <input
                type="text"
                value={item.killRadius || ''}
                onChange={(e) => handleItemChange(index, 'killRadius', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.killRadius" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.killRadius" })}
              />
            </div>
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.ammo" })}</label>
              <input
                type="text"
                value={item.ammo || ''}
                onChange={(e) => handleItemChange(index, 'ammo', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.ammo" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.ammo" })}
              />
            </div>
          </>
        )}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
        handleUpdate={handleUpdate}
        handleCancel={handleCancel}
        />
      </div>
    );
  };

  return <BaseSection<DeltaGreenWeaponItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};

export const createDefaultDeltaGreenWeaponsContent = () => ({
  showEmpty: false,
  items: []
});