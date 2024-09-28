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

type TrackableItem = {
  id: string;
  name: string;
  length: number;
  ticked: number;
  description: string;
};

type SectionTypeTrackable = {
  showZeros: boolean;
  items: TrackableItem[];
};

const TickCheckbox: React.FC<{
  state: 'unticked' | 'ticked';
  onClick: () => void;
  disabled: boolean;
}> = ({ state, onClick, disabled }) => {
  const intl = useIntl();
  let content = state === 'ticked' ? intl.formatMessage({ id: "sectionTrackable.tickedEmoji" }) : null;

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`tick-checkbox ${state}`}
    >
      {content}
    </button>
  );
};

export const SectionTrackable: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = (props) => {
  const intl = useIntl();
  const toast = useToast();

  const handleTickClick = async (item: TrackableItem, index: number, content: SectionTypeTrackable, setContent: React.Dispatch<React.SetStateAction<SectionTypeTrackable>>) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    if (index < updatedItem.ticked) {
      updatedItem.ticked = Math.max(0, updatedItem.ticked - 1);
    } else if (index >= updatedItem.ticked && updatedItem.ticked < updatedItem.length) {
      updatedItem.ticked = Math.min(updatedItem.length, updatedItem.ticked + 1);
    }

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
      console.error("Error updating ticks:", error);
      toast.addToast(intl.formatMessage({ id: "sectionTrackable.updateError" }), 'error');
    }
  };

  const renderItems = (content: SectionTypeTrackable, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<SectionTypeTrackable>>) => {
    return content.items
      .filter(item => content.showZeros || item.ticked > 0)
      .map(item => (
        <div key={item.id} className="trackable-item">
          <span>{item.name}</span>
          {[...Array(item.length)].map((_, index) => (
            <TickCheckbox
              key={`${item.id}-${index}`}
              state={index < item.ticked ? 'ticked' : 'unticked'}
              onClick={() => handleTickClick(item, index, content, setContent)}
              disabled={userSubject !== sectionUserId}
            />
          ))}
          <FaInfoCircle
            className="info-icon"
            data-tooltip-content={item.description}
            data-tooltip-id={`description-tooltip-${item.id}`}
          />
          <Tooltip id={`description-tooltip-${item.id}`} place="top" />
        </div>
      ));
  };

  const renderEditForm = (content: SectionTypeTrackable, setContent: React.Dispatch<React.SetStateAction<SectionTypeTrackable>>) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { id: uuidv4(), name: '', length: 1, ticked: 0, description: '' }];
      setContent({ ...content, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = content.items.filter((_, i) => i !== index);
      setContent({ ...content, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'length') {
        const newLength = Math.max(1, Math.min(10, value));
        newItems[index].length = newLength;
        if (newItems[index].ticked > newLength) {
          newItems[index].ticked = newLength;
        }
      }
      
      setContent({ ...content, items: newItems });
    };

    return (
      <div className="trackable-items-edit">
        {content.items.map((item, index) => (
          <div key={item.id} className="trackable-item-edit">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionTrackable.itemName" })}
            />
            <div className="item-length-controls">
              <button onClick={() => handleItemChange(index, 'length', item.length - 1)}>
                <FormattedMessage id="sectionTrackable.decrement" />
              </button>
              <span>{item.length}</span>
              <button onClick={() => handleItemChange(index, 'length', item.length + 1)}>
                <FormattedMessage id="sectionTrackable.increment" />
              </button>
            </div>
            <textarea
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionTrackable.itemDescription" })}
            />
            <button onClick={() => handleRemoveItem(index)}>
              <FormattedMessage id="sectionTrackable.removeItem" />
            </button>
          </div>
        ))}
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionTrackable.addItem" />
        </button>
        <div className="show-zeros-toggle">
          <label>
            <input
              type="checkbox"
              checked={content.showZeros}
              onChange={() => setContent({ ...content, showZeros: !content.showZeros })}
            />
            <FormattedMessage id="sectionTrackable.showZeros" />
          </label>
        </div>
      </div>
    );
  };

  return <BaseSection<SectionTypeTrackable> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
