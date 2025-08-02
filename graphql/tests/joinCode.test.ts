import { generateJoinCodeFromUuid } from "../lib/joinCode";

describe("joinCode", () => {
  describe("generateJoinCodeFromUuid", () => {
    it("should generate a 6-character join code from a UUID", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      const result = generateJoinCodeFromUuid(uuid);

      expect(result).toHaveLength(6);
      expect(result).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    });

    it("should produce consistent results for the same UUID", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      const result1 = generateJoinCodeFromUuid(uuid);
      const result2 = generateJoinCodeFromUuid(uuid);

      expect(result1).toBe(result2);
    });

    it("should map 0x00 bytes to first safe character '2'", () => {
      const uuid = "12345678-1234-1234-1234-000000000000";
      const result = generateJoinCodeFromUuid(uuid);

      expect(result).toBe("222222");
    });

    it("should map 0xFF bytes to last safe character 'Z' (255 % 32 = 31)", () => {
      const uuid = "12345678-1234-1234-1234-ffffffffffff";
      const result = generateJoinCodeFromUuid(uuid);

      expect(result).toBe("ZZZZZZ");
    });

    it("should handle specific hex patterns correctly", () => {
      // 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB
      // 1%32=1('3'), 35%32=3('5'), 69%32=5('7'), 103%32=7('9'), 137%32=9('B'), 171%32=11('D')
      const uuid = "12345678-1234-1234-1234-0123456789ab";
      const result = generateJoinCodeFromUuid(uuid);

      expect(result).toBe("3579BD");
    });

    it("should handle invalid hex characters", () => {
      const invalidUuid = "12345678-1234-1234-1234-123456789xyz";

      // In AppSync environment, util.error() would terminate execution
      // In test environment, we can still verify the function handles invalid input
      expect(() => generateJoinCodeFromUuid(invalidUuid)).toThrow();
    });

    it("should handle uppercase and lowercase hex equally", () => {
      const lowerUuid = "12345678-1234-1234-1234-abcdefabcdef";
      const upperUuid = "12345678-1234-1234-1234-ABCDEFABCDEF";

      const lowerResult = generateJoinCodeFromUuid(lowerUuid);
      const upperResult = generateJoinCodeFromUuid(upperUuid);

      expect(lowerResult).toBe(upperResult);
    });
  });
});
