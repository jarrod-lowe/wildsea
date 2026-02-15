import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SectionDeltaGreenSanLoss } from './sectionDeltaGreenSanLoss';
import { IntlProvider } from 'react-intl';
import { messages } from './translations';
import { ToastProvider } from './notificationToast';

const mockUpdateSection = jest.fn();

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      <IntlProvider locale="en" messages={messages.en}>
        {component}
      </IntlProvider>
    </ToastProvider>
  );
};

describe('SectionDeltaGreenSanLoss', () => {
  beforeEach(() => {
    mockUpdateSection.mockClear();
    mockUpdateSection.mockResolvedValue(undefined);
  });

  const mockSection = {
    id: 'section-1',
    sectionName: 'Incidents of SAN loss without going insane',
    sectionType: 'DELTAGREENSANLOSS',
    content: JSON.stringify({
      showEmpty: true,
      items: [
        { id: '1', name: 'Violence', length: 3, ticked: 0, description: '' },
        { id: '2', name: 'Helplessness', length: 3, ticked: 0, description: '' }
      ]
    }),
    sheetId: 'sheet-1',
    order: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  it('renders items correctly', () => {
    const { getByText } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    expect(getByText('Violence')).toBeInTheDocument();
    expect(getByText('Helplessness')).toBeInTheDocument();
  });

  it('shows adapted label when all boxes are ticked', async () => {
    const adaptedSection = {
      ...mockSection,
      content: JSON.stringify({
        showEmpty: true,
        items: [
          { id: '1', name: 'Violence', length: 3, ticked: 3, description: '' },
          { id: '2', name: 'Helplessness', length: 3, ticked: 2, description: '' }
        ]
      })
    };

    const { getByText, queryByText } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={adaptedSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    // Violence should show adapted label (all 3 ticked)
    expect(getByText(/✓ Adapted/i)).toBeInTheDocument();

    // Only one adapted label should exist (Violence only)
    const adaptedLabels = queryByText(/✓ Adapted/i);
    expect(adaptedLabels).toBeInTheDocument();
  });

  it('applies adapted-item class when all boxes are ticked', () => {
    const adaptedSection = {
      ...mockSection,
      content: JSON.stringify({
        showEmpty: true,
        items: [
          { id: '1', name: 'Violence', length: 3, ticked: 3, description: '' }
        ]
      })
    };

    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={adaptedSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    const adaptedItem = container.querySelector('.section-item.adapted-item');
    expect(adaptedItem).toBeInTheDocument();
  });

  it('does not apply adapted class when not all boxes are ticked', () => {
    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    const adaptedItem = container.querySelector('.section-item.adapted-item');
    expect(adaptedItem).not.toBeInTheDocument();
  });

  it('tracks adaptation independently for each item', async () => {
    const mixedSection = {
      ...mockSection,
      content: JSON.stringify({
        showEmpty: true,
        items: [
          { id: '1', name: 'Violence', length: 3, ticked: 3, description: '' },
          { id: '2', name: 'Helplessness', length: 3, ticked: 1, description: '' }
        ]
      })
    };

    const { container, queryAllByText } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mixedSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    // Only one item should have adapted class
    const adaptedItems = container.querySelectorAll('.section-item.adapted-item');
    expect(adaptedItems).toHaveLength(1);

    // Only one adapted label
    const adaptedLabels = queryAllByText(/✓ Adapted/i);
    expect(adaptedLabels).toHaveLength(1);
  });

  it('allows ticking boxes when mayEditSheet is true', async () => {
    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={true}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    const tickButtons = container.querySelectorAll('.tick-checkbox');
    expect(tickButtons[0]).not.toBeDisabled();
  });

  it('disables ticking boxes when mayEditSheet is false', async () => {
    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        updateSection={mockUpdateSection}
        deleteSection={jest.fn()}
        mayEditSheet={false}
        playerId="player-1"
        sheetId="sheet-1"
        gameName="Test Game"
      />
    );

    const tickButtons = container.querySelectorAll('.tick-checkbox');
    expect(tickButtons[0]).toBeDisabled();
  });
});
