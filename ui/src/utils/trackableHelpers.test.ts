import { TrackableItem, TrackableContent, handleTrackableTickClick, isItemAdapted } from './trackableHelpers';
import { SheetSection } from "../../../appsync/graphql";

describe('trackableHelpers', () => {
  describe('isItemAdapted', () => {
    it('returns true when all boxes are ticked', () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 3,
        description: ''
      };

      expect(isItemAdapted(item)).toBe(true);
    });

    it('returns false when no boxes are ticked', () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 0,
        description: ''
      };

      expect(isItemAdapted(item)).toBe(false);
    });

    it('returns false when some boxes are ticked', () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 2,
        description: ''
      };

      expect(isItemAdapted(item)).toBe(false);
    });

    it('returns true for single-box items when ticked', () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Single',
        length: 1,
        ticked: 1,
        description: ''
      };

      expect(isItemAdapted(item)).toBe(true);
    });
  });

  describe('handleTrackableTickClick', () => {
    const mockUpdateSection = jest.fn();
    const mockSetContent = jest.fn();

    beforeEach(() => {
      mockUpdateSection.mockClear();
      mockSetContent.mockClear();
    });

    it('increments ticked count when clicking next unticked box', async () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 1,
        description: ''
      };

      const content: TrackableContent = {
        showEmpty: true,
        items: [item]
      };

      await handleTrackableTickClick(item, 1, content, mockSetContent, mockUpdateSection);

      expect(mockSetContent).toHaveBeenCalledWith({
        showEmpty: true,
        items: [{ ...item, ticked: 2 }]
      });

      expect(mockUpdateSection).toHaveBeenCalledWith({
        content: JSON.stringify({
          showEmpty: true,
          items: [{ ...item, ticked: 2 }]
        })
      });
    });

    it('decrements ticked count when clicking a ticked box', async () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 2,
        description: ''
      };

      const content: TrackableContent = {
        showEmpty: true,
        items: [item]
      };

      await handleTrackableTickClick(item, 1, content, mockSetContent, mockUpdateSection);

      expect(mockSetContent).toHaveBeenCalledWith({
        showEmpty: true,
        items: [{ ...item, ticked: 1 }]
      });
    });

    it('does not exceed maximum length when incrementing', async () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 3,
        description: ''
      };

      const content: TrackableContent = {
        showEmpty: true,
        items: [item]
      };

      // Try to click beyond the ticked boxes - should not increment beyond length
      await handleTrackableTickClick(item, 3, content, mockSetContent, mockUpdateSection);

      expect(mockSetContent).toHaveBeenCalledWith({
        showEmpty: true,
        items: [{ ...item, ticked: 3 }]
      });
    });

    it('does not go below zero when decrementing', async () => {
      const item: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 1,
        description: ''
      };

      const content: TrackableContent = {
        showEmpty: true,
        items: [item]
      };

      // Click a ticked box when only one is ticked - should decrement to 0 not below
      await handleTrackableTickClick(item, 0, content, mockSetContent, mockUpdateSection);

      expect(mockSetContent).toHaveBeenCalledWith({
        showEmpty: true,
        items: [{ ...item, ticked: 0 }]
      });
    });

    it('handles multiple items correctly', async () => {
      const item1: TrackableItem = {
        id: '1',
        name: 'Violence',
        length: 3,
        ticked: 1,
        description: ''
      };

      const item2: TrackableItem = {
        id: '2',
        name: 'Helplessness',
        length: 3,
        ticked: 2,
        description: ''
      };

      const content: TrackableContent = {
        showEmpty: true,
        items: [item1, item2]
      };

      await handleTrackableTickClick(item2, 2, content, mockSetContent, mockUpdateSection);

      expect(mockSetContent).toHaveBeenCalledWith({
        showEmpty: true,
        items: [item1, { ...item2, ticked: 3 }]
      });
    });
  });
});
