import { SupportedLanguage } from '../translations';
import deltaGreenSkillsEn from './deltaGreenSkills.en.json';
import deltaGreenSkillsTlh from './deltaGreenSkills.tlh.json';
import deltaGreenStatsEn from './deltaGreenStats.en.json';
import deltaGreenStatsTlh from './deltaGreenStats.tlh.json';
import deltaGreenDerivedEn from './deltaGreenDerived.en.json';
import deltaGreenDerivedTlh from './deltaGreenDerived.tlh.json';

export interface DeltaGreenSkillSeed {
  name: string;
  roll: number;
  hasUsedFlag?: boolean;
  description?: string;
}

export interface DeltaGreenStatSeed {
  name: string;
  abbreviation: string;
}

export interface DeltaGreenDerivedSeed {
  name: string;
  attributeType: 'HP' | 'WP' | 'SAN' | 'BP';
  defaultCurrent: number;
}

const deltaGreenSkillsSeeds: Record<Exclude<SupportedLanguage, 'auto'>, DeltaGreenSkillSeed[]> = {
  en: deltaGreenSkillsEn,
  tlh: deltaGreenSkillsTlh,
};

const deltaGreenStatsSeeds: Record<Exclude<SupportedLanguage, 'auto'>, DeltaGreenStatSeed[]> = {
  en: deltaGreenStatsEn,
  tlh: deltaGreenStatsTlh,
};

const deltaGreenDerivedSeeds: Record<Exclude<SupportedLanguage, 'auto'>, DeltaGreenDerivedSeed[]> = {
  en: deltaGreenDerivedEn,
  tlh: deltaGreenDerivedTlh,
};

export function getDeltaGreenSkillsSeed(language: SupportedLanguage): DeltaGreenSkillSeed[] {
  if (language === 'auto') {
    return deltaGreenSkillsSeeds.en; // Default to English for auto-detect
  }
  
  return deltaGreenSkillsSeeds[language] || deltaGreenSkillsSeeds.en;
}

export function getDeltaGreenStatsSeed(language: SupportedLanguage): DeltaGreenStatSeed[] {
  if (language === 'auto') {
    return deltaGreenStatsSeeds.en; // Default to English for auto-detect
  }
  
  return deltaGreenStatsSeeds[language] || deltaGreenStatsSeeds.en;
}

export function getDeltaGreenDerivedSeed(language: SupportedLanguage): DeltaGreenDerivedSeed[] {
  if (language === 'auto') {
    return deltaGreenDerivedSeeds.en; // Default to English for auto-detect
  }
  
  return deltaGreenDerivedSeeds[language] || deltaGreenDerivedSeeds.en;
}