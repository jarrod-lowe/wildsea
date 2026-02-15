import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { messagesEnglish } from '../translations.en';
import { SanityLossActions } from './SanityLossActions';
import { DiceRoll } from '../../../appsync/graphql';

// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: jest.fn(() => Promise.resolve({
      data: {
        rollDice: {
          value: 5,
          messageType: 'deltaGreen'
        }
      }
    }))
  })
}));

// Mock constants
jest.mock('../../../graphql/lib/constants/rollTypes', () => ({
  RollTypes: {
    SUM: 'SUM'
  }
}));

jest.mock('../../../appsync/schema', () => ({
  rollDiceMutation: 'mockRollDiceMutation'
}));

const mockOnSanityLoss = jest.fn();
const mockOnCloseAndShowNewRoll = jest.fn();

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <IntlProvider locale="en" messages={messagesEnglish}>
      {component}
    </IntlProvider>
  );
};

describe('SanityLossActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders static sanity loss buttons (1-6)', () => {
    renderWithIntl(
      <SanityLossActions
        gameId="test-game"
        onSanityLoss={mockOnSanityLoss}
        onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
      />
    );

    // Check that static buttons are rendered
    for (let i = 1; i <= 6; i++) {
      const button = screen.getByRole('button', { name: i.toString() });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', `Lose ${i} sanity points`);
    }
  });

  it('renders dice roll buttons', () => {
    renderWithIntl(
      <SanityLossActions
        gameId="test-game"
        onSanityLoss={mockOnSanityLoss}
        onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
      />
    );

    // Check that dice buttons are rendered
    const diceOptions = ['1d4', '1d6', '1d8', '1d10', '1d20'];
    for (const dice of diceOptions) {
      const button = screen.getByRole('button', { name: dice });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', `Roll ${dice} for sanity loss`);
    }
  });

  it('calls onSanityLoss when static button is clicked', () => {
    renderWithIntl(
      <SanityLossActions
        gameId="test-game"
        onSanityLoss={mockOnSanityLoss}
        onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
      />
    );

    const button3 = screen.getByRole('button', { name: '3' });
    fireEvent.click(button3);

    expect(mockOnSanityLoss).toHaveBeenCalledWith(3);
    expect(mockOnCloseAndShowNewRoll).toHaveBeenCalledWith(null);
  });

  it('static buttons are above dice buttons in DOM order', () => {
    const { container } = renderWithIntl(
      <SanityLossActions
        gameId="test-game"
        onSanityLoss={mockOnSanityLoss}
        onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
      />
    );

    const staticButtonsContainer = container.querySelector('.sanity-loss-static-buttons');
    const diceButtonsContainer = container.querySelector('.sanity-loss-buttons');

    expect(staticButtonsContainer).toBeInTheDocument();
    expect(diceButtonsContainer).toBeInTheDocument();

    // Check DOM order - static buttons should come before dice buttons
    const allContainers = container.querySelectorAll('.sanity-loss-static-buttons, .sanity-loss-buttons');
    expect(allContainers[0]).toBe(staticButtonsContainer);
    expect(allContainers[1]).toBe(diceButtonsContainer);
  });

  describe('adaptation reminders', () => {
    it('does not show reminder when not adapted', () => {
      const { container } = renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={false}
          isAdaptedToHelplessness={false}
        />
      );

      // Should not contain warning emoji or reminder text
      expect(container.textContent).not.toContain('⚠️');
      expect(container.textContent).not.toContain('adapted');
    });

    it('does not show reminder on successful roll even when adapted', () => {
      // Successful roll: value (45) <= target (50)
      const successfulRoll = {
        value: 45,
        target: 50,
        __typename: 'DiceRoll' as const,
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'SUCCESS',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      const { container } = renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={true}
          isAdaptedToHelplessness={false}
          rollResult={successfulRoll}
        />
      );

      // Component should render
      expect(screen.getByText(/Roll for sanity loss/i)).toBeInTheDocument();

      // But reminder should NOT show
      expect(container.textContent).not.toContain('⚠️');
      expect(container.textContent).not.toContain('adapted');
    });

    it('shows reminder on failed roll when adapted to violence', () => {
      // Failed roll: value (75) > target (50)
      const failedRoll = {
        value: 75,
        target: 50,
        __typename: 'DiceRoll' as const,
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'FAILURE',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={true}
          isAdaptedToHelplessness={false}
          rollResult={failedRoll}
        />
      );

      // Component should render
      expect(screen.getByText(/Roll for sanity loss/i)).toBeInTheDocument();

      // Reminder SHOULD show for failed rolls
      expect(screen.getByText(/Take the success penalty for violence checks/i)).toBeInTheDocument();
      expect(screen.getByText(/adapted/i)).toBeInTheDocument();
    });

    it('shows violence reminder when adapted to violence only', () => {
      // Need a failed roll to show reminder
      const failedRoll: DiceRoll = {
        value: 75,
        target: 50,
        __typename: 'DiceRoll',
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'FAILURE',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={true}
          isAdaptedToHelplessness={false}
          rollResult={failedRoll}
        />
      );

      expect(screen.getByText(/Take the success penalty for violence checks/i)).toBeInTheDocument();
      expect(screen.getByText(/adapted/i)).toBeInTheDocument();
    });

    it('shows helplessness reminder when adapted to helplessness only', () => {
      // Need a failed roll to show reminder
      const failedRoll: DiceRoll = {
        value: 75,
        target: 50,
        __typename: 'DiceRoll',
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'FAILURE',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={false}
          isAdaptedToHelplessness={true}
          rollResult={failedRoll}
        />
      );

      expect(screen.getByText(/Take the success penalty for helplessness checks/i)).toBeInTheDocument();
      expect(screen.getByText(/adapted/i)).toBeInTheDocument();
    });

    it('shows combined reminder when adapted to both', () => {
      // Need a failed roll to show reminder
      const failedRoll: DiceRoll = {
        value: 75,
        target: 50,
        __typename: 'DiceRoll',
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'FAILURE',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={true}
          isAdaptedToHelplessness={true}
          rollResult={failedRoll}
        />
      );

      expect(screen.getByText(/Take the success penalty for violence or helplessness checks/i)).toBeInTheDocument();
      expect(screen.getByText(/adapted/i)).toBeInTheDocument();
    });

    it('gracefully handles undefined adaptation props', () => {
      const { container } = renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
        />
      );

      // Should not crash and should not show reminder
      expect(container.textContent).not.toContain('⚠️');
      expect(container.textContent).not.toContain('adapted');
    });

    it('reminder appears after the main description text', () => {
      // Need a failed roll to show reminder
      const failedRoll: DiceRoll = {
        value: 75,
        target: 50,
        __typename: 'DiceRoll',
        action: 'Test SAN',
        dice: [],
        diceList: [],
        gameId: 'test-game',
        grade: 'FAILURE',
        messageIndex: 1,
        messageType: 'deltaGreen',
        playerId: 'test-player',
        playerName: 'Test Player',
        proxyRoll: false,
        rollType: 'SUM',
        rolledAt: new Date().toISOString(),
        rolledBy: 'test-user',
        type: 'ROLL'
      };

      const { container } = renderWithIntl(
        <SanityLossActions
          gameId="test-game"
          onSanityLoss={mockOnSanityLoss}
          onCloseAndShowNewRoll={mockOnCloseAndShowNewRoll}
          isAdaptedToViolence={true}
          isAdaptedToHelplessness={false}
          rollResult={failedRoll}
        />
      );

      const description = container.querySelector('.sanity-loss-description');
      expect(description).toBeInTheDocument();

      // Check that description contains both main text and reminder
      expect(description?.textContent).toContain('Roll for sanity loss');
      expect(description?.textContent).toContain('adapted');
    });
  });
});