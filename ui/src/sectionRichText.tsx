import React from 'react';
import { BaseSection, BaseSectionContent, BaseSectionItem } from './baseSection';
import { SheetSection } from "../../appsync/graphql";
import ReactMarkdown from 'react-markdown';
import MDEditor from "@uiw/react-md-editor";

interface RichTextItem extends BaseSectionItem {
  markdown: string;
}

type SectionTypeRichText = BaseSectionContent<RichTextItem>;

export const SectionRichText: React.FC<{ section: SheetSection, userSubject: string, onUpdate: (updatedSection: SheetSection) => void }> = (props) => {
    
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
                <MDEditor
                    value={item.markdown}
                    onChange={(value) => handleItemChange(index, value ?? "")}
                    preview="edit"
                />
          </div>
        ))}
      </>
    );
  };

  return <BaseSection<RichTextItem> {...props} renderItems={renderItems} renderEditForm={renderEditForm} />;
};
