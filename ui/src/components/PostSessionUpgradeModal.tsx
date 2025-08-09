import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { rollDiceMutation } from "../../../appsync/schema";
import { RollDiceInput, DiceRoll } from "../../../appsync/graphql";
import { RollTypes } from "../../../graphql/lib/constants/rollTypes";
import { useToast } from '../notificationToast';

interface SkillUpgrade {
  id: string;
  name: string;
  currentValue: number;
  rollResult?: DiceRoll;
  upgradeAmount?: number;
  hasError?: boolean;
}

interface PostSessionUpgradeModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  gameId: string;
  skillsToUpgrade: { id: string; name: string; currentValue: number }[];
  onUpgradesComplete: (upgrades: { id: string; upgradeAmount: number }[]) => void;
  onBehalfOf?: string;
}

export const PostSessionUpgradeModal: React.FC<PostSessionUpgradeModalProps> = ({
  isOpen,
  onRequestClose,
  gameId,
  skillsToUpgrade,
  onUpgradesComplete,
  onBehalfOf
}) => {
  const intl = useIntl();
  const toast = useToast();
  const [upgrades, setUpgrades] = useState<SkillUpgrade[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRollingIndex, setCurrentRollingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && skillsToUpgrade.length > 0) {
      // Initialize upgrades from skills to upgrade
      const initialUpgrades: SkillUpgrade[] = skillsToUpgrade.map(skill => ({
        id: skill.id,
        name: skill.name,
        currentValue: skill.currentValue,
        rollResult: undefined,
        upgradeAmount: undefined,
        hasError: false
      }));
      setUpgrades(initialUpgrades);
      setIsRolling(false);
      setCurrentRollingIndex(null);
      
      // Automatically roll for all skills
      rollAllSkills(initialUpgrades);
    }
  }, [isOpen, skillsToUpgrade]);

  const rollAllSkills = async (skillUpgrades: SkillUpgrade[]) => {
    setIsRolling(true);
    const updatedUpgrades: SkillUpgrade[] = [...skillUpgrades];
    
    // Roll for each skill sequentially (skip skills already at maximum)
    for (let i = 0; i < skillUpgrades.length; i++) {
      // Skip skills that are already at maximum (99%)
      if (skillUpgrades[i].currentValue >= 99) {
        continue;
      }
      setCurrentRollingIndex(i);
      
      try {
        const client = generateClient();
        const skill = skillUpgrades[i];
        const input: RollDiceInput = {
          gameId,
          dice: [{ type: 'd4', size: 4 }],
          rollType: RollTypes.SUM,
          target: 0,
          action: intl.formatMessage({ id: 'postSessionUpgrade.learnSkill' }, { skillName: skill.name }),
          onBehalfOf: onBehalfOf || undefined,
        };
        
        const result = await client.graphql({
          query: rollDiceMutation,
          variables: { input },
        });

        if ('data' in result && result.data?.rollDice) {
          const rollResult = result.data.rollDice;
          const upgradeAmount = rollResult.value || rollResult.total || rollResult.dice?.[0]?.result;
          
          if (upgradeAmount === undefined || upgradeAmount === null) {
            throw new Error(`No dice result returned for skill ${skill.name}`);
          }
          
          // Update our local copy
          updatedUpgrades[i] = {
            ...updatedUpgrades[i],
            rollResult,
            upgradeAmount
          };
          
          // Update state
          setUpgrades([...updatedUpgrades]);
          
          // Small delay between rolls for visual effect
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw new Error(`Invalid response from dice roll mutation for skill ${skill.name}`);
        }
      } catch (error) {
        console.error(`Error rolling dice for skill ${skillUpgrades[i].name}:`, error);
        toast.addToast(
          intl.formatMessage(
            { id: 'postSessionUpgrade.rollError' }, 
            { skillName: skillUpgrades[i].name }
          ), 
          'error'
        );
        
        // Mark this skill as having an error
        updatedUpgrades[i] = {
          ...updatedUpgrades[i],
          hasError: true
        };
        setUpgrades([...updatedUpgrades]);
      }
    }
    
    setIsRolling(false);
    setCurrentRollingIndex(null);
    
    // Automatically apply upgrades when all rolls are complete
    setTimeout(() => {
      const completedUpgrades = updatedUpgrades
        .filter(upgrade => upgrade.upgradeAmount !== undefined && upgrade.currentValue < 99)
        .map(upgrade => ({
          id: upgrade.id,
          upgradeAmount: upgrade.upgradeAmount!
        }));
      
      onUpgradesComplete(completedUpgrades);
    }, 500);
  };



  const handleClose = () => {
    if (!isRolling) {
      onRequestClose();
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={isRolling ? () => {} : onRequestClose}
      contentLabel={intl.formatMessage({ id: 'postSessionUpgrade.title' })}
      className="post-session-upgrade-modal"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h2 id="post-session-upgrade-modal-title">
          <FormattedMessage id="postSessionUpgrade.title" />
        </h2>
      </div>

      <div className="modal-body">
        <div className="upgrade-instructions">
          <FormattedMessage id="postSessionUpgrade.instructions" />
        </div>

        <div className="skills-upgrade-list">
          {upgrades.map((upgrade, index) => (
            <div key={upgrade.id} className="skill-upgrade-item">
              <div className="skill-info">
                <h4>{upgrade.name}</h4>
              </div>
              
              <div className="upgrade-controls">
                <div className="roll-result">
                  {(() => {
                    if (upgrade.currentValue >= 99) {
                      return (
                        <div className="upgrade-preview at-maximum">
                          <FormattedMessage id="postSessionUpgrade.atMaximum" />
                        </div>
                      );
                    }
                    
                    if (upgrade.upgradeAmount !== undefined) {
                      return (
                        <div className="upgrade-preview">
                          <FormattedMessage 
                            id="postSessionUpgrade.newValue"
                            values={{ 
                              oldValue: upgrade.currentValue,
                              upgradeAmount: upgrade.upgradeAmount,
                              newValue: Math.min(99, upgrade.currentValue + upgrade.upgradeAmount)
                            }}
                          />
                        </div>
                      );
                    }
                    
                    if (upgrade.hasError) {
                      return (
                        <div className="rolling-status error">
                          <FormattedMessage id="postSessionUpgrade.error" />
                        </div>
                      );
                    }
                    
                    const statusMessage = isRolling && currentRollingIndex === index 
                      ? "postSessionUpgrade.rolling" 
                      : "postSessionUpgrade.waiting";
                    
                    return (
                      <div className="rolling-status">
                        <FormattedMessage id={statusMessage} />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={handleClose}
            disabled={isRolling}
          >
            <FormattedMessage id="postSessionUpgrade.close" />
          </button>
        </div>
      </div>
    </Modal>
  );
};