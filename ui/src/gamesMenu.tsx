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
                <section className="joingame" role="region" aria-labelledby="available-games-heading">
                    <h1 id="available-games-heading"><FormattedMessage id="availableGames" /></h1>
                    {games?.length === 0 ? (
                        <p role="status" aria-live="polite">
                            <FormattedMessage id="noGamesAvailable" />
                        </p>
                    ) : (
                        <ul role="list" aria-label={intl.formatMessage({ id: "availableGames" })}>
                            {games?.map((game) => (
                                <li key={game.gameId} className="game-card" role="listitem">
                                    <a 
                                        href={`/?gameId=${game.gameId}`} 
                                        className="game-link" 
                                        aria-describedby={`game-${game.gameId}-description`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                window.location.href = `/?gameId=${game.gameId}`;
                                            }
                                        }}
                                    >
                                        <h3>{game.gameName}</h3>
                                        <h4>{getGameTypeName(game.gameType)}</h4>
                                        <span aria-label={intl.formatMessage({ id: "characterName" })}>{game.characterName}</span>
                                        <div 
                                            id={`game-${game.gameId}-description`}
                                            className="game-description"
                                            aria-label={intl.formatMessage({ id: "gameDescription" })}
                                        >
                                            <ReactMarkdown>{game.gameDescription}</ReactMarkdown>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="newgame" role="region" aria-labelledby="create-game-heading">
                    <h1 id="create-game-heading"><FormattedMessage id="createNewGame" /></h1>
                    {canCreateGame ? (
                        <form 
                            onSubmit={handleCreateGame} 
                            aria-labelledby="create-game-heading"
                            role="form"
                        >
                            <div role="group" aria-labelledby="game-details">
                                <div className="form-field">
                                    <label htmlFor="gameName"><FormattedMessage id="gameName" /></label>
                                    <input 
                                        type="text" 
                                        id="gameName" 
                                        name="gameName" 
                                        required 
                                        value={gameName}
                                        onChange={(e) => setGameName(e.target.value)}
                                        placeholder={intl.formatMessage({ id: "editGameModal.namePlaceholder" })}
                                        aria-describedby="game-name-help"
                                    />
                                </div>
                                
                                <div className="form-field">
                                    <label htmlFor="gameType"><FormattedMessage id="gameType" /></label>
                                    <select
                                        id="gameType"
                                        name="gameType"
                                        value={gameType}
                                        onChange={(e) => setGameType(e.target.value)}
                                        required
                                        aria-describedby="game-type-help"
                                    >
                                        {GameTypes.filter(gt => gt.enabled).map(gameType => (
                                            <option key={gameType.id} value={gameType.id}>
                                                {intl.formatMessage({ id: gameType.name })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-field">
                                    <label htmlFor="gameDescription"><FormattedMessage id="gameDescription" /></label>
                                    <SectionItemDescription 
                                        id="gameDescription"
                                        value={gameDescription}
                                        onChange={(d) => setGameDescription(d)}
                                        placeholder={intl.formatMessage({ id: "editGameModal.descriptionPlaceholder" })}
                                        aria-describedby="game-description-help"
                                    />
                                </div>
                                
                                <div className="form-field">
                                    <button 
                                        type="submit"
                                        aria-describedby="create-game-help"
                                    >
                                        <FormattedMessage id="createGame" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <p role="alert" aria-live="polite">
                            <FormattedMessage id="createGamePermissionDenied" />
                        </p>
                    )}
                    {error && (
                        <div role="alert" className="error-container">
                            <p className="error-message">{error}</p>
                            <button onClick={() => setError(null)} aria-label="Dismiss error message">
                                Dismiss
                            </button>
                        </div>
                    )}
                </section>
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
