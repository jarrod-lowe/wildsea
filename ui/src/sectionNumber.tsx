import React from 'react';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { generateClient } from "aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { updateSectionMutation } from '../../appsync/schema';
import { FormattedMessage } from 'react-intl';

export const SectionNumber: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const content = JSON.parse(section.content) as { number: number };

  const handleIncrement = async () => {
    try {
      const updatedContent = { number: content.number + 1 };
      const input: UpdateSectionInput = {
        gameId: section.gameId,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        sectionType: section.sectionType,
        content: JSON.stringify(updatedContent),
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: { input },
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  return (
    <div className="section">
      <h3>{section.sectionName}</h3>
      <p>
        <FormattedMessage id="sectionNumber.value" values={{ number: content.number }} /> 
      </p>
      {userSubject === section.userId && (
        <button onClick={handleIncrement}>
           <FormattedMessage id="sectionNumber.increment" />
        </button>
      )}
    </div>
  );
};
