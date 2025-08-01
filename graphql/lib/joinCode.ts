import { util } from "@aws-appsync/utils";

export function generateJoinCode(): string {
  const safeChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const uuid = util.autoId(); // e.g. "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  const tail = uuid.split("-")[4]; // last 12 hex characters

  const index0 = hexByteToIndex(
    tail.charAt(0),
    tail.charAt(1),
    safeChars.length,
  );
  const index1 = hexByteToIndex(
    tail.charAt(2),
    tail.charAt(3),
    safeChars.length,
  );
  const index2 = hexByteToIndex(
    tail.charAt(4),
    tail.charAt(5),
    safeChars.length,
  );
  const index3 = hexByteToIndex(
    tail.charAt(6),
    tail.charAt(7),
    safeChars.length,
  );
  const index4 = hexByteToIndex(
    tail.charAt(8),
    tail.charAt(9),
    safeChars.length,
  );
  const index5 = hexByteToIndex(
    tail.charAt(10),
    tail.charAt(11),
    safeChars.length,
  );

  return (
    safeChars.charAt(index0) +
    safeChars.charAt(index1) +
    safeChars.charAt(index2) +
    safeChars.charAt(index3) +
    safeChars.charAt(index4) +
    safeChars.charAt(index5)
  );
}

function hexByteToIndex(char1, char2, modulo) {
  return ((hexToVal(char1) << 4) | hexToVal(char2)) % modulo;
}

function hexToVal(c) {
  if (c === "0") return 0;
  if (c === "1") return 1;
  if (c === "2") return 2;
  if (c === "3") return 3;
  if (c === "4") return 4;
  if (c === "5") return 5;
  if (c === "6") return 6;
  if (c === "7") return 7;
  if (c === "8") return 8;
  if (c === "9") return 9;
  if (c === "a" || c === "A") return 10;
  if (c === "b" || c === "B") return 11;
  if (c === "c" || c === "C") return 12;
  if (c === "d" || c === "D") return 13;
  if (c === "e" || c === "E") return 14;
  if (c === "f" || c === "F") return 15;
  return 0; // fallback
}
