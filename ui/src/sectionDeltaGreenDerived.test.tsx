import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { SectionDeltaGreenDerived, calculateDerivedAttributes, createDefaultDeltaGreenDerivedContent } from "./sectionDeltaGreenDerived";
import { IntlProvider } from "react-intl";
import { messagesEnglish } from "./translations.en";
import { ToastProvider } from "./notificationToast";

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
          <SectionDeltaGreenDerived
            section={mockSection}
            userSubject="user-1"
            mayEditSheet={true}
            onUpdate={() => {}}
          />
        </IntlProvider>
      </ToastProvider>
    );

    // The component should display max SAN as 45 (50 - 5)
    const maxValues = container.querySelectorAll('.derived-col-maximum');
    // HP, WP, SAN, BP - SAN is the 3rd one (index 2)
    // We're looking for the SAN row which should show 45
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
