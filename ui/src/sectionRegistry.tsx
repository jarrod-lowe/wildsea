import React from 'react';
import { SheetSection } from "../../appsync/graphql";
import { SectionText } from './sectionText';
import { SectionNumber } from './sectionNumber';
import { SectionTrackable } from './sectionTrackable';

type SectionTypeConfig = {
  component: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }>;
  label: string; // i18n key for translation
};

// Section type registry to map types to components and labels
const sectionRegistry: Record<string, SectionTypeConfig> = {
  'TEXT': { component: SectionText, label: 'sectionType.text' },
  'NUMBER': { component: SectionNumber, label: 'sectionType.number' },
  'TRACKABLE': { component: SectionTrackable, label: 'sectionType.trackable' }
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
