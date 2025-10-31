import type {
  User, Product, Category, Settings, Transaction, Tab, OrderItem,
  Till, StockItem, StockAdjustment, OrderActivityLog, ProductVariant
} from '../../shared/types';

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

// Users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const saveUser = async (user: Omit<User, 'id'> & { id?: number }): Promise<User> => {
  try {
    const method = user.id ? 'PUT' : 'POST';
    const url = user.id ? `/api/users/${user.id}` : '/api/users';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
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
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
 }
};

// Products, Variants
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const saveProduct = async (productData: Omit<Product, 'id' | 'variants'> & { id?: number; variants: (Omit<ProductVariant, 'id' | 'productId'> & {id?:number})[] }): Promise<Product> => {
  try {
    const method = productData.id ? 'PUT' : 'POST';
    const url = productData.id ? `/api/products/${productData.id}` : '/api/products';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
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
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const saveCategory = async (category: Omit<Category, 'id'> & { id?: number }): Promise<Category> => {
  try {
    const method = category.id ? 'PUT' : 'POST';
    const url = category.id ? `/api/categories/${category.id}` : '/api/categories';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE'
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
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
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
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
  try {
    const response = await fetch('/api/transactions');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const saveTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  try {
    const response = await fetch('/api/tabs');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return [];
  }
};

export const saveTab = async (tabData: Omit<Tab, 'id'> & {id?: number}): Promise<Tab> => {
  try {
    const method = tabData.id ? 'PUT' : 'POST';
    const url = tabData.id ? `/api/tabs/${tabData.id}` : '/api/tabs';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`/api/tabs/${tabId}`, {
      method: 'DELETE'
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
  try {
    const response = await fetch('/api/tills');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching tills:', error);
    return [];
  }
};

export const saveTill = async (till: Omit<Till, 'id'> & { id?: number }): Promise<Till> => {
 try {
    const method = till.id ? 'PUT' : 'POST';
    const url = till.id ? `/api/tills/${till.id}` : '/api/tills';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`/api/tills/${tillId}`, {
      method: 'DELETE'
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
  try {
    const response = await fetch('/api/stock-items');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return [];
  }
};

export const saveStockItem = async (item: Omit<StockItem, 'id'> & { id?: number }): Promise<StockItem> => {
  try {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `/api/stock-items/${item.id}` : '/api/stock-items';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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

export const deleteStockItem = async (itemId: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`/api/stock-items/${itemId}`, {
      method: 'DELETE'
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

export const updateStockLevels = async (consumptions: { stockItemId: number, quantity: number }[]): Promise<void> => {
 try {
    const response = await fetch('/api/stock-items/update-levels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumptions })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    notifyUpdates();
  } catch (error) {
    console.error('Error updating stock levels:', error);
    throw error;
 }
};

// Stock Adjustments
export const getStockAdjustments = async (): Promise<StockAdjustment[]> => {
  try {
    const response = await fetch('/api/stock-adjustments');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    return [];
  }
};

export const saveStockAdjustment = async (adjData: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> => {
  try {
    const response = await fetch('/api/stock-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// Order Activity Log
export const getOrderActivityLogs = async (): Promise<OrderActivityLog[]> => {
  try {
    const response = await fetch('/api/order-activity-logs');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching order activity logs:', error);
    return [];
  }
};

export const saveOrderActivityLog = async (logData: Omit<OrderActivityLog, 'id' | 'createdAt'>): Promise<OrderActivityLog> => {
  try {
    const response = await fetch('/api/order-activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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