// Application constants to eliminate magic numbers and improve maintainability

export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 25 * 1024 * 1024, // 25MB
} as const;

export const API_CONSTANTS = {
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  TIMEOUT: {
    DEFAULT: 30000, // 30 seconds
    LONG: 60000, // 1 minute
  },
} as const;

export const CACHE_CONSTANTS = {
  DURATIONS: {
    ONE_HOUR: 1000 * 60 * 60,
    ONE_DAY: 1000 * 60 * 60 * 24,
    ONE_WEEK: 1000 * 60 * 60 * 24 * 7,
  },
} as const;

export const RETRY_CONSTANTS = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  // Exponential backoff calculation: Math.min(BASE_DELAY * 2 ** attemptIndex, MAX_DELAY)
} as const;

export const UI_CONSTANTS = {
  POLLING_INTERVALS: {
    UPDATE_INTERVAL: 300, // 300ms for real-time updates
    SLOW_UPDATE: 1000, // 1 second for less frequent updates
  },
  TITLE_LIMITS: {
    MIN_LENGTH: 16,
    MAX_LENGTH: 100,
  },
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const;

export const STORAGE_KEYS = {
  MODEL_SELECTION: "selected-model",
  REASONING_EFFORT: "reasoning-effort",
  SEARCH_TOGGLE: "search-enabled",
  INPUT_STORE: "input-store",
  PENDING_ATTACHMENTS: "pendingAttachments",
  FIRST_MESSAGE: "firstMessage",
} as const;

export const MODEL_CONSTANTS = {
  DEFAULT_REASONING_EFFORT: "low",
  TOKEN_LIMITS: {
    TITLE_MIN: 16,
    TITLE_MAX: 100,
  },
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  FILE: FILE_CONSTANTS,
  API: API_CONSTANTS,
  CACHE: CACHE_CONSTANTS,
  RETRY: RETRY_CONSTANTS,
  UI: UI_CONSTANTS,
  STORAGE: STORAGE_KEYS,
  MODEL: MODEL_CONSTANTS,
} as const;
