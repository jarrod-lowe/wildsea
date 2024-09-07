import { generateClient } from "aws-amplify/api";
import { Game } from "../../appsync/graphql";
import { getGameQuery } from "../../appsync/schema";

export async function play(id: string) {
    const gameData = await fetchGame(id);

    // Debug
    const formattedJSON = JSON.stringify(gameData, null, 2);

    // Create a pre element to preserve formatting
    const preElement = document.createElement('pre');
    
    // Set the text content of the pre element
    preElement.textContent = formattedJSON;

    // Add some basic styling
    preElement.style.backgroundColor = '#f4f4f4';
    preElement.style.padding = '10px';
    preElement.style.border = '1px solid #ddd';
    preElement.style.borderRadius = '4px';
    preElement.style.whiteSpace = 'pre-wrap';

    // Append the pre element to the body (or any other container element)
    document.body.appendChild(preElement);
}

export async function fetchGame(id: string): Promise<Game> {
    const client = generateClient();
    const response = await client.graphql({
        query: getGameQuery,
        variables: {
            id: id
        }
    }) as { data: { getGame: Game } };

    return response.data.getGame;
}
