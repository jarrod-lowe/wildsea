import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection, RollDiceInput, DiceRoll, GamePresetItem } from "../../appsync/graphql";
import { useIntl, FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionEditForm } from './components/SectionEditForm';
import { DiceRollModal } from './components/DiceRollModal';
import { useToast } from './notificationToast';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../appsync/schema";
import { RollTypes } from "../../graphql/lib/constants/rollTypes";
import { getGamePresets } from './utils/gamePresetsCache';
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
  maxAmmo: string;
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
      const roll = Number.parseInt(rollText.replace(/%/g, '')) || 0;

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

// Function to get stats from DOM data attributes for stat-based skills like DEXx5
const getStatsFromDataAttributes = (): { id: string; name: string; roll: number }[] => {
  const statsContainer = document.querySelector('.delta-green-stats-grid');
  if (!statsContainer) return [];

  const stats: { id: string; name: string; roll: number }[] = [];

  // Common stat abbreviations used in Delta Green
  const statAbbreviations = ['STR', 'CON', 'DEX', 'INT', 'POW', 'CHA'];

  statAbbreviations.forEach(abbrev => {
    const statValue = Number.parseInt(statsContainer.getAttribute(`data-stat-${abbrev.toLowerCase()}`) || '0');
    if (statValue > 0) {
      stats.push({
        id: `stat-${abbrev.toLowerCase()}`,
        name: `${abbrev}×5`,
        roll: statValue * 5
      });
    }
  });

  return stats;
};

// Function to get all available skills and stats combined
const getAllSkillsAndStats = (): { id: string; name: string; roll: number; isStatBased?: boolean }[] => {
  const skills = getSkillsFromDataAttributes().map(skill => ({ ...skill, isStatBased: false }));
  const stats = getStatsFromDataAttributes().map(stat => ({ ...stat, isStatBased: true }));
  return [...skills, ...stats];
};

// Function to parse dice notation (e.g., "2d6+3", "1d8", "3d10-1")
const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } | null => {
  if (!notation || notation.toLowerCase() === 'n/a') return null;

  const regex = /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i;
  const match = regex.exec(notation);
  if (!match) return null;

  const count = Number.parseInt(match[1]) || 1;
  const sides = Number.parseInt(match[2]) || 6;
  const modifier = match[3] ? Number.parseInt(match[3]) : 0;

  return { count, sides, modifier };
};

// Function to calculate lethality failure damage
const calculateLethalityFailureDamage = (rollValue: number): number => {
  return Math.floor(rollValue / 10) + (rollValue % 10);
};

// Helper function to format dice modifier string
const getModifierString = (modifier: number): string => {
  if (modifier === 0) return '';
  if (modifier > 0) return `+${modifier}`;
  return modifier.toString();
};

type SelectedWeapon = {
  name: string;
  value: number;
  item: DeltaGreenWeaponItem;
  actionText: string;
  rollType: 'skill' | 'damage' | 'lethality';
  messageType?: string;
  needsAmmoDecrement?: boolean;
};

export const SectionDeltaGreenWeapons: React.FC<SectionDefinition> = (props) => {
  const { section, userSubject } = props;
  const intl = useIntl();
  const toast = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<SelectedWeapon | null>(null);
  const [lastRollResult, setLastRollResult] = useState<DiceRoll | null>(null);
  const [presetWeapons, setPresetWeapons] = useState<GamePresetItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Load preset weapons when component mounts
  useEffect(() => {
    const loadPresetWeapons = async () => {
      setLoadingPresets(true);
      try {
        const presets = await getGamePresets('deltagreen-weapons', intl.locale);
        setPresetWeapons(presets);
      } catch (error) {
        toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.presetLoadError' }), 'error');
      } finally {
        setLoadingPresets(false);
      }
    };

    loadPresetWeapons();
  }, [intl.locale, toast]);

  // Helper: Tick the 'used' flag on the relevant skill in the DOM
  const tickUsedFlagOnSkill = (skillName: string) => {
    const skillsContainer = document.querySelector('.delta-green-skills-grid');
    if (!skillsContainer) return;
    const skillElements = Array.from(skillsContainer.querySelectorAll('.skills-item'));
    for (const element of skillElements) {
      const nameElement = element.querySelector('.skills-col-name');
      if (nameElement && nameElement.textContent?.trim() === skillName) {
        const usedCheckbox = element.querySelector('input[type="checkbox"]');
        if (usedCheckbox && !(usedCheckbox as HTMLInputElement).checked) {
          (usedCheckbox as HTMLInputElement).click();
        }
        break;
      }
    }
  };

  // When a weapon skill roll fails or fumbles, tick the 'used' flag on the relevant skill
  // Note: DEXx5 and other stat-based skills don't have a 'used' flag to tick
  const handleRollComplete = (result: DiceRoll, content: SectionTypeDeltaGreenWeapons, setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>, updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>) => {
    setLastRollResult(result);
    if (selectedWeapon) {
      // Decrement ammo when the weapon is actually fired
      if (selectedWeapon.needsAmmoDecrement) {
        const hasValidAmmo = selectedWeapon.item.ammo && selectedWeapon.item.ammo !== 'N/A' && !Number.isNaN(Number.parseInt(selectedWeapon.item.ammo));
        if (hasValidAmmo) {
          handleAmmoDecrement(selectedWeapon.item, content, setContent, updateSection);
        }
      }

      // Only tick 'used' flag for failures and fumbles on skill rolls (not lethality rolls)
      if (selectedWeapon.rollType === 'skill' && (result.grade === 'FAILURE' || result.grade === 'FUMBLE')) {
        // Extract skill name from selectedWeapon
        const skillName = selectedWeapon.name.split('(')[1]?.replace(')', '').trim();
        if (skillName && !skillName.includes('×5')) {
          // Only tick 'used' flag for regular skills, not stat-based skills like DEXx5
          tickUsedFlagOnSkill(skillName);
        }
      }
    }
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
    const currentAmmo = Number.parseInt(item.ammo) || 0;
    if (currentAmmo > 0) {
      await handleFieldChange(item, 'ammo', (currentAmmo - 1).toString(), content, setContent, updateSection);
    }
  }, [handleFieldChange]);

  const handleReload = useCallback(async (
    item: DeltaGreenWeaponItem,
    content: SectionTypeDeltaGreenWeapons,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenWeapons>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const maxAmmo = item.maxAmmo;
    if (maxAmmo && maxAmmo !== 'N/A' && !Number.isNaN(Number.parseInt(maxAmmo))) {
      await handleFieldChange(item, 'ammo', maxAmmo, content, setContent, updateSection);
    }
  }, [handleFieldChange]);

  const handleSkillRoll = (item: DeltaGreenWeaponItem) => {
    const allSkillsAndStats = getAllSkillsAndStats();
    const skill = allSkillsAndStats.find(s => s.id === item.skillId || s.name === item.skillId);

    if (skill) {
      // Set actionText to just the weapon name for skill rolls
      setSelectedWeapon({
        name: `${item.name} (${skill.name})`,
        value: skill.roll,
        item,
        actionText: item.name,
        rollType: 'skill',
        messageType: 'deltaGreenAttack',
        needsAmmoDecrement: true
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

    const client = generateClient();
    const input: RollDiceInput = {
      gameId: section.gameId,
      dice: [{
        type: `${diceData.count}d${diceData.sides}${getModifierString(diceData.modifier)}`,
        size: diceData.sides,
        modifier: diceData.modifier
      }],
      rollType: RollTypes.SUM,
      target: 0,
      action: intl.formatMessage({ id: 'deltaGreenWeapons.damageRoll' }, { weapon: item.name }),
      onBehalfOf: userSubject || undefined,
      messageType: 'deltaGreenDamage',
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
  };

  const handleLethalityRoll = (item: DeltaGreenWeaponItem) => {
    const lethalityRegex = /(\d+)%?/;
    const lethalityMatch = lethalityRegex.exec(item.lethality);
    if (lethalityMatch) {
      const lethalityValue = Number.parseInt(lethalityMatch[1]);
      setSelectedWeapon({
        name: `${item.name} (Lethality)`,
        value: lethalityValue,
        item,
        actionText: intl.formatMessage({ id: 'deltaGreenWeapons.lethalityRoll' }, { weapon: item.name }),
        rollType: 'lethality',
        needsAmmoDecrement: true
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
    const allSkillsAndStats = getAllSkillsAndStats();

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
              const skill = allSkillsAndStats.find(s => s.id === item.skillId || s.name === item.skillId);
              const hasValidAmmo = item.ammo && item.ammo !== 'N/A' && !Number.isNaN(Number.parseInt(item.ammo));
              const hasValidDamage = item.damage && item.damage !== 'N/A' && parseDiceNotation(item.damage);
              const lethalityTestRegex = /\d+%?/;
              const hasValidLethality = item.lethality && item.lethality !== 'N/A' && lethalityTestRegex.test(item.lethality);

              return (
                <div key={item.id} className="weapon-row" role="row">
                  <div
                    className="weapon-col-name"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.weaponName' })}
                    role="cell"
                  >
                    <span className="weapon-name">{item.name}</span>
                    {item.description && (
                      <Tippy
                        content={<ReactMarkdown>{item.description}</ReactMarkdown>}
                        interactive={true}
                        trigger="click"
                        arrow={true}
                        placement="top"
                        className="markdown-tippy"
                        appendTo="parent"
                        onShown={(instance) => { (instance.popper.querySelector('.tippy-box') as HTMLElement)?.focus(); }}
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
                  <div
                    className="weapon-col-skill"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.skill' })}
                    role="cell"
                  >
                    {skill ? (
                      <div className="weapon-skill">
                        <span>{skill.name} ({skill.roll}%)</span>
                        {mayEditSheet && (
                          <button
                            className="dice-button"
                            onClick={() => handleSkillRoll(item)}
                            disabled={!!hasValidAmmo && Number.parseInt(item.ammo) <= 0}
                            aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.rollSkill' }, { weapon: item.name })}
                            title={!!hasValidAmmo && Number.parseInt(item.ammo) <= 0 ? intl.formatMessage({ id: 'deltaGreenWeapons.noAmmo' }, { weapon: item.name }) : intl.formatMessage({ id: 'deltaGreenWeapons.rollSkill' }, { weapon: item.name })}
                          >
                            🎲
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="no-skill">—</span>
                    )}
                  </div>
                  <div
                    className="weapon-col-range"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.baseRange' })}
                    role="cell"
                  >
                    <span>{item.baseRange || 'N/A'}</span>
                  </div>
                  <div
                    className="weapon-col-damage"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.damage' })}
                    role="cell"
                  >
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
                  <div
                    className="weapon-col-ap"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.armorPiercing' })}
                    role="cell"
                  >
                    <span>{item.armorPiercing || 'N/A'}</span>
                  </div>
                  <div
                    className="weapon-col-lethality"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.lethality' })}
                    role="cell"
                  >
                    <div className="weapon-lethality">
                      <span>{item.lethality || 'N/A'}</span>
                      {mayEditSheet && hasValidLethality && (
                        <button
                          className="dice-button"
                          onClick={() => handleLethalityRoll(item)}
                          disabled={!!hasValidAmmo && Number.parseInt(item.ammo) <= 0}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.rollLethality' }, { weapon: item.name })}
                          title={!!hasValidAmmo && Number.parseInt(item.ammo) <= 0 ? intl.formatMessage({ id: 'deltaGreenWeapons.noAmmo' }, { weapon: item.name }) : intl.formatMessage({ id: 'deltaGreenWeapons.rollLethality' }, { weapon: item.name })}
                        >
                          🎲
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className="weapon-col-radius"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.killRadius' })}
                    role="cell"
                  >
                    <span>{item.killRadius || 'N/A'}</span>
                  </div>
                  <div
                    className="weapon-col-ammo"
                    data-label={intl.formatMessage({ id: 'deltaGreenWeapons.ammo' })}
                    role="cell"
                  >
                    <div className="weapon-ammo">
                      <span>{item.ammo || 'N/A'}</span>
                      {mayEditSheet && hasValidAmmo && (
                        <button
                          className="adjust-btn small"
                          onClick={() => handleAmmoDecrement(item, content, setContent, updateSection)}
                          disabled={Number.parseInt(item.ammo) <= 0}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.decrementAmmo' }, { weapon: item.name })}
                          title={intl.formatMessage({ id: 'deltaGreenWeapons.decrementAmmo' }, { weapon: item.name })}
                        >
                          -1
                        </button>
                      )}
                      {mayEditSheet && hasValidAmmo && (
                        <button
                          className="adjust-btn small reload"
                          onClick={() => handleReload(item, content, setContent, updateSection)}
                          disabled={!item.maxAmmo || item.maxAmmo === 'N/A' || Number.isNaN(Number.parseInt(item.maxAmmo))}
                          aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.reloadWeapon' }, { weapon: item.name })}
                          title={intl.formatMessage({ id: 'deltaGreenWeapons.reloadWeapon' }, { weapon: item.name })}
                        >
                          {intl.formatMessage({ id: 'deltaGreenWeapons.reloadSymbol' })}
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
            onRollComplete={(result) => handleRollComplete(result, content, setContent, updateSection)}
            onBehalfOf={userSubject}
            prePopulatedResult={selectedWeapon.rollType === 'damage' ? lastRollResult || undefined : undefined}
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
            // Pass messageType for skill rolls
            {...(selectedWeapon.rollType === 'skill' && selectedWeapon.messageType ? { messageType: selectedWeapon.messageType } : {})}
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
    const allSkillsAndStats = getAllSkillsAndStats();

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
        ammo: 'N/A',
        maxAmmo: 'N/A'
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

    const handleAddPresetWeapon = () => {
      if (!selectedPreset) return;

      const preset = presetWeapons.find(p => p.displayName === selectedPreset);
      if (!preset) return;

      try {
        // Parse twice because the data is double-encoded JSON
        const firstParse = JSON.parse(preset.data);
        const weaponData = JSON.parse(firstParse);

        // Look up skill ID by skill name
        const allSkillsAndStats = getAllSkillsAndStats();
        const skill = allSkillsAndStats.find(s => s.name === weaponData.skillId);
        const skillId = skill ? skill.id : '';

        const newWeapon: DeltaGreenWeaponItem = {
          id: uuidv4(),
          name: weaponData.name || '',
          description: weaponData.description || '',
          skillId: skillId,
          baseRange: weaponData.baseRange || 'N/A',
          damage: weaponData.damage || 'N/A',
          armorPiercing: weaponData.armorPiercing || 'N/A',
          lethality: weaponData.lethality || 'N/A',
          killRadius: weaponData.killRadius || 'N/A',
          ammo: weaponData.ammo || 'N/A',
          maxAmmo: weaponData.maxAmmo || weaponData.ammo || 'N/A'
        };

        const newItems = [...content.items, newWeapon];
        setContent({ ...content, items: newItems });
        setSelectedPreset(''); // Reset selection
        toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.presetAdded' }, { weapon: newWeapon.name }), 'success');
      } catch (error) {
        toast.addToast(intl.formatMessage({ id: 'deltaGreenWeapons.presetAddError' }), 'error');
      }
    };

    return (
      <div className="weapon-edit-form">
        {presetWeapons.length > 0 && (
          <div className="section-item-edit">
            <div className="preset-weapon-row">
              <span className="preset-label">
                {intl.formatMessage({ id: 'deltaGreenWeapons.addPresetWeapon' })}
              </span>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                disabled={loadingPresets}
                className="preset-select"
                aria-label={intl.formatMessage({ id: 'deltaGreenWeapons.selectWeapon' })}
              >
                <option value="">{intl.formatMessage({ id: 'deltaGreenWeapons.chooseWeapon' })}</option>
                {presetWeapons.map((preset) => (
                  <option key={preset.displayName} value={preset.displayName}>
                    {preset.displayName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPresetWeapon}
                disabled={!selectedPreset || loadingPresets}
                className="btn-standard btn-small"
              >
                ✚ {intl.formatMessage({ id: 'deltaGreenWeapons.addWeapon' })}
              </button>
            </div>
          </div>
        )}
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
                {allSkillsAndStats.map(skill => (
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
            <div className="form-field">
              <label>{intl.formatMessage({ id: "deltaGreenWeapons.maxAmmo" })}</label>
              <input
                type="text"
                value={item.maxAmmo || ''}
                onChange={(e) => handleItemChange(index, 'maxAmmo', e.target.value)}
                placeholder={intl.formatMessage({ id: "deltaGreenWeapons.maxAmmo" })}
                aria-label={intl.formatMessage({ id: "deltaGreenWeapons.maxAmmo" })}
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