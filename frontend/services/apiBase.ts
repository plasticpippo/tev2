import type { OrderItem } from '@shared/types';
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
   // In production, use the current hostname and port
   // The nginx proxy at port 80 handles both frontend and API requests
   const protocol = window.location.protocol;
   const hostname = window.location.hostname;
   const port = window.location.port || (protocol === 'https:' ? '443' : '80');
   return `${protocol}//${hostname}:${port}`;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to construct full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
 const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function to decode JWT token to check if it's expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    // Consider token as expired 5 minutes before actual expiration for safety
    return payload.exp < currentTime + 300;
  } catch (e) {
    // If we can't decode the token, assume it's invalid/expired
    return true;
  }
};

// Helper function to check if token is about to expire (within 10 minutes)
export const isTokenExpiringSoon = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (token) {
    return isTokenExpired(token);
  }
  
  // Also check the token in currentUser
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.token) {
        return isTokenExpired(currentUser.token);
      }
    } catch (e) {
      // Invalid JSON in localStorage, ignore
    }
  }
  
  return true; // If no token found, it's considered expiring/missing
};

// Helper function to get headers with credentials
export const getAuthHeaders = (): Record<string, string> => {
  let token = localStorage.getItem('authToken');
  
  // Check if token exists and is expired
  if (token && isTokenExpired(token)) {
    console.log('Token is expired, clearing it from storage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    token = null;
    
    // Redirect to login if on a protected route
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      window.location.href = '/';
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from localStorage - try both token and currentUser formats
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Fallback: check if currentUser contains a token
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.token) {
          // Check if this token is also expired
          if (isTokenExpired(currentUser.token)) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            // Redirect to login if on a protected route
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
              window.location.href = '/';
            }
          } else {
            headers['Authorization'] = `Bearer ${currentUser.token}`;
          }
        }
      } catch (e) {
        // Invalid JSON in localStorage, ignore
      }
    }
  }
  
  return headers;
};

// Helper function to check if authentication token is available
export const isAuthTokenReady = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (token) return true;
  
  // Check if currentUser contains a token
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      return !!currentUser.token;
    } catch (e) {
      return false;
    }
  }
  
  return false;
};

// --- SUBSCRIBER for real-time updates ---
export let subscribers: (() => void)[] = [];

export const subscribeToUpdates = (callback: () => void): (() => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
};

export const clearAllSubscribers = (): void => {
  console.log("Clearing all subscribers...");
  subscribers = [];
};

export const notifyUpdates = () => {
  console.log("Notifying subscribers of data change...");
  subscribers.forEach(callback => callback());
};

// --- API FUNCTIONS ---

// Timeout duration in milliseconds (10 seconds)
const API_TIMEOUT_MS = 10000;

// Helper function for making API requests with deduplication and timeout
export const makeApiRequest = async (url: string, options?: RequestInit, cacheKey?: string): Promise<any> => {
  // If a cache key is provided, check if we have a pending request
  if (cacheKey && requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Merge the abort signal with any existing options
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    signal: controller.signal,
  };

  const requestPromise = fetch(url, fetchOptions)
    .then(async response => {
      clearTimeout(timeoutId);
      
      // Handle 403 Forbidden specifically (usually means token is invalid/expired)
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if the error is related to token expiration
        if (errorData.error && (errorData.error.includes('Invalid or expired token') || errorData.error.includes('expired'))) {
          console.log('Token expired or invalid, clearing authentication and redirecting to login');
          
          // Clear authentication data
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          
          // Redirect to login if on a protected route
          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            window.location.href = '/';
          }
        }
        
        throw new Error(errorData.error || 'Invalid or expired token. Please log in again.');
      }
      
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
      // Handle 204 No Content responses - they have no body to parse
      if (response.status === 204) {
        return null;
      }
      return await response.json();
    })
    .catch(error => {
      clearTimeout(timeoutId);
      // Handle AbortError specifically for timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network connection and try again.');
      }
      // Don't log or rethrow abort errors - they're expected when cancelling
      if (error instanceof Error && error.message?.includes('aborted')) {
        throw error;
      }
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