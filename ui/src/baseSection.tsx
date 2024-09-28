import React, { useState, useEffect } from 'react';
import { SheetSection, UpdateSectionInput } from "../../appsync/graphql";
import { FormattedMessage, useIntl } from 'react-intl';
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
    userSubject: string;
    onUpdate: (updatedSection: SheetSection) => void;
    renderItems: (
        content: BaseSectionContent<T>,
        userSubject: string,
        sectionUserId: string,
        setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>,
        updateSection: (updatedSection: Partial<SheetSection>) => Promise<void>,
    ) => React.ReactNode;
    renderEditForm: (
        content: BaseSectionContent<T>,
        setContent: React.Dispatch<React.SetStateAction<BaseSectionContent<T>>>,
    ) => React.ReactNode;
}

export const BaseSection = <T extends BaseSectionItem>({
    section,
    userSubject,
    onUpdate,
    renderItems,
    renderEditForm
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

    if (userSubject !== section.userId) {
        return (
            <div className="section">
                <h3>{sectionName}</h3>
                <div className="section-items">
                    {renderItems(content, userSubject, section.userId, setContent, updateSection)}
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
                {renderItems(content, userSubject, section.userId, setContent, updateSection)}
            </div>
        </div>
    );
};
