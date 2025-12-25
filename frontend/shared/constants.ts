export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'Check',
  'Gift Card',
  'Other'
];

export const DEFAULT_TAX_RATE = 0.19; // 19% default tax rate
export const BUSINESS_DAY_START_TIME = '06:00';
export const DEFAULT_CURRENCY = '€';

export const GRID_LAYOUT_VERSION = '1.0.0';

// Product grid layout defaults
export const DEFAULT_GRID_COLUMNS = 4;
export const DEFAULT_GRID_ITEM_WIDTH = 1;
export const DEFAULT_GRID_ITEM_HEIGHT = 1;

// API endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  TILLS: '/api/tills',
  USERS: '/api/users',
  TRANSACTIONS: '/api/transactions',
  TABS: '/api/tabs',
  LAYOUTS: '/api/layouts',
  SETTINGS: '/api/settings',
  STOCK_ITEMS: '/api/stock-items',
  STOCK_ADJUSTMENTS: '/api/stock-adjustments',
  DAILY_CLOSINGS: '/api/daily-closings',
  ORDER_ACTIVITY_LOGS: '/api/order-activity-logs',
  ORDER_SESSIONS: '/api/order-sessions',
  TABLES: '/api/tables',
  ROOMS: '/api/rooms',
  INGREDIENTS: '/api/ingredients'
};

// UI defaults
export const UI_DEFAULTS = {
  MAX_VISIBLE_TABS: 5,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
 PAGE_SIZE: 20
};

// Filter types for layouts
export const FILTER_TYPES = {
  ALL: 'all',
  FAVORITES: 'favorites',
  CATEGORY: 'category'
} as const;

export type FilterType = keyof typeof FILTER_TYPES;