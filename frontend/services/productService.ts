import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Product, Category, ProductVariant } from '../../shared/types';
import i18n from '../src/i18n';

// Products
export const getProducts = async (): Promise<Product[]> => {
  const cacheKey = 'getProducts';
  try {
    const result = await makeApiRequest(apiUrl('/api/products'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('productService.errorFetchingProducts'), error);
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedProduct = await response.json();
    notifyUpdates();
    return savedProduct;
  } catch (error) {
    console.error(i18n.t('productService.errorSavingProduct'), error);
    throw error;
  }
};

export const deleteProduct = async (productId: number): Promise<{ success: boolean, message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/products/${productId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error(i18n.t('productService.errorDeletingProduct'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('productService.failedDeleteProduct') };
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const cacheKey = 'getCategories';
  try {
    const result = await makeApiRequest(apiUrl('/api/categories'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('productService.errorFetchingCategories'), error);
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedCategory = await response.json();
    notifyUpdates();
    return savedCategory;
  } catch (error) {
    console.error(i18n.t('productService.errorSavingCategory'), error);
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error(i18n.t('productService.errorDeletingCategory'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('productService.failedDeleteCategory') };
  }
};