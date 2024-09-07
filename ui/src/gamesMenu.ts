import { generateClient } from "aws-amplify/api";
import { createGameMutation, getGamesQuery } from "../../appsync/schema";
import { PlayerSheetSummary, CreateGameInput, Game } from "../../appsync/graphql";
import { GraphQLResult } from "@aws-amplify/api-graphql";

export async function fetchGames(): Promise<PlayerSheetSummary[]> {
    const client = generateClient();
    const response = await client.graphql({
        query: getGamesQuery,
    }) as GraphQLResult<{ getGames: PlayerSheetSummary[] }>;

    return response.data.getGames;
}

export function createGameElement(game: PlayerSheetSummary): HTMLLIElement {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/?gameId=${game.gameId}`;
    link.textContent = `${game.gameName} - ${game.gameDescription}`;
    link.setAttribute('aria-label', `Play game: ${game.gameName}`);
    li.appendChild(link);
    return li;
}

export function createGamesList(games: PlayerSheetSummary[]): HTMLUListElement {
    const ul = document.createElement('ul');
    for (const game of games) {
        const li = createGameElement(game);
        ul.appendChild(li);
    }
    return ul;
}

export function createNewGameForm(): HTMLFormElement {
   const form = document.createElement('form');
    form.setAttribute('aria-label', 'Create New Game');

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

    const errorContainer = document.createElement('div');
    errorContainer.setAttribute('role', 'alert');
    errorContainer.classList.add('error-container', 'hidden');
    errorContainer.id = 'error';

    const errorMessage = document.createElement('p');
    errorMessage.classList.add('error-message');
    errorMessage.id = 'error-message';

    const dismissButton = document.createElement('button');
    dismissButton.textContent = 'Dismiss';
    dismissButton.setAttribute('aria-label', 'Dismiss error message');
    dismissButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent any default action
        errorContainer.classList.add('hidden');
    });

    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(dismissButton);

    form.addEventListener('submit', handleCreateGame);
    form.appendChild(gameNameLabel);
    form.appendChild(gameNameInput);
    form.appendChild(gameDescriptionLabel);
    form.appendChild(gameDescriptionTextarea);
    form.appendChild(submitButton);
    form.appendChild(errorContainer);

    return form;
}

export async function doCreateGame(data: CreateGameInput): Promise<string | undefined> {
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
        const msg = 'Error creating game: ' + JSON.stringify(error);
        logError(msg);
        return "";
    }
}

function logError(msg: string) {
    console.log(msg);
    const errorElement = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    if (errorElement != null && errorMessage != null) {
        errorMessage.textContent = msg;
        errorElement.classList.remove('hidden');
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
    if (gameId) {
        // Redirect to the new game page
        console.log(gameId);
        window.location.href = `${window.location.origin}/?gameId=${gameId}`;
    }
}

export async function gamesMenuScreen(): Promise<void> {
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
