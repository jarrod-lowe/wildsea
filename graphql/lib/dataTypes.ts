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
};
export type DataSheetSection = SheetSection;

export type Data = DataGame | DataPlayerSheet | DataSheetSection;

export type SubscriptionGenericArgs =
  | SubscriptionUpdatedPlayerArgs
  | SubscriptionUpdatedSectionArgs;

export type Empty = Record<string, never>;
