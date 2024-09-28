import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import { BaseSectionItem } from '../baseSection';

interface SectionItemProps<T extends BaseSectionItem> {
  readonly item: T;
  readonly renderContent: (item: T) => React.ReactNode;
}

export function SectionItem<T extends BaseSectionItem>({ item, renderContent }: Readonly<SectionItemProps<T>>) {
  return (
    <div className={`section-item ${item.constructor.name.toLowerCase()}-item`}>
      <span>{item.name}</span>
      {renderContent(item)}
      <FaInfoCircle
        className="info-icon"
        data-tooltip-content={item.description}
        data-tooltip-id={`description-tooltip-${item.id}`}
      />
      <Tooltip id={`description-tooltip-${item.id}`} place="top" />
    </div>
  );
}
