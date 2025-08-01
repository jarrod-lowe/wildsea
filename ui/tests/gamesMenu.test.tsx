import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { GamesMenu } from '../src/gamesMenu';
import { generateClient } from "aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { PlayerSheetSummary } from "../../appsync/graphql";
import { fetchAuthSession } from 'aws-amplify/auth';
import { messages } from '../src/translations';

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

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
      {component}
    </IntlProvider>
  );
};

describe('GamesMenu', () => {
  let mockGraphql: jest.Mock;

  beforeEach(() => {
    mockGraphql = jest.fn();
    (generateClient as jest.Mock).mockReturnValue({ graphql: mockGraphql });
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: { accessToken: { payload: { "cognito:groups": ["CreateGame"] } } } });
  });

  it('renders without crashing', async () => {
    // Mock both GraphQL calls
    mockGraphql
      .mockResolvedValueOnce({ data: { getGames: [] } })
      .mockResolvedValueOnce({ data: { getGameTypes: [] } });

    await act(async () => {
      renderWithIntl(<GamesMenu userEmail="email"/>);
    });
    expect(screen.getByText('Available Games')).toBeInTheDocument();
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
  });

  it('fetches and displays games', async () => {
    const mockGames: PlayerSheetSummary[] = [
      { 
        gameId: '1', 
        gameName: 'Test Game 1', 
        gameType: 'wildsea',
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
        gameType: 'deltaGreen',
        gameDescription: 'Description 2',
        characterName: "char1",
        userId: "user1",
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        type: 'GAME'
      },
    ];

    mockGraphql
      .mockResolvedValueOnce({ data: { getGames: mockGames } } as GraphQLResult<{ getGames: PlayerSheetSummary[] }>)
      .mockResolvedValueOnce({ data: { getGameTypes: [] } });

    await act(async () => {
      renderWithIntl(<GamesMenu userEmail="email"/>);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
        expect(screen.getByText(/Test Game 2/)).toBeInTheDocument();
      });
    });
  });

  it('displays error message when fetching games fails', async () => {
    // Mock failed getGames call (first) and successful getGameTypes call (second)
    mockGraphql
      .mockRejectedValueOnce(new Error('Fetch error')) // First call (getGames) fails
      .mockResolvedValueOnce({ data: { getGameTypes: [] } }); // Second call (getGameTypes) succeeds

    await act(async () => {
      renderWithIntl(<GamesMenu userEmail="email"/>);
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Error fetching games:/)).toBeInTheDocument();
      });
    });
  });

  it('displays error message when creating game fails', async () => {
    // Mock successful getGames and getGameTypes calls, then failed createGame call
    mockGraphql
      .mockResolvedValueOnce({ data: { getGames: [] } })
      .mockResolvedValueOnce({ data: { getGameTypes: [{ gameType: 'wildsea', displayName: 'Wildsea', language: 'en' }] } })
      .mockRejectedValueOnce(new Error('Create error'));

    await act(async () => {
      renderWithIntl(<GamesMenu userEmail="email"/>);
    });

    fireEvent.change(screen.getByLabelText('Game Name:'), { target: { value: 'New Game' } });
    fireEvent.change(screen.getByLabelText('Game Description:'), { target: { value: 'New Description' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('🆕 Create Game'));
    });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText(/Error creating game:/)).toBeInTheDocument();
      });
    });
  });

  it('allows dismissing error messages', async () => {
    // Mock failed getGames call (first) and successful getGameTypes call (second)
    mockGraphql
      .mockRejectedValueOnce(new Error('Fetch error'))
      .mockResolvedValueOnce({ data: { getGameTypes: [] } });

    await act(async () => {
      renderWithIntl(<GamesMenu userEmail="email"/>);
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
