import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import { SheetSection } from "../../appsync/graphql";

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
  const renderItems = (
    content: SectionTypeDeltaGreenBonds,
    mayEditSheet: boolean,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenBonds>>,
    updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    isEditing: boolean,
  ) => {
    return <div>Bonds section - coming soon</div>;
  };

  const renderEditForm = (
    content: SectionTypeDeltaGreenBonds,
    setContent: React.Dispatch<React.SetStateAction<SectionTypeDeltaGreenBonds>>,
    handleUpdate: () => void,
    handleCancel: () => void
  ) => {
    return <div>Bonds edit form - coming soon</div>;
  };

  return <BaseSection<BondItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};