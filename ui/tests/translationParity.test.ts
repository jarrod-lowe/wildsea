import { messagesEnglish } from '../src/translations.en';
import { messagesKlingon } from '../src/translations.tlh';
import { diceRollMessagesEnglish } from '../src/rollTranslations.en';
import { diceRollMessagesKlingon } from '../src/rollTranslations.tlh';

function getBaseKeys(obj: Record<string, string>): Set<string> {
  return new Set(
    Object.keys(obj).map((k) => k.replace(/\.[0-9]+$/, ''))
  );
}

describe('Translation key parity', () => {
  it('Klingon and English translation files have the same keys', () => {
    const enKeys = Object.keys(messagesEnglish).sort();
    const tlhKeys = Object.keys(messagesKlingon).sort();
    expect(tlhKeys).toEqual(enKeys);
  });

  it('Klingon and English roll translation files have the same base keys', () => {
    const enBaseKeys = Array.from(getBaseKeys(diceRollMessagesEnglish)).sort();
    const tlhBaseKeys = Array.from(getBaseKeys(diceRollMessagesKlingon)).sort();
    expect(tlhBaseKeys).toEqual(enBaseKeys);
  });
});
