import React from 'react';
import { SheetSection } from "../../appsync/graphql";
import { SectionTrackable } from './sectionTrackable';
import { SectionBurnable } from './sectionBurnable';
import { SectionKeyValue } from './sectionKeyValue';
import { SectionRichText } from './sectionRichText';

type SectionTypeConfig = {
  component: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }>;
  label: string; // i18n key for translation
  seed?: any;
};

// Section type registry to map types to components and labels
const sectionRegistry: Record<string, SectionTypeConfig> = {
  'TRACKABLE': { component: SectionTrackable, label: 'sectionType.trackable' },
  'BURNABLE': { component: SectionBurnable, label: 'sectionType.burnable' },
  'KEYVALUE': { component: SectionKeyValue, label: 'sectionType.keyvalue' },
  'RICHTEXT': { component: SectionRichText, label: 'sectionType.richtext', seed: {items: [{html: ""}]} }
};

// Function to get the component for a section type
export const getSectionComponent = (sectionType: string) => {
  return sectionRegistry[sectionType]?.component || null;
};

export const getSectionSeed = (sectionType: string) => {
  return sectionRegistry[sectionType]?.seed || {};
}

// Function to get all supported section types and their labels (for dropdowns or validation)
export const getSectionTypes = () => {
  return Object.entries(sectionRegistry).map(([type, config]) => ({
    type,
    label: config.label,
    seed: config.seed ?? {},
  }));
};
