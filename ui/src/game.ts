import { generateClient } from "aws-amplify/api";
import { createGameMutation, getGamesQuery } from "../../appsync/schema";
import { GameSummary, CreateGameInput, Game } from "../../appsync/graphql";
import { GraphQLResult } from "@aws-amplify/api-graphql";

export async function fetchGames(): Promise<GameSummary[]> {
    const client = generateClient();
    const response = await client.graphql({
        query: getGamesQuery.replace(/\(\)/g, ''),
    }) as GraphQLResult<{ getGames: GameSummary[] }>;

    return response.data.getGames;
}

export function createGameElement(game: GameSummary): HTMLLIElement {
    const li = document.createElement('li');
    li.textContent = `${game.gameName} - ${game.gameDescription}`;
    return li;
}

export function createGamesList(games: GameSummary[]): HTMLUListElement {
    const ul = document.createElement('ul');
    for (const game of games) {
        const li = createGameElement(game);
        ul.appendChild(li);
    }
    return ul;
}

export function createNewGameForm(): HTMLFormElement {
    const form = document.createElement('form');

    const gameNameLabel = document.createElement('label');
    gameNameLabel.setAttribute('for', 'gameName');
    gameNameLabel.textContent = 'Game Name:';

    const gameNameInput = document.createElement('input');
    gameNameInput.setAttribute('type', 'text');
    gameNameInput.setAttribute('id', 'gameName');
    gameNameInput.setAttribute('name', 'gameName');
    gameNameInput.required = true;

    const gameDescriptionLabel = document.createElement('label');
    gameDescriptionLabel.setAttribute('for', 'gameDescription');
    gameDescriptionLabel.textContent = 'Game Description:';

    const gameDescriptionTextarea = document.createElement('textarea');
    gameDescriptionTextarea.setAttribute('id', 'gameDescription');
    gameDescriptionTextarea.setAttribute('name', 'gameDescription');
    gameDescriptionTextarea.required = true;

    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Create Game';

    form.addEventListener('submit', handleCreateGame);
    form.appendChild(gameNameLabel);
    form.appendChild(gameNameInput);
    form.appendChild(gameDescriptionLabel);
    form.appendChild(gameDescriptionTextarea);
    form.appendChild(submitButton);

    return form;
}

export async function doCreateGame(data: CreateGameInput): Promise<String> {
    try {
        const client = generateClient();
        const result = await client.graphql({
            query: createGameMutation,
            variables: {input: data},
        }) as GraphQLResult<{ createGame: Game }>;

        const newGame = result.data.createGame;
        const gameId = newGame.gameId;

        return gameId;
    } catch (error) {
        console.error('Error creating game:', error);
        // Handle error
        return "";
    }

}

export async function handleCreateGame(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const gameName = formData.get('gameName') as string;
    const gameDescription = formData.get('gameDescription') as string;

    const createGameInput: CreateGameInput = {
        name: gameName,
        description: gameDescription,
    };

    const gameId = await doCreateGame(createGameInput);
    // Redirect to the new game page
    window.location.href = `${window.location.origin}/?gameId=${gameId}`;
}

export async function gamesScreen(): Promise<void> {
    const games = await fetchGames();

    const gamesList = document.getElementById('gameslist');
    if (gamesList) {
        const all = document.createElement('div');
        all.className = 'allgames';

        const join = document.createElement('div');
        join.className = 'joingame';
        all.appendChild(join);

        const h1 = document.createElement('h1');
        h1.innerText = 'Available Games';
        join.appendChild(h1);

        const ul = createGamesList(games);
        join.appendChild(ul);

        const newGame = document.createElement('div');
        newGame.className = 'newgame';

        const h1b = document.createElement('h1');
        h1b.innerText = 'Create New Game';
        newGame.appendChild(h1b);

        const form = createNewGameForm();
        newGame.appendChild(form);

        all.appendChild(newGame);

        gamesList.innerHTML = '';
        gamesList.appendChild(all);
        gamesList.className = 'gameslist';
    }
}
