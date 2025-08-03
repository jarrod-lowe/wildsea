import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { createGameMutation, getGamesQuery, getGameTypesQuery } from "../../appsync/schema";
import { PlayerSheetSummary, CreateGameInput, Game, GameTypeMetadata, GamesWithQuota } from "../../appsync/graphql";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FormattedMessage, useIntl } from 'react-intl';
import { type SupportedLanguage } from './translations';
import { TopBar } from "./frame";
import ReactMarkdown from 'react-markdown';
import { SectionItemDescription } from './components/SectionItem';
import { resolveLanguage } from './translations';
import { fetchAuthSession } from 'aws-amplify/auth';

export const GamesMenuContent: React.FC<{ 
    userEmail: string;
    currentLanguage?: SupportedLanguage;
    onLanguageChange?: (language: SupportedLanguage) => void;
}> = ({ userEmail, currentLanguage, onLanguageChange }) => {
    const actualLanguage = resolveLanguage(currentLanguage);
    const client = generateClient();
    const [games, setGames] = useState<PlayerSheetSummary[]>([]);
    const [gameTypes, setGameTypes] = useState<GameTypeMetadata[]>([]);
    const [remainingGames, setRemainingGames] = useState<number>(10);
    const [totalQuota, setTotalQuota] = useState<number>(10);
    const [error, setError] = useState<string | null>(null);
    const [gameName, setGameName] = useState('');
    const [gameDescription, setGameDescription] = useState('');
    const [canCreateGame, setCanCreateGame] = useState(false);
    const [gameType, setGameType] = useState('');
    const intl = useIntl();

    useEffect(() => {
        fetchGames();
        fetchGameTypes();
        checkCreateGamePermission();
    }, [currentLanguage]);

    const fetchGames = async () => {
        try {
            const response = await client.graphql({
                query: getGamesQuery,
            }) as GraphQLResult<{ getGames: GamesWithQuota }>;
            setGames(response.data.getGames.games);
            setRemainingGames(response.data.getGames.remainingGames);
            setTotalQuota(response.data.getGames.totalQuota);
        } catch (error) {
            setError(intl.formatMessage({ id: 'errorFetchingGames' }) + JSON.stringify(error));
        }
    };

    const fetchGameTypes = async () => {
        try {
            const response = await client.graphql({
                query: getGameTypesQuery,
                variables: {
                    input: {
                        language: actualLanguage || 'en'
                    }
                }
            }) as GraphQLResult<{ getGameTypes: GameTypeMetadata[] }>;
            const fetchedGameTypes = response.data.getGameTypes;
            setGameTypes(fetchedGameTypes);
            
            // Set default game type to first available if not already set
            if (fetchedGameTypes.length > 0 && !gameType) {
                setGameType(fetchedGameTypes[0].gameType);
            }
        } catch (error) {
            setError(intl.formatMessage({ id: 'errorFetchingGameTypes' }) + JSON.stringify(error));
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
            language: currentLanguage || 'en',
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
        const gameTypeRecord = gameTypes.find(gt => gt.gameType === gameType);
        if (gameTypeRecord) {
            return intl.formatMessage({ id: `gameType.${gameType}.name` }, { defaultMessage: gameTypeRecord.displayName });
        }
        return intl.formatMessage({ id: 'gameType.unknown.name' }, { defaultMessage: gameType }); 
    }

    return (
        <div className="gameslist">
            <TopBar 
                title={intl.formatMessage({ id: 'wildsea' })} 
                userEmail={userEmail} 
                gameDescription="" 
                isFirefly={false}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />
            <div className="allgames">
                <section className="joingame" role="region" aria-labelledby="available-games-heading">
                    <h2 id="available-games-heading"><FormattedMessage id="availableGames" /></h2>
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
                                        aria-label={intl.formatMessage(
                                            { id: "game.playLink" }, 
                                            { 
                                                gameName: game.gameName,
                                                gameType: getGameTypeName(game.gameType),
                                                characterName: game.characterName 
                                            }
                                        )}
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
                    <h2 id="create-game-heading"><FormattedMessage id="createNewGame" /></h2>
                    <p className="game-quota">
                        <FormattedMessage 
                            id="gameQuota.remaining" 
                            values={{ current: totalQuota - remainingGames, totalQuota: totalQuota }} 
                        />
                        {remainingGames <= 2 && remainingGames > 0 && (
                            <span className="quota-warning">
                                {" "}
                                <FormattedMessage 
                                    id="gameQuota.warning" 
                                    values={{ remaining: remainingGames }} 
                                />
                            </span>
                        )}
                    </p>
                    {canCreateGame ? (
                        <form 
                            onSubmit={handleCreateGame} 
                            aria-labelledby="create-game-heading"
                            role="form"
                        >
                            <div role="group">
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
                                    >
                                        {gameTypes.map(gameTypeOption => (
                                            <option key={gameTypeOption.gameType} value={gameTypeOption.gameType}>
                                                {intl.formatMessage({ id: `gameType.${gameTypeOption.gameType}.name` }, { defaultMessage: gameTypeOption.displayName })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-field">
                                    <label htmlFor="game-description"><FormattedMessage id="gameDescription" /></label>
                                    <SectionItemDescription 
                                        id="game-description"
                                        value={gameDescription}
                                        onChange={(d) => setGameDescription(d)}
                                        placeholder={intl.formatMessage({ id: "editGameModal.descriptionPlaceholder" })}
                                    />
                                </div>
                                
                                <div className="form-field">
                                    <button 
                                        type="submit"
                                        className="btn-standard"
                                        disabled={remainingGames <= 0}
                                    >
                                        <FormattedMessage id="createGame" />
                                    </button>
                                    {remainingGames <= 0 && (
                                        <p className="quota-exceeded-message" role="alert">
                                            <FormattedMessage 
                                                id="gameQuota.exceeded" 
                                                values={{ totalQuota: totalQuota }} 
                                            />
                                        </p>
                                    )}
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
                            <button onClick={() => setError(null)} className="btn-danger btn-small" aria-label={intl.formatMessage({ id: 'dismissErrorMessage' })}>
                                <FormattedMessage id="dismiss" />
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export const GamesMenu: React.FC<{ 
    userEmail: string;
    currentLanguage?: SupportedLanguage;
    onLanguageChange?: (language: SupportedLanguage) => void;
}> = (props) => (
    <GamesMenuContent {...props} />
);

export default GamesMenu;
