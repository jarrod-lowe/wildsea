import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { FormattedMessage, useIntl } from 'react-intl';
import { CharacterTemplateMetadata, TemplateSectionData, CreateSectionInput } from "../../appsync/graphql";
import { getCharacterTemplatesQuery, getCharacterTemplateQuery, createSectionMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';
import { SupportedLanguage, resolveLanguage } from './translations';

interface AutoPopulateProps {
  gameType: string;
  gameId: string;
  userId: string;
  currentLanguage?: SupportedLanguage;
  onSectionsAdded: () => void;
}

export const SectionAutoPopulate: React.FC<AutoPopulateProps> = ({
  gameType,
  gameId,
  userId,
  currentLanguage,
  onSectionsAdded,
}) => {
  const [templates, setTemplates] = useState<CharacterTemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [gameType, currentLanguage]);

  const fetchTemplates = async () => {
    try {
      const client = generateClient();
      const language = resolveLanguage(currentLanguage);
      const response = await client.graphql({
        query: getCharacterTemplatesQuery,
        variables: {
          input: {
            gameType: gameType,
            language: language,
          },
        },
      }) as GraphQLResult<{ getCharacterTemplates: CharacterTemplateMetadata[] }>;

      let templates = response.data?.getCharacterTemplates || [];
      
      // Fallback to English if no templates found for current language
      if (templates.length === 0 && language !== 'en') {
        console.log(`No templates found for language '${language}', falling back to English`);
        const fallbackResponse = await client.graphql({
          query: getCharacterTemplatesQuery,
          variables: {
            input: {
              gameType: gameType,
              language: 'en',
            },
          },
        }) as GraphQLResult<{ getCharacterTemplates: CharacterTemplateMetadata[] }>;
        
        templates = fallbackResponse.data?.getCharacterTemplates || [];
      }

      setTemplates(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.addToast(intl.formatMessage({ id: "autoPopulate.fetchTemplatesError" }), 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleAutoPopulate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const client = generateClient();
      const language = resolveLanguage(currentLanguage);
      
      // Fetch template sections
      let templateResponse = await client.graphql({
        query: getCharacterTemplateQuery,
        variables: {
          input: {
            templateName: selectedTemplate,
            gameType: gameType,
            language: language,
          },
        },
      }) as GraphQLResult<{ getCharacterTemplate: TemplateSectionData[] }>;

      let templateSections = templateResponse.data?.getCharacterTemplate || [];
      
      // Fallback to English if no template found for current language
      if (templateSections.length === 0 && language !== 'en') {
        console.log(`No template sections found for language '${language}', falling back to English`);
        templateResponse = await client.graphql({
          query: getCharacterTemplateQuery,
          variables: {
            input: {
              templateName: selectedTemplate,
              gameType: gameType,
              language: 'en',
            },
          },
        }) as GraphQLResult<{ getCharacterTemplate: TemplateSectionData[] }>;
        
        templateSections = templateResponse.data?.getCharacterTemplate || [];
      }

      // Create all sections in order
      for (const section of templateSections) {
        const input: CreateSectionInput = {
          userId: userId,
          gameId: gameId,
          sectionName: section.sectionName,
          sectionType: section.sectionType,
          content: section.content,
          position: section.position,
        };

        await client.graphql({
          query: createSectionMutation,
          variables: { input },
        });
      }

      toast.addToast(intl.formatMessage({ id: "autoPopulate.success" }), 'success');
      onSectionsAdded();
    } catch (error) {
      console.error('Error auto-populating character:', error);
      toast.addToast(intl.formatMessage({ id: "autoPopulate.error" }), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="auto-populate-section">
        <FormattedMessage id="autoPopulate.loadingTemplates" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="auto-populate-section">
        <h3><FormattedMessage id="autoPopulate.title" /></h3>
        <p><FormattedMessage id="autoPopulate.noTemplates" /></p>
      </div>
    );
  }

  return (
    <div className="auto-populate-section">
      <h3><FormattedMessage id="autoPopulate.title" /></h3>
      <p><FormattedMessage id="autoPopulate.description" /></p>
      
      <div className="auto-populate-form">
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          disabled={loading}
          aria-label={intl.formatMessage({ id: "autoPopulate.selectTemplate" })}
        >
          <option value="">
            {intl.formatMessage({ id: "autoPopulate.selectTemplate" })}
          </option>
          {templates.map((template) => (
            <option key={template.templateName} value={template.templateName}>
              {template.displayName}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleAutoPopulate}
          disabled={!selectedTemplate || loading}
          className="btn-standard"
        >
          {loading ? (
            <FormattedMessage id="autoPopulate.applying" />
          ) : (
            <FormattedMessage id="autoPopulate.apply" />
          )}
        </button>
      </div>
    </div>
  );
};