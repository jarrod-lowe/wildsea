import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem } from './baseSection';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { generateClient } from "aws-amplify/api";
import { updateSectionMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';

interface KeyValueItem extends BaseSectionItem {
  value: string;
};

type SectionTypeKeyValue = BaseSectionContent<KeyValueItem>;

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
      toast.addToast(intl.formatMessage({ id: "sectionObject.updateError" }), 'error');
    }
  };

  const renderItems = (content: SectionTypeKeyValue, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>) => {
    return content.items
      .filter(item => content.showEmpty || item.value !== '')
      .map(item => (
        <SectionItem
          key={item.id}
          item={item}
          renderContent={(item) => (
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleValueChange(item, e.target.value, content, setContent)}
              disabled={userSubject !== sectionUserId}
            />
          )}
        />
      ));
  };

  const renderEditForm = (content: SectionTypeKeyValue, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { id: uuidv4(), name: '', value: '', description: '' }];
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
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleItemChange(index, 'value', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
            />
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

  return <BaseSection<KeyValueItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
