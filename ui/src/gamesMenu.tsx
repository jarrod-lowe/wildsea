import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { createGameMutation, getGamesQuery } from "../../appsync/schema";
import { PlayerSheetSummary, CreateGameInput, Game } from "../../appsync/graphql";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { messages } from './translations';
import { TopBar } from "./frame";


export const GamesMenuContent: React.FC<{ userEmail: string}> = ({ userEmail }) => {
    const client = generateClient();
    const [games, setGames] = useState<PlayerSheetSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gameName, setGameName] = useState('');
    const [gameDescription, setGameDescription] = useState('');
    const intl = useIntl();

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const response = await client.graphql({
                query: getGamesQuery,
            }) as GraphQLResult<{ getGames: PlayerSheetSummary[] }>;
            setGames(response.data.getGames);
        } catch (error) {
            setError(intl.formatMessage({ id: 'errorFetchingGames' }) + JSON.stringify(error));
        }
    };

    const handleCreateGame = async (event: React.FormEvent) => {
        event.preventDefault();

        const createGameInput: CreateGameInput = {
            name: gameName,
            description: gameDescription,
        };

        try {
            const result = await client.graphql({
                query: createGameMutation,
                variables: {input: createGameInput},
            }) as GraphQLResult<{ createGame: Game }>;

            const newGame = result.data.createGame;
            const gameId = newGame.gameId;

            if (gameId) {
                window.location.href = `${window.location.origin}/?gameId=${gameId}`;
            }
        } catch (error) {
            setError('Error creating game: ' + JSON.stringify(error));
        }
    };

    return (
        <div className="gameslist">
            <TopBar title={intl.formatMessage({ id: 'wildsea' })} userEmail={ userEmail } />
            <div className="allgames">
                <div className="joingame">
                    <h1><FormattedMessage id="availableGames" /></h1>
                    <ul>
                        {games?.map((game) => (
                            <li key={game.gameId}>
                                <a href={`/?gameId=${game.gameId}`} aria-label={intl.formatMessage({ id: "playGame"}) + game.gameName}>
                                    {game.gameName} - {game.gameDescription}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="newgame">
                    <h1>Create New Game</h1>
                    <form onSubmit={handleCreateGame} aria-label="Create New Game">
                        <label htmlFor="gameName">Game Name:</label>
                        <input 
                            type="text" 
                            id="gameName" 
                            name="gameName" 
                            required 
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                        />
                        <label htmlFor="gameDescription">Game Description:</label>
                        <textarea 
                            id="gameDescription" 
                            name="gameDescription" 
                            required
                            value={gameDescription}
                            onChange={(e) => setGameDescription(e.target.value)}
                        ></textarea>
                        <button type="submit">Create Game</button>
                    </form>
                    {error && (
                        <div role="alert" className="error-container">
                            <p className="error-message">{error}</p>
                            <button onClick={() => setError(null)} aria-label="Dismiss error message">
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GamesMenu: React.FC<{ userEmail: string }> = (props) => (
    <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
        <GamesMenuContent {...props} />
    </IntlProvider>
);

export default GamesMenu;
