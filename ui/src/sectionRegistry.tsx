import React from 'react';
import { SheetSection } from "../../appsync/graphql";
import { SectionTrackable } from './sectionTrackable';
import { SectionBurnable } from './sectionBurnable';
import { SectionKeyValue } from './sectionKeyValue';

type SectionTypeConfig = {
  component: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }>;
  label: string; // i18n key for translation
};

// Section type registry to map types to components and labels
const sectionRegistry: Record<string, SectionTypeConfig> = {
  'TRACKABLE': { component: SectionTrackable, label: 'sectionType.trackable' },
  'BURNABLE': { component: SectionBurnable, label: 'sectionType.burnable' },
  'KEYVALUE': { component: SectionKeyValue, label: 'sectionType.keyvalue' },
};

// Function to get the component for a section type
export const getSectionComponent = (sectionType: string) => {
  return sectionRegistry[sectionType]?.component || null;
};

// Function to get all supported section types and their labels (for dropdowns or validation)
export const getSectionTypes = () => {
  return Object.entries(sectionRegistry).map(([type, config]) => ({
    type,
    label: config.label
  }));
};
