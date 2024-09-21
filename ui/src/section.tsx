import React from 'react';
import { SheetSection } from "../../appsync/graphql";
import { getSectionComponent } from './sectionRegistry';

export const Section: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const SectionComponent = getSectionComponent(section.sectionType);

  if (!SectionComponent) {
    return <div>Unsupported section type</div>;
  }

  return <SectionComponent section={section} userSubject={userSubject} onUpdate={onUpdate} />;
};
