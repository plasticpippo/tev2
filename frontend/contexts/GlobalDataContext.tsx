import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  User, Product, Category, Settings,
  Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog,
  Room, Table, ProductVariant
} from '../../shared/types';
import * as api from '../services/apiService';
import { subscribeToUpdates } from '../services/apiBase';
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
  
  const { assignedTillId } = useSessionContext();

  // Debounce function to prevent rapid API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
 };

  const fetchData = useCallback(async () => {
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
      console.error("Failed to fetch initial data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced version of fetchData to prevent multiple rapid calls
  const debouncedFetchData = useCallback(debounce(fetchData, 300), [fetchData]);

  useEffect(() => {
    // If no till is assigned, we don't need to load all data, just enough to set up.
    if (!assignedTillId) {
      setIsLoading(false);
      return;
    }
    fetchData();
    const unsubscribe = subscribeToUpdates(debouncedFetchData);
    return () => unsubscribe();
  }, [fetchData, debouncedFetchData, assignedTillId]);

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
          console.warn(`Variant ${variant.id} (${product.name} - ${variant.name}) has invalid stock references:`,
                       invalidRefs.map(ref => ref.stockItemId));
        }
      });
    });
    return makableIds;
  }, [appData.stockItems, appData.products]);

  const currentTillName = useMemo(() => {
    if (!assignedTillId) return "Not Configured";
    return appData.tills.find(t => t.id === assignedTillId)?.name || 'Unknown Till';
  }, [assignedTillId, appData.tills]);

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
 const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalDataContext must be used within a GlobalDataProvider');
  }
  return context;
};