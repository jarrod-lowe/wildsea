// Roll type constants
export const RollTypes = {
  SUM: "sum",
  DELTA_GREEN: "deltaGreen",
} as const;

// Grade constants
export const Grades = {
  NEUTRAL: "NEUTRAL",
  CRITICAL_SUCCESS: "CRITICAL_SUCCESS",
  SUCCESS: "SUCCESS",
  FUMBLE: "FUMBLE",
  FAILURE: "FAILURE",
} as const;

export type RollType = (typeof RollTypes)[keyof typeof RollTypes];
export type Grade = (typeof Grades)[keyof typeof Grades];
