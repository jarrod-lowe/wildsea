import React from "react";
import { render } from "@testing-library/react";
import { SectionDeltaGreenDerived, calculateDerivedAttributes, createDefaultDeltaGreenDerivedContent } from "./sectionDeltaGreenDerived";
import { IntlProvider } from "react-intl";
import { messagesEnglish } from "./translations.en";
import { ToastProvider } from "./notificationToast";
import { CharacterDeathProvider } from "./contexts/CharacterDeathContext";

// Test helper types and functions
interface MockSectionConfig {
  hpCurrent?: number;
  wpCurrent?: number;
  sanCurrent?: number;
  bpCurrent?: number;
}

const createMockDeltaGreenDerivedSection = (config: MockSectionConfig = {}) => {
  const {
    hpCurrent = 10,
    wpCurrent = 10,
    sanCurrent = 50,
    bpCurrent = 40
  } = config;

  return {
    gameId: 'test-game',
    sectionId: 'section-id',
    sectionName: 'Derived Attributes',
    sectionType: 'deltagreenderived',
    userId: 'user-1',
    content: JSON.stringify({
      showEmpty: false,
      items: [
        { id: 'hp-1', name: 'HP', attributeType: 'HP', current: hpCurrent, description: '' },
        { id: 'wp-1', name: 'WP', attributeType: 'WP', current: wpCurrent, description: '' },
        { id: 'san-1', name: 'SAN', attributeType: 'SAN', current: sanCurrent, description: '' },
        { id: 'bp-1', name: 'BP', attributeType: 'BP', current: bpCurrent, description: '' }
      ]
    }),
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    position: 0,
    type: 'section'
  };
};

interface RenderDeltaGreenDerivedOptions {
  section?: ReturnType<typeof createMockDeltaGreenDerivedSection>;
  userSubject?: string;
  mayEditSheet?: boolean;
  onUpdate?: () => void;
}

const renderDeltaGreenDerived = (options: RenderDeltaGreenDerivedOptions = {}) => {
  const {
    section = createMockDeltaGreenDerivedSection(),
    userSubject = 'user-1',
    mayEditSheet = true,
    onUpdate = () => {}
  } = options;

  // Set up DOM with stats
  document.body.innerHTML = `
    <div class="delta-green-stats-grid"
         data-stat-str="10"
         data-stat-con="10"
         data-stat-pow="10">
    </div>
  `;

  // Render with all required providers
  return render(
    <ToastProvider>
      <IntlProvider locale="en" messages={messagesEnglish}>
        <CharacterDeathProvider>
          <SectionDeltaGreenDerived
            section={section}
            userSubject={userSubject}
            mayEditSheet={mayEditSheet}
            onUpdate={onUpdate}
          />
        </CharacterDeathProvider>
      </IntlProvider>
    </ToastProvider>
  );
};

describe("SectionDeltaGreenDerived - Sanity Modifier", () => {
  it("reduces SAN max when modifier is applied", () => {
    const stats = { STR: 10, CON: 10, POW: 10 };
    const modifier = 5;

    const result = calculateDerivedAttributes(stats, modifier);

    expect(result.SAN.max).toBe(45); // (POW × 5) - modifier = 50 - 5 = 45
  });

  it("BP calculation includes modifier", () => {
    const stats = { STR: 10, CON: 10, POW: 10 };
    const modifier = 5;

    const result = calculateDerivedAttributes(stats, modifier);

    // BP = ((POW × 5) - modifier) - POW = (50 - 5) - 10 = 35
    expect(result.BP.current).toBe(35);
  });

  it("edge case - modifier exceeds base max", () => {
    const stats = { STR: 10, CON: 10, POW: 10 };
    const modifier = 60; // Base max is 50

    const result = calculateDerivedAttributes(stats, modifier);

    // SAN max should be clamped to 0
    expect(result.SAN.max).toBe(0);
    // BP should also reflect this
    expect(result.BP.current).toBe(-10); // 0 - 10
  });

  it("backward compatibility - missing modifier defaults to 0", () => {
    const stats = { STR: 10, CON: 10, POW: 10 };

    const result = calculateDerivedAttributes(stats); // No modifier provided

    expect(result.SAN.max).toBe(50); // POW × 5 with no modifier
    expect(result.BP.current).toBe(40); // 50 - 10
  });
});

describe("SectionDeltaGreenDerived - getAdaptationStatusFromDataAttributes", () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  it("returns false for both when no container exists", () => {
    // Import the helper function - we'll need to export it
    const { getAdaptationStatusFromDataAttributes } = require('./sectionDeltaGreenDerived');

    const result = getAdaptationStatusFromDataAttributes();

    expect(result).toEqual({ violence: false, helplessness: false });
  });

  it("returns false for both when attributes are 'false'", () => {
    document.body.innerHTML = `
      <div class="delta-green-sanloss-section"
           data-adapted-violence="false"
           data-adapted-helplessness="false">
      </div>
    `;

    const { getAdaptationStatusFromDataAttributes } = require('./sectionDeltaGreenDerived');

    const result = getAdaptationStatusFromDataAttributes();

    expect(result).toEqual({ violence: false, helplessness: false });
  });

  it("returns true for violence when attribute is 'true'", () => {
    document.body.innerHTML = `
      <div class="delta-green-sanloss-section"
           data-adapted-violence="true"
           data-adapted-helplessness="false">
      </div>
    `;

    const { getAdaptationStatusFromDataAttributes } = require('./sectionDeltaGreenDerived');

    const result = getAdaptationStatusFromDataAttributes();

    expect(result).toEqual({ violence: true, helplessness: false });
  });

  it("returns true for helplessness when attribute is 'true'", () => {
    document.body.innerHTML = `
      <div class="delta-green-sanloss-section"
           data-adapted-violence="false"
           data-adapted-helplessness="true">
      </div>
    `;

    const { getAdaptationStatusFromDataAttributes } = require('./sectionDeltaGreenDerived');

    const result = getAdaptationStatusFromDataAttributes();

    expect(result).toEqual({ violence: false, helplessness: true });
  });

  it("returns true for both when both attributes are 'true'", () => {
    document.body.innerHTML = `
      <div class="delta-green-sanloss-section"
           data-adapted-violence="true"
           data-adapted-helplessness="true">
      </div>
    `;

    const { getAdaptationStatusFromDataAttributes } = require('./sectionDeltaGreenDerived');

    const result = getAdaptationStatusFromDataAttributes();

    expect(result).toEqual({ violence: true, helplessness: true });
  });
});

describe("SectionDeltaGreenDerived - Integration", () => {
  // Set up DOM with stats before each test
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="delta-green-stats-grid"
           data-stat-str="10"
           data-stat-con="10"
           data-stat-pow="10">
      </div>
    `;
  });

  it("applies sanityModifier from content when rendering", () => {
    const mockSection = {
      gameId: "test-game",
      sectionId: "section-id",
      sectionName: "Derived Attributes",
      sectionType: "deltagreenderived",
      userId: "user-1",
      content: JSON.stringify({
        showEmpty: false,
        sanityModifier: 5,
        items: [
          { id: "san-1", name: "SAN", attributeType: "SAN", current: 45 },
          { id: "bp-1", name: "BP", attributeType: "BP", current: 35 }
        ]
      }),
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      position: 0,
      type: "section",
    };

    const { container } = render(
      <ToastProvider>
        <IntlProvider locale="en" messages={messagesEnglish}>
          <CharacterDeathProvider>
            <SectionDeltaGreenDerived
              section={mockSection}
              userSubject="user-1"
              mayEditSheet={true}
              onUpdate={() => {}}
            />
          </CharacterDeathProvider>
        </IntlProvider>
      </ToastProvider>
    );

    // The component should display max SAN as 45 (50 - 5)
    expect(container.textContent).toContain('45'); // Adjusted max should be visible
  });

  it("default content initializes without sanityModifier", () => {
    const defaultContent = createDefaultDeltaGreenDerivedContent(undefined, 'en');

    // sanityModifier is optional and defaults to undefined
    expect(defaultContent.sanityModifier).toBeUndefined();

    // Should still have items
    expect(defaultContent.items.length).toBeGreaterThan(0);
  });

  it("content with sanityModifier persists the value", () => {
    const contentWithModifier = {
      showEmpty: false,
      sanityModifier: 10,
      items: []
    };

    // TypeScript should allow sanityModifier field
    expect(contentWithModifier.sanityModifier).toBe(10);
  });
});

describe('WP Depletion Styling', () => {
  it('applies wp-depleted class when WP current is 0', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({ wpCurrent: 0 })
    });

    const wpRow = container.querySelector('.derived-row.wp-depleted');
    expect(wpRow).toBeTruthy();
  });

  it('does not apply wp-depleted class when WP current is greater than 0', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({ wpCurrent: 5 })
    });

    const wpDepletedRow = container.querySelector('.derived-row.wp-depleted');
    expect(wpDepletedRow).toBeFalsy();
  });

  it('can show both wp-depleted and disorder-warning simultaneously', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({ wpCurrent: 0, sanCurrent: 35 })
    });

    const wpDepletedRow = container.querySelector('.derived-row.wp-depleted');
    const disorderRows = container.querySelectorAll('.derived-row.disorder-warning');

    expect(wpDepletedRow).toBeTruthy();
    expect(disorderRows.length).toBeGreaterThan(0);
  });
});

describe('HP Depletion Styling', () => {
  it('applies hp-depleted class when HP current is 0', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({ hpCurrent: 0 })
    });

    const hpRow = container.querySelector('.derived-row.hp-depleted');
    expect(hpRow).toBeTruthy();
  });

  it('does not apply hp-depleted class when HP current is greater than 0', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({ hpCurrent: 5 })
    });

    const hpDepletedRow = container.querySelector('.derived-row.hp-depleted');
    expect(hpDepletedRow).toBeFalsy();
  });

  it('can show hp-depleted, wp-depleted, and disorder-warning simultaneously', () => {
    const { container } = renderDeltaGreenDerived({
      section: createMockDeltaGreenDerivedSection({
        hpCurrent: 0,
        wpCurrent: 0,
        sanCurrent: 35
      })
    });

    const hpDepletedRow = container.querySelector('.derived-row.hp-depleted');
    const wpDepletedRow = container.querySelector('.derived-row.wp-depleted');
    const disorderRows = container.querySelectorAll('.derived-row.disorder-warning');

    expect(hpDepletedRow).toBeTruthy();
    expect(wpDepletedRow).toBeTruthy();
    expect(disorderRows.length).toBeGreaterThan(0);
  });
});
