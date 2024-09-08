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
