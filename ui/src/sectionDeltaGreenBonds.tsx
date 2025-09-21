import React, { useRef, useCallback } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionEditForm } from './components/SectionEditForm';
import { SectionItem } from './components/SectionItem';

interface BondItem extends BaseSectionItem {
  value: number;
  symptoms: string;
}

type SectionTypeDeltaGreenBonds = BaseSectionContent<BondItem>;

export const createDefaultDeltaGreenBondsContent = (): SectionTypeDeltaGreenBonds => ({
  showEmpty: false,
  items: []
});

export const SectionDeltaGreenBonds: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleValueDecrement = useCallback(async (
    item: BondItem,
    content: SectionTypeDeltaGreenBonds,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenBonds>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    if (item.value > 0) {
      const newItems = [...content.items];
      const itemIndex = newItems.findIndex(i => i.id === item.id);
      const updatedItem = { ...item, value: item.value - 1 };
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
    }
  }, []);

  const renderItems = (
    content: SectionTypeDeltaGreenBonds,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenBonds>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
  ) => {
    const filteredItems = content.items.filter(item => content.showEmpty || item.name !== '');

    return (
      <div className="bonds-grid">
        {filteredItems.map(item => {
          const isZeroValue = item.value === 0;
          return (
            <React.Fragment key={item.id}>
              <span className={`bond-value ${isZeroValue ? 'bond-value-zero' : ''}`}>
                {(item as BondItem).value}
              </span>
              {mayEditSheet ? (
                <button
                  className="adjust-btn small"
                  onClick={() => handleValueDecrement(item as BondItem, content, setContent, updateSection)}
                  disabled={isZeroValue}
                  aria-label={intl.formatMessage({ id: 'deltaGreenBonds.decrementValue' }, { name: item.name })}
                  title={intl.formatMessage({ id: 'deltaGreenBonds.decrementValue' }, { name: item.name })}
                >
                  -1
                </button>
              ) : (
                <span></span>
              )}
              <span className="bond-name">{item.name}</span>
              {(item as BondItem).symptoms && (
                <div className="bond-symptoms" style={{ gridColumn: '1 / -1' }}>
                  <span className="bond-symptoms-label">{intl.formatMessage({ id: 'deltaGreenBonds.symptoms' })}: </span>
                  <span>{(item as BondItem).symptoms}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderEditForm = (
    content: SectionTypeDeltaGreenBonds,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenBonds>>,
    handleUpdate: () => void,
    handleCancel: () => void
  ) => {
    const handleAddItem = () => {
      const newItems = [...content.items, {
        id: uuidv4(),
        name: '',
        description: '',
        value: 0,
        symptoms: ''
      }];
      setContent({ ...content, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = content.items.filter((_, i) => i !== index);
      setContent({ ...content, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
      const newItems = [...content.items];

      // Handle value field with proper validation
      if (field === 'value') {
        if (typeof value === 'string') {
          // Allow empty string for editing, but validate on conversion
          if (value === '') {
            newItems[index] = { ...newItems[index], [field]: '' as any };
          } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              // Ensure non-negative values
              const clampedValue = Math.max(0, numValue);
              newItems[index] = { ...newItems[index], [field]: clampedValue };
            }
          }
        } else {
          // Handle direct number input
          const clampedValue = Math.max(0, value as number);
          newItems[index] = { ...newItems[index], [field]: clampedValue };
        }
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }

      setContent({ ...content, items: newItems });
    };

    const handleValueBlur = (index: number, value: string) => {
      // Convert empty string to 0 on blur
      if (value === '') {
        handleItemChange(index, 'value', 0);
      }
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
              placeholder={intl.formatMessage({ id: "deltaGreenBonds.bondName" })}
              aria-label={intl.formatMessage({ id: "deltaGreenBonds.bondName" })}
            />
            <input
              type="number"
              min="0"
              value={(item.value as any) === '' ? '' : (item.value || 0)}
              onChange={(e) => handleItemChange(index, 'value', e.target.value)}
              onBlur={(e) => handleValueBlur(index, e.target.value)}
              placeholder="Value"
              aria-label="Bond value"
              className="bond-value-input"
            />
          </>
        )}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
        handleUpdate={handleUpdate}
        handleCancel={handleCancel}
      />
    );
  };

  return <BaseSection<BondItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};