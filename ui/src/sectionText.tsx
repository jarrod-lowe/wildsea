import React, { useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPencilAlt } from 'react-icons/fa';

type SectionTypeText = {
  text: string;
};

// Section component
export const SectionText: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(JSON.parse(section.content) as SectionTypeText);
  const [sectionName, setSectionName] = useState(section.sectionName);
  const intl = useIntl(); // Get the intl object for translation

  const handleUpdate = async () => {
    try {
      const input: UpdateSectionInput = {
            gameId: section.gameId,
            sectionId: section.sectionId,
            sectionName: sectionName,
            sectionType: section.sectionType,
            content: JSON.stringify(content),
      }
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: {
          input: input,
        }
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <p>{content.text}</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="section">
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder={intl.formatMessage({ id: "sectionName" })}
        />
        <textarea
          value={content.text}
          onChange={(e) => setContent({ ...content, text: e.target.value })}
          placeholder={intl.formatMessage({ id: "sectionContent.text" })}
        />
        <button onClick={handleUpdate}>
          <FormattedMessage id="save" />
        </button>
      </div>
    );
  }

  return (
    <div className="section">
      <h3>{sectionName} <FaPencilAlt onClick={() => setIsEditing(true)} /></h3>
      <p>{content.text}</p>
    </div>
  );
};
