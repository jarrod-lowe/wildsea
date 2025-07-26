import React, { useState, useEffect } from 'react';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { useIntl } from 'react-intl';
import { FaPencilAlt } from 'react-icons/fa';
import { useToast } from './notificationToast';
import { generateClient, GraphQLResult } from 'aws-amplify/api';
import { updateSectionMutation } from '../../appsync/schema';

export interface BaseSectionItem {
    id: string;
    name: string;
    description: string;
}

export interface BaseSectionContent<T extends BaseSectionItem> {
    showEmpty: boolean;
    items: T[];
}

interface BaseSectionProps<T extends BaseSectionItem> {
    section: SheetSection;
    mayEditSheet: boolean;
    renderItems: (
        content: BaseSectionContent<T>,
        mayEditSheet: boolean,
        setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
        isEditing: boolean,
    ) => React.ReactNode;
    renderEditForm: (
        content: BaseSectionContent<T>,
        setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>,
        handleUpdate: () => void,
        handleCancel: () => void,
    ) => React.ReactNode;
}

export type SectionDefinition = {
  section: SheetSection
  mayEditSheet: boolean
  onUpdate: (updatedSection: SheetSection) => void
}

export const BaseSection = <T extends BaseSectionItem>({
    section,
    mayEditSheet,
    renderItems,
    renderEditForm,
}: BaseSectionProps<T>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState<BaseSectionContent<T>>(JSON.parse(section.content || '{}'));
    const [sectionName, setSectionName] = useState(section.sectionName);
    const [originalContent, setOriginalContent] = useState(content);
    const [originalSectionName, setOriginalSectionName] = useState(section.sectionName);
    const intl = useIntl();
    const toast = useToast();

    useEffect(() => {
        setSectionName(section.sectionName);
        setContent(JSON.parse(section.content || '{}'));
        setOriginalContent(content);
    }, [section]);

    const updateSection = async (updatedSection: Partial<SheetSection>): Promise<void> => {
        const input: UpdateSectionInput = {
            gameId: section.gameId,
            sectionId: section.sectionId,
            sectionName: updatedSection.sectionName ?? section.sectionName,
            content: updatedSection.content ?? JSON.stringify(content),
        };

        const client = generateClient();
        try {
            await client.graphql({
                query: updateSectionMutation,
                variables: { input },
            }) as GraphQLResult<{ updateSection: SheetSection }>;
        } catch (error) {
            console.error("Error updating section:", error);
            toast.addToast(intl.formatMessage({ id: "sectionObject.updateError" }), 'error');
        }
    }

    const handleUpdate = async () => {
        try {
            updateSection({
                sectionName: sectionName,
                content: JSON.stringify(content),
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating section:", error);
            toast.addToast(intl.formatMessage({ id: "sectionObject.updateError" }), 'error');
        }
    };

    const handleCancel = () => {
        setContent(originalContent);
        setSectionName(originalSectionName);
        setIsEditing(false);
    };

    if (!mayEditSheet) {
        return (
            <div className="section">
                <h3>{sectionName}</h3>
                <div className="section-items">
                    {renderItems(content, mayEditSheet, setContent, updateSection, false)}
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
                    className="section-title-edit"
                />
                {renderEditForm(content, setContent, handleUpdate, handleCancel)}
            </div>
        );
    }

    return (
        <div className="section">
            <h3>{sectionName} <button className="btn-icon edit" onClick={() => {
                setOriginalContent(content);
                setOriginalSectionName(section.sectionName);
                setIsEditing(true);
            }}><FaPencilAlt /></button></h3>
            <div className="section-items">
                {renderItems(content, mayEditSheet, setContent, updateSection, false)}
            </div>
        </div>
    );
};
