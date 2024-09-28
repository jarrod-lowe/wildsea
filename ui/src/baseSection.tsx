import React, { useState, useEffect } from 'react';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { FaPencilAlt } from 'react-icons/fa';
import { useToast } from './notificationToast';
import { generateClient } from "aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api-graphql";

interface BaseSectionProps<T> {
  section: SheetSection;
  userSubject: string;
  onUpdate: (updatedSection: SheetSection) => void;
  renderItems: (content: T, userSubject: string, sectionUserId: string, setContent: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
  renderEditForm: (content: T, setContent: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
}

export const BaseSection = <T extends Record<string, any>>({ 
  section, 
  userSubject, 
  onUpdate, 
  renderItems, 
  renderEditForm 
}: BaseSectionProps<T>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<T>(JSON.parse(section.content || '{}') as T);
  const [sectionName, setSectionName] = useState(section.sectionName);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    setSectionName(section.sectionName);
    setContent(JSON.parse(section.content || '{}') as T);
    setOriginalContent(content);
  }, [section]);

  const handleUpdate = async () => {
    try {
      const input: UpdateSectionInput = {
        gameId: section.gameId,
        sectionId: section.sectionId,
        sectionName: sectionName,
        content: JSON.stringify(content),
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: { input },
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
      toast.addToast(intl.formatMessage({ id: "section.updateError" }), 'error');
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setSectionName(originalSectionName);
    setIsEditing(false);
  };

  if (userSubject !== section.userId) {
    return (
      <div className="section">
        <h3>{sectionName}</h3>
        <div className="section-items">
          {renderItems(content, userSubject, section.userId, setContent)}
        </div>
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
        {renderEditForm(content, setContent)}
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
      <div className="section-items">
        {renderItems(content, userSubject, section.userId, setContent)}
      </div>
    </div>
  );
};
