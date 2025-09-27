import React from 'react';
import Tippy from '@tippyjs/react';
import ReactMarkdown from 'react-markdown';
import 'tippy.js/dist/tippy.css';
import { useIntl } from 'react-intl';
import { BaseSectionItem } from '../baseSection';
import MDEditor, { getCommands, ICommand } from '@uiw/react-md-editor';

interface SectionItemProps<T extends BaseSectionItem> {
  readonly item: T;
  readonly renderContent: (item: T) => React.ReactNode;
}

export function SectionItem<T extends BaseSectionItem>({ item, renderContent }: Readonly<SectionItemProps<T>>) {
  const intl = useIntl();
  
  return (
    <div className={`section-item ${item.constructor.name.toLowerCase()}-item`}>
      <span>
        {item.name}
        { item.description && (
          <Tippy
            content={<ReactMarkdown>{item.description}</ReactMarkdown> }
            interactive={true}
            trigger="click"
            arrow={true}
            placement="top"
            className="markdown-tippy"
          >
            <button
              className="btn-icon info"
              aria-label={intl.formatMessage({ id: 'showInfo.itemDescription' })}
            >
              {intl.formatMessage({ id: 'showInfo' })}
            </button>
          </Tippy>
        )}
      </span>
      {renderContent(item)}
    </div>
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
}

export const SectionItemDescription: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder, id, ariaLabel }) => {
  // Filter out the preview command to protect against XSS issues
  const customCommands = getCommands().filter((cmd: ICommand) => 
    cmd.name !== 'preview' && cmd.name !== 'live'
  );

  return (
    <MDEditor
      value={value}
      onChange={(value) => onChange(value ?? "")}
      preview="edit"
      textareaProps={{
        placeholder: placeholder,
        id: id,
        'aria-label': ariaLabel
      }}
      commands={customCommands}
      extraCommands={[]}
      previewOptions={{
        allowedElements: [],
      }}
    />
  );
};
