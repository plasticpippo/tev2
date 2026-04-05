import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { Receipt, ReceiptStatus, PaginatedResponse } from '@shared/types';
import { formatCurrency, formatDate } from '../utils/formatting';
import * as receiptService from '../services/receiptService';
import { DatePicker } from './analytics/DatePicker';

type GenerationStatus = 'pending' | 'completed' | 'failed';

interface ReceiptManagementProps {
  onDataUpdate?: () => void;
}

const STATUS_OPTIONS: ReceiptStatus[] = ['draft', 'issued', 'voided'];
const GENERATION_STATUS_OPTIONS: GenerationStatus[] = ['pending', 'completed', 'failed'];

export const ReceiptManagement: React.FC<ReceiptManagementProps> = ({ onDataUpdate }) => {
  const { t } = useTranslation('admin');
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Receipt>['pagination']>({
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
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'all'>('all');
  const [generationStatusFilter, setGenerationStatusFilter] = useState<GenerationStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [issuingReceipt, setIssuingReceipt] = useState<Receipt | null>(null);
  const [issueResult, setIssueResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [retryingReceipt, setRetryingReceipt] = useState<number | null>(null);
  
  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await receiptService.getReceipts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter === 'all' ? undefined : statusFilter,
      generationStatus: generationStatusFilter === 'all' ? undefined : generationStatusFilter,
      search: search || undefined,
      startDate: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
      endDate: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (result) {
      setReceipts(result.data);
      setPagination(result.pagination);
    }
    setLoading(false);
  }, [pagination.page, pagination.pageSize, statusFilter, generationStatusFilter, search, dateFrom, dateTo]);
  
  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);
  
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchReceipts();
  };
  
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setGenerationStatusFilter('all');
    setDateFrom(null);
    setDateTo(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  const handleViewDetail = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  };
  
  const handleDownloadPdf = async (receipt: Receipt) => {
    try {
      await receiptService.downloadReceiptPdf(receipt);
    } catch (err) {
      setError(t('receipts.errors.downloadFailed'));
    }
  };

  const handleSendEmail = async (receipt: Receipt) => {
    if (!receipt.customerSnapshot?.email) {
      setError(t('receipts.errors.noEmail'));
      return;
    }

    setEmailSending(true);
    setEmailResult(null);

    try {
      const result = await receiptService.sendReceiptEmail(receipt.id, { email: receipt.customerSnapshot.email });
      setEmailSending(false);
      setEmailResult({ success: true });
      fetchReceipts();
      onDataUpdate?.();
    } catch (err) {
      setEmailSending(false);
      setEmailResult({ success: false, message: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleIssueReceipt = async (receipt: Receipt) => {
    if (!confirm(t('receipts.issue.confirm'))) {
      return;
    }

    setIssuingReceipt(receipt);
    setIssueResult(null);

    try {
      await receiptService.issueReceipt(receipt.id);
      setIssuingReceipt(null);
      setIssueResult({ success: true });
      setShowDetailModal(false);
      setSelectedReceipt(null);
      fetchReceipts();
      onDataUpdate?.();
    } catch (err) {
      setIssuingReceipt(null);
      setIssueResult({ success: false, message: err instanceof Error ? err.message : String(err) });
      setError(t('receipts.errors.failedToIssue'));
    }
  };
  
  const getStatusBadgeClass = (status: ReceiptStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'emailed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getGenerationStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleRetryGeneration = async (receipt: Receipt) => {
    if (!confirm(t('receipts.generation.confirmRetry'))) {
      return;
    }

    setRetryingReceipt(receipt.id);
    try {
      await receiptService.retryReceiptGeneration(receipt.id);
      fetchReceipts();
      onDataUpdate?.();
    } catch (err) {
      setError(t('receipts.generation.retryFailed'));
    } finally {
      setRetryingReceipt(null);
    }
  };
  
  const filteredReceipts = useMemo(() => receipts, [receipts]);
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-slate-300 mb-4 flex-shrink-0">{t('receipts.management.title')}</h2>
      
      <div className="bg-slate-800 p-4 rounded-lg mb-4 flex-shrink-0 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="receipt-search" className="block text-sm font-medium text-slate-400 mb-1">
              {t('receipts.filters.search')}
            </label>
            <input
              id="receipt-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('receipts.filters.searchPlaceholder')}
              className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm"
            />
          </div>
          
              <div className="w-40">
                <label htmlFor="receipt-status" className="block text-sm font-medium text-slate-400 mb-1">
                  {t('receipts.filters.status')}
                </label>
                <select
                  id="receipt-status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as ReceiptStatus | 'all')}
                  className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm"
                >
                  <option value="all">{t('receipts.filters.allStatuses')}</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{t(`receipts.status.${status}`)}</option>
                  ))}
                </select>
              </div>

              <div className="w-40">
                <label htmlFor="generation-status" className="block text-sm font-medium text-slate-400 mb-1">
                  {t('receipts.filters.generationStatus')}
                </label>
                <select
                  id="generation-status"
                  value={generationStatusFilter}
                  onChange={e => setGenerationStatusFilter(e.target.value as GenerationStatus | 'all')}
                  className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm"
                >
                  <option value="all">{t('receipts.filters.allGenerationStatuses')}</option>
                  {GENERATION_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{t(`receipts.generationStatus.${status}`)}</option>
                  ))}
                </select>
              </div>
          
<div className="w-auto">
        <label className="block text-sm font-medium text-slate-400 mb-1">
          {t('receipts.filters.dateFrom')}
        </label>
        <DatePicker
          selectedDate={dateFrom}
          onDateChange={setDateFrom}
          maxDate={dateTo || new Date()}
          placeholder={t('receipts.filters.dateFrom')}
        />
      </div>

      <div className="w-auto">
        <label className="block text-sm font-medium text-slate-400 mb-1">
          {t('receipts.filters.dateTo')}
        </label>
        <DatePicker
          selectedDate={dateTo}
          onDateChange={setDateTo}
          maxDate={new Date()}
          minDate={dateFrom || undefined}
          placeholder={t('receipts.filters.dateTo')}
        />
      </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-md transition"
          >
            {t('receipts.buttons.search')}
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
          >
            {t('receipts.buttons.clearFilters')}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-md p-3 mb-4 text-red-400">
          {error}
        </div>
      )}
      
      <div className="mb-2 text-slate-400 text-sm">
        {t('receipts.pagination.showing', { 
          count: filteredReceipts.length, 
          total: pagination.totalItems 
        })}
      </div>
      
      <div className="flex-grow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">{t('receipts.loading')}</div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.receiptNumber')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.transactionId')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.customer')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.generationStatus')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                      {t('receipts.table.total')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                      {t('receipts.table.issuedDate')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">
                      {t('receipts.table.actions')}
                    </th>
                  </tr>
                </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('receipts.noReceipts')}
                </td>
              </tr>
            ) : (
                    filteredReceipts.map(receipt => (
                      <tr key={receipt.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-amber-400">
                          {receipt.receiptNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          #{receipt.transactionId}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {receipt.customerSnapshot?.name || t('receipts.noCustomer')}
                        </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(receipt.status)}`}>
                        {t(`receipts.status.${receipt.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(receipt as any).generationStatus === 'pending' && (
                          <>
                            <svg className="w-4 h-4 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.198.803 4.212 2.14 5.77l1.86-2.479z"></path>
                            </svg>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGenerationStatusBadgeClass((receipt as any).generationStatus)}`}>
                              {t(`receipts.generationStatus.${(receipt as any).generationStatus}`)}
                            </span>
                          </>
                        )}
                        {(receipt as any).generationStatus === 'completed' && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getGenerationStatusBadgeClass((receipt as any).generationStatus)}`}>
                            {t(`receipts.generationStatus.${(receipt as any).generationStatus}`)}
                          </span>
                        )}
                        {(receipt as any).generationStatus === 'failed' && (
                          <>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getGenerationStatusBadgeClass((receipt as any).generationStatus)}`}>
                              {t(`receipts.generationStatus.${(receipt as any).generationStatus}`)}
                            </span>
                            <button
                              onClick={() => handleRetryGeneration(receipt)}
                              disabled={retryingReceipt === receipt.id}
                              className="p-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                              title={t('receipts.generation.retry')}
                            >
                              {retryingReceipt === receipt.id ? (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.198.803 4.212 2.14 5.77l1.86-2.479z"></path>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H9" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                        {!(receipt as any).generationStatus && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {t('receipts.generationStatus.completed')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">
                      {formatCurrency(receipt.total)}
                    </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {receipt.issuedAt ? formatDate(receipt.issuedAt) : '-'}
                        </td>
                        <td className="px-4 py-3">
<div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleViewDetail(receipt)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition"
                title={t('receipts.actions.view')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              {receipt.status === 'draft' && (
                <button
                  onClick={() => handleIssueReceipt(receipt)}
                  disabled={issuingReceipt?.id === receipt.id}
                  className="p-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                  title={t('receipts.actions.issue')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              {receipt.status === 'issued' && (
                              <>
                                <button
                                  onClick={() => handleDownloadPdf(receipt)}
                                  className="p-1.5 bg-green-700 hover:bg-green-600 rounded transition"
                                  title={t('receipts.actions.download')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleSendEmail(receipt)}
                                  disabled={!receipt.customerSnapshot?.email || emailSending}
                                  className="p-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                                  title={t('receipts.actions.email')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-center gap-2 py-4 bg-slate-900">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
                >
                  {t('receipts.pagination.previous')}
                </button>
                <span className="text-sm text-slate-400">
                  {t('receipts.pagination.page', { current: pagination.page, total: pagination.totalPages })}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
                >
                  {t('receipts.pagination.next')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showDetailModal && selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReceipt(null);
            setEmailResult(null);
            setIssueResult(null);
          }}
          onDownload={handleDownloadPdf}
          onEmail={handleSendEmail}
          onIssue={handleIssueReceipt}
          emailSending={emailSending}
          emailResult={emailResult}
          issuingReceipt={issuingReceipt?.id === selectedReceipt.id}
          issueResult={issueResult}
        />
      )}
    </div>
  );
};

interface ReceiptDetailModalProps {
  receipt: Receipt;
  onClose: () => void;
  onDownload: (receipt: Receipt) => void;
  onEmail: (receipt: Receipt) => void;
  onIssue: (receipt: Receipt) => void;
  emailSending: boolean;
  emailResult: { success: boolean; message?: string } | null;
  issuingReceipt: boolean;
  issueResult: { success: boolean; message?: string } | null;
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  onClose,
  onDownload,
  onEmail,
  onIssue,
  emailSending,
  emailResult,
  issuingReceipt,
  issueResult
}) => {
  const { t } = useTranslation('admin');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
        <div className="flex-shrink-0 p-6 border-b border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-amber-400">
                {t('receipts.detail.title', { number: receipt.receiptNumber })}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {t('receipts.detail.transaction', { id: receipt.transactionId })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {receipt.businessSnapshot && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">{t('receipts.detail.business')}</h4>
              <div className="bg-slate-800 rounded-md p-4">
                <p className="font-semibold text-white">{receipt.businessSnapshot.name}</p>
                {receipt.businessSnapshot.address && (
                  <p className="text-sm text-slate-300">{receipt.businessSnapshot.address}</p>
                )}
                {receipt.businessSnapshot.city && (
                  <p className="text-sm text-slate-300">
                    {receipt.businessSnapshot.postalCode} {receipt.businessSnapshot.city}
                  </p>
                )}
                {receipt.businessSnapshot.country && (
                  <p className="text-sm text-slate-300">{receipt.businessSnapshot.country}</p>
                )}
                {receipt.businessSnapshot.vatNumber && (
                  <p className="text-sm text-slate-400 mt-2">
                    {t('receipts.detail.vatNumber')}: {receipt.businessSnapshot.vatNumber}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {receipt.customerSnapshot && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">{t('receipts.detail.customer')}</h4>
              <div className="bg-slate-800 rounded-md p-4">
                <p className="font-semibold text-white">{receipt.customerSnapshot.name}</p>
                {receipt.customerSnapshot.email && (
                  <p className="text-sm text-slate-300">{receipt.customerSnapshot.email}</p>
                )}
                {receipt.customerSnapshot.address && (
                  <p className="text-sm text-slate-300">{receipt.customerSnapshot.address}</p>
                )}
                {receipt.customerSnapshot.city && (
                  <p className="text-sm text-slate-300">
                    {receipt.customerSnapshot.postalCode} {receipt.customerSnapshot.city}
                  </p>
                )}
                {receipt.customerSnapshot.vatNumber && (
                  <p className="text-sm text-slate-400 mt-2">
                    {t('receipts.detail.vatNumber')}: {receipt.customerSnapshot.vatNumber}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">{t('receipts.detail.items')}</h4>
            <div className="bg-slate-800 rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm text-slate-300">{t('receipts.detail.item')}</th>
                    <th className="px-4 py-2 text-center text-sm text-slate-300">{t('receipts.detail.qty')}</th>
                    <th className="px-4 py-2 text-right text-sm text-slate-300">{t('receipts.detail.price')}</th>
                    <th className="px-4 py-2 text-right text-sm text-slate-300">{t('receipts.detail.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {receipt.itemsSnapshot.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-slate-300">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-md p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('receipts.detail.subtotal')}</span>
                <span className="text-slate-300">{formatCurrency(receipt.subtotal)}</span>
              </div>
              
              {receipt.taxBreakdown && receipt.taxBreakdown.length > 0 ? (
                receipt.taxBreakdown.map((tax, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {tax.rateName} ({tax.ratePercent}%)
                    </span>
                    <span className="text-slate-300">{formatCurrency(tax.taxAmount)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('receipts.detail.tax')}</span>
                  <span className="text-slate-300">{formatCurrency(receipt.tax)}</span>
                </div>
              )}
              
              {receipt.discount > 0 && (
                <div className="flex justify-between text-sm text-purple-400">
                  <span>{t('receipts.detail.discount')}</span>
                  <span>-{formatCurrency(receipt.discount)}</span>
                </div>
              )}
              
              {receipt.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('receipts.detail.tip')}</span>
                  <span className="text-slate-300">{formatCurrency(receipt.tip)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-700">
                <span className="text-white">{t('receipts.detail.total')}</span>
                <span className="text-amber-400">{formatCurrency(receipt.total)}</span>
              </div>
            </div>
          </div>
          
{emailResult && (
        <div className={`rounded-md p-3 ${emailResult.success ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-red-900/30 border border-red-700 text-red-400'}`}>
          {emailResult.success ? t('receipts.email.success') : emailResult.message}
        </div>
      )}

      {issueResult && (
        <div className={`rounded-md p-3 ${issueResult.success ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-red-900/30 border border-red-700 text-red-400'}`}>
          {issueResult.success ? t('receipts.issue.success') : issueResult.message}
        </div>
      )}
    </div>

    <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-end gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition"
      >
        {t('buttons.close', { ns: 'common' })}
      </button>
      {receipt.status === 'draft' && (
        <button
          onClick={() => onIssue(receipt)}
          disabled={issuingReceipt}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {issuingReceipt ? t('receipts.buttons.issuing') : t('receipts.buttons.issue')}
        </button>
      )}
      {receipt.status === 'issued' && (
            <>
              <button
                onClick={() => onDownload(receipt)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('receipts.buttons.download')}
              </button>
              <button
                onClick={() => onEmail(receipt)}
                disabled={!receipt.customerSnapshot?.email || emailSending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {emailSending ? t('receipts.buttons.sending') : t('receipts.buttons.email')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptManagement;
