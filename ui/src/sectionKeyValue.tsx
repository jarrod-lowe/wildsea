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

export const SectionKeyValue: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = (props) => {
  const intl = useIntl();
  const toast = useToast();

  const handleValueChange = async (item: KeyValueItem, newValue: string, content: SectionTypeKeyValue, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, value: newValue };
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
      console.error("Error updating key/value:", error);
      toast.addToast(intl.formatMessage({ id: "sectionKeyValue.updateError" }), 'error');
    }
  };

  const renderItems = (content: SectionTypeKeyValue, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>) => {
    return content.items
      .filter(item => content.showEmpty || item.value !== '')
      .map(item => (
        <div key={item.id} className="keyvalue-item">
          <span>{item.key}</span>
          <input
            type="text"
            value={item.value}
            onChange={(e) => handleValueChange(item, e.target.value, content, setContent)}
            disabled={userSubject !== sectionUserId}
          />
          <FaInfoCircle
            className="info-icon"
            data-tooltip-content={item.description}
            data-tooltip-id={`description-tooltip-${item.id}`}
          />
          <Tooltip id={`description-tooltip-${item.id}`} place="top" />
        </div>
      ));
  };

  const renderEditForm = (content: SectionTypeKeyValue, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { id: uuidv4(), key: '', value: '', description: '' }];
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
      <div className="keyvalue-items-edit">
        {content.items.map((item, index) => (
          <div key={item.id} className="keyvalue-item-edit">
            <input
              type="text"
              value={item.key}
              onChange={(e) => handleItemChange(index, 'key', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionKeyValue.itemKey" })}
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleItemChange(index, 'value', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
            />
            <textarea
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionKeyValue.itemDescription" })}
            />
            <button onClick={() => handleRemoveItem(index)}>
              <FormattedMessage id="sectionKeyValue.removeItem" />
            </button>
          </div>
        ))}
        <button onClick={handleAddItem}>
          <FormattedMessage id="sectionKeyValue.addItem" />
        </button>
        <div className="show-empty-toggle">
          <label>
            <input
              type="checkbox"
              checked={content.showEmpty}
              onChange={() => setContent({ ...content, showEmpty: !content.showEmpty })}
            />
            <FormattedMessage id="sectionKeyValue.showEmpty" />
          </label>
        </div>
      </div>
    );
  };

  return <BaseSection<SectionTypeKeyValue> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
