import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';

interface TrackableItem extends BaseSectionItem {
  length: number;
  ticked: number;
}

type SectionTypeTrackable = BaseSectionContent<TrackableItem>;

const TickCheckbox: React.FC<{
  state: 'unticked' | 'ticked';
  onClick: () => void;
  disabled: boolean;
}> = ({ state, onClick, disabled }) => {
  const intl = useIntl();
  let content = state === 'ticked' ? intl.formatMessage({ id: "sectionObject.tickedEmoji" }) : null;

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

export const SectionTrackable: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();

  const handleTickClick = async (
      item: TrackableItem,
      index: number,
      content: SectionTypeTrackable,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeTrackable>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    if (index < updatedItem.ticked) {
      updatedItem.ticked = Math.max(0, updatedItem.ticked - 1);
    } else if (index >= updatedItem.ticked && updatedItem.ticked < updatedItem.length) {
      updatedItem.ticked = Math.min(updatedItem.length, updatedItem.ticked + 1);
    }

    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };
    setContent(newContent);
    await updateSection({ content: JSON.stringify(newContent) })
  };

  const renderItems = (
      content: SectionTypeTrackable,
      mayEditSheet: boolean,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeTrackable>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    return content.items
      .filter(item => content.showEmpty || item.ticked > 0)
      .map(item => (
        <SectionItem
          key={item.id}
          item={item}
          renderContent={(item) => (
            <>
              {[...Array(item.length)].map((_, index) => (
                <TickCheckbox
                  key={`${item.id}-${index}`}
                  state={index < item.ticked ? 'ticked' : 'unticked'}
                  onClick={() => handleTickClick(item, index, content, setContent, updateSection)}
                  disabled={!mayEditSheet}
                />
              ))}
            </>
          )}
        />
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
              placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
            />
          </>
        )}
        addItem={handleAddItem}
        removeItem={handleRemoveItem}
      />
    );
  };

  return <BaseSection<TrackableItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
