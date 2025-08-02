import { util } from "@aws-appsync/utils";

const SAFE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateJoinCode(): string {
  const uuid: string = util.autoId();
  return generateJoinCodeFromUuid(uuid);
}

export function generateJoinCodeFromUuid(uuid: string): string {
  const tail: string = uuid.split("-")[4];

  const index0 = hexByteToSafeCharIndex(tail.charAt(0), tail.charAt(1));
  const index1 = hexByteToSafeCharIndex(tail.charAt(2), tail.charAt(3));
  const index2 = hexByteToSafeCharIndex(tail.charAt(4), tail.charAt(5));
  const index3 = hexByteToSafeCharIndex(tail.charAt(6), tail.charAt(7));
  const index4 = hexByteToSafeCharIndex(tail.charAt(8), tail.charAt(9));
  const index5 = hexByteToSafeCharIndex(tail.charAt(10), tail.charAt(11));

  return (
    SAFE_CHARS.charAt(index0) +
    SAFE_CHARS.charAt(index1) +
    SAFE_CHARS.charAt(index2) +
    SAFE_CHARS.charAt(index3) +
    SAFE_CHARS.charAt(index4) +
    SAFE_CHARS.charAt(index5)
  );
}

function hexByteToSafeCharIndex(char1: string, char2: string): number {
  const hi = hexToVal(char1);
  const lo = hexToVal(char2);
  const byteValue = (hi << 4) | lo;
  return byteValue % SAFE_CHARS.length;
}

function hexToVal(c: string): number {
  const lower = c.toLowerCase();
  if (lower === "0") return 0;
  if (lower === "1") return 1;
  if (lower === "2") return 2;
  if (lower === "3") return 3;
  if (lower === "4") return 4;
  if (lower === "5") return 5;
  if (lower === "6") return 6;
  if (lower === "7") return 7;
  if (lower === "8") return 8;
  if (lower === "9") return 9;
  if (lower === "a") return 10;
  if (lower === "b") return 11;
  if (lower === "c") return 12;
  if (lower === "d") return 13;
  if (lower === "e") return 14;
  if (lower === "f") return 15;
  return util.error(`Invalid hex character: '${c}'`);
}
