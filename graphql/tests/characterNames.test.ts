import {
  generateCharacterName,
  isSupportedLanguage,
} from "../lib/utils/characterNames";

describe("characterNames", () => {
  describe("generateCharacterName", () => {
    it("should generate English Wildsea character name", () => {
      const name = generateCharacterName("wildsea", "en");
      expect(name).toBe("Unnamed Character");
    });

    it("should generate Klingon Wildsea character name", () => {
      const name = generateCharacterName("wildsea", "tlh");
      expect(name).toBe("pagh DIch jup");
    });

    it("should generate English Delta Green agent name with random number", () => {
      const name = generateCharacterName("deltaGreen", "en");
      expect(name).toMatch(/^Agent #\d{3}$/);

      // Verify the number is between 100-999
      const agentNumber = parseInt(name.match(/\d{3}/)![0]);
      expect(agentNumber).toBeGreaterThanOrEqual(100);
      expect(agentNumber).toBeLessThanOrEqual(999);
    });

    it("should generate Klingon Delta Green agent name with random number", () => {
      const name = generateCharacterName("deltaGreen", "tlh");
      expect(name).toMatch(/^jup #\d{3}$/);

      // Verify the number is between 100-999
      const agentNumber = parseInt(name.match(/\d{3}/)![0]);
      expect(agentNumber).toBeGreaterThanOrEqual(100);
      expect(agentNumber).toBeLessThanOrEqual(999);
    });

    it("should default to English for unsupported language", () => {
      const name = generateCharacterName("wildsea", "xyz123");
      expect(name).toBe("Unnamed Character");
    });

    it("should default to English when no language provided", () => {
      const name = generateCharacterName("wildsea");
      expect(name).toBe("Unnamed Character");
    });

    it("should default to wildsea pattern for unknown game type", () => {
      const name = generateCharacterName("unknownGame", "en");
      expect(name).toBe("Unnamed Character");
    });

    it("should generate different agent numbers", () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        names.add(generateCharacterName("deltaGreen", "en"));
      }
      // Should have generated multiple different names (very unlikely to get duplicates)
      expect(names.size).toBeGreaterThan(1);
    });
  });

  describe("isSupportedLanguage", () => {
    it("should return true for supported languages", () => {
      expect(isSupportedLanguage("en")).toBe(true);
      expect(isSupportedLanguage("tlh")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(isSupportedLanguage("abc123")).toBe(false);
      expect(isSupportedLanguage("xyz999")).toBe(false);
      expect(isSupportedLanguage("")).toBe(false);
    });
  });
});
