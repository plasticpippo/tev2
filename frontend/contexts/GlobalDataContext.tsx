import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  User, Product, Category, Settings,
  Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog,
  Room, Table, ProductVariant
} from '../../shared/types';
import * as api from '../services/apiService';
import { subscribeToUpdates, isAuthTokenReady } from '../services/apiBase';
import { useSessionContext } from './SessionContext';

interface GlobalDataContextType {
  appData: {
    products: Product[];
    categories: Category[];
    users: User[];
    tills: Till[];
    settings: Settings | null;
    transactions: Transaction[];
    tabs: Tab[];
    stockItems: StockItem[];
    stockAdjustments: StockAdjustment[];
    orderActivityLogs: OrderActivityLog[];
    rooms: Room[];
    tables: Table[];
  };
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  makableVariantIds: Set<number>;
  currentTillName: string;
  fetchData: () => Promise<void>;
  debouncedFetchData: () => void;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const [appData, setAppData] = useState<{
    products: Product[];
    categories: Category[];
    users: User[];
    tills: Till[];
    settings: Settings | null;
    transactions: Transaction[];
    tabs: Tab[];
    stockItems: StockItem[];
    stockAdjustments: StockAdjustment[];
    orderActivityLogs: OrderActivityLog[];
    rooms: Room[];
    tables: Table[];
  }>({
    products: [], categories: [], users: [], tills: [], settings: null,
    transactions: [], tabs: [], stockItems: [], stockAdjustments: [], orderActivityLogs: [],
    rooms: [], tables: []
 });
  const [isLoading, setIsLoading] = useState(true);
  
  const { assignedTillId, currentUser, handleLogout } = useSessionContext();

  // Ref to store timeout ID for cleanup on unmount
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce function to prevent rapid API calls
  const debounce = (func: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    // Check if user is still authenticated before making API calls
    // This prevents API calls after logout (e.g., from in-flight operations that trigger notifyUpdates)
    if (!currentUser || !isAuthTokenReady()) {
      console.log(t('globalDataContext.fetchDataNotAuthenticated'));
      setIsLoading(false);
      return;
    }

    try {
      const [
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs, rooms, tables
      ] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getUsers(),
        api.getTills(),
        api.getSettings(),
        api.getTransactions(),
        api.getTabs(),
        api.getStockItems(),
        api.getStockAdjustments(),
        api.getOrderActivityLogs(),
        api.getRooms(),
        api.getTables()
      ]);
      setAppData({
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs, rooms, tables
      });
    } catch (error) {
      console.error(t('globalDataContext.failedToFetchInitialData'), error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, t]);

  // Debounced version of fetchData to prevent multiple rapid calls
  const debouncedFetchData = useCallback(debounce(fetchData, 300), [fetchData]);

  useEffect(() => {
    // Only fetch data when user is authenticated AND token is ready
    // This prevents API calls on the login screen and ensures auth token is available
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    // Check if authentication token is ready before making API calls
    if (!isAuthTokenReady()) {
      // Token not ready yet, wait and try again
      const checkTokenInterval = setInterval(() => {
        // Stop polling if user logged out
        if (!currentUser) {
          clearInterval(checkTokenInterval);
          return;
        }
        if (isAuthTokenReady()) {
          clearInterval(checkTokenInterval);
          setIsLoading(true);
          fetchData();
        }
      }, 50); // Check every 50ms

      // Cleanup interval after 5 seconds to prevent infinite checking
      const timeoutId = setTimeout(() => {
        clearInterval(checkTokenInterval);
        // If token still not ready after timeout, clear loading state to prevent indefinite hang
        if (!isAuthTokenReady()) {
          console.error(t('globalDataContext.authTokenTimeout'));
          setIsLoading(false);
          // Clear the invalid user session to force re-login
          handleLogout();
        }
      }, 5000);

      return () => {
        clearInterval(checkTokenInterval);
        clearTimeout(timeoutId);
      };
    }
    
    // Set loading to true before fetching data
    setIsLoading(true);
    
    // Fetch data when user is logged in and token is ready
    fetchData();
    const unsubscribe = subscribeToUpdates(debouncedFetchData);
    return () => unsubscribe();
  }, [fetchData, debouncedFetchData, currentUser, handleLogout]);

  // --- STOCK & PRODUCT COMPUTATIONS ---
  const makableVariantIds = useMemo(() => {
    const stockMap = new Map(appData.stockItems.map(item => [item.id, item.quantity]));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const makableIds = new Set<number>();
    appData.products.forEach(product => {
      product.variants.forEach(variant => {
        // Only consider valid stock consumption records (with proper UUID format and existing stock items)
        const validStockConsumptions = variant.stockConsumption.filter(
          ({ stockItemId }) => uuidRegex.test(stockItemId) && stockMap.has(stockItemId)
        );
        
        // Check if all valid stock consumption requirements can be met
        const canMake = validStockConsumptions.every(
          ({ stockItemId, quantity }) => (stockMap.get(stockItemId) ?? 0) >= quantity
        );
        
        // Only consider the variant makable if all of its valid stock consumption requirements can be met
        // If a variant has invalid stock references, it should not be considered makable
        if (canMake && validStockConsumptions.length === variant.stockConsumption.length) {
          makableIds.add(variant.id);
        } else if (validStockConsumptions.length < variant.stockConsumption.length) {
          // Log warning for variants with invalid stock references
          const invalidRefs = variant.stockConsumption.filter(
            ({ stockItemId }) => !uuidRegex.test(stockItemId) || !stockMap.has(stockItemId)
          );
          console.warn(t('globalDataContext.variantInvalidStockRefs', { variantId: variant.id, productName: product.name, variantName: variant.name }),
                       invalidRefs.map(ref => ref.stockItemId));
        }
      });
    });
    return makableIds;
  }, [appData.stockItems, appData.products, t]);

  const currentTillName = useMemo(() => {
    if (!assignedTillId) return t('globalDataContext.tillNotConfigured');
    return appData.tills.find(t => t.id === assignedTillId)?.name || t('globalDataContext.unknownTill');
  }, [assignedTillId, appData.tills, t]);

  const value: GlobalDataContextType = {
    appData,
    isLoading,
    setIsLoading,
    makableVariantIds,
    currentTillName,
    fetchData,
    debouncedFetchData
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalDataContext = () => {
  const { t } = useTranslation();
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error(t('globalDataContext.contextError'));
  }
  return context;
};