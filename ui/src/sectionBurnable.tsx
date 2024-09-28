import React from 'react';
import { BaseSection } from './baseSection';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { generateClient } from "aws-amplify/api";
import { updateSectionMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';

type BurnableItem = {
  id: string;
  name: string;
  length: number;
  states: ('unticked' | 'ticked' | 'burnt')[];
  description: string;
};

type SectionTypeBurnable = {
  showZeros: boolean;
  items: BurnableItem[];
};

const BurnCheckbox: React.FC<{
  state: 'unticked' | 'ticked' | 'burnt';
  onClick: () => void;
  disabled: boolean;
}> = ({ state, onClick, disabled }) => {
  const intl = useIntl();
  let content;
  switch (state) {
    case 'ticked':
      content = intl.formatMessage({ id: "sectionBurnable.tickedEmoji" });
      break;
    case 'burnt':
      content = intl.formatMessage({ id: "sectionBurnable.burntEmoji" });
      break;
    default:
      content = null;
  }

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`burn-checkbox ${state}`}
    >
      {content}
    </button>
  );
};

export const SectionBurnable: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = (props) => {
  const intl = useIntl();
  const toast = useToast();


  const handleStateChange = async (item: BurnableItem, index: number, content: SectionTypeBurnable, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    // Cycle through states: unticked -> ticked -> burnt -> unticked
    const stateOrder: ('unticked' | 'ticked' | 'burnt')[] = ['unticked', 'ticked', 'burnt'];
    const currentStateIndex = stateOrder.indexOf(updatedItem.states[index]);
    updatedItem.states[index] = stateOrder[(currentStateIndex + 1) % 3];

    newItems[itemIndex] = updatedItem;
    setContent({ ...content, items: newItems });
        try {
            const input: UpdateSectionInput = {
            gameId: props.section.gameId,
            sectionId: props.section.sectionId,
            sectionName: props.section.sectionName,
            content: JSON.stringify({ ...content, items: newItems }),
            };
            
            const client = generateClient();
            await client.graphql({
            query: updateSectionMutation,
            variables: { input },
            }) as GraphQLResult<{ updateSection: SheetSection }>;
        } catch (error) {
            console.error("Error updating burnable states:", error);
            toast.addToast(intl.formatMessage({ id: "sectionBurnable.updateError" }), 'error');
        }
    };

    const renderItems = (content: SectionTypeBurnable, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
        return content.items
            .filter(item => content.showZeros || item.states.some(state => state !== 'unticked'))
            .map(item => {
            const sortedStates = [...item.states].sort((a, b) => {
                const order = { burnt: 0, ticked: 1, unticked: 2 };
                return order[a] - order[b];
            });

            return (
                <div key={item.id} className="burnable-item">
                <span>{item.name}</span>
                {sortedStates.map((state, sortedIndex) => {
                    const originalIndex = item.states.findIndex((s, i) => s === state && !item.states.slice(0, i).includes(state));
                    return (
                    <BurnCheckbox
                        key={`${item.id}-${sortedIndex}`}
                        state={state}
                        onClick={() => handleStateChange(item, originalIndex, content, setContent)}
                        disabled={userSubject !== sectionUserId}
                    />
                    );
                })}
                <FaInfoCircle
                    className="info-icon"
                    data-tooltip-content={item.description}
                    data-tooltip-id={`description-tooltip-${item.id}`}
                />
                <Tooltip id={`description-tooltip-${item.id}`} place="top" />
                </div>
            );
        });
    };

    const renderEditForm = (content: SectionTypeBurnable, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
        const handleAddItem = () => {
            const newItems = [...content.items, { 
            id: uuidv4(), 
            name: '', 
            length: 1, 
            states: ['unticked'] as ('unticked' | 'ticked' | 'burnt')[], 
            description: '' 
            }];
            setContent({ ...content, items: newItems });
        };

        const handleRemoveItem = (index: number) => {
            const newItems = content.items.filter((_, i) => i !== index);
            setContent({ ...content, items: newItems });
        };

        const handleItemChange = (index: number, field: string, value: any) => {
            const newItems = [...content.items];
            if (field === 'length') {
            const newLength = Math.max(1, Math.min(10, value));
            const currentStates = newItems[index].states;
            const newStates = [...currentStates];
            
            if (newLength > currentStates.length) {
                newStates.push(...Array(newLength - currentStates.length).fill('unticked' as const));
            } else if (newLength < currentStates.length) {
                newStates.splice(newLength);
            }
            
            newItems[index] = { 
                ...newItems[index], 
                [field]: newLength, 
                states: newStates 
            };
            } else {
            newItems[index] = { ...newItems[index], [field]: value };
            }
            
            setContent({ ...content, items: newItems });
        };

        return (
            <div className="burnable-items-edit">
            {content.items.map((item, index) => (
                <div key={item.id} className="burnable-item-edit">
                <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder={intl.formatMessage({ id: "sectionBurnable.itemName" })}
                />
                <div className="item-length-controls">
                    <button onClick={() => handleItemChange(index, 'length', item.length - 1)}>
                    <FormattedMessage id="sectionBurnable.decrement" />
                    </button>
                    <span>{item.length}</span>
                    <button onClick={() => handleItemChange(index, 'length', item.length + 1)}>
                    <FormattedMessage id="sectionBurnable.increment" />
                    </button>
                </div>
                <textarea
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder={intl.formatMessage({ id: "sectionBurnable.itemDescription" })}
                />
                <button onClick={() => handleRemoveItem(index)}>
                    <FormattedMessage id="sectionBurnable.removeItem" />
                </button>
                </div>
            ))}
            <button onClick={handleAddItem}>
                <FormattedMessage id="sectionBurnable.addItem" />
            </button>
            <div className="show-zeros-toggle">
                <label>
                <input
                    type="checkbox"
                    checked={content.showZeros}
                    onChange={() => setContent({ ...content, showZeros: !content.showZeros })}
                />
                <FormattedMessage id="sectionBurnable.showZeros" />
                </label>
            </div>
            </div>
        );
    };
  return <BaseSection<SectionTypeBurnable> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
