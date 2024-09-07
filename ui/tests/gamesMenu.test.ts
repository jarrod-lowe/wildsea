/**
 * @jest-environment jsdom
 */

import { createGameElement, createGamesList, createNewGameForm } from "../src/gamesMenu";
import { PlayerSheetSummary } from '../../appsync/graphql';

describe('createGameElement', () => {
  it('should create a game element correctly', () => {
    const game: PlayerSheetSummary = {
      __typename: 'PlayerSheetSummary',
      gameName: 'Test Game',
      gameDescription: 'Test Description',
      gameId: '1',
      type: 'Test Type',
      createdAt: '2023-05-01T00:00:00.000Z',
      updatedAt: '2023-05-01T00:00:00.000Z',
    };

    const li = createGameElement(game);
    expect(li.textContent).toBe(`${game.gameName} - ${game.gameDescription}`);
  });
});

describe('createGamesList', () => {
  it('should create a games list correctly', () => {
    const games: PlayerSheetSummary[] = [
      {
        __typename: 'PlayerSheetSummary',
        gameName: 'Game 1',
        gameDescription: 'Description 1',
        gameId: '1',
        type: 'Type 1',
        createdAt: '2023-05-01T00:00:00.000Z',
        updatedAt: '2023-05-01T00:00:00.000Z',
      },
      {
        __typename: 'PlayerSheetSummary',
        gameName: 'Game 2',
        gameDescription: 'Description 2',
        gameId: '2',
        type: 'Type 2',
        createdAt: '2023-05-01T00:00:00.000Z',
        updatedAt: '2023-05-01T00:00:00.000Z',
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
    expect(form.querySelectorAll('input, textarea, button').length).toBe(4);
  });
});
