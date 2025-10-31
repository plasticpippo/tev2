import { http, HttpResponse } from 'msw';
import type { User, Product, Category, Settings, Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog, OrderItem, ProductVariant } from '../../../shared/types';

// Mock data
const mockUsers: User[] = [
  { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' },
  { id: 2, name: 'Jane Smith', username: 'janesmith', password_HACK: 'password456', role: 'Cashier' },
  { id: 3, name: 'Bob Johnson', username: 'bobjohnson', password_HACK: 'password789', role: 'Cashier' },
  { id: 4, name: 'Admin User', username: 'admin', password_HACK: 'admin123', role: 'Admin' }
];

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Coffee',
    categoryId: 1,
    variants: [
      {
        id: 1,
        productId: 1,
        name: 'Regular Coffee',
        price: 2.50,
        stockConsumption: [
          { stockItemId: 1, quantity: 0.1 }
        ],
        backgroundColor: '#6f4e37',
        textColor: '#ffffff'
      }
    ]
  },
  {
    id: 2,
    name: 'Tea',
    categoryId: 1,
    variants: [
      {
        id: 2,
        productId: 2,
        name: 'Green Tea',
        price: 2.00,
        stockConsumption: [
          { stockItemId: 2, quantity: 0.05 }
        ],
        backgroundColor: '#d2b48c',
        textColor: '#00000'
      }
    ]
  },
  {
    id: 3,
    name: 'Burger',
    categoryId: 2,
    variants: [
      {
        id: 3,
        productId: 3,
        name: 'Classic Burger',
        price: 8.99,
        stockConsumption: [
          { stockItemId: 3, quantity: 0.2 }
        ],
        backgroundColor: '#d2691e',
        textColor: '#ffffff'
      }
    ]
  }
];

const mockCategories: Category[] = [
  { id: 1, name: 'Drinks', visibleTillIds: [1, 2] },
 { id: 2, name: 'Food', visibleTillIds: [1, 2] }
];

const mockOrderItem: OrderItem = {
  id: '1',
  variantId: 1,
  productId: 1,
  name: 'Regular Coffee',
  price: 2.50,
 quantity: 1,
  effectiveTaxRate: 0.2
};

const mockTransactions: Transaction[] = [
  {
    id: 1,
    items: [mockOrderItem],
    subtotal: 2.50,
    tax: 0.50,
    tip: 0.50,
    total: 3.50,
    paymentMethod: 'cash',
    userId: 1,
    userName: 'John Doe',
    tillId: 1,
    tillName: 'Till 1',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    items: [mockOrderItem],
    subtotal: 2.50,
    tax: 0.50,
    tip: 0,
    total: 3.00,
    paymentMethod: 'card',
    userId: 2,
    userName: 'Jane Smith',
    tillId: 2,
    tillName: 'Till 2',
    createdAt: new Date().toISOString()
  }
];

const mockTabs: Tab[] = [
  {
    id: 1,
    name: 'Table 1',
    items: [],
    createdAt: new Date().toISOString(),
    tillId: 1,
    tillName: 'Till 1'
  },
  {
    id: 2,
    name: 'Table 2',
    items: [],
    createdAt: new Date().toISOString(),
    tillId: 2,
    tillName: 'Till 2'
  }
];

const mockTills: Till[] = [
  { id: 1, name: 'Till 1' },
 { id: 2, name: 'Till 2' }
];

const mockStockItems: StockItem[] = [
  {
    id: 1,
    name: 'Coffee Beans',
    quantity: 100,
    type: 'Ingredient',
    baseUnit: 'kg',
    purchasingUnits: [
      { id: 'kg', name: 'Kilogram', multiplier: 1 },
      { id: 'g', name: 'Gram', multiplier: 1000 }
    ]
  },
  {
    id: 2,
    name: 'Tea Leaves',
    quantity: 50,
    type: 'Ingredient',
    baseUnit: 'kg',
    purchasingUnits: [
      { id: 'kg', name: 'Kilogram', multiplier: 1 },
      { id: 'g', name: 'Gram', multiplier: 1000 }
    ]
  }
];

const mockStockAdjustments: StockAdjustment[] = [
 {
    id: 1,
    stockItemId: 1,
    itemName: 'Coffee Beans',
    quantity: 10,
    reason: 'Delivery',
    userId: 1,
    userName: 'John Doe',
    createdAt: new Date().toISOString()
  }
];

const mockOrderActivityLogs: OrderActivityLog[] = [
  {
    id: 1,
    action: 'Item Removed',
    details: 'Removed 1x Regular Coffee',
    userId: 1,
    userName: 'John Doe',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    action: 'Order Cleared',
    details: [],
    userId: 2,
    userName: 'Jane Smith',
    createdAt: new Date().toISOString()
  }
];

const mockSettings: Settings = {
  tax: { mode: 'none' },
  businessDay: { autoStartTime: '06:00', lastManualClose: null }
};

export const handlers = [
  // Users API
 http.get('/api/users', () => {
    return HttpResponse.json(mockUsers);
  }),
  
  http.get('/api/users/:id', ({ params }) => {
    const userId = Number(params.id);
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(user);
 }),
  
  http.post('/api/users', async ({ request }) => {
    const userData = await request.json() as Omit<User, 'id'>;
    const newUser = { id: mockUsers.length + 1, ...userData } as User;
    mockUsers.push(newUser);
    
    return HttpResponse.json(newUser, { status: 201 });
  }),
  
  http.put('/api/users/:id', async ({ request, params }) => {
    const userId = Number(params.id);
    const userData = await request.json() as Partial<User>;
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData } as User;
    
    return HttpResponse.json(mockUsers[userIndex]);
  }),
  
  http.delete('/api/users/:id', ({ params }) => {
    const userId = Number(params.id);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockUsers.splice(userIndex, 1);
    
    return new HttpResponse(null, { status: 204 });
  }),
  
  http.post('/api/users/login', async ({ request }) => {
    const { username, password } = await request.json() as { username: string; password: string };
    const user = mockUsers.find(u => u.username === username && u.password_HACK === password);
    
    if (!user) {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    return HttpResponse.json(user);
  }),
  
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts);
  }),
  
  http.get('/api/products/:id', ({ params }) => {
    const productId = Number(params.id);
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(product);
  }),
  
  http.post('/api/products', async ({ request }) => {
    const productData = await request.json() as Omit<Product, 'id'>;
    const newProduct = { id: mockProducts.length + 1, ...productData } as Product;
    mockProducts.push(newProduct);
    
    return HttpResponse.json(newProduct, { status: 201 });
  }),
  
  http.put('/api/products/:id', async ({ request, params }) => {
    const productId = Number(params.id);
    const productData = await request.json() as Partial<Product>;
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockProducts[productIndex] = { ...mockProducts[productIndex], ...productData } as Product;
    
    return HttpResponse.json(mockProducts[productIndex]);
  }),
  
  http.delete('/api/products/:id', ({ params }) => {
    const productId = Number(params.id);
    const productIndex = mockProducts.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockProducts.splice(productIndex, 1);
    
    return new HttpResponse(null, { status: 204 });
  }),
  
  // Categories API
  http.get('/api/categories', () => {
    return HttpResponse.json(mockCategories);
  }),
  
  // Settings API
  http.get('/api/settings', () => {
    return HttpResponse.json(mockSettings);
  }),
  
  http.put('/api/settings', async ({ request }) => {
    const settingsData = await request.json() as Settings;
    Object.assign(mockSettings, settingsData);
    
    return HttpResponse.json(mockSettings);
  }),
  
  // Transactions API
  http.get('/api/transactions', () => {
    return HttpResponse.json(mockTransactions);
  }),
  
  // Tabs API
  http.get('/api/tabs', () => {
    return HttpResponse.json(mockTabs);
  }),
  
  // Tills API
  http.get('/api/tills', () => {
    return HttpResponse.json(mockTills);
  }),
  
  // Stock Items API
 http.get('/api/stock-items', () => {
    return HttpResponse.json(mockStockItems);
  }),
  
  // Stock Adjustments API
  http.get('/api/stock-adjustments', () => {
    return HttpResponse.json(mockStockAdjustments);
  }),
  
  // Order Activity Logs API
 http.get('/api/order-activity-logs', () => {
    return HttpResponse.json(mockOrderActivityLogs);
  }),
  
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'API is running', timestamp: new Date().toISOString() });
  })
];