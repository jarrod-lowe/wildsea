import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { createGameMutation, getGamesQuery } from "../../appsync/schema";
import { PlayerSheetSummary, CreateGameInput, Game } from "../../appsync/graphql";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { messages } from './translations';
import { TopBar } from "./frame";
import ReactMarkdown from 'react-markdown';
import { SectionItemDescription } from './components/SectionItem';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GameTypes, DefaultNewGameType } from "../../graphql/lib/constants/gameTypes";

export const GamesMenuContent: React.FC<{ userEmail: string}> = ({ userEmail }) => {
    const client = generateClient();
    const [games, setGames] = useState<PlayerSheetSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gameName, setGameName] = useState('');
    const [gameDescription, setGameDescription] = useState('');
    const [canCreateGame, setCanCreateGame] = useState(false);
    const [gameType, setGameType] = useState(DefaultNewGameType);
    const intl = useIntl();

    useEffect(() => {
        fetchGames();
        checkCreateGamePermission();
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

    const checkCreateGamePermission = async () => {
        try {
            const authSession = await fetchAuthSession();
            const userGroups = authSession?.tokens?.accessToken.payload["cognito:groups"] as string[] | undefined;
            setCanCreateGame(userGroups?.includes('CreateGame') || false);
        } catch (error) {
            console.error("Error checking user permissions:", error);
            setError(intl.formatMessage({ id: 'errorCheckingPermissions' }));
        }
    };

    const handleCreateGame = async (event: React.FormEvent) => {
        event.preventDefault();

        const createGameInput: CreateGameInput = {
            name: gameName,
            gameType: gameType,
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

    const getGameTypeName = (gameType: string): string => {
        const gameTypeRecord = GameTypes.find(gt => gt.id === gameType);
        return intl.formatMessage({ id: gameTypeRecord?.name || 'gameType.unknown.name' }); 
    }

    return (
        <div className="gameslist">
            <TopBar title={intl.formatMessage({ id: 'wildsea' })} userEmail={ userEmail } gameDescription="" isFirefly={false}/>
            <div className="allgames">
                <div className="joingame">
                    <h1><FormattedMessage id="availableGames" /></h1>
                    <ul>
                        {games?.map((game) => (
                            <li key={game.gameId} className="game-panel">
                                <a href={`/?gameId=${game.gameId}`} className="game-link" aria-label={intl.formatMessage({ id: "playGame"}) + game.gameName}>
                                    <h3>{game.gameName}</h3>
                                    <h4>{getGameTypeName(game.gameType)}</h4>
                                    <span>{game.characterName}</span>
                                    <ReactMarkdown>{game.gameDescription}</ReactMarkdown>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="newgame">
                    <h1><FormattedMessage id="createNewGame" /></h1>
                    {canCreateGame ? (
                        <form onSubmit={handleCreateGame} aria-label={intl.formatMessage({ id: "createNewGame" })}>
                            <label htmlFor="gameName"><FormattedMessage id="gameName" /></label>
                            <input 
                                type="text" 
                                id="gameName" 
                                name="gameName" 
                                required 
                                value={gameName}
                                onChange={(e) => setGameName(e.target.value)}
                                placeholder={intl.formatMessage({ id: "editGameModal.namePlaceholder" })}
                            />
                            <label htmlFor="gameType"><FormattedMessage id="gameType" /></label>
                            <select
                                id="gameType"
                                name="gameType"
                                value={gameType}
                                onChange={(e) => setGameType(e.target.value)}
                                required
                                >
                                    {GameTypes.filter(gt => gt.enabled).map(gameType => (
                                        <option key={gameType.id} value={gameType.id}>
                                            {intl.formatMessage({ id: gameType.name })}
                                        </option>
                                    ))}
                                </select>
                            <label htmlFor="gameDescription">Game Description:</label>
                            <SectionItemDescription 
                                id="gameDescription"
                                value={gameDescription}
                                onChange={(d) => setGameDescription(d)}
                                placeholder={intl.formatMessage({ id: "editGameModal.descriptionPlaceholder" })}
                            />
                            <button type="submit"><FormattedMessage id="createGame" /></button>
                        </form>
                    ) : (
                        <p><FormattedMessage id="createGamePermissionDenied" /></p>
                    )}
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
