import { BaseSectionItem, BaseSectionContent } from '../baseSection';
import { SheetSection } from "../../../appsync/graphql";

export interface TrackableItem extends BaseSectionItem {
  length: number;
  ticked: number;
}

export type TrackableContent = BaseSectionContent<TrackableItem>;

export const handleTrackableTickClick = async (
  item: TrackableItem,
  index: number,
  content: TrackableContent,
  setContent: (content: TrackableContent) => void,
  updateSection: (section: Partial<SheetSection>) => Promise<void>,
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
  await updateSection({ content: JSON.stringify(newContent) });
};

export const isItemAdapted = (item: TrackableItem): boolean => {
  return item.ticked === item.length;
};
