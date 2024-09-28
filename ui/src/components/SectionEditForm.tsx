import React from 'react';
import { FormattedMessage } from 'react-intl';
import { BaseSectionItem, BaseSectionContent } from '../baseSection';

interface SectionEditFormProps<T extends BaseSectionItem> {
  readonly content: BaseSectionContent<T>;
  readonly setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>;
  readonly renderItemEdit: (item: T, index: number) => React.ReactNode;
  readonly addItem: () => void;
  readonly removeItem: (index: number) => void;
}

export function SectionEditForm<T extends BaseSectionItem>({
  content,
  setContent,
  renderItemEdit,
  addItem,
  removeItem
}: Readonly<SectionEditFormProps<T>>) {
  return (
    <div className={`${content.constructor.name.toLowerCase()}-items-edit`}>
      {content.items.map((item, index) => (
        <div key={item.id} className={`${content.constructor.name.toLowerCase()}-item-edit`}>
          {renderItemEdit(item, index)}
          <button onClick={() => removeItem(index)}>
            <FormattedMessage id={`sectionObject.removeItem`} />
          </button>
        </div>
      ))}
      <button onClick={addItem}>
        <FormattedMessage id={`sectionObject.addItem`} />
      </button>
      <div className="show-zeros-toggle">
        <label>
          <input
            type="checkbox"
            checked={content.showEmpty}
            onChange={() => setContent({ ...content, showEmpty: !content.showEmpty })}
          />
          <FormattedMessage id={`sectionObject.showEmpty`} />
        </label>
      </div>
    </div>
  );
}