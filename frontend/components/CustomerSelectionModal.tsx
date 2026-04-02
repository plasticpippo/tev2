import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, CreateCustomerInput } from '../../shared/types';
import { searchCustomers } from '../services/receiptService';
import { CustomerForm } from './CustomerForm';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateCustomer: (data: CreateCustomerInput) => Promise<Customer>;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onCreateCustomer,
}) => {
  const { t } = useTranslation('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        setSearchResults(results);
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
      onSelectCustomer(selectedCustomer);
      handleClose();
    }
  };

  const handleCreateCustomer = async (data: CreateCustomerInput) => {
    setIsCreating(true);
    try {
      const newCustomer = await onCreateCustomer(data);
      onSelectCustomer(newCustomer);
      handleClose();
    } catch (error) {
      // Error handling is done by the form
      throw error;
    } finally {
      setIsCreating(false);
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
    onSelectCustomer(null as any); // Allow proceeding without customer
    handleClose();
  };

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
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full text-left p-3 rounded-md transition ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-900 hover:bg-slate-700'
                        }`}
                      >
                        <div className="font-semibold">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm opacity-75">{customer.email}</div>
                        )}
                        {customer.vatNumber && (
                          <div className="text-xs opacity-60">{t('receipts.customer.vatNumber')}: {customer.vatNumber}</div>
                        )}
                      </button>
                    ))}
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
              {searchTerm.trim().length < 2 && (
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
          <div className="pt-4 border-t border-slate-700 flex-shrink-0 flex gap-3">
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
        )}
      </div>
    </div>
  );
};
