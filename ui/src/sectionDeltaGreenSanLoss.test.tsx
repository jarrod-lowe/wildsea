import React from 'react';
import { render } from '@testing-library/react';
import { SectionDeltaGreenSanLoss } from './sectionDeltaGreenSanLoss';
import { IntlProvider } from 'react-intl';
import { messages } from './translations';
import { ToastProvider } from './notificationToast';

const mockUpdateSection = jest.fn();

// Helper to create JSON with stable key ordering for tests
// Comparator for deterministic string sorting (non-locale)
const stringComparator = (a: string, b: string): number => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const stableStringify = (obj: unknown): string => {
  // Use a replacer function that sorts object keys with explicit comparator
  // codacy-disable-next-line
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort(stringComparator)
        .reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {} as Record<string, unknown>);
    }
    return value;
  });
};

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
    sectionId: 'section-1',
    sectionName: 'Incidents of SAN loss without going insane',
    sectionType: 'DELTAGREENSANLOSS',
    type: 'DELTAGREENSANLOSS',
    content: stableStringify({
      showEmpty: true,
      items: [
        { id: '1', name: 'Violence', length: 3, ticked: 0, description: '' },
        { id: '2', name: 'Helplessness', length: 3, ticked: 0, description: '' }
      ]
    }),
    sheetId: 'sheet-1',
    gameId: 'game-1',
    userId: 'user-1',
    order: 0,
    position: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  it('renders items correctly', () => {
    const { getByText } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
      />
    );

    expect(getByText('Violence')).toBeInTheDocument();
    expect(getByText('Helplessness')).toBeInTheDocument();
  });

  it('shows adapted label when all boxes are ticked', async () => {
    const adaptedSection = {
      ...mockSection,
      content: stableStringify({
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
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
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
      content: stableStringify({
        showEmpty: true,
        items: [
          { id: '1', name: 'Violence', length: 3, ticked: 3, description: '' }
        ]
      })
    };

    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={adaptedSection}
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
      />
    );

    const adaptedItem = container.querySelector('.section-item.adapted-item');
    expect(adaptedItem).toBeInTheDocument();
  });

  it('does not apply adapted class when not all boxes are ticked', () => {
    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
      />
    );

    const adaptedItem = container.querySelector('.section-item.adapted-item');
    expect(adaptedItem).not.toBeInTheDocument();
  });

  it('tracks adaptation independently for each item', async () => {
    const mixedSection = {
      ...mockSection,
      content: stableStringify({
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
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
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
        userSubject="user-1"
        mayEditSheet={true}
        onUpdate={mockUpdateSection}
      />
    );

    const tickButtons = container.querySelectorAll('.tick-checkbox');
    expect(tickButtons[0]).not.toBeDisabled();
  });

  it('disables ticking boxes when mayEditSheet is false', async () => {
    const { container } = renderWithIntl(
      <SectionDeltaGreenSanLoss
        section={mockSection}
        userSubject="user-1"
        mayEditSheet={false}
        onUpdate={mockUpdateSection}
      />
    );

    const tickButtons = container.querySelectorAll('.tick-checkbox');
    expect(tickButtons[0]).toBeDisabled();
  });
});
