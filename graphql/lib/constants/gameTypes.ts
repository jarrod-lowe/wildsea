import type { GameType, GameTypeConfigType } from "../dataTypes";
import { TypeShip } from "./entityTypes";

export const GameTypeWildsea = "wildsea";
export const GameTypeDeltaGreen = "deltaGreen";
export const DefaultNewGameType = GameTypeDeltaGreen;

export interface GameTypeMetadata {
  id: GameType;
  name: string;
  enabled: boolean;
}

export const GameTypes: GameTypeMetadata[] = [
  {
    id: GameTypeWildsea,
    name: "gameType.wildsea.name",
    enabled: true,
  },
  {
    id: GameTypeDeltaGreen,
    name: "gameType.deltaGreen.name",
    enabled: true,
  },
];

export const GameTypeConfig: Record<GameType, GameTypeConfigType> = {
  [GameTypeWildsea]: {
    fireflyCharacterName: "Firefly",
    // Default NPCs for Wildsea
    defaultNPCs: [
      {
        type: TypeShip,
        characterName: "Unnamed Ship",
      },
    ],
  },
  [GameTypeDeltaGreen]: {
    fireflyCharacterName: "Handler",
    defaultNPCs: [],
  },
};

export const DefaultGameConfig = GameTypeConfig[GameTypeWildsea];
