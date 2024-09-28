import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem } from './baseSection';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { generateClient } from "aws-amplify/api";
import { updateSectionMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';

type BurnableState = 'unticked' | 'ticked' | 'burnt';

interface BurnableItem extends BaseSectionItem {
  length: number;
  states: BurnableState[];
};

type SectionTypeBurnable = BaseSectionContent<BurnableItem>;

const BurnCheckbox: React.FC<{
  state: BurnableState;
  onClick: () => void;
  disabled: boolean;
}> = ({ state, onClick, disabled }) => {
  const intl = useIntl();
  let content;
  switch (state) {
    case 'ticked':
      content = intl.formatMessage({ id: "sectionObject.tickedEmoji" });
      break;
    case 'burnt':
      content = intl.formatMessage({ id: "sectionObject.burntEmoji" });
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


    const handleStateChange = async (item: BurnableItem, sortedIndex: number, content: SectionTypeBurnable, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
        const newItems = [...content.items];
        const itemIndex = newItems.findIndex(i => i.id === item.id);
        const updatedItem = { ...item };

        // Sort the states
        const sortedStates = [...updatedItem.states].sort((a, b) => {
            const order: BurnableState[] = ['burnt', 'ticked', 'unticked'];
            return order.indexOf(a) - order.indexOf(b);
        });

        // Cycle through states: unticked -> ticked -> burnt -> unticked
        const stateOrder: BurnableState[] = ['unticked', 'ticked', 'burnt'];
        const currentState = sortedStates[sortedIndex];
        const currentStateIndex = stateOrder.indexOf(currentState);
        const newState = stateOrder[(currentStateIndex + 1) % 3];

        // Update the state in the original (unsorted) array
        const originalIndex = updatedItem.states.findIndex(s => s === currentState);
        updatedItem.states[originalIndex] = newState;

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
            toast.addToast(intl.formatMessage({ id: "sectionObject.updateError" }), 'error');
        }
    };

    const renderItems = (content: SectionTypeBurnable, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
        return content.items
        .filter(item => content.showEmpty || item.states.some(state => state !== 'unticked'))
        .map(item => {
            const sortedStates = [...item.states].sort((a,b) => {
                const order: BurnableState[] = ['burnt', 'ticked', 'unticked'];
                return order.indexOf(a) - order.indexOf(b);
            });

            return (
            <SectionItem
                key={item.id}
                item={item}
                renderContent={(item) => (
                    <>
                    {sortedStates.map((state, index) => (
                        <BurnCheckbox
                        key={`${item.id}-${index}`}
                        state={state}
                        onClick={() => handleStateChange(item, index, content, setContent)}
                        disabled={userSubject !== sectionUserId}
                        />
                    ))}
                    </>
                )}
            />
        )});
    };

  const renderEditForm = (content: SectionTypeBurnable, setContent: React.Dispatch<React.SetStateAction<SectionTypeBurnable>>) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { id: uuidv4(), name: '', length: 1, states: ['unticked' as BurnableState], description: '' }];
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
      <SectionEditForm
        content={content}
        setContent={setContent}
        renderItemEdit={(item, index) => (
          <>
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionObject.itemName" })}
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
              placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
            />
          </>
        )}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
      />
    );
  };

  return <BaseSection<BurnableItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};