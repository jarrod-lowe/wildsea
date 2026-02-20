// Regex covering emoji, pictographs, symbols, and common UI symbols (×, −, ✚, ✕, ✎, ↺, ℹ, etc.)
const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}✚✕✖✗✘✎×−↺↕ℹ]/gu;

export function stripEmoji(str: string): string {
  return str.replace(EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();
}

export function splitEmojiParts(str: string): Array<{ text: string; isEmoji: boolean }> {
  const parts: Array<{ text: string; isEmoji: boolean }> = [];
  let last = 0;
  for (const match of str.matchAll(EMOJI_REGEX)) {
    if (match.index > last) parts.push({ text: str.slice(last, match.index), isEmoji: false });
    parts.push({ text: match[0], isEmoji: true });
    last = match.index + match[0].length;
  }
  if (last < str.length) parts.push({ text: str.slice(last), isEmoji: false });
  return parts;
}
