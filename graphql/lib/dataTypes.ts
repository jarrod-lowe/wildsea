import type { AppGame, PlayerSheet, SheetSection } from "../../appsync/graphql";

// define a type DataGame, like Game, except players -> playerSheets (PlayerSheet[]), and fireflyUserId -> fireflySheet (PlayerSheet)

export type DataGame = Omit<AppGame, "playerSheets"> & {
  players: string[];
  fireflyUserId: string;
};
export type DataPlayerSheet = Omit<PlayerSheet, "sections"> & {
  gameName: string;
  gameDescription: string;
};
export type DataSheetSection = SheetSection;

export type Data = DataGame | DataPlayerSheet | DataSheetSection;
