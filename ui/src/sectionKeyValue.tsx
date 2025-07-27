import React, { useRef, useCallback } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionEditForm } from './components/SectionEditForm';
import { SectionItem } from './components/SectionItem';

interface KeyValueItem extends BaseSectionItem {
  value: string;
};

type SectionTypeKeyValue = BaseSectionContent<KeyValueItem>;

export const SectionKeyValue: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleValueChange = useCallback(async (
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
    
    // Update local state immediately for responsive UI
    setContent(newContent);
    
    // Debounce the backend update to prevent race conditions
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(async () => {
      await updateSection({ content: JSON.stringify(newContent) });
    }, 300);
  }, []);

  const renderItems = (
    content: SectionTypeKeyValue,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
  ) => {
    // Always provide default values for all fields to avoid uncontrolled input warnings
    return content.items
      .filter(item => content.showEmpty || (item.value ?? '') !== '')
      .map(item => {
        const safeItem: KeyValueItem = {
          ...item,
          name: item.name ?? '',
          value: item.value ?? '',
          description: item.description ?? '',
        };
        const inputId = `keyvalue-input-${safeItem.id}`;
        return (
          <SectionItem
            key={safeItem.id}
            item={safeItem}
            renderContent={() => (
              <input
                id={inputId}
                type="text"
                value={safeItem.value}
                onChange={(e) => handleValueChange(safeItem, e.target.value, content, setContent, updateSection, isEditing)}
                disabled={!mayEditSheet}
                aria-label={safeItem.name}
              />
            )}
          />
        );
      });
  };

  const renderEditForm = (content: SectionTypeKeyValue, setContent: React.Dispatch<React.SetStateAction<SectionTypeKeyValue>>, handleUpdate: () => void, handleCancel: () => void) => {
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
        renderItemEdit={(item, index) => {
          const safeItem: KeyValueItem = {
            ...item,
            name: item.name ?? '',
            value: item.value ?? '',
            description: item.description ?? '',
          };
          return (
            <>
              <input
                type="text"
                value={safeItem.name}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionObject.itemName" })}
                aria-label={intl.formatMessage({ id: "sectionObject.itemName" })}
              />
              <input
                type="text"
                value={safeItem.value}
                onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
                aria-label={intl.formatMessage({ id: "sectionKeyValue.itemValue" })}
              />
              <textarea
                value={safeItem.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
                aria-label={intl.formatMessage({ id: "sectionObject.itemDescription" })}
              />
            </>
          );
        }}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
        handleUpdate={handleUpdate}
        handleCancel={handleCancel}
      />
    );
  };

  return <BaseSection<KeyValueItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
