import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GamesMenu } from '../src/gamesMenu';
import { generateClient } from "aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { PlayerSheetSummary } from "../../appsync/graphql";
import { fetchAuthSession } from 'aws-amplify/auth';

jest.mock("aws-amplify/api", () => ({
  generateClient: jest.fn(),
}));

jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

jest.mock("../src/gamesMenu", () => {
  const originalModule = jest.requireActual("../src/gamesMenu");
  return {
    ...originalModule,
    client: {
      graphql: jest.fn(),
    },
  };
})

describe('GamesMenu', () => {
  let mockGraphql: jest.Mock;

  beforeEach(() => {
    mockGraphql = jest.fn();
    (generateClient as jest.Mock).mockReturnValue({ graphql: mockGraphql });
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: { accessToken: { payload: { "cognito:groups": ["CreateGame"] } } } });
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<GamesMenu userEmail="email"/>);
    });
    expect(screen.getByText('Available Games')).toBeInTheDocument();
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
  });

  it('fetches and displays games', async () => {
    const mockGames: PlayerSheetSummary[] = [
      { 
        gameId: '1', 
        gameName: 'Test Game 1', 
        gameDescription: 'Description 1',
        characterName: "char1",
        userId: "user1",
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        type: 'GAME'
      },
      { 
        gameId: '2', 
        gameName: 'Test Game 2', 
        gameDescription: 'Description 2',
        characterName: "char1",
        userId: "user1",
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        type: 'GAME'
      },
    ];

    mockGraphql.mockResolvedValueOnce({ data: { getGames: mockGames } } as GraphQLResult<{ getGames: PlayerSheetSummary[] }>);

    await act(async () => {
      render(<GamesMenu userEmail="email"/>);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
        expect(screen.getByText(/Test Game 2/)).toBeInTheDocument();
      });
    });
  });

  it('displays error message when fetching games fails', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('Fetch error'));

    await act(async () => {
      render(<GamesMenu userEmail="email"/>);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Error fetching games:/)).toBeInTheDocument();
      });
    });
  });

  it('displays error message when creating game fails', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('Create error'));

    await act(async () => {
      render(<GamesMenu userEmail="email"/>);
    });

    fireEvent.change(screen.getByLabelText('Game Name:'), { target: { value: 'New Game' } });
    fireEvent.change(screen.getByLabelText('Game Description:'), { target: { value: 'New Description' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Create Game'));
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Error creating game:/)).toBeInTheDocument();
      });
    });
  });

  it('allows dismissing error messages', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('Fetch error'));

    await act(async () => {
      render(<GamesMenu userEmail="email"/>);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Error fetching games:/)).toBeInTheDocument();
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Dismiss'));
    });

    expect(screen.queryByText(/Error fetching games:/)).not.toBeInTheDocument();
  });
});
