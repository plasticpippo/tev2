export const PAYMENT_METHODS = [
  'Cash',
  'Card',
];

export const DEFAULT_TAX_RATE = 0.19; // 19% default tax rate
export const BUSINESS_DAY_START_TIME = '06:00';
export const DEFAULT_CURRENCY = '€';

// API endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  TILLS: '/api/tills',
  USERS: '/api/users',
  TRANSACTIONS: '/api/transactions',
  TABS: '/api/tabs',
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
