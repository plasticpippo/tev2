import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, Receipt } from '@shared/types';
import { apiUrl, getAuthHeaders } from '../services/apiBase';

interface CustomerReceipt {
  id: number;
  receiptNumber: string;
  issuedAt: string | null;
  total: number;
  status: string;
}

interface CustomerDetailProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onStatusChange: (customer: Customer, newStatus: boolean) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const { t } = useTranslation('admin');

  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [totalReceipts, setTotalReceipts] = useState(0);

  useEffect(() => {
    if (isOpen && customer.id) {
      fetchCustomerReceipts();
    }
  }, [isOpen, customer.id]);

  const fetchCustomerReceipts = async () => {
    setReceiptsLoading(true);
    setReceiptsError(null);

    try {
      const response = await fetch(
        apiUrl(`/api/customers/${customer.id}/receipts?limit=5`),
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch receipts');
      }

      const result = await response.json();
      setReceipts(result.data || result);
      setTotalReceipts(result.pagination?.totalItems || result.length || 0);
    } catch (err) {
      setReceiptsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setReceiptsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getReceiptStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'emailed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleEdit = () => {
    onEdit(customer);
  };

  const handleStatusToggle = () => {
    onStatusChange(customer, !customer.isActive);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-detail-title"
    >
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="flex-shrink-0 p-6 border-b border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h3
                id="customer-detail-title"
                className="text-xl font-bold text-amber-400"
              >
                {t('customers.detail.title', 'Customer Details')}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {customer.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
              aria-label={t('customers.actions.close', 'Close')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="bg-slate-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">
              {t('customers.detail.contactInfo', 'Contact Information')}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.name', 'Name')}</span>
                <span className="text-slate-300 font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.email', 'Email')}</span>
                <span className="text-slate-300">{customer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.phone', 'Phone')}</span>
                <span className="text-slate-300">{customer.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.vatNumber', 'VAT Number')}</span>
                <span className="text-slate-300">{customer.vatNumber || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">
              {t('customers.detail.address', 'Address')}
            </h4>
            <div className="space-y-1">
              <p className="text-slate-300">{customer.address || '-'}</p>
              <p className="text-slate-300">
                {customer.postalCode || ''} {customer.city || '-'}
              </p>
              <p className="text-slate-300">{customer.country || '-'}</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">
              {t('customers.detail.metadata', 'Metadata')}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.status', 'Status')}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(customer.isActive)}`}>
                  {customer.isActive
                    ? t('customers.status.active', 'Active')
                    : t('customers.status.inactive', 'Inactive')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.createdBy', 'Created by')}</span>
                <span className="text-slate-300">{customer.createdBy?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.createdAt', 'Created at')}</span>
                <span className="text-slate-300">{formatDateTime(customer.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('customers.detail.updatedAt', 'Updated at')}</span>
                <span className="text-slate-300">{formatDateTime(customer.updatedAt)}</span>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="bg-slate-800 rounded-md p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">
                {t('customers.detail.notes', 'Notes')}
              </h4>
              <p className="text-slate-300 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">
              {t('customers.detail.receipts', { count: totalReceipts, defaultValue: `Receipts (${totalReceipts})` })}
            </h4>

            {receiptsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
              </div>
            ) : receiptsError ? (
              <div className="text-red-400 text-sm py-2">{receiptsError}</div>
            ) : receipts.length === 0 ? (
              <div className="text-slate-500 text-sm py-2">
                {t('customers.detail.noReceipts', 'No receipts found')}
              </div>
            ) : (
              <div className="space-y-2">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center justify-between bg-slate-900 rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-medium">{receipt.receiptNumber}</span>
                      <span className="text-slate-400 text-sm">
                        {t('customers.detail.issuedOn', 'issued')} {formatDate(receipt.issuedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 font-medium">{formatCurrency(receipt.total)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getReceiptStatusBadgeClass(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </div>
                  </div>
                ))}

                {totalReceipts > 5 && (
                  <button
                    className="w-full text-center text-amber-400 hover:text-amber-300 text-sm py-2 transition"
                  >
                    {t('customers.detail.viewAllReceipts', { count: totalReceipts, defaultValue: `View all ${totalReceipts} receipts` })}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
          >
            {t('buttons.close', { ns: 'common', defaultValue: 'Close' })}
          </button>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-md transition font-medium ${
              customer.isActive
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {customer.isActive
              ? t('customers.actions.deactivate', 'Deactivate')
              : t('customers.actions.activate', 'Activate')}
          </button>
          <button
            onClick={handleEdit}
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
  );
};

export default CustomerDetail;
