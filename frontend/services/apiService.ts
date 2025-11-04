import type {
  User, Product, Category, Settings, Transaction, Tab, OrderItem,
  Till, StockItem, StockAdjustment, OrderActivityLog, ProductVariant, Room, Table
} from '../../shared/types';

// Define OrderSession interface for frontend
export interface OrderSession {
  id: string;
  userId: number;
  items: OrderItem[];
  status: 'active' | 'pending_logout' | 'completed';
  createdAt: string;
  updatedAt: string;
  logoutTime: string | null;
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// --- API BASE URL HELPER ---
const getApiBaseUrl = (): string => {
  // In development, use the VITE_API_URL from .env
  if ((import.meta as any).env.DEV) {
     return (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
   }
   // In production, you might want to use relative URLs or a different config
   return (import.meta as any).env.VITE_API_URL || '';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to construct full API URLs
const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function to get headers with credentials
const getAuthHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    // In a real implementation, you might include a token here if using JWT
    // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  };
};

// --- SUBSCRIBER for real-time updates ---
let subscribers: (() => void)[] = [];

export const subscribeToUpdates = (callback: () => void): (() => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
 };
};

const notifyUpdates = () => {
  console.log("Notifying subscribers of data change...");
  subscribers.forEach(callback => callback());
};

// --- API FUNCTIONS ---

// Helper function for making API requests with deduplication
const makeApiRequest = async (url: string, options?: RequestInit, cacheKey?: string): Promise<any> => {
  // If a cache key is provided, check if we have a pending request
  if (cacheKey && requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const requestPromise = fetch(url, options)
    .then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    })
    .catch(error => {
      console.error(`Error making request to ${url}:`, error);
      throw error;
    })
    .finally(() => {
      // Clean up the cache when the request completes
      if (cacheKey) {
        requestCache.delete(cacheKey);
      }
    });

  // Store the promise in the cache if a cache key was provided
  if (cacheKey) {
    requestCache.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const cacheKey = 'getUsers';
  try {
    const result = await makeApiRequest(apiUrl('/api/users'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const saveUser = async (user: Omit<User, 'id'> & { id?: number }): Promise<User> => {
  try {
    const method = user.id ? 'PUT' : 'POST';
    const url = user.id ? apiUrl(`/api/users/${user.id}`) : apiUrl('/api/users');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedUser = await response.json();
    notifyUpdates();
    return savedUser;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/users/${userId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
};

export const login = async (username: string, password: string): Promise<User> => {
  try {
    const response = await fetch(apiUrl('/api/users/login'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const userData = await response.json();
    // Store user in localStorage upon successful login for API authentication
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return userData;
 } catch (error) {
    console.error('Error during login:', error);
    throw error;
 }
};

// Products, Variants
export const getProducts = async (): Promise<Product[]> => {
  const cacheKey = 'getProducts';
  try {
    const result = await makeApiRequest(apiUrl('/api/products'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const saveProduct = async (productData: Omit<Product, 'id' | 'variants'> & { id?: number; variants: (Omit<ProductVariant, 'id' | 'productId'> & {id?:number})[] }): Promise<Product> => {
  try {
    const method = productData.id ? 'PUT' : 'POST';
    const url = productData.id ? apiUrl(`/api/products/${productData.id}`) : apiUrl('/api/products');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedProduct = await response.json();
    notifyUpdates();
    return savedProduct;
 } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: number): Promise<{ success: boolean, message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/products/${productId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Failed to delete product' };
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const cacheKey = 'getCategories';
  try {
    const result = await makeApiRequest(apiUrl('/api/categories'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const saveCategory = async (category: Omit<Category, 'id'> & { id?: number }): Promise<Category> => {
  try {
    const method = category.id ? 'PUT' : 'POST';
    const url = category.id ? apiUrl(`/api/categories/${category.id}`) : apiUrl('/api/categories');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(category)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedCategory = await response.json();
    notifyUpdates();
    return savedCategory;
  } catch (error) {
    console.error('Error saving category:', error);
    throw error;
 }
};

export const deleteCategory = async (categoryId: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/categories/${categoryId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.error };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, message: 'Failed to delete category' };
  }
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const cacheKey = 'getSettings';
  try {
    const result = await makeApiRequest(apiUrl('/api/settings'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings on error
    return {
      tax: { mode: 'none' },
      businessDay: { autoStartTime: '06:00', lastManualClose: null }
    };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const response = await fetch(apiUrl('/api/settings'), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
 }
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const cacheKey = 'getTransactions';
  try {
    const result = await makeApiRequest(apiUrl('/api/transactions'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const saveTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  try {
    const response = await fetch(apiUrl('/api/transactions'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedTransaction = await response.json();
    notifyUpdates();
    return savedTransaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
 }
};

// Tabs
export const getTabs = async (): Promise<Tab[]> => {
  const cacheKey = 'getTabs';
  try {
    const result = await makeApiRequest(apiUrl('/api/tabs'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return [];
  }
};

export const saveTab = async (tabData: Omit<Tab, 'id'> & {id?: number}): Promise<Tab> => {
  try {
    const method = tabData.id ? 'PUT' : 'POST';
    const url = tabData.id ? apiUrl(`/api/tabs/${tabData.id}`) : apiUrl('/api/tabs');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(tabData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedTab = await response.json();
    notifyUpdates();
    return savedTab;
 } catch (error) {
    console.error('Error saving tab:', error);
    throw error;
 }
};

export const deleteTab = async (tabId: number): Promise<void> => {
 try {
    const response = await fetch(apiUrl(`/api/tabs/${tabId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
  } catch (error) {
    console.error('Error deleting tab:', error);
    throw error;
 }
};

export const updateMultipleTabs = async (tabsToUpdate: Tab[]): Promise<void> => {
  // For now, update each tab individually
 const promises = tabsToUpdate.map(tab => saveTab(tab));
  await Promise.all(promises);
  notifyUpdates();
};

// Tills
export const getTills = async (): Promise<Till[]> => {
  const cacheKey = 'getTills';
  try {
    const result = await makeApiRequest(apiUrl('/api/tills'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching tills:', error);
    return [];
  }
};

export const saveTill = async (till: Omit<Till, 'id'> & { id?: number }): Promise<Till> => {
 try {
    const method = till.id ? 'PUT' : 'POST';
    const url = till.id ? apiUrl(`/api/tills/${till.id}`) : apiUrl('/api/tills');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(till)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedTill = await response.json();
    notifyUpdates();
    return savedTill;
  } catch (error) {
    console.error('Error saving till:', error);
    throw error;
  }
};

export const deleteTill = async (tillId: number): Promise<{success: boolean}> => {
  try {
    const response = await fetch(apiUrl(`/api/tills/${tillId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
    return { success: true };
 } catch (error) {
    console.error('Error deleting till:', error);
    return { success: false };
  }
};

// Stock Items
export const getStockItems = async (): Promise<StockItem[]> => {
  const cacheKey = 'getStockItems';
  try {
    const result = await makeApiRequest(apiUrl('/api/stock-items'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return [];
  }
};

export const saveStockItem = async (item: Omit<StockItem, 'id'> & { id?: string }): Promise<StockItem> => {
  try {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? apiUrl(`/api/stock-items/${item.id}`) : apiUrl('/api/stock-items');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(item)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedItem = await response.json();
    notifyUpdates();
    return savedItem;
 } catch (error) {
    console.error('Error saving stock item:', error);
    throw error;
 }
};

export const deleteStockItem = async (itemId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/stock-items/${itemId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.error };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return { success: false, message: 'Failed to delete stock item' };
  }
};

export const updateStockLevels = async (consumptions: { stockItemId: string, quantity: number }[]): Promise<void> => {
  try {
     const response = await fetch(apiUrl('/api/stock-items/update-levels'), {
       method: 'PUT',
       headers: getAuthHeaders(),
       body: JSON.stringify({ consumptions })
     });
     
     if (!response.ok) {
       // Check if it's a 400 error with a specific message
       if (response.status === 400) {
         const errorData = await response.json();
         console.warn('Stock level update response:', errorData);
         // If the error is related to invalid stock item references, we might want to handle it differently
         if (errorData.error && errorData.error.includes('Invalid stock item ID format')) {
           throw new Error(`Invalid stock item ID format: ${errorData.error}`);
         }
       }
       throw new Error(`HTTP error! status: ${response.status}`);
     }
     
     // Check if the response contains warnings (for orphaned references)
     const responseData = await response.json();
     if (responseData.warnings) {
       console.warn('Stock level update completed with warnings:', responseData.warnings);
     }
     
     notifyUpdates();
   } catch (error) {
     console.error('Error updating stock levels:', error);
     throw error;
 }
};

// Stock Adjustments
export const getStockAdjustments = async (): Promise<StockAdjustment[]> => {
  const cacheKey = 'getStockAdjustments';
  try {
    const result = await makeApiRequest(apiUrl('/api/stock-adjustments'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    return [];
  }
};

export const saveStockAdjustment = async (adjData: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> => {
  try {
    const response = await fetch(apiUrl('/api/stock-adjustments'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adjData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedAdjustment = await response.json();
    notifyUpdates();
    return savedAdjustment;
  } catch (error) {
    console.error('Error saving stock adjustment:', error);
    throw error;
 }
};

// Order Sessions
export const getOrderSession = async (): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl(`/api/order-sessions/current?userId=${userId}`));
    if (!response.ok) {
      if (response.status === 404) {
        // Return null or empty session if no active session exists
        return null;
      } else if (response.status === 401) {
        // User not authenticated, return null instead of throwing
        console.warn('User not authenticated for order session, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const saveOrderSession = async (orderItems: OrderItem[]): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session save, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: orderItems, userId })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn('User not authenticated for order session save, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const savedSession = await response.json();
    notifyUpdates();
    return savedSession;
  } catch (error) {
    console.error('Error saving order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const updateOrderSessionStatus = async (status: 'logout' | 'complete' | 'assign-tab'): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn(`No user authenticated for order session status update (${status}), returning null`);
      return null;
    }
    
    let endpoint = '';
    switch (status) {
      case 'logout':
        endpoint = '/api/order-sessions/current/logout';
        break;
      case 'complete':
        endpoint = '/api/order-sessions/current/complete';
        break;
      case 'assign-tab':
        endpoint = '/api/order-sessions/current/assign-tab';
        break;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
    
    const response = await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn(`User not authenticated for order session status update (${status}), returning null`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedSession = await response.json();
    notifyUpdates();
    return updatedSession;
  } catch (error) {
    console.error(`Error updating order session status (${status}):`, error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const clearOrderSession = async (): Promise<void> => {
  // Helper function to clear the session after completion
  // In our implementation, this happens by updating the status to 'completed' or 'pending_logout'
  console.log('Order session cleared');
};

// Logout function to clear user data from localStorage
export const logout = async (): Promise<void> => {
  // Clear user data from localStorage
  localStorage.removeItem('currentUser');
  console.log('User logged out and data cleared');
};

// Order Activity Log
export const getOrderActivityLogs = async (): Promise<OrderActivityLog[]> => {
  const cacheKey = 'getOrderActivityLogs';
  try {
    const result = await makeApiRequest(apiUrl('/api/order-activity-logs'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching order activity logs:', error);
    return [];
  }
};

export const saveOrderActivityLog = async (logData: Omit<OrderActivityLog, 'id' | 'createdAt'>): Promise<OrderActivityLog> => {
 try {
    const response = await fetch(apiUrl('/api/order-activity-logs'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedLog = await response.json();
    notifyUpdates();
    return savedLog;
  } catch (error) {
    console.error('Error saving order activity log:', error);
    throw error;
 }
};

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  const cacheKey = 'getRooms';
  try {
    const result = await makeApiRequest(apiUrl('/api/rooms'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

export const saveRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Room> => {
  try {
    const method = roomData.id ? 'PUT' : 'POST';
    const url = roomData.id ? apiUrl(`/api/rooms/${roomData.id}`) : apiUrl('/api/rooms');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedRoom = await response.json();
    notifyUpdates();
    return savedRoom;
  } catch (error) {
    console.error('Error saving room:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/rooms/${roomId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.error };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    return { success: false, message: 'Failed to delete room' };
  }
};

// Tables
export const getTables = async (): Promise<Table[]> => {
  const cacheKey = 'getTables';
  try {
    const result = await makeApiRequest(apiUrl('/api/tables'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
};

export const saveTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Table> => {
  try {
    const method = tableData.id ? 'PUT' : 'POST';
    const url = tableData.id ? apiUrl(`/api/tables/${tableData.id}`) : apiUrl('/api/tables');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(tableData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const savedTable = await response.json();
    notifyUpdates();
    return savedTable;
  } catch (error) {
    console.error('Error saving table:', error);
    throw error;
 }
};

export const deleteTable = async (tableId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.error };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting table:', error);
    return { success: false, message: 'Failed to delete table' };
  }
};

// Function to update table position specifically (for drag/drop operations)
export const updateTablePosition = async (tableId: string, x: number, y: number): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/position`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ positionX: x, positionY: y })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error('Error updating table position:', error);
    throw error;
 }
};