import { SupportedLanguage } from '../translations';
import deltaGreenSkillsEn from './deltaGreenSkills.en.json';
import deltaGreenSkillsTlh from './deltaGreenSkills.tlh.json';

export interface DeltaGreenSkillSeed {
  name: string;
  roll: number;
  hasUsedFlag?: boolean;
  description?: string;
}

const deltaGreenSkillsSeeds: Record<Exclude<SupportedLanguage, 'auto'>, DeltaGreenSkillSeed[]> = {
  en: deltaGreenSkillsEn,
  tlh: deltaGreenSkillsTlh,
};

export function getDeltaGreenSkillsSeed(language: SupportedLanguage): DeltaGreenSkillSeed[] {
  if (language === 'auto') {
    return deltaGreenSkillsSeeds.en; // Default to English for auto-detect
  }
  
  return deltaGreenSkillsSeeds[language] || deltaGreenSkillsSeeds.en;
}