import React from 'react';
import { useIntl } from 'react-intl';
import { stripEmoji } from '../utils/emojiUtils';
import { EmojiButtonText } from './EmojiButtonText';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  values?: Record<string, string | number>;
}

export function ButtonWithEmoji({ id, values, ...buttonProps }: Readonly<Props>) {
  const intl = useIntl();
  const label = stripEmoji(intl.formatMessage({ id }, values));
  return (
    <button aria-label={label} {...buttonProps}>
      <EmojiButtonText id={id} values={values} />
    </button>
  );
}
