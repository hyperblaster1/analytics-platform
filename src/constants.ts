// ===== FRONTEND CONSTANTS =====

// Pagination
export const PAGE_SIZE = 50;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;
export const MIN_LIMIT = 1;

// Polling Intervals (milliseconds)
export const PNODES_REFRESH_INTERVAL = 45000; // 45 seconds
export const INGESTION_STATUS_POLL_INTERVAL = 45000; // 45 seconds
export const COUNTDOWN_UPDATE_INTERVAL = 1000; // 1 second
export const DRAWER_STATE_POLL_INTERVAL = 16; // 16ms for smooth UI
export const LAST_SEEN_UPDATE_INTERVAL = 60000; // 1 minute

// Timeouts (milliseconds)
export const DRAWER_CLOSE_TRANSITION_TIMEOUT = 150; // 150ms
export const DRAWER_SPINNER_TIMEOUT = 200; // 200ms
export const DRAWER_STATE_TIMEOUT = 300; // 300ms

// Cache
export const DRAWER_CACHE_TTL = 30 * 1000; // 30 seconds
export const MAX_DRAWER_CACHE_SIZE = 3;

// Time Calculations (milliseconds)
export const ONE_MINUTE = 60000;
export const ONE_HOUR = 3600000;
export const ONE_DAY = 86400000;
export const ONE_HOUR_IN_SECONDS = 60 * 60;
export const SIX_HOURS_IN_SECONDS = 6 * 60 * 60;
export const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
export const TWENTY_DAYS_IN_SECONDS = 20 * 24 * 60 * 60;

// API Query Limits
export const MAX_GOSSIP_OBSERVATIONS = 500;
export const MAX_TIME_SERIES_POINTS_7D = 150;
export const MAX_TIME_SERIES_POINTS_20D = 200;
export const MAX_TIMELINE_POINTS = 50;
export const MAX_CREDITS_HISTORY_POINTS = 200;

// Layout
export const MAX_CONTENT_WIDTH = 1400; // px
export const ICON_SIZE_SMALL = 7; // Tailwind units (w-7 h-7)

// Storage
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = 1_048_576;
export const BYTES_PER_GB = 1_073_741_824;
export const BYTES_PER_TB = 1_099_511_627_776;

