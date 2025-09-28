// Asset upload constants

// File size limits
export const MAX_ASSET_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for testing

// Timeout and expiration settings
export const ASSET_CLEANUP_TIMEOUT_SECONDS = 30; // Temporary 60 * 60; // 60 minutes
export const PRESIGNED_URL_EXPIRES_SECONDS = 900; // 15 minutes
export const LAMBDA_TIMEOUT_SECONDS = 30;

// Asset status values (re-exported from assetStatus.ts)
export { ASSET_STATUS_PENDING, ASSET_STATUS_EXPIRED } from "./assetStatus";

// Allowed MIME types for asset uploads
export const ALLOWED_ASSET_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
