export function generateJoinCode(): string {
  // Generate 6-character code excluding confusing characters (0, O, 1, I, l)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  // Generate 6 random characters using AppSync-compatible syntax
  const char1 = chars.charAt(Math.floor(Math.random() * chars.length));
  const char2 = chars.charAt(Math.floor(Math.random() * chars.length));
  const char3 = chars.charAt(Math.floor(Math.random() * chars.length));
  const char4 = chars.charAt(Math.floor(Math.random() * chars.length));
  const char5 = chars.charAt(Math.floor(Math.random() * chars.length));
  const char6 = chars.charAt(Math.floor(Math.random() * chars.length));

  return char1 + char2 + char3 + char4 + char5 + char6;
}
