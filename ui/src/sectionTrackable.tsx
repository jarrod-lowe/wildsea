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

// TickCheckbox Component
const TickCheckbox: React.FC<{
  item: TrackableItem;
  tickIndex: number;
  handleTickClick: (tickIndex: number) => void;
  disabled: boolean;
}> = ({ item, tickIndex, handleTickClick, disabled }) => {
  return (
    <input
      key={`${item.id}-${tickIndex}`}
      type="checkbox"
      checked={tickIndex < item.ticked}
      onChange={!disabled ? () => handleTickClick(tickIndex) : undefined}
      disabled={disabled}
    />
  );
};

// TrackableItem Component
const TrackableItem: React.FC<{
  item: TrackableItem;
  handleTickClick: (tickIndex: number) => void;
  userSubject: string;
  sectionUserId: string;
}> = ({ item, handleTickClick, userSubject, sectionUserId }) => {
  return (
    <div key={item.id} className="trackable-item">
      <span>{item.name}</span>
      {[...Array(item.length)].map((_, tickIndex) => (
        <TickCheckbox
          key={`${item.id}-${tickIndex}`}
          item={item}
          tickIndex={tickIndex}
          handleTickClick={() => handleTickClick(tickIndex)}
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
  );
};

export const SectionTrackable: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<SectionTypeTrackable>(
    JSON.parse(section.content || '{}') || { showZeros: true, items: [] }
  );
  const [sectionName, setSectionName] = useState(section.sectionName);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
  const intl = useIntl();
  const toast = useToast();

  // Ensuring the items array is defined:
  if (!content.items) {
    setContent({ ...content, items: [] });
  }

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
        sectionType: section.sectionType,
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
      toast.addToast(intl.formatMessage({ id: "sectionTrackable.updateError" }), 'error');
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
  };

  const handleTickClick = async (item: TrackableItem, tickIndex: number) => {
    const newItems = [...content.items];
    const index = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    if (tickIndex < updatedItem.ticked) {
      updatedItem.ticked--;  // Decrement the tick count
    } else if (tickIndex >= updatedItem.ticked && updatedItem.ticked < updatedItem.length) {
      updatedItem.ticked++;  // Increment the tick count
    }

    newItems[index] = updatedItem;
    setContent({ ...content, items: newItems });

    try {
      const input: UpdateSectionInput = {
        gameId: section.gameId,
        sectionId: section.sectionId,
        sectionName: sectionName,
        sectionType: section.sectionType,
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

  const handleShowZerosToggle = () => {
    setContent(prevContent => ({
      ...prevContent,
      showZeros: !prevContent.showZeros
    }));
  };

  const handleAddItem = () => {
    const newItems = content.items ? [...content.items] : [];
    newItems.push({ id: uuidv4(), name: '', length: 1, ticked: 1, description: '' });
    setContent({ ...content, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...content.items];
    newItems.splice(index, 1);
    setContent({ ...content, items: newItems });
  };

  const renderTrackableItems = (items: TrackableItem[], showZeros: boolean) => {
    return (items || [])
      .filter(item => showZeros || item.ticked > 0)
      .map((item) => (
        <TrackableItem
          key={item.id}
          item={item}
          handleTickClick={(tickIndex: number) => handleTickClick(item, tickIndex)}
          userSubject={userSubject}
          sectionUserId={section.userId}
        />
      ));
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <div className="trackable-items">
          {renderTrackableItems(content.items, content.showZeros)}
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
        if (item.ticked > newLength) {
          item.ticked = newLength;
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
        <div className="trackable-items-edit">
          {content.items?.map((item, index) => (
            <div key={item.id} className="trackable-item-edit">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemNameChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionTrackable.itemName" })}
              />
              <div className="item-length-controls">
                <button onClick={() => handleItemLengthChange(index, -1)}>
                  <FormattedMessage id="sectionTrackable.decrement" />
                </button>
                <span>{item.length}</span>
                <button onClick={() => handleItemLengthChange(index, 1)}>
                  <FormattedMessage id="sectionTrackable.increment" />
                </button>
              </div>
              <textarea
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionTrackable.itemDescription" })}
              />
              <button onClick={() => handleRemoveItem(index)}>
                <FormattedMessage id="sectionTrackable.removeItem" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionTrackable.addItem" />
        </button>
        <div className="show-zeros-toggle">
          <label>
            <input
              type="checkbox"
              checked={!!content.showZeros} // Ensures it is a boolean
              onChange={handleShowZerosToggle}
            />
            <FormattedMessage id="sectionTrackable.showZeros" />
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
      <div className="trackable-items">
        {renderTrackableItems(content.items, content.showZeros)}
      </div>
    </div>
  );
};
