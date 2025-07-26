import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';

interface KeyValueItem extends BaseSectionItem {
  value: string;
};

type SectionTypeKeyValue = BaseSectionContent<KeyValueItem>;

export const SectionKeyValue: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();

  const handleValueChange = async (
        item: KeyValueItem,
        newValue: string,
        content: SectionTypeKeyValue,
        setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    _isEditing: boolean,
    ) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, value: newValue };
    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) })

  };

  const renderItems = (
        content: SectionTypeKeyValue,
        mayEditSheet: boolean,
        setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
    ) => {
    return content.items
      .filter(item => content.showEmpty || item.value !== '')
      .map(item => (
        <SectionItem
          key={item.id}
          item={item}
          renderContent={(item) => (
            <input
              type="text"
              value={item.value || ''}
              onChange={(e) => handleValueChange(item, e.target.value, content, setContent, updateSection, isEditing)}
              disabled={!mayEditSheet}
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
              value={item.name || ''}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionObject.itemName" })}
            />
            <input
              type="text"
              value={item.value || ''}
              onChange={(e) => handleItemChange(index, 'value', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
            />
            <textarea
              value={item.description || ''}
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
