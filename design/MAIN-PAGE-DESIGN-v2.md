# Wildsea Companion App

## My Ask

I am writing a webapp using React in Typescript. Below is the current code, which is just a placeholder which dumps put the JSON data received.

I want it to have a top title bar which contains the gameName, and on its right-hand side I want a standard circular user icon (using Gravatar) which is a drop-down menu with "Log out" as an item. This bar should be abstracted into a separate function, as I'll need to use it on other displays as well.

In the main section, it should have a tab bar, with a tab for each playerSheet. The playerSheet's should be rendered by another function.

On a playerSheet, it should have characterName displayed, and then below that a block for each section on the playerSheet. The section display should be in a separate function.

Each section has a sectionName, which will be rendered across the top. To the right of the name should be a pencil icon, which will change that section to edit mode. Each section also has a sectionType, with a different renderer and editor function for each. Currently, we'll only implement the TEXT sectionType. The TEXT rendered will display `content.text` as text. `content` is a string containing JSON, with different fields depending on the sectionType. The TEXT editor will let the user edit the text - and on submit, make a updateSection graphQL call (and using the returned update as a new version with the renderer).

There should also be a + button, which would open a box allowing setting a section name, and choosing the section type (from the list of types) - which when submitted will run the createSection graphql call, and then render the returned data as a new section on the page.

## Other Requirements

* Use all best practices.
* Be secure
* Use react-intl
* Beware of separation of concerns

## Current Files

### Current Code

Here is the current (placeholder) code, for reference:

```typescript
import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game as GameType } from "../../appsync/graphql";
import { getGameQuery } from "../../appsync/schema";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { messages } from './translations';

interface GameProps {
    id: string;
}

const GameContent: React.FC<GameProps> = ({ id }) => {
    const [game, setGame] = useState<GameType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intl = useIntl();

    useEffect(() => {
        async function fetchGame() {
            try {
                const client = generateClient();
                const response = await client.graphql({
                    query: getGameQuery,
                    variables: {
                        id: id
                    }
                }) as { data: { getGame: GameType } };

                setGame(response.data.getGame);
            } catch (err) {
                setError(intl.formatMessage({ id: 'errorFetchingGameData'}));
            }
        }

        fetchGame();
    }, [id]);

    if (error) {
        return <div><FormattedMessage id="error" />: {error}</div>;
    }

    if (!game) {
        return <div><FormattedMessage id="loadingGameData" /></div>;
    }

    return (
        <div>
            <h1><FormattedMessage id="gameTitle" />: {game.gameName}</h1>
            <pre style={{
                backgroundColor: '#f4f4f4',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
            }}>
                {JSON.stringify(game, null, 2)}
            </pre>
        </div>
    );
};

const Game: React.FC<GameProps> = (props) => (
    <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
        <GameContent {...props} />
    </IntlProvider>
);

export default Game;
```

### Current CSS

Here is the CSS that already exists, for re-use or maintaining consistency:

```css
.hidden {
    display: none;
}

.gameslist {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f2f2f2;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0 0 0 0.1);
}

.allgames {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}

.joingame,
.newgame {
    width: 48%;
    background-color: #fff;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0 0 0 0.1);
}

h1 {
    font-size: 24px;
    margin-bottom: 10px;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

li:last-child {
    border-bottom: none;
}

form {
    display: flex;
    flex-direction: column;
}

label {
    font-weight: bold;
    margin-bottom: 5px;
}

input,
textarea {
    padding: 5px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

button {
    padding: 10px;
    background-color: #4CAF50;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}

.error-container {
    background-color: #ffebee;
    border: 1px solid #f44336;
    border-radius: 3px;
    padding: 10px;
    margin-top: 10px;
}

.error-container.hidden {
    display: none;
}

.error-message {
    color: #f44336;
    margin-bottom: 10px;
}

.error-container button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
}

.error-container button:hover {
    background-color: #d32f2f;
}

.game-link {
    text-decoration: none;
    color: inherit;
    display: block;
    width: 100%;
    height: 100%;
    padding: 10px;
    transition: background-color 0.2s ease;
}

.game-link:hover {
    background-color: #f0f0f0;
}
```

### GraphQL Types

```typescript
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
  joinGame: Game;
};


export type MutationCreateGameArgs = {
  input: CreateGameInput;
};


export type MutationJoinGameArgs = {
  input: JoinGameInput;
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
  content: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  gameId: Scalars['ID']['output'];
  sectionName: Scalars['String']['output'];
  sectionType: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};
```

## Your Task

Please write the code described above.
