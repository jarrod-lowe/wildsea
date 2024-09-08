/// <reference types="jest" />

declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    // Add other custom matchers here if needed
  }
}
