import React, { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPencilAlt } from 'react-icons/fa';
import { useToast } from './notificationToast';

type SectionTypeText = {
  text: string;
};

// Section component
export const SectionText: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, userSubject, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(JSON.parse(section.content) as SectionTypeText);
  const [sectionName, setSectionName] = useState(section.sectionName);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
  const intl = useIntl(); // Get the intl object for translation
  const toast = useToast();

  useEffect(() => {
    setContent(JSON.parse(section.content) as SectionTypeText);
  }, [section.content]);

  useEffect(() => {
    setSectionName(section.sectionName);
  }, [section.sectionName]);

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
      toast.addToast(intl.formatMessage({ id: "sectionText.updateError" }), 'error');

    }
  };

  const handleCancel = () => {
    // Reset the content and section name to their original values
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
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
          placeholder={intl.formatMessage({ id: "sectionText.sampleContent" })}
        />
        <button onClick={handleUpdate}>
          <FormattedMessage id="save" />
        </button>
        <button onClick={handleCancel}>
          <FormattedMessage id="cancel" />
        </button>
      </div>
    );
  }

  return (
    <div className="section">
      <h3>{sectionName} <FaPencilAlt onClick={() => {
        setOriginalContent(content);
        setOriginalSectionName(section.sectionName);
        setIsEditing(true);
      }} /></h3>
      <p>{content.text}</p>
    </div>
  );
};
