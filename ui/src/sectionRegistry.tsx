import React from 'react';
import { SheetSection } from "../../appsync/graphql";
import { SectionTrackable } from './sectionTrackable';
import { SectionBurnable } from './sectionBurnable';
import { SectionKeyValue } from './sectionKeyValue';
import { SectionRichText } from './sectionRichText';
import { SectionDeltaGreenStats, createDefaultDeltaGreenStatsContent } from './sectionDeltaGreenStats';
import { SectionDeltaGreenDerived, createDefaultDeltaGreenDerivedContent } from './sectionDeltaGreenDerived';
import { SectionDeltaGreenSkills, createDefaultDeltaGreenSkillsContent } from './sectionDeltaGreenSkills';

type SectionTypeConfig = {
  component: React.FC<{ section: SheetSection, mayEditSheet: boolean, onUpdate: (updatedSection: SheetSection) => void }>;
  label: string; // i18n key for translation
  seed: (sheet?: any) => any;
};

// Section type registry to map types to components and labels
const sectionRegistry: Record<string, SectionTypeConfig> = {
  'TRACKABLE': { component: SectionTrackable, label: 'sectionType.trackable', seed: () => ({items: []}) },
  'BURNABLE': { component: SectionBurnable, label: 'sectionType.burnable', seed: () => ({items: []}) },
  'KEYVALUE': { component: SectionKeyValue, label: 'sectionType.keyvalue', seed: () => ({items: []}) },
  'RICHTEXT': { component: SectionRichText, label: 'sectionType.richtext', seed: () => ({items: [{content: ""}]}) },
  'DELTAGREENSTATS': { component: SectionDeltaGreenStats, label: 'sectionType.deltagreenstats', seed: () => createDefaultDeltaGreenStatsContent() },
  'DELTAGREENDERED': { component: SectionDeltaGreenDerived, label: 'sectionType.deltagreendered', seed: (sheet) => createDefaultDeltaGreenDerivedContent(sheet) },
  'DELTAGREENSKILLS': { component: SectionDeltaGreenSkills, label: 'sectionType.deltagreenskills', seed: () => createDefaultDeltaGreenSkillsContent() }
};

// Function to get the component for a section type
export const getSectionComponent = (sectionType: string) => {
  return sectionRegistry[sectionType]?.component || null;
};

export const getSectionSeed = (sectionType: string, sheet?: any) => {
  const seedFunction = sectionRegistry[sectionType]?.seed;
  return seedFunction ? seedFunction(sheet) : {};
}

// Function to get all supported section types and their labels (for dropdowns or validation)
export const getSectionTypes = () => {
  return Object.entries(sectionRegistry).map(([type, config]) => ({
    type,
    label: config.label,
    seed: config.seed(),
  }));
};
