import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListFilters,
  Receipt,
  CreateReceiptInput,
  UpdateReceiptInput,
  IssueReceiptInput,
  VoidReceiptInput,
  SendReceiptEmailInput,
  ReceiptListFilters,
  PaginatedResponse,
} from '../../shared/types';
import i18n from '../src/i18n';

// ============================================================================
// CUSTOMER API
// ============================================================================

export const getCustomers = async (filters?: CustomerListFilters): Promise<PaginatedResponse<Customer>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = apiUrl(`/api/customers${queryString ? `?${queryString}` : ''}`);

  try {
    const result = await makeApiRequest(url);
    return result;
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingCustomers'), error);
    throw error;
  }
};

export const getCustomer = async (id: number): Promise<Customer> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/customers/${id}`));
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingCustomer'), error);
    throw error;
  }
};

export const createCustomer = async (data: CreateCustomerInput): Promise<Customer> => {
  try {
    const response = await fetch(apiUrl('/api/customers'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorCreatingCustomer'), error);
    throw error;
  }
};

export const updateCustomer = async (id: number, data: UpdateCustomerInput): Promise<Customer> => {
  try {
    const response = await fetch(apiUrl(`/api/customers/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorUpdatingCustomer'), error);
    throw error;
  }
};

export const searchCustomers = async (searchTerm: string, limit: number = 10): Promise<Customer[]> => {
  const params = new URLSearchParams();
  params.append('search', searchTerm);
  params.append('pageSize', String(limit));

  try {
    const result = await makeApiRequest(apiUrl(`/api/customers?${params.toString()}`));
    return result.customers || result.data || [];
  } catch (error) {
    console.error(i18n.t('receiptService.errorSearchingCustomers'), error);
    return [];
  }
};

// ============================================================================
// RECEIPT API
// ============================================================================

export const getReceipts = async (filters?: ReceiptListFilters): Promise<PaginatedResponse<Receipt>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('limit', String(filters.pageSize));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.generationStatus) params.append('generationStatus', filters.generationStatus);
  if (filters?.customerId) params.append('customerId', String(filters.customerId));
  if (filters?.startDate) params.append('issuedAtFrom', filters.startDate);
  if (filters?.endDate) params.append('issuedAtTo', filters.endDate);
  if (filters?.receiptNumber) params.append('receiptNumber', filters.receiptNumber);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = apiUrl(`/api/receipts${queryString ? `?${queryString}` : ''}`);

  try {
    const result = await makeApiRequest(url);
    return {
      data: result.receipts || [],
      pagination: {
        page: result.pagination?.page || 1,
        pageSize: result.pagination?.limit || 20,
        totalItems: result.pagination?.totalCount || 0,
        totalPages: result.pagination?.totalPages || 0,
        hasNextPage: result.pagination?.hasNextPage || false,
        hasPrevPage: result.pagination?.hasPrevPage || false,
      },
    };
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingReceipts'), error);
    throw error;
  }
};

export const getReceipt = async (id: number): Promise<Receipt> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/receipts/${id}`));
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingReceipt'), error);
    throw error;
  }
};

export const getReceiptByNumber = async (receiptNumber: string): Promise<Receipt> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/receipts/number/${receiptNumber}`));
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingReceipt'), error);
    throw error;
  }
};

export const createReceipt = async (data: CreateReceiptInput): Promise<Receipt> => {
  try {
    const response = await fetch(apiUrl('/api/receipts'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorCreatingReceipt'), error);
    throw error;
  }
};

export const updateReceipt = async (id: number, data: UpdateReceiptInput): Promise<Receipt> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorUpdatingReceipt'), error);
    throw error;
  }
};

export const issueReceipt = async (id: number, data?: IssueReceiptInput): Promise<Receipt> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${id}/issue`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorIssuingReceipt'), error);
    throw error;
  }
};

export const voidReceipt = async (id: number, data: VoidReceiptInput): Promise<Receipt> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${id}/void`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorVoidingReceipt'), error);
    throw error;
  }
};

export const sendReceiptEmail = async (id: number, data: SendReceiptEmailInput): Promise<{ id: number; receiptNumber: string; emailRecipient: string; emailStatus: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${id}/email`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorSendingReceiptEmail'), error);
    throw error;
  }
};

export const getReceiptPdf = async (id: number, regenerate: boolean = false): Promise<Blob> => {
  try {
    const params = new URLSearchParams();
    if (regenerate) params.append('regenerate', 'true');

    const queryString = params.toString();
    const url = apiUrl(`/api/receipts/${id}/pdf${queryString ? `?${queryString}` : ''}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    return await response.blob();
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingReceiptPdf'), error);
    throw error;
  }
};

export const downloadReceiptPdf = async (receipt: Receipt): Promise<void> => {
  try {
    const blob = await getReceiptPdf(receipt.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(i18n.t('receiptService.errorDownloadingReceiptPdf'), error);
    throw error;
  }
};

export const checkTransactionHasReceipt = async (transactionId: number): Promise<{ hasReceipt: boolean; receiptId?: number; receiptNumber?: string }> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/transactions/${transactionId}/receipt`));
    return result.data || { hasReceipt: false };
  } catch (error) {
    // If 404, no receipt exists
    return { hasReceipt: false };
  }
};

export interface PendingReceipt {
  id: number;
  receiptNumber: string;
  total: number;
  status: string;
  generationStatus: 'pending' | 'failed';
  generationError?: string;
  createdAt: string;
  issuedBy: number;
}

export const getPendingReceipts = async (): Promise<PendingReceipt[]> => {
  try {
    const result = await makeApiRequest(apiUrl('/api/receipts/pending'));
    return result.data || [];
  } catch (error) {
    console.error(i18n.t('receiptService.errorFetchingPendingReceipts'), error);
    return [];
  }
};

export const retryReceiptGeneration = async (id: number): Promise<Receipt> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${id}/retry`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result.data;
  } catch (error) {
    console.error(i18n.t('receiptService.errorRetryingReceipt'), error);
    throw error;
  }
};

// ============================================================================
// EMAIL QUEUE API
// ============================================================================

export interface EmailJob {
  id: string;
  receiptId: number;
  recipientEmail: string;
  subject: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
  processedAt: string | null;
  sentAt: string | null;
  nextAttemptAt: string | null;
  receipt?: {
    receiptNumber: string;
  };
}

export interface EmailQueueOverview {
  data: EmailJob[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getReceiptEmailJobs = async (receiptId: number): Promise<EmailJob[]> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/receipts/${receiptId}/email-jobs`));
    return result.data || [];
  } catch (error) {
    console.error('Error fetching email jobs:', error);
    return [];
  }
};

export const resendReceiptEmail = async (
  receiptId: number,
  email?: string,
  message?: string
): Promise<{ message: string; job: any }> => {
  try {
    const response = await fetch(apiUrl(`/api/receipts/${receiptId}/resend-email`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        ...(email && { email }),
        ...(message && { message }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || i18n.t('api.httpError', { status: response.status }));
    }

    const result = await response.json();
    notifyUpdates();
    return result;
  } catch (error) {
    console.error('Error resending receipt email:', error);
    throw error;
  }
};

export const getEmailQueueOverview = async (
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<EmailQueueOverview> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', String(page));
  params.append('limit', String(limit));

  try {
    const result = await makeApiRequest(apiUrl(`/api/receipts/email-queue/overview?${params.toString()}`));
    return result;
  } catch (error) {
    console.error('Error fetching email queue overview:', error);
    throw error;
  }
};
