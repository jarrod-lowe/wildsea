import React from 'react';
import Tippy from '@tippyjs/react';
import ReactMarkdown from 'react-markdown';
import 'tippy.js/dist/tippy.css';
import { FaInfoCircle } from 'react-icons/fa';
import { BaseSectionItem } from '../baseSection';
import MDEditor, { getCommands, ICommand } from '@uiw/react-md-editor';

interface SectionItemProps<T extends BaseSectionItem> {
  readonly item: T;
  readonly renderContent: (item: T) => React.ReactNode;
}

export function SectionItem<T extends BaseSectionItem>({ item, renderContent }: Readonly<SectionItemProps<T>>) {
  return (
    <div className={`section-item ${item.constructor.name.toLowerCase()}-item`}>
      <span>{item.name}</span>
      {renderContent(item)}
      { item.description && (
      <Tippy
        content={<ReactMarkdown>{item.description}</ReactMarkdown> }
        interactive={true}
        trigger="click"
        arrow={true}
        placement="top"
        className="markdown-tippy"
      >
        <button className="info-icon-button">
          <FaInfoCircle className="info-icon" />
        </button>
      </Tippy>
      )}
    </div>
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SectionItemDescription: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  // Filter out the preview command to protect against XSS issues
  const customCommands = getCommands().filter((cmd: ICommand) => 
    cmd.name !== 'preview' && cmd.name !== 'live'
  );

  return (
    <MDEditor
      value={value}
      onChange={(value) => onChange(value ?? "")}
      preview="edit"
      textareaProps={{placeholder: placeholder }}
      commands={customCommands}
      extraCommands={[]}
      previewOptions={{
        allowedElements: [],
      }}
    />
  );
};
