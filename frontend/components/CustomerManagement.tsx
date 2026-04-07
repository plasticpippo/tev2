import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, PaginatedResponse, CreateCustomerInput, UpdateCustomerInput } from '@shared/types';
import { apiUrl, getAuthHeaders, notifyUpdates } from '../services/apiBase';
import { CustomerForm } from './CustomerForm';

interface CustomerManagementProps {
  onDataUpdate?: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ onDataUpdate }) => {
  const { t } = useTranslation('admin');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Customer>['pagination']>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.pageSize));
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (statusFilter !== 'all') {
        params.append('isActive', String(statusFilter === 'active'));
      }

      const response = await fetch(apiUrl(`/api/customers?${params.toString()}`), {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customers');
      }

const result = await response.json();
    const customersList = result.customers || result.data || [];
    const paginationData = result.pagination || {};
    setCustomers(customersList);
    setPagination({
      page: paginationData.page || 1,
      pageSize: paginationData.limit || paginationData.pageSize || 20,
      totalItems: paginationData.totalCount || paginationData.totalItems || 0,
      totalPages: paginationData.totalPages || 0,
      hasNextPage: paginationData.hasNextPage ?? false,
      hasPrevPage: paginationData.hasPrevPage ?? false
    });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize: newSize }));
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingCustomer(null);
    setFormLoading(false);
  };

  const handleFormSubmit = async (data: CreateCustomerInput) => {
    setFormLoading(true);
    setError(null);

    try {
      const url = editingCustomer
        ? apiUrl(`/api/customers/${editingCustomer.id}`)
        : apiUrl('/api/customers');
      const method = editingCustomer ? 'PUT' : 'POST';

      const body: UpdateCustomerInput | CreateCustomerInput = editingCustomer
        ? { ...data, isActive: editingCustomer.isActive }
        : data;

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save customer');
      }

      handleCloseForm();
      fetchCustomers();
      notifyUpdates();
      onDataUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    setTogglingStatus(customer.id);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/customers/${customer.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: !customer.isActive })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update customer status');
      }

      fetchCustomers();
      notifyUpdates();
      onDataUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-300">
          {t('customers.management.title', 'Customer Management')}
        </h2>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-md transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('customers.buttons.new', 'New Customer')}
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg mb-4 flex-shrink-0">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="customer-search" className="block text-sm font-medium text-slate-400 mb-1">
              {t('customers.filters.search', 'Search')}
            </label>
            <input
              id="customer-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('customers.filters.searchPlaceholder', 'Search by name, email, or phone...')}
              className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm"
            />
          </div>

          <div className="w-40">
            <label htmlFor="customer-status" className="block text-sm font-medium text-slate-400 mb-1">
              {t('customers.filters.status', 'Status')}
            </label>
            <select
              id="customer-status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm"
            >
              <option value="all">{t('customers.filters.allStatuses', 'All')}</option>
              <option value="active">{t('customers.status.active', 'Active')}</option>
              <option value="inactive">{t('customers.status.inactive', 'Inactive')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
            >
              {t('customers.buttons.clearFilters', 'Clear')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-md p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      <div className="mb-2 text-slate-400 text-sm">
        {t('customers.pagination.showing', {
          count: customers.length,
          total: pagination.totalItems,
          defaultValue: `Showing ${customers.length} of ${pagination.totalItems} customers`
        })}
      </div>

      <div className="flex-grow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">{t('customers.loading', 'Loading customers...')}</div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('customers.table.name', 'Name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('customers.table.email', 'Email')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('customers.table.phone', 'Phone')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('customers.table.vatNumber', 'VAT Number')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('customers.table.status', 'Status')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">
                      {t('customers.table.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        {t('customers.noCustomers', 'No customers found')}
                      </td>
                    </tr>
                  ) : (
                    customers.map(customer => (
                      <tr key={customer.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-amber-400">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {customer.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {customer.vatNumber || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(customer.isActive)}`}>
                            {customer.isActive
                              ? t('customers.status.active', 'Active')
                              : t('customers.status.inactive', 'Inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(customer)}
                              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition"
                              title={t('customers.actions.view', 'View details')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(customer)}
                              className="p-1.5 bg-amber-600 hover:bg-amber-500 rounded transition"
                              title={t('customers.actions.edit', 'Edit')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(customer)}
                              disabled={togglingStatus === customer.id}
                              className={`p-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                customer.isActive
                                  ? 'bg-red-700 hover:bg-red-600'
                                  : 'bg-green-700 hover:bg-green-600'
                              }`}
                              title={customer.isActive
                                ? t('customers.actions.deactivate', 'Deactivate')
                                : t('customers.actions.activate', 'Activate')}
                            >
                              {togglingStatus === customer.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.198.803 4.212 2.14 5.77l1.86-2.479z"></path>
                                </svg>
                              ) : customer.isActive ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-between py-4 px-2 bg-slate-900">
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size" className="text-sm text-slate-400">
                    {t('customers.pagination.itemsPerPage', 'Items per page:')}
                  </label>
                  <select
                    id="page-size"
                    value={pagination.pageSize}
                    onChange={e => handlePageSizeChange(Number(e.target.value))}
                    className="bg-slate-800 p-1 rounded border border-slate-700 text-sm"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
                  >
                    {t('customers.pagination.previous', 'Previous')}
                  </button>
                  <span className="text-sm text-slate-400">
                    {t('customers.pagination.page', {
                      current: pagination.page,
                      total: pagination.totalPages,
                      defaultValue: `Page ${pagination.page} of ${pagination.totalPages}`
                    })}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
                  >
                    {t('customers.pagination.next', 'Next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
            <div className="flex-shrink-0 p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-amber-400">
                  {editingCustomer
                    ? t('customers.form.editTitle', 'Edit Customer')
                    : t('customers.form.newTitle', 'New Customer')}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-slate-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <CustomerForm
                mode={editingCustomer ? 'edit' : 'create'}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
                initialData={editingCustomer || undefined}
                isLoading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
            <div className="flex-shrink-0 p-6 border-b border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-amber-400">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {t('customers.detail.id', { id: selectedCustomer.id })}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="text-slate-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <div className="bg-slate-800 rounded-md p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  {t('customers.detail.contactInfo', 'Contact Information')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.email', 'Email')}</span>
                    <span className="text-slate-300">{selectedCustomer.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.phone', 'Phone')}</span>
                    <span className="text-slate-300">{selectedCustomer.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.vatNumber', 'VAT Number')}</span>
                    <span className="text-slate-300">{selectedCustomer.vatNumber || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-md p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  {t('customers.detail.address', 'Address')}
                </h4>
                <div className="space-y-2">
                  <p className="text-slate-300">{selectedCustomer.address || '-'}</p>
                  <p className="text-slate-300">
                    {selectedCustomer.postalCode} {selectedCustomer.city}
                  </p>
                  <p className="text-slate-300">{selectedCustomer.country || '-'}</p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="bg-slate-800 rounded-md p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">
                    {t('customers.detail.notes', 'Notes')}
                  </h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                </div>
              )}

              <div className="bg-slate-800 rounded-md p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  {t('customers.detail.metadata', 'Metadata')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.status', 'Status')}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(selectedCustomer.isActive)}`}>
                      {selectedCustomer.isActive
                        ? t('customers.status.active', 'Active')
                        : t('customers.status.inactive', 'Inactive')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.createdBy', 'Created by')}</span>
                    <span className="text-slate-300">{selectedCustomer.createdBy?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.createdAt', 'Created at')}</span>
                    <span className="text-slate-300">
                      {new Date(selectedCustomer.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('customers.detail.updatedAt', 'Updated at')}</span>
                    <span className="text-slate-300">
                      {new Date(selectedCustomer.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
              >
                {t('buttons.close', { ns: 'common', defaultValue: 'Close' })}
              </button>
              <button
                onClick={() => {
                  handleCloseDetail();
                  handleOpenEdit(selectedCustomer);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('customers.buttons.edit', 'Edit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
