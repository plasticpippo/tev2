// Re-export all API service functions for backward compatibility
// This allows existing imports to continue working while enabling modular imports

// Export base API utilities
export {
  API_BASE_URL,
  apiUrl,
  getAuthHeaders,
  isAuthTokenReady,
  makeApiRequest,
  subscribers,
  subscribeToUpdates,
  clearAllSubscribers,
  notifyUpdates
} from './apiBase';

// Export types
export type {
  OrderSession,
  DailyClosing
} from './apiBase';

// Export user service functions
export {
  getUsers,
  saveUser,
  deleteUser,
  login,
  logout
} from './userService';

// Export product service functions
export {
  getProducts,
  saveProduct,
  deleteProduct,
  getCategories,
  saveCategory,
  deleteCategory
} from './productService';

// Export transaction service functions
export {
  getTransactions,
  saveTransaction,
  getTabs,
  saveTab,
  deleteTab,
  updateMultipleTabs
} from './transactionService';

// Export inventory service functions
export {
  getStockItems,
  saveStockItem,
  deleteStockItem,
  updateStockLevels,
  getStockAdjustments,
  saveStockAdjustment
} from './inventoryService';

// Export order service functions
export {
  getOrderSession,
  saveOrderSession,
  updateOrderSessionStatus,
  clearOrderSession,
  getOrderActivityLogs,
  saveOrderActivityLog
} from './orderService';

// Export setting service functions
export {
  getSettings,
  saveSettings
} from './settingService';

// Export till service functions
export {
  getTills,
  saveTill,
  deleteTill
} from './tillService';

// Export table service functions
export {
  getRooms,
  saveRoom,
  deleteRoom,
  getTables,
  saveTable,
  deleteTable,
  updateTablePosition,
  updateTableStatus
} from './tableService';


// Export daily closing service functions
export {
  getDailyClosings,
  createDailyClosing
} from './dailyClosingService';

// Export consumption service functions
export {
  getConsumptionReport
} from './consumptionService';

// Export tax rate service functions
export {
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  setDefaultTaxRate,
  deleteTaxRate
} from './taxRateService';