import React from 'react';
import { BaseSection, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';
import { TrackableItem, TrackableContent, handleTrackableTickClick, isItemAdapted } from './utils/trackableHelpers';

const TickCheckbox: React.FC<{
  state: 'unticked' | 'ticked';
  onClick: () => void;
  disabled: boolean;
}> = ({ state, onClick, disabled }) => {
  const intl = useIntl();
  let content = state === 'ticked' ? intl.formatMessage({ id: "sectionObject.tickedEmoji" }) : null;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`tick-checkbox ${state}`}
      aria-label={intl.formatMessage({ id: `sectionObject.buttonState.${state}` })}
    >
      {content}
    </button>
  );
};

export const SectionDeltaGreenSanLoss: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();

  const renderItemContent = (
    item: TrackableItem,
    content: TrackableContent,
    setContent: React.Dispatch<React.SetStateAction<TrackableContent>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    mayEditSheet: boolean,
    adapted: boolean,
  ) => (
    <>
      <span className="sr-only" aria-live="polite">
        {intl.formatMessage(
          { id: 'sectionObject.trackableSummary' },
          { ticked: item.ticked, total: item.length }
        )}
      </span>
      {Array.from({ length: item.length }, (_, index) => (
        <TickCheckbox
          key={`${item.id}-${index}`}
          state={index < item.ticked ? 'ticked' : 'unticked'}
          onClick={() => handleTrackableTickClick(item, index, content, setContent, updateSection)}
          disabled={!mayEditSheet}
        />
      ))}
      {adapted && (
        <span className="adapted-label">
          <FormattedMessage id="deltaGreenSanLoss.adapted" />
        </span>
      )}
    </>
  );

  const renderItems = (
    content: TrackableContent,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<TrackableContent>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
  ) => {
    // Find violence and helplessness items by ID
    const violenceItem = content.items.find(i => i.id === 'violence');
    const helplessnessItem = content.items.find(i => i.id === 'helplessness');

    // Check adaptation status
    const dataAttributes = {
      'data-adapted-violence': (violenceItem ? isItemAdapted(violenceItem) : false).toString(),
      'data-adapted-helplessness': (helplessnessItem ? isItemAdapted(helplessnessItem) : false).toString()
    };

    return (
      <div className="delta-green-sanloss-section" {...dataAttributes}>
        {content.items
          .filter(item => content.showEmpty || item.ticked > 0)
          .map(item => {
            const adapted = isItemAdapted(item);
            return (
              <SectionItem
                key={item.id}
                item={item}
                className={adapted ? 'adapted-item' : ''}
                renderContent={() => renderItemContent(item, content, setContent, updateSection, mayEditSheet, adapted)}
              />
            );
          })}
      </div>
    );
  };

  const renderEditForm = (
    content: TrackableContent,
    setContent: React.Dispatch<React.SetStateAction<TrackableContent>>,
    handleUpdate: () => void,
    handleCancel: () => void
  ) => {
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
      <SectionEditForm
        content={content}
        setContent={setContent}
        renderItemEdit={(item, index) => (
          <>
            <input
              id={`trackable-item-name-${item.id}`}
              name={`trackableItemName_${item.id}`}
              type="text"
              value={item.name || ''}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionObject.itemName" })}
              aria-label={intl.formatMessage({ id: "sectionObject.itemName" })}
            />
            <div className="item-length-controls">
              <button
                onClick={() => handleItemChange(index, 'length', item.length - 1)}
                aria-label={intl.formatMessage({ id: 'sectionTrackable.decrementLength' }, { name: item.name })}
              >
                <FormattedMessage id="sectionTrackable.decrement" />
              </button>
              <span>{item.length}</span>
              <button
                onClick={() => handleItemChange(index, 'length', item.length + 1)}
                aria-label={intl.formatMessage({ id: 'sectionTrackable.incrementLength' }, { name: item.name })}
              >
                <FormattedMessage id="sectionTrackable.increment" />
              </button>
            </div>
            <textarea
              value={item.description || ''}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
              aria-label={intl.formatMessage({ id: "sectionObject.itemDescription" })}
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

  return <BaseSection<TrackableItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
