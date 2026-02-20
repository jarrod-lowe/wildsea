import React from 'react';
import { useIntl } from 'react-intl';
import { splitEmojiParts } from '../utils/emojiUtils';

interface Props {
  id: string;
  values?: Record<string, string | number>;
}

export function EmojiButtonText({ id, values }: Readonly<Props>) {
  const intl = useIntl();
  const text = intl.formatMessage({ id }, values);
  const parts = splitEmojiParts(text);
  return (
    <>
      {parts.map((part) =>
        part.isEmoji
          ? <span key={part.key} aria-hidden="true">{part.text}</span>
          : part.text
      )}
    </>
  );
}
