import type { OrderItem } from '../../shared/types';
import { HTTP_ERROR_MESSAGES, CUSTOM_ERROR_MESSAGES } from '../utils/errorMessages';

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

// Define DailyClosing interface
export interface DailyClosing {
  id: number;
  createdAt: string;
 closedAt: string;
  summary: {
    transactions: number;
    totalSales: number;
    totalTax: number;
    totalTips: number;
    paymentMethods: Record<string, { count: number; total: number }>;
    tills: Record<string, { transactions: number; total: number }>;
  };
 userId: number;
 userName: string;
}


// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// --- API BASE URL HELPER ---
const getApiBaseUrl = (): string => {
  // In development, use the VITE_API_URL from .env
  if ((import.meta as any).env.DEV) {
     return (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
   }
   // In production, construct the API URL based on the current hostname but different port
   // This allows the frontend to work when accessed from different IPs (localhost, LAN IP, etc.)
   const protocol = window.location.protocol;
   const hostname = window.location.hostname;
   const backendPort = 3001; // Backend runs on port 3001
   return `${protocol}//${hostname}:${backendPort}`;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to construct full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
 const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function to get headers with credentials
export const getAuthHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    // In a real implementation, you might include a token here if using JWT
    // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  };
};

// --- SUBSCRIBER for real-time updates ---
export let subscribers: (() => void)[] = [];

export const subscribeToUpdates = (callback: () => void): (() => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
 };
};

export const notifyUpdates = () => {
  console.log("Notifying subscribers of data change...");
  subscribers.forEach(callback => callback());
};

// --- API FUNCTIONS ---

// Helper function for making API requests with deduplication
export const makeApiRequest = async (url: string, options?: RequestInit, cacheKey?: string): Promise<any> => {
  // If a cache key is provided, check if we have a pending request
  if (cacheKey && requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const requestPromise = fetch(url, options)
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Extract path from URL for custom error messages
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Check for custom error message based on path and status
        const customMessage = CUSTOM_ERROR_MESSAGES[path]?.[response.status];
        const defaultHttpMessage = HTTP_ERROR_MESSAGES[response.status];
        const serverMessage = errorData.error;
        
        // Build error message in order of preference: custom -> server -> default HTTP message
        const errorMessage = customMessage || serverMessage || defaultHttpMessage || `HTTP error! status: ${response.status}`;
        
        throw new Error(errorMessage);
      }
      return await response.json();
    })
    .catch(error => {
      console.error(`Error making request to ${url}:`, error);
      // If it's already an Error object, just rethrow it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it in an Error object
      throw new Error(error.message || 'An unexpected error occurred');
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