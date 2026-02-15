import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlayerSheetTab } from './playerSheetTab';
import { IntlProvider } from 'react-intl';
import { messagesEnglish } from './translations.en';
import { ToastProvider } from './notificationToast';
import { PlayerSheet, Game } from '../../appsync/graphql';
import { CharacterDeathProvider, useCharacterDeath } from './contexts/CharacterDeathContext';

// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn()
  }))
}));

// Mock react-modal
jest.mock('react-modal', () => {
  const MockModal = ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null);
  MockModal.setAppElement = jest.fn();
  return MockModal;
});

describe('PlayerSheetTab - Death State', () => {
  const mockGame: Game = {
    gameId: 'game-1',
    gameName: 'Test Game',
    gameType: 'deltaGreen',
    owners: ['user-1'],
    theme: 'deltaGreen'
  } as Game;

  const mockSheet: PlayerSheet = {
    gameId: 'game-1',
    userId: 'user-1',
    characterName: 'Agent Smith',
    sections: [],
    entityType: 'PLAYER'
  } as PlayerSheet;

  const mockProps = {
    sheet: mockSheet,
    userSubject: 'user-1',
    game: mockGame,
    onUpdate: jest.fn(),
    currentLanguage: 'en' as const
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <IntlProvider locale="en" messages={messagesEnglish}>
        <ToastProvider>
          <CharacterDeathProvider>
            {component}
          </CharacterDeathProvider>
        </ToastProvider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies character-deceased class when character is dead', () => {
    // Create a test component that sets death state before rendering
    const TestComponent = () => {
      const { setCharacterDead } = useCharacterDeath();

      React.useEffect(() => {
        setCharacterDead('user-1', true);
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      return <PlayerSheetTab {...mockProps} />;
    };

    const { container } = renderWithProviders(<TestComponent />);

    const playerSheet = container.querySelector('.player-sheet');
    expect(playerSheet).toHaveClass('character-deceased');
  });

  it('shows death banner when character is dead', () => {
    // Create a test component that sets death state before rendering
    const TestComponent = () => {
      const { setCharacterDead } = useCharacterDeath();

      React.useEffect(() => {
        setCharacterDead('user-1', true);
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      return <PlayerSheetTab {...mockProps} />;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText(/AGENT TERMINATED/i)).toBeInTheDocument();
  });

  it('does not apply class when character is alive', () => {
    // Character is alive by default (no setCharacterDead call)
    const { container } = renderWithProviders(<PlayerSheetTab {...mockProps} />);

    const playerSheet = container.querySelector('.player-sheet');
    expect(playerSheet).not.toHaveClass('character-deceased');
  });
});
