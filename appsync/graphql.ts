export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDateTime: { input: string; output: string; }
  AWSEmail: { input: string; output: string; }
  AWSIPAddress: { input: string; output: string; }
  AWSJSON: { input: string; output: string; }
  AWSPhone: { input: string; output: string; }
  AWSTime: { input: string; output: string; }
  AWSTimestamp: { input: string; output: string; }
  AWSURL: { input: string; output: string; }
};

export type Asset = {
  __typename?: 'Asset';
  assetId: Scalars['ID']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameId: Scalars['ID']['output'];
  height?: Maybe<Scalars['Int']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  mimeType: Scalars['String']['output'];
  sectionId: Scalars['ID']['output'];
  sizeBytes?: Maybe<Scalars['Int']['output']>;
  status: AssetStatus;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export enum AssetStatus {
  Canceled = 'CANCELED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
  Ready = 'READY'
}

export type AssetUploadTicket = {
  __typename?: 'AssetUploadTicket';
  asset: Asset;
  headers: Scalars['AWSJSON']['output'];
  uploadFields: Scalars['AWSJSON']['output'];
  uploadUrl: Scalars['AWSURL']['output'];
};

export type CharacterTemplateMetadata = {
  __typename?: 'CharacterTemplateMetadata';
  displayName: Scalars['String']['output'];
  gameType: Scalars['String']['output'];
  language: Scalars['String']['output'];
  templateName: Scalars['String']['output'];
};

export type CreateGameInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  gameType: Scalars['String']['input'];
  language: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateNpcInput = {
  characterName: Scalars['String']['input'];
  gameId: Scalars['ID']['input'];
};

export type CreateSectionInput = {
  content?: InputMaybe<Scalars['AWSJSON']['input']>;
  gameId: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
  sectionName: Scalars['String']['input'];
  sectionType: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type DeleteAssetInput = {
  assetId: Scalars['ID']['input'];
  gameId: Scalars['ID']['input'];
  sectionId: Scalars['ID']['input'];
};

export type DeleteGameInput = {
  gameId: Scalars['ID']['input'];
};

export type DeletePlayerInput = {
  gameId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type DeleteSectionInput = {
  gameId: Scalars['ID']['input'];
  sectionId: Scalars['ID']['input'];
};

export type Dice = SingleDie;

export type DiceInput = {
  modifier?: InputMaybe<Scalars['Int']['input']>;
  size: Scalars['Int']['input'];
  type: Scalars['String']['input'];
};

export type DiceRoll = {
  __typename?: 'DiceRoll';
  action?: Maybe<Scalars['String']['output']>;
  dice: Array<Dice>;
  diceList: Array<Dice>;
  gameId: Scalars['ID']['output'];
  grade: Scalars['String']['output'];
  messageIndex: Scalars['Int']['output'];
  messageType?: Maybe<Scalars['String']['output']>;
  playerId: Scalars['ID']['output'];
  playerName: Scalars['String']['output'];
  proxyRoll: Scalars['Boolean']['output'];
  rollType: Scalars['String']['output'];
  rolledAt: Scalars['AWSDateTime']['output'];
  rolledBy: Scalars['String']['output'];
  target: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  value: Scalars['Int']['output'];
};

export type ExpireAssetInput = {
  assetId: Scalars['ID']['input'];
  gameId: Scalars['ID']['input'];
};

export type FinaliseAssetInput = {
  assetId: Scalars['ID']['input'];
  gameId: Scalars['ID']['input'];
  sectionId: Scalars['ID']['input'];
};

export type Game = {
  __typename?: 'Game';
  createdAt: Scalars['AWSDateTime']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  gameDescription?: Maybe<Scalars['String']['output']>;
  gameId: Scalars['ID']['output'];
  gameName: Scalars['String']['output'];
  gameType: Scalars['String']['output'];
  gmUserId: Scalars['String']['output'];
  joinCode?: Maybe<Scalars['String']['output']>;
  playerSheets: Array<PlayerSheet>;
  remainingAssets: Scalars['Int']['output'];
  remainingCharacters: Scalars['Int']['output'];
  remainingSections: Scalars['Int']['output'];
  theme?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type GamePresetItem = {
  __typename?: 'GamePresetItem';
  data: Scalars['AWSJSON']['output'];
  displayName: Scalars['String']['output'];
  language: Scalars['String']['output'];
};

export type GameSummary = {
  __typename?: 'GameSummary';
  createdAt: Scalars['AWSDateTime']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  gameDescription?: Maybe<Scalars['String']['output']>;
  gameId: Scalars['ID']['output'];
  gameName: Scalars['String']['output'];
  gameType: Scalars['String']['output'];
  gmUserId: Scalars['String']['output'];
  joinCode?: Maybe<Scalars['String']['output']>;
  remainingAssets: Scalars['Int']['output'];
  remainingCharacters: Scalars['Int']['output'];
  remainingSections: Scalars['Int']['output'];
  theme?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type GameTypeMetadata = {
  __typename?: 'GameTypeMetadata';
  displayName: Scalars['String']['output'];
  gameType: Scalars['String']['output'];
  language: Scalars['String']['output'];
};

export type GamesWithQuota = {
  __typename?: 'GamesWithQuota';
  games: Array<PlayerSheetSummary>;
  remainingGames: Scalars['Int']['output'];
  totalQuota: Scalars['Int']['output'];
};

export type GetCharacterTemplateInput = {
  gameType: Scalars['String']['input'];
  language: Scalars['String']['input'];
  templateName: Scalars['String']['input'];
};

export type GetCharacterTemplatesInput = {
  gameType: Scalars['String']['input'];
  language: Scalars['String']['input'];
};

export type GetGameInput = {
  gameId: Scalars['ID']['input'];
  language: Scalars['String']['input'];
};

export type GetGamePresetsInput = {
  dataSetName: Scalars['String']['input'];
  language: Scalars['String']['input'];
};

export type GetGameTypesInput = {
  language: Scalars['String']['input'];
};

export type JoinGameInput = {
  joinCode: Scalars['String']['input'];
  language: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _expireAsset: Asset;
  _finaliseAsset: Asset;
  createGame: GameSummary;
  createNPC: PlayerSheetSummary;
  createSection: SheetSection;
  deleteAsset: Asset;
  deleteGame: GameSummary;
  deletePlayer?: Maybe<PlayerSheetSummary>;
  deleteSection: SheetSection;
  joinGame: PlayerSheetSummary;
  requestAssetUpload: AssetUploadTicket;
  rollDice: DiceRoll;
  setSystemNotification: SystemNotification;
  updateGame: GameSummary;
  updateJoinCode: GameSummary;
  updatePlayer?: Maybe<PlayerSheetSummary>;
  updateSection: SheetSection;
  updateUserSettings: UserSettings;
};


export type Mutation_ExpireAssetArgs = {
  input: ExpireAssetInput;
};


export type Mutation_FinaliseAssetArgs = {
  input: FinaliseAssetInput;
};


export type MutationCreateGameArgs = {
  input: CreateGameInput;
};


export type MutationCreateNpcArgs = {
  input: CreateNpcInput;
};


export type MutationCreateSectionArgs = {
  input: CreateSectionInput;
};


export type MutationDeleteAssetArgs = {
  input: DeleteAssetInput;
};


export type MutationDeleteGameArgs = {
  input: DeleteGameInput;
};


export type MutationDeletePlayerArgs = {
  input: DeletePlayerInput;
};


export type MutationDeleteSectionArgs = {
  input: DeleteSectionInput;
};


export type MutationJoinGameArgs = {
  input: JoinGameInput;
};


export type MutationRequestAssetUploadArgs = {
  input: RequestAssetUploadInput;
};


export type MutationRollDiceArgs = {
  input: RollDiceInput;
};


export type MutationSetSystemNotificationArgs = {
  input: SetSystemNotificationInput;
};


export type MutationUpdateGameArgs = {
  input: UpdateGameInput;
};


export type MutationUpdateJoinCodeArgs = {
  input: UpdateJoinCodeInput;
};


export type MutationUpdatePlayerArgs = {
  input: UpdatePlayerInput;
};


export type MutationUpdateSectionArgs = {
  input: UpdateSectionInput;
};


export type MutationUpdateUserSettingsArgs = {
  input: UpdateUserSettingsInput;
};

export type PlayerSheet = {
  __typename?: 'PlayerSheet';
  characterName: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameId: Scalars['ID']['output'];
  gmUserId: Scalars['ID']['output'];
  remainingSections: Scalars['Int']['output'];
  sections: Array<SheetSection>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type PlayerSheetSummary = {
  __typename?: 'PlayerSheetSummary';
  characterName: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  gameDescription?: Maybe<Scalars['String']['output']>;
  gameId: Scalars['ID']['output'];
  gameName: Scalars['String']['output'];
  gameType: Scalars['String']['output'];
  remainingSections: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  getCharacterTemplate: Array<TemplateSectionData>;
  getCharacterTemplates: Array<CharacterTemplateMetadata>;
  getGame: Game;
  getGamePresets: Array<GamePresetItem>;
  getGameTypes: Array<GameTypeMetadata>;
  getGames: GamesWithQuota;
  getSystemNotification?: Maybe<SystemNotification>;
  getUserSettings?: Maybe<UserSettings>;
};


export type QueryGetCharacterTemplateArgs = {
  input: GetCharacterTemplateInput;
};


export type QueryGetCharacterTemplatesArgs = {
  input: GetCharacterTemplatesInput;
};


export type QueryGetGameArgs = {
  input: GetGameInput;
};


export type QueryGetGamePresetsArgs = {
  input: GetGamePresetsInput;
};


export type QueryGetGameTypesArgs = {
  input: GetGameTypesInput;
};

export type RequestAssetUploadInput = {
  gameId: Scalars['ID']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  mimeType: Scalars['String']['input'];
  sectionId: Scalars['ID']['input'];
  sizeBytes: Scalars['Int']['input'];
};

export type RollDiceInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  dice: Array<DiceInput>;
  gameId: Scalars['ID']['input'];
  messageType?: InputMaybe<Scalars['String']['input']>;
  onBehalfOf?: InputMaybe<Scalars['ID']['input']>;
  rollType: Scalars['String']['input'];
  target: Scalars['Int']['input'];
};

export type SetSystemNotificationInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  urgent?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SheetSection = {
  __typename?: 'SheetSection';
  assets?: Maybe<Array<Scalars['String']['output']>>;
  content: Scalars['AWSJSON']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  deleted?: Maybe<Scalars['Boolean']['output']>;
  gameId: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  sectionId: Scalars['ID']['output'];
  sectionName: Scalars['String']['output'];
  sectionType: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type SingleDie = {
  __typename?: 'SingleDie';
  size: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  value: Scalars['Int']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  diceRolled?: Maybe<DiceRoll>;
  systemNotificationUpdated?: Maybe<SystemNotification>;
  updatedAsset?: Maybe<Asset>;
  updatedGame?: Maybe<GameSummary>;
  updatedPlayer?: Maybe<PlayerSheetSummary>;
  updatedSection?: Maybe<SheetSection>;
  updatedUserSettings?: Maybe<UserSettings>;
};


export type SubscriptionDiceRolledArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionUpdatedAssetArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionUpdatedGameArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionUpdatedPlayerArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionUpdatedSectionArgs = {
  gameId: Scalars['ID']['input'];
};

export type SystemNotification = {
  __typename?: 'SystemNotification';
  createdAt: Scalars['AWSDateTime']['output'];
  message?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  urgent: Scalars['Boolean']['output'];
};

export type TemplateSectionData = {
  __typename?: 'TemplateSectionData';
  content: Scalars['AWSJSON']['output'];
  position: Scalars['Int']['output'];
  sectionName: Scalars['String']['output'];
  sectionType: Scalars['String']['output'];
};

export type UpdateGameInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  gameId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type UpdateJoinCodeInput = {
  gameId: Scalars['ID']['input'];
};

export type UpdatePlayerInput = {
  characterName: Scalars['String']['input'];
  gameId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type UpdateSectionInput = {
  content?: InputMaybe<Scalars['AWSJSON']['input']>;
  gameId: Scalars['ID']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  sectionId: Scalars['ID']['input'];
  sectionName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserSettingsInput = {
  language: Scalars['String']['input'];
  settings: Scalars['AWSJSON']['input'];
};

export type UserSettings = {
  __typename?: 'UserSettings';
  createdAt: Scalars['AWSDateTime']['output'];
  settings: Scalars['AWSJSON']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};
