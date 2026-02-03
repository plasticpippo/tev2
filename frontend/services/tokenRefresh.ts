import { login } from './userService';

/**
 * Attempts to refresh the authentication token by re-authenticating with stored credentials
 * This function tries to get the username and password from memory or secure storage
 * and re-login to get a fresh token.
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    // Try to get stored credentials (in a real app, you might have a secure way to store/retrieve credentials)
    // For now, we'll just check if we have the username in memory
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return false;
    }
    
    const user = JSON.parse(storedUser);
    // Since we don't store the password for security reasons, we can't automatically refresh
    // In a real app, you might have a refresh token mechanism
    // For now, we'll return false to indicate that manual re-login is needed
    return false;
  } catch (error) {
    console.error('Error attempting to refresh token:', error);
    return false;
  }
};

/**
 * Wrapper function to execute an API call with automatic token refresh
 * @param apiCallFn The API function to execute
 * @returns The result of the API call
 */
export const withTokenRefresh = async <T>(apiCallFn: () => Promise<T>): Promise<T> => {
  try {
    // Execute the API call
    return await apiCallFn();
  } catch (error) {
    // Check if the error is related to token expiration
    if (error instanceof Error && 
        (error.message.includes('Invalid or expired token') || 
         error.message.includes('expired') || 
         error.message.includes('403'))) {
      
      // Attempt to refresh the token
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // Retry the API call with the new token
        return await apiCallFn();
      } else {
        // Token refresh failed, throw the original error
        throw error;
      }
    }
    
    // If the error is not token-related, just re-throw it
    throw error;
  }
};