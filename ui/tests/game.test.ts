import { createGameElement, createGamesList, createNewGameForm } from "../src/game";
import { GameSummary } from '../../appsync/graphql';

describe('createGameElement', () => {
  it('should create a game element correctly', () => {
    const game: GameSummary = {
      __typename: 'GameSummary',
      gameName: 'Test Game',
      gameDescription: 'Test Description',
      gameId: '1',
      type: 'Test Type',
    };

    const li = createGameElement(game);
    expect(li.textContent).toBe(`${game.gameName} - ${game.gameDescription}`);
  });
});

describe('createGamesList', () => {
  it('should create a games list correctly', () => {
    const games: GameSummary[] = [
      {
        __typename: 'GameSummary',
        gameName: 'Game 1',
        gameDescription: 'Description 1',
        gameId: '1',
        type: 'Type 1',
      },
      {
        __typename: 'GameSummary',
        gameName: 'Game 2',
        gameDescription: 'Description 2',
        gameId: '2',
        type: 'Type 2',
      },
    ];

    const ul = createGamesList(games);
    const liElements = ul.querySelectorAll('li');
    expect(liElements.length).toBe(games.length);
    liElements.forEach((li, index) => {
      expect(li.textContent).toBe(
        `${games[index].gameName} - ${games[index].gameDescription}`
      );
    });
  });
});

describe('createNewGameForm', () => {
  it('should create a new game form correctly', () => {
    const form = createNewGameForm();
    expect(form.tagName).toBe('FORM');
    expect(form.querySelectorAll('input, textarea, button').length).toBe(3);
  });
});
