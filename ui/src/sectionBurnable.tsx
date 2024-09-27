import React, { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPencilAlt, FaInfoCircle } from 'react-icons/fa';
import { useToast } from './notificationToast';
import { Tooltip } from 'react-tooltip';
import { v4 as uuidv4 } from 'uuid';

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

const BurnableItem: React.FC<{
  item: BurnableItem;
  handleStateChange: (index: number) => void;
  userSubject: string;
  sectionUserId: string;
}> = ({ item, handleStateChange, userSubject, sectionUserId }) => {
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
            onClick={() => handleStateChange(originalIndex)}
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
};

export const SectionBurnable: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<SectionTypeBurnable>(
    JSON.parse(section.content || '{}') || { showZeros: true, items: [] }
  );
  const [sectionName, setSectionName] = useState(section.sectionName);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    setSectionName(section.sectionName);
  }, [section.sectionName]);

  useEffect(() => {
    setContent(JSON.parse(section.content || '{}') || { showZeros: true, items: [] });
    setOriginalContent(content);
  }, [section.content])

  const handleUpdate = async () => {
    try {
      const input: UpdateSectionInput = {
        gameId: section.gameId,
        sectionId: section.sectionId,
        sectionName: sectionName,
        content: JSON.stringify(content),
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: { input },
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
      toast.addToast(intl.formatMessage({ id: "sectionBurnable.updateError" }), 'error');
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
  };

  const handleStateChange = async (item: BurnableItem, index: number) => {
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
        gameId: section.gameId,
        sectionId: section.sectionId,
        sectionName: sectionName,
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

  const handleShowZerosToggle = () => {
    setContent(prevContent => ({
      ...prevContent,
      showZeros: !prevContent.showZeros
    }));
  };

  const handleAddItem = () => {
    const newItems = content.items ? [...content.items] : [];
    newItems.push({ id: uuidv4(), name: '', length: 1, states: ['unticked'], description: '' });
    setContent({ ...content, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...content.items];
    newItems.splice(index, 1);
    setContent({ ...content, items: newItems });
  };

  const renderBurnableItems = (items: BurnableItem[], showZeros: boolean) => {
    return (items || [])
      .filter(item => showZeros || item.states.some(state => state !== 'unticked'))
      .map((item) => (
        <BurnableItem
          key={item.id}
          item={item}
          handleStateChange={(index: number) => handleStateChange(item, index)}
          userSubject={userSubject}
          sectionUserId={section.userId}
        />
      ));
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <div className="burnable-items">
          {renderBurnableItems(content.items, content.showZeros)}
        </div>
      </div>
    );
  }

  if (isEditing) {
    const handleItemNameChange = (index: number, newName: string) => {
      const newItems = [...content.items];
      newItems[index].name = newName;
      setContent({ ...content, items: newItems });
    };

    const handleItemLengthChange = (index: number, delta: number) => {
      const newItems = [...content.items];
      const item = newItems[index];
      const newLength = item.length + delta;
      if (newLength >= 1 && newLength <= 10) {
        item.length = newLength;
        if (item.states.length < newLength) {
          item.states = [...item.states, ...Array(newLength - item.states.length).fill('unticked')];
        } else if (item.states.length > newLength) {
          item.states = item.states.slice(0, newLength);
        }
        setContent({ ...content, items: newItems });
      }
    };

    const handleDescriptionChange = (index: number, newDescription: string) => {
      const newItems = [...content.items];
      newItems[index].description = newDescription;
      setContent({ ...content, items: newItems });
    };

    return (
      <div className="section">
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder={intl.formatMessage({ id: "sectionName" })}
        />
        <div className="burnable-items-edit">
          {content.items?.map((item, index) => (
            <div key={item.id} className="burnable-item-edit">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemNameChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionBurnable.itemName" })}
              />
              <div className="item-length-controls">
                <button onClick={() => handleItemLengthChange(index, -1)}>
                  <FormattedMessage id="sectionBurnable.decrement" />
                </button>
                <span>{item.length}</span>
                <button onClick={() => handleItemLengthChange(index, 1)}>
                  <FormattedMessage id="sectionBurnable.increment" />
                </button>
              </div>
              <textarea
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionBurnable.itemDescription" })}
              />
              <button onClick={() => handleRemoveItem(index)}>
                <FormattedMessage id="sectionBurnable.removeItem" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionBurnable.addItem" />
        </button>
        <div className="show-zeros-toggle">
          <label>
            <input
              type="checkbox"
              checked={!!content.showZeros}
              onChange={handleShowZerosToggle}
            />
            <FormattedMessage id="sectionBurnable.showZeros" />
          </label>
        </div>
        <button onClick={handleUpdate}>
          <FormattedMessage id="save" />
        </button>
        <button onClick={handleCancel}>
          <FormattedMessage id="cancel" />
        </button>
      </div>
    );
  }

  return (
    <div className="section">
      <h3>{sectionName} <FaPencilAlt onClick={() => {
        setOriginalContent(content);
        setOriginalSectionName(section.sectionName);
        setIsEditing(true);
      }} /></h3>
      <div className="burnable-items">
        {renderBurnableItems(content.items, content.showZeros)}
      </div>
    </div>
  );
};
