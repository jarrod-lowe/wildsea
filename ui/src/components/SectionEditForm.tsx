import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { BaseSectionItem, BaseSectionContent } from '../baseSection';

interface SectionEditFormProps<T extends BaseSectionItem> {
  readonly content: BaseSectionContent<T>;
  readonly setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>;
  readonly renderItemEdit: (item: T, index: number) => React.ReactNode;
  readonly addItem: () => void;
  readonly removeItem: (index: number) => void;
  readonly handleUpdate: () => void;
  readonly handleCancel: () => void;
}

export function SectionEditForm<T extends BaseSectionItem>({
  content,
  setContent,
  renderItemEdit,
  addItem,
  removeItem,
  handleUpdate,
  handleCancel
}: Readonly<SectionEditFormProps<T>>) {
  const intl = useIntl();
  return (
    <div className="section-items-edit">
      <div className="show-empty-toggle">
        <label>
          <input
            id="show-empty-items"
            name="showEmpty"
            type="checkbox"
            checked={content.showEmpty}
            onChange={() => setContent({ ...content, showEmpty: !content.showEmpty })}
          />
          <FormattedMessage id={`sectionObject.showEmpty`} />
        </label>
      </div>
      {content.items.map((item, index) => (
        <div key={item.id} className="section-item-edit">
          <div className="section-item-content">
            {renderItemEdit(item, index)}
          </div>
          <button 
            onClick={() => removeItem(index)} 
            className="btn-edit-form"
            aria-label={intl.formatMessage(
              { id: 'sectionObject.removeItemLabel' }, 
              { itemName: item.name || `item ${index + 1}` }
            )}
          >
            <FormattedMessage id={`sectionObject.removeItem`} />
          </button>
        </div>
      ))}
      <div className="section-edit-buttons">
        <button onClick={addItem} className="btn-standard btn-small">
          <FormattedMessage id={`sectionObject.addItem`} />
        </button>
        <button onClick={handleUpdate} className="btn-standard btn-small">
          <FormattedMessage id="save" />
        </button>
        <button onClick={handleCancel} className="btn-secondary btn-small">
          <FormattedMessage id="cancel" />
        </button>
      </div>
    </div>
  );
}