import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game as GameType } from "../../appsync/graphql";
import { getGameQuery } from "../../appsync/schema";

interface GameProps {
    id: string;
}

const Game: React.FC<GameProps> = ({ id }) => {
    const [game, setGame] = useState<GameType | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                setError('Error fetching game data');
                console.error(err);
            }
        }

        fetchGame();
    }, [id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!game) {
        return <div>Loading game data...</div>;
    }

    return (
        <div>
            <h1>Game: {game.gameName}</h1>
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

export default Game;
