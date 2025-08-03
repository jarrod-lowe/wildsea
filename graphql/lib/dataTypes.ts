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

// Type for DynamoDB NPC configuration (as stored in database)
export interface DynamoDBNPCConfig {
  type: string;
  characterName: string;
}

// Type for DynamoDB GameDefaults (as returned from database)
export interface DynamoDBGameDefaults {
  PK: string;
  SK: string;
  gameType: string;
  displayName: string;
  defaultCharacterName: string;
  defaultGMName: string;
  defaultNPCs: DynamoDBNPCConfig[];
  theme: string;
  remainingCharacters: number;
  remainingSections: number;
}

// Type for game defaults from database
export interface GameDefaults {
  defaultCharacterName: string;
  defaultGMName: string;
  defaultNPCs: NPCConfig[];
  theme: string;
  remainingCharacters: number;
  remainingSections: number;
}
