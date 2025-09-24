import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { messagesEnglish } from '../translations.en';
import { SanityLossActions } from './SanityLossActions';

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
    diceOptions.forEach(dice => {
      const button = screen.getByRole('button', { name: dice });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', `Roll ${dice} for sanity loss`);
    });
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
});