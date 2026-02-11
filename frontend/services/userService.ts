import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { User } from '../../shared/types';

// Users
export const getUsers = async (): Promise<User[]> => {
  const cacheKey = 'getUsers';
  try {
    const result = await makeApiRequest(apiUrl('/api/users'), { headers: getAuthHeaders() }, cacheKey);
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete user' };
  }
};

export const login = async (username: string, password: string): Promise<User> => {
  try {
    const response = await fetch(apiUrl('/api/users/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const userData = await response.json();
    // Store user in localStorage upon successful login for API authentication
    localStorage.setItem('currentUser', JSON.stringify(userData));
    // Also store the token separately for easier access by getAuthHeaders
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
    return userData;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Logout function to clear user data from localStorage
export const logout = async (): Promise<void> => {
  // Clear user data from localStorage
  localStorage.removeItem('currentUser');
  // Also clear the auth token
  localStorage.removeItem('authToken');
  console.log('User logged out and data cleared');
};