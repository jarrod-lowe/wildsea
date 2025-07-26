import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem, SectionDefinition } from './baseSection';
import ReactMarkdown from 'react-markdown';
import { SectionItemDescription } from './components/SectionItem';
import { useIntl } from 'react-intl';

interface RichTextItem extends BaseSectionItem {
  markdown: string;
}

type SectionTypeRichText = BaseSectionContent<RichTextItem>;

export const SectionRichText: React.FC<SectionDefinition> = (props) => {
  const intl = useIntl();
    
  const renderItems = (
    content: SectionTypeRichText,
  ) => {
    return content.items.map((item, index) => (
      <div key={`${item.id}-${index}`} className="rich-text-content">
        <ReactMarkdown>{item.markdown}</ReactMarkdown>
      </div>
    ));
  };

  const renderEditForm = (content: SectionTypeRichText, setContent: React.Dispatch<React.SetStateAction<SectionTypeRichText>>) => {
    const handleItemChange = (index: number, value: string) => {
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], markdown: value };
      setContent({ ...content, items: newItems });
    };

    return (
      <>
        {content.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="rich-text-edit">
                <SectionItemDescription
                    value={item.markdown || ''}
                    onChange={(value) => handleItemChange(index, value ?? "")}
                    placeholder={intl.formatMessage({ id: "sectionRichText.sampleContent" })}
                />
          </div>
        ))}
      </>
    );
  };

  return <BaseSection<RichTextItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
