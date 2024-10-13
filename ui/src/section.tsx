import React from 'react';
import { getSectionComponent } from './sectionRegistry';
import { SectionDefinition } from './baseSection';

export const Section: React.FC<SectionDefinition> = ({ section, mayEditSheet, onUpdate }) => {
  const SectionComponent = getSectionComponent(section.sectionType);

  if (!SectionComponent) {
    return <div>Unsupported section type</div>;
  }

  return <SectionComponent section={section} mayEditSheet={mayEditSheet} onUpdate={onUpdate} />;
};
