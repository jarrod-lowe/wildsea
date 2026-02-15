import React from 'react';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { messagesEnglish } from './translations.en';
import { ToastProvider } from './notificationToast';
import { Game, PlayerSheet } from '../../appsync/graphql';
import { CharacterDeathProvider, useCharacterDeath } from './contexts/CharacterDeathContext';

// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn()
  }))
}));

jest.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: jest.fn(() => Promise.resolve({ sub: 'user-1', email: 'test@test.com' }))
}));

// Mock react-modal
jest.mock('react-modal', () => {
  const MockModal = ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null);
  MockModal.setAppElement = jest.fn();
  return MockModal;
});

// Mock PlayerSheetTab since we're just testing the tab rendering
jest.mock('./playerSheetTab', () => ({
  PlayerSheetTab: () => <div>Mock PlayerSheetTab</div>
}));

// Mock other components
jest.mock('./frame', () => ({
  TopBar: () => <div>Mock TopBar</div>
}));

jest.mock('./editGame', () => ({
  EditGameModal: () => <div>Mock EditGameModal</div>
}));

jest.mock('./joinCodeModal', () => ({
  JoinCodeModal: () => <div>Mock JoinCodeModal</div>
}));

jest.mock('./diceRollPanel', () => ({
  DiceRollPanel: () => <div>Mock DiceRollPanel</div>
}));

jest.mock('./themeLoader', () => ({
  loadTheme: jest.fn()
}));

// We need to test the tab rendering in isolation
// Since GameContent does a lot of async fetching, we'll create a simpler wrapper for testing
// This mirrors the production code structure to verify the death state rendering
const TabBar: React.FC<{ sheets: PlayerSheet[], activeSheet: string }> = ({ sheets, activeSheet }) => {
  const { isCharacterDead } = useCharacterDeath();

  return (
    <div className="tab-bar">
      {sheets.map((sheet) => (
        <button
          key={sheet.userId}
          className={activeSheet === sheet.userId ? 'active' : ''}
        >
          <span className={isCharacterDead(sheet.userId) ? 'deceased-character-name' : ''}>
            {sheet.characterName}
          </span>
        </button>
      ))}
    </div>
  );
};

describe('GameContent - Death State', () => {
  const mockSheet: PlayerSheet = {
    gameId: 'game-1',
    userId: 'user-1',
    characterName: 'Agent Smith',
    sections: [],
    entityType: 'PLAYER',
    createdAt: '2024-01-01T00:00:00Z'
  } as PlayerSheet;

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

  it('applies strikethrough to deceased character tab', () => {
    // Create a test component that sets death state before rendering tabs
    const TestComponent = () => {
      const { setCharacterDead } = useCharacterDeath();

      // Set character as dead (run only once on mount)
      React.useEffect(() => {
        setCharacterDead('user-1', true);
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      return <TabBar sheets={[mockSheet]} activeSheet="user-1" />;
    };

    const { container } = renderWithProviders(<TestComponent />);

    const deceasedName = container.querySelector('.deceased-character-name');
    expect(deceasedName).toBeInTheDocument();
    expect(deceasedName?.textContent).toBe('Agent Smith');
  });

  it('does not apply strikethrough to living character tab', () => {
    // Character is alive by default (no setCharacterDead call)
    const { container } = renderWithProviders(
      <TabBar sheets={[mockSheet]} activeSheet="user-1" />
    );

    const deceasedName = container.querySelector('.deceased-character-name');
    expect(deceasedName).not.toBeInTheDocument();
  });
});
