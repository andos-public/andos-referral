/**
 * Package version stamped into health/readiness responses.
 * Kept in one place so ops can correlate a running instance with a release without
 * reading files at runtime.
 */
export const APP_VERSION = process.env.npm_package_version ?? '0.1.0';
