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

type KeyValueItem = {
  id: string;
  key: string;
  value: string;
  description: string;
};

type SectionTypeKeyValue = {
  showEmpty: boolean;
  items: KeyValueItem[];
};

const KeyValueItem: React.FC<{
  item: KeyValueItem;
  handleValueChange: (value: string) => void;
  userSubject: string;
  sectionUserId: string;
}> = ({ item, handleValueChange, userSubject, sectionUserId }) => {
  return (
    <div key={item.id} className="keyvalue-item">
      <span>{item.key}</span>
      <input
        type="text"
        value={item.value}
        onChange={(e) => handleValueChange(e.target.value)}
        disabled={userSubject !== sectionUserId}
      />
      <FaInfoCircle
        className="info-icon"
        data-tooltip-content={item.description}
        data-tooltip-id={`description-tooltip-${item.id}`}
      />
      <Tooltip id={`description-tooltip-${item.id}`} place="top" />
    </div>
  );
};

export const SectionKeyValue: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<SectionTypeKeyValue>(
    JSON.parse(section.content || '{}') || { showEmpty: true, items: [] }
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
    setContent(JSON.parse(section.content || '{}') || { showEmpty: true, items: [] });
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
      toast.addToast(intl.formatMessage({ id: "sectionKeyValue.updateError" }), 'error');
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
  };

  const handleValueChange = async (item: KeyValueItem, newValue: string) => {
    const newItems = [...content.items];
    const index = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, value: newValue };
    newItems[index] = updatedItem;
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
      console.error("Error updating key/value:", error);
      toast.addToast(intl.formatMessage({ id: "sectionKeyValue.updateError" }), 'error');
    }
  };

  const handleShowEmptyToggle = () => {
    setContent(prevContent => ({
      ...prevContent,
      showEmpty: !prevContent.showEmpty
    }));
  };

  const handleAddItem = () => {
    const newItems = content.items ? [...content.items] : [];
    newItems.push({ id: uuidv4(), key: '', value: '', description: '' });
    setContent({ ...content, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...content.items];
    newItems.splice(index, 1);
    setContent({ ...content, items: newItems });
  };

  const renderKeyValueItems = (items: KeyValueItem[], showEmpty: boolean) => {
    return (items || [])
      .filter(item => showEmpty || item.value !== '')
      .map((item) => (
        <KeyValueItem
          key={item.id}
          item={item}
          handleValueChange={(value: string) => handleValueChange(item, value)}
          userSubject={userSubject}
          sectionUserId={section.userId}
        />
      ));
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <div className="keyvalue-items">
          {renderKeyValueItems(content.items, content.showEmpty)}
        </div>
      </div>
    );
  }

  if (isEditing) {
    const handleItemKeyChange = (index: number, newKey: string) => {
      const newItems = [...content.items];
      newItems[index].key = newKey;
      setContent({ ...content, items: newItems });
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
        <div className="keyvalue-items-edit">
          {content.items?.map((item, index) => (
            <div key={item.id} className="keyvalue-item-edit">
              <input
                type="text"
                value={item.key}
                onChange={(e) => handleItemKeyChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionKeyValue.itemKey" })}
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => handleValueChange(item, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
              />
              <textarea
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionKeyValue.itemDescription" })}
              />
              <button onClick={() => handleRemoveItem(index)}>
                <FormattedMessage id="sectionKeyValue.removeItem" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionKeyValue.addItem" />
        </button>
        <div className="show-empty-toggle">
          <label>
            <input
              type="checkbox"
              checked={!!content.showEmpty}
              onChange={handleShowEmptyToggle}
            />
            <FormattedMessage id="sectionKeyValue.showEmpty" />
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
      <div className="keyvalue-items">
        {renderKeyValueItems(content.items, content.showEmpty)}
      </div>
    </div>
  );
};
