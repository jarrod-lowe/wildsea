// Regex covering emoji, pictographs, symbols, and common UI symbols (×, −, ✚, ✕, ✎, ↺, ℹ, etc.)
const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}✚✕✖✗✘✎×−↺↕ℹ]/gu;

export function stripEmoji(str: string): string {
  return str.replaceAll(EMOJI_REGEX, '').replaceAll(/\s+/g, ' ').trim();
}

export function splitEmojiParts(str: string): Array<{ text: string; isEmoji: boolean; key: string }> {
  const parts: Array<{ text: string; isEmoji: boolean; key: string }> = [];
  let last = 0;
  for (const match of str.matchAll(EMOJI_REGEX)) {
    if (match.index > last) parts.push({ text: str.slice(last, match.index), isEmoji: false, key: `t${last}` });
    parts.push({ text: match[0], isEmoji: true, key: `e${match.index}` });
    last = match.index + match[0].length;
  }
  if (last < str.length) parts.push({ text: str.slice(last), isEmoji: false, key: `t${last}` });
  return parts;
}
