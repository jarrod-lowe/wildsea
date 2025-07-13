import type {
  Game,
  PlayerSheet,
  SheetSection,
  SubscriptionUpdatedPlayerArgs,
  SubscriptionUpdatedSectionArgs,
} from "../../appsync/graphql";

export type DataGame = Omit<Game, "playerSheets"> & {
  players: string[];
};
export type DataPlayerSheet = Omit<PlayerSheet, "sections"> & {
  gameName: string;
  gameDescription: string;
  gameType: string;
};
export type DataSheetSection = SheetSection;

export type Data = DataGame | DataPlayerSheet | DataSheetSection;

export type SubscriptionGenericArgs =
  | SubscriptionUpdatedPlayerArgs
  | SubscriptionUpdatedSectionArgs;

export type Empty = Record<string, never>;

export type GameType = string;

// Type for NPC configuration
export interface NPCConfig {
  type: string;
  characterName: string;
}

// Type for game type configuration
export interface GameTypeConfigType {
  fireflyCharacterName: string;
  defaultNPCs: NPCConfig[];
}
