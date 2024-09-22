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

export type CreateGameInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateSectionInput = {
  content?: InputMaybe<Scalars['AWSJSON']['input']>;
  gameId: Scalars['ID']['input'];
  sectionName: Scalars['String']['input'];
  sectionType: Scalars['String']['input'];
};

export type Game = {
  __typename?: 'Game';
  createdAt: Scalars['AWSDateTime']['output'];
  gameDescription?: Maybe<Scalars['String']['output']>;
  gameId: Scalars['ID']['output'];
  gameName: Scalars['String']['output'];
  joinToken?: Maybe<Scalars['String']['output']>;
  playerSheets: Array<PlayerSheet>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type JoinGameInput = {
  gameId: Scalars['ID']['input'];
  joinToken: Scalars['ID']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createGame: Game;
  createSection: SheetSection;
  joinGame: Game;
  updatePlayerSheet?: Maybe<PlayerSheetSummary>;
  updateSection: SheetSection;
};


export type MutationCreateGameArgs = {
  input: CreateGameInput;
};


export type MutationCreateSectionArgs = {
  input: CreateSectionInput;
};


export type MutationJoinGameArgs = {
  input: JoinGameInput;
};


export type MutationUpdatePlayerSheetArgs = {
  input: UpdatePlayerSheetInput;
};


export type MutationUpdateSectionArgs = {
  input: UpdateSectionInput;
};

export type PlayerSheet = {
  __typename?: 'PlayerSheet';
  characterName: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameId: Scalars['ID']['output'];
  sections: Array<SheetSection>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type PlayerSheetSummary = {
  __typename?: 'PlayerSheetSummary';
  characterName: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameDescription: Scalars['String']['output'];
  gameId: Scalars['ID']['output'];
  gameName: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  getGame: Game;
  getGames?: Maybe<Array<PlayerSheetSummary>>;
};


export type QueryGetGameArgs = {
  id: Scalars['ID']['input'];
};

export type SheetSection = {
  __typename?: 'SheetSection';
  content: Scalars['AWSJSON']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameId: Scalars['ID']['output'];
  sectionId: Scalars['ID']['output'];
  sectionName: Scalars['String']['output'];
  sectionType: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type UpdatePlayerSheetInput = {
  characterName: Scalars['String']['input'];
  gameId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type UpdateSectionInput = {
  content: Scalars['AWSJSON']['input'];
  gameId: Scalars['ID']['input'];
  sectionId: Scalars['ID']['input'];
  sectionName: Scalars['String']['input'];
  sectionType: Scalars['String']['input'];
};
