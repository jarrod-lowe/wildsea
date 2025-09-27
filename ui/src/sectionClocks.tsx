import React, { useRef, useCallback } from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { SectionItem } from './components/SectionItem';
import { SectionEditForm } from './components/SectionEditForm';

interface ClockItem extends BaseSectionItem {
  length: number;
  current: number;
}

type SectionTypeClocks = BaseSectionContent<ClockItem>;

const ClockItemContent: React.FC<{
  item: ClockItem;
  content: SectionTypeClocks;
  mayEditSheet: boolean;
  setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>;
  updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>;
  isEditing: boolean;
  onDecrement: (item: ClockItem, content: SectionTypeClocks, setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>, updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>) => void;
  onIncrement: (item: ClockItem, content: SectionTypeClocks, setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>, updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>) => void;
  onFilledBarClick: (event: React.MouseEvent<HTMLDivElement>, item: ClockItem, content: SectionTypeClocks, setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>, updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>) => void;
  onSegmentClick: (item: ClockItem, index: number, content: SectionTypeClocks, setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>, updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>, isEditing: boolean) => void;
  shouldUseFilledMode: (segmentCount: number) => boolean;
  intl: any;
}> = ({ item, content, mayEditSheet, setContent, updateSection, isEditing, onDecrement, onIncrement, onFilledBarClick, onSegmentClick, shouldUseFilledMode, intl }) => (
  <div className="clock-container">
    <button
      className="adjust-btn"
      onClick={() => onDecrement(item, content, setContent, updateSection)}
      disabled={mayEditSheet === false || item.current <= 0}
      aria-label={intl.formatMessage(
        { id: 'sectionClocks.decrementLabel' },
        { name: item.name }
      )}
    >
      <FormattedMessage id="sectionClocks.decrement" />
    </button>

    {shouldUseFilledMode(item.length) ? (
      <div
        className={`clock-bar-filled ${mayEditSheet === false ? 'disabled' : ''}`}
        onClick={mayEditSheet ? (e) => onFilledBarClick(e, item, content, setContent, updateSection) : undefined}
        onKeyDown={mayEditSheet ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilledBarClick(e, item, content, setContent, updateSection);
          }
        } : undefined}
        role="button"
        tabIndex={mayEditSheet ? 0 : undefined}
      >
        <progress
          value={item.current}
          max={item.length}
          aria-label={intl.formatMessage(
            { id: 'sectionClocks.progressLabelWithName' },
            { name: item.name, current: item.current, length: item.length }
          )}
          className="clock-progress-element"
        />
        <span
          className="sr-only"
          aria-live="polite"
        >
          {intl.formatMessage(
            { id: 'sectionClocks.progressLabelWithName' },
            { name: item.name, current: item.current, length: item.length }
          )}
        </span>
        <div
          className="clock-bar-filled-progress"
          style={{ width: `${(item.current / item.length) * 100}%` }}
        />
      </div>
    ) : (
      <div className="clock-bar">
        <progress
          value={item.current}
          max={item.length}
          aria-label={intl.formatMessage(
            { id: 'sectionClocks.progressLabelWithName' },
            { name: item.name, current: item.current, length: item.length }
          )}
          className="clock-progress-element"
        />
        <span
          className="sr-only"
          aria-live="polite"
        >
          {intl.formatMessage(
            { id: 'sectionClocks.progressLabelWithName' },
            { name: item.name, current: item.current, length: item.length }
          )}
        </span>
        {new Array(item.length).fill(null).map((_, index) => (
          <ClockSegment
            key={`${item.id}-${index}`}
            filled={index < item.current}
            onClick={() => onSegmentClick(item, index, content, setContent, updateSection, isEditing)}
            disabled={mayEditSheet === false}
          />
        ))}
      </div>
    )}

    <button
      className="adjust-btn"
      onClick={() => onIncrement(item, content, setContent, updateSection)}
      disabled={mayEditSheet === false || item.current >= item.length}
      aria-label={intl.formatMessage(
        { id: 'sectionClocks.incrementLabel' },
        { name: item.name }
      )}
    >
      <FormattedMessage id="sectionClocks.increment" />
    </button>
  </div>
);

const ClockSegment: React.FC<{
  filled: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ filled, onClick, disabled }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`clock-segment ${filled ? 'filled' : 'unfilled'}`}
    >
    </button>
  );
};

export const SectionClocks: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Constants for display mode calculation
  const CLOCK_BAR_WIDTH = 200; // Fixed bar width in pixels
  const MIN_SEGMENT_WIDTH = 8; // Minimum width for usable segments

  const shouldUseFilledMode = (segmentCount: number) => {
    const segmentWidth = CLOCK_BAR_WIDTH / segmentCount;
    return segmentWidth < MIN_SEGMENT_WIDTH;
  };

  const debouncedUpdate = useCallback((
    newContent: SectionTypeClocks,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>
  ) => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout for debounced update
    updateTimeoutRef.current = setTimeout(async () => {
      await updateSection({ content: JSON.stringify(newContent) });
    }, 500); // Longer delay for clock interactions to ensure persistence
  }, []);

  const handleFilledBarClick = useCallback(async (
    event: React.MouseEvent<HTMLDivElement>,
    item: ClockItem,
    content: SectionTypeClocks,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetSegment = Math.floor(percentage * item.length);

    // Handle click like segment click
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    if (targetSegment < updatedItem.current) {
      updatedItem.current = Math.max(0, updatedItem.current - 1);
    } else if (targetSegment >= updatedItem.current && updatedItem.current < updatedItem.length) {
      updatedItem.current = Math.min(updatedItem.length, updatedItem.current + 1);
    }

    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };

    // Update local state immediately for responsive UI
    setContent(newContent);

    // Debounce the backend update to prevent race conditions
    debouncedUpdate(newContent, updateSection);
  }, [debouncedUpdate]);

  const handleSegmentClick = useCallback(async (
      item: ClockItem,
      index: number,
      content: SectionTypeClocks,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
      _isEditing: boolean,
    ) => {
    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item };

    if (index < updatedItem.current) {
      updatedItem.current = Math.max(0, updatedItem.current - 1);
    } else if (index >= updatedItem.current && updatedItem.current < updatedItem.length) {
      updatedItem.current = Math.min(updatedItem.length, updatedItem.current + 1);
    }

    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };

    // Update local state immediately for responsive UI
    setContent(newContent);

    // Debounce the backend update to prevent race conditions
    debouncedUpdate(newContent, updateSection);
  }, [debouncedUpdate]);

  const handleIncrement = useCallback(async (
      item: ClockItem,
      content: SectionTypeClocks,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    if (item.current >= item.length) return;

    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, current: item.current + 1 };

    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };

    // Update local state immediately for responsive UI
    setContent(newContent);

    // Debounce the backend update to prevent race conditions
    debouncedUpdate(newContent, updateSection);
  }, [debouncedUpdate]);

  const handleDecrement = useCallback(async (
      item: ClockItem,
      content: SectionTypeClocks,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => {
    if (item.current <= 0) return;

    const newItems = [...content.items];
    const itemIndex = newItems.findIndex(i => i.id === item.id);
    const updatedItem = { ...item, current: item.current - 1 };

    newItems[itemIndex] = updatedItem;
    const newContent = { ...content, items: newItems };

    // Update local state immediately for responsive UI
    setContent(newContent);

    // Debounce the backend update to prevent race conditions
    debouncedUpdate(newContent, updateSection);
  }, [debouncedUpdate]);

  const renderItems = (
      content: SectionTypeClocks,
      mayEditSheet: boolean,
      setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>,
      updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
      isEditing: boolean,
    ) => {
    return content.items
      .filter(item => content.showEmpty || item.current > 0)
      .map(item => (
        <SectionItem
          key={item.id}
          item={item}
          renderContent={() => (
            <ClockItemContent
              item={item}
              content={content}
              mayEditSheet={mayEditSheet}
              setContent={setContent}
              updateSection={updateSection}
              isEditing={isEditing}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
              onFilledBarClick={handleFilledBarClick}
              onSegmentClick={handleSegmentClick}
              shouldUseFilledMode={shouldUseFilledMode}
              intl={intl}
            />
          )}
        />
      ));
  };

  const renderEditForm = (content: SectionTypeClocks, setContent: React.Dispatch<React.SetStateAction<SectionTypeClocks>>, handleUpdate: () => void, handleCancel: () => void) => {
    const handleAddItem = () => {
      const newItems = [...content.items, { id: uuidv4(), name: '', length: 1, current: 0, description: '' }];
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
        const newLength = Math.max(1, value);
        newItems[index].length = newLength;
        if (newItems[index].current > newLength) {
          newItems[index].current = newLength;
        }
      } else if (field === 'current') {
        const newCurrent = Math.max(0, Math.min(newItems[index].length, value));
        newItems[index].current = newCurrent;
      }

      setContent({ ...content, items: newItems });
    };

    return (
      <SectionEditForm
        content={content}
        setContent={setContent}
        renderItemEdit={(item, index) => (
          <>
            <div className="clock-edit-main-line">
              <input
                id={`clock-item-name-${item.id}`}
                name={`clockItemName_${item.id}`}
                type="text"
                value={item.name || ''}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                placeholder={intl.formatMessage({ id: "sectionClocks.clockName" })}
                aria-label={intl.formatMessage({ id: "sectionClocks.clockName" })}
                className="clock-name-input"
              />
              <button
                className="adjust-btn"
                onClick={() => handleItemChange(index, 'current', item.current - 1)}
                aria-label={intl.formatMessage({ id: 'sectionClocks.decrementCurrent' }, { name: item.name })}
              >
                <FormattedMessage id="sectionClocks.decrement" />
              </button>
              <input
                type="number"
                min="0"
                max={item.length}
                value={item.current}
                onChange={(e) => handleItemChange(index, 'current', Number.parseInt(e.target.value) || 0)}
                className="clock-number-input"
                aria-label={intl.formatMessage({ id: 'sectionClocks.currentLabel' })}
              />
              <button
                className="adjust-btn"
                onClick={() => handleItemChange(index, 'current', item.current + 1)}
                aria-label={intl.formatMessage({ id: 'sectionClocks.incrementCurrent' }, { name: item.name })}
              >
                <FormattedMessage id="sectionClocks.increment" />
              </button>
              <span className="clock-edit-separator">/</span>
              <button
                className="adjust-btn"
                onClick={() => handleItemChange(index, 'length', item.length - 1)}
                aria-label={intl.formatMessage({ id: 'sectionClocks.decrementLength' }, { name: item.name })}
              >
                <FormattedMessage id="sectionClocks.decrement" />
              </button>
              <input
                type="number"
                min="1"
                value={item.length}
                onChange={(e) => handleItemChange(index, 'length', Number.parseInt(e.target.value) || 1)}
                className="clock-number-input"
                aria-label={intl.formatMessage({ id: 'sectionClocks.lengthLabel' })}
              />
              <button
                className="adjust-btn"
                onClick={() => handleItemChange(index, 'length', item.length + 1)}
                aria-label={intl.formatMessage({ id: 'sectionClocks.incrementLength' }, { name: item.name })}
              >
                <FormattedMessage id="sectionClocks.increment" />
              </button>
              <span className="clock-edit-label">
                <FormattedMessage id="sectionClocks.segments" />
              </span>
            </div>
            <textarea
              value={item.description || ''}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              placeholder={intl.formatMessage({ id: "sectionObject.itemDescription" })}
              aria-label={intl.formatMessage({ id: "sectionObject.itemDescription" })}
              className="clock-description-input"
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

  return <BaseSection<ClockItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};