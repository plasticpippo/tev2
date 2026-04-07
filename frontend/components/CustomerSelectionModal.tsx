import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, CreateCustomerInput } from '../../shared/types';
import { searchCustomers, getCustomers } from '../services/receiptService';
import { CustomerForm } from './CustomerForm';

interface CustomerWithCount extends Customer {
  receiptCount?: number;
}

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateCustomer: (data: CreateCustomerInput) => Promise<Customer>;
  onViewAllCustomers?: () => void;
}

const RECENT_CUSTOMERS_KEY = 'recentCustomerIds';
const MAX_RECENT_CUSTOMERS = 5;

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onCreateCustomer,
  onViewAllCustomers,
}) => {
  const { t } = useTranslation('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerWithCount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<CustomerWithCount[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getRecentCustomerIds = useCallback((): number[] => {
    try {
      const stored = localStorage.getItem(RECENT_CUSTOMERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveRecentCustomerId = useCallback((customerId: number) => {
    const current = getRecentCustomerIds();
    const filtered = current.filter(id => id !== customerId);
    const updated = [customerId, ...filtered].slice(0, MAX_RECENT_CUSTOMERS);
    localStorage.setItem(RECENT_CUSTOMERS_KEY, JSON.stringify(updated));
  }, [getRecentCustomerIds]);

  const fetchRecentCustomers = useCallback(async () => {
    const ids = getRecentCustomerIds();
    if (ids.length === 0) {
      setRecentCustomers([]);
      return;
    }

    setIsLoadingRecent(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await getCustomers({ pageSize: 1, search: String(id) });
            const customer = response.data.find(c => c.id === id);
            return customer ? { ...customer, receiptCount: 0 } : null;
          } catch {
            return null;
          }
        })
      );
      const validCustomers = results.filter((c): c is CustomerWithCount => c !== null);
      setRecentCustomers(validCustomers);
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      setRecentCustomers([]);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [getRecentCustomerIds]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentCustomers();
    }
  }, [isOpen, fetchRecentCustomers]);

  // Focus search input on mount
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCustomers(searchTerm, 10);
        setSearchResults(results.map(c => ({ ...c, receiptCount: 0 })));
      } catch (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleConfirmSelection = () => {
    if (selectedCustomer) {
      saveRecentCustomerId(selectedCustomer.id);
      onSelectCustomer(selectedCustomer);
      handleClose();
    }
  };

  const handleCreateCustomer = async (data: CreateCustomerInput) => {
    setIsCreating(true);
    try {
      const newCustomer = await onCreateCustomer(data);
      saveRecentCustomerId(newCustomer.id);
      onSelectCustomer(newCustomer);
      handleClose();
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickSelectCustomer = (customer: Customer) => {
    saveRecentCustomerId(customer.id);
    onSelectCustomer(customer);
    handleClose();
  };

  const handleViewAllCustomers = () => {
    if (onViewAllCustomers) {
      onViewAllCustomers();
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowCreateForm(false);
    setSelectedCustomer(null);
    onClose();
  };

  const handleSkipCustomer = () => {
    onSelectCustomer(null as any);
    handleClose();
  };

  const renderCustomerButton = (customer: CustomerWithCount, isRecent: boolean = false) => (
    <button
      key={customer.id}
      onClick={() => isRecent ? handleQuickSelectCustomer(customer) : handleSelectCustomer(customer)}
      className={`w-full text-left p-3 rounded-md transition ${
        selectedCustomer?.id === customer.id && !isRecent
          ? 'bg-amber-500 text-white'
          : 'bg-slate-900 hover:bg-slate-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <div className="font-semibold">{customer.name}</div>
          {customer.email && (
            <div className="text-sm opacity-75">{customer.email}</div>
          )}
          {customer.vatNumber && (
            <div className="text-xs opacity-60">{t('receipts.customer.vatNumber')}: {customer.vatNumber}</div>
          )}
        </div>
        {customer.receiptCount !== undefined && customer.receiptCount > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-slate-700 rounded-full text-slate-300 whitespace-nowrap">
            {t('receipts.customer.receiptCount', { count: customer.receiptCount })}
          </span>
        )}
      </div>
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">
            {showCreateForm ? t('receipts.customer.createNew') : t('receipts.customer.selectCustomer')}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition"
            aria-label={t('receipts.close')}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {showCreateForm ? (
            <CustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          ) : (
            <div className="space-y-4">
              {/* Recent Customers Section */}
              {recentCustomers.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-400">
                    {t('receipts.customer.recentCustomers')}
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {isLoadingRecent ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      recentCustomers.map((customer) => renderCustomerButton(customer, true))
                    )}
                  </div>
                </div>
              )}

              {/* Divider between recent and search */}
              {recentCustomers.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      {t('receipts.customer.orSearch')}
                    </span>
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div>
                <label htmlFor="customer-search" className="block text-sm font-medium text-slate-400 mb-1">
                  {t('receipts.customer.searchPlaceholder')}
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    id="customer-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 p-3 pr-10 rounded-md border border-slate-700 text-white text-sm"
                    placeholder={t('receipts.customer.searchHint')}
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t('receipts.customer.searchMinChars')}
                </p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-400">
                    {t('receipts.customer.searchResults')}
                  </label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((customer) => renderCustomerButton(customer))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchTerm.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-400">{t('receipts.customer.noResults')}</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-2 text-amber-400 hover:text-amber-300 underline text-sm"
                  >
                    {t('receipts.customer.createInstead')}
                  </button>
                </div>
              )}

              {/* Create New Customer Link */}
              {searchTerm.trim().length < 2 && recentCustomers.length === 0 && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    {t('receipts.customer.createNew')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Only show when not in create form */}
        {!showCreateForm && (
          <div className="pt-4 border-t border-slate-700 flex-shrink-0">
            {/* Action buttons row */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition text-sm"
              >
                {t('receipts.customer.createNew')}
              </button>
              {onViewAllCustomers && (
                <button
                  onClick={handleViewAllCustomers}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition text-sm"
                >
                  {t('receipts.customer.viewAll')}
                </button>
              )}
            </div>
            {/* Confirm/Skip buttons row */}
            <div className="flex gap-3">
              <button
                onClick={handleSkipCustomer}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition"
              >
                {t('receipts.customer.skip')}
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedCustomer}
                className={`flex-1 font-bold py-2 px-4 rounded-md transition ${
                  selectedCustomer
                    ? 'bg-amber-500 hover:bg-amber-400 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {t('receipts.customer.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
