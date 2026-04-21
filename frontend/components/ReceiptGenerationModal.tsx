import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, Customer, CreateCustomerInput, Receipt } from '../../shared/types';
import { formatCurrency, formatDate } from '../utils/formatting';
import {
  createReceipt,
  issueReceipt,
  updateReceipt,
  downloadReceiptPdf,
  createCustomer,
  getReceipt,
} from '../services/receiptService';
import { CustomerSelectionModal } from './CustomerSelectionModal';

interface ReceiptGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onReceiptGenerated?: (receipt: Receipt) => void;
  onViewAllCustomers?: () => void;
}

type Step = 'details' | 'customer' | 'preview' | 'success';

export const ReceiptGenerationModal: React.FC<ReceiptGenerationModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onReceiptGenerated,
  onViewAllCustomers,
}) => {
  const { t } = useTranslation('admin');

  const [step, setStep] = useState<Step>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receipt state
  const [draftReceipt, setDraftReceipt] = useState<Receipt | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [issuedReceipt, setIssuedReceipt] = useState<Receipt | null>(null);

  // Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);

// Reset state when modal opens
useEffect(() => {
  if (isOpen) {
    setStep('details');
    setDraftReceipt(null);
    setSelectedCustomer(null);
    setNotes('');
    setIssuedReceipt(null);
    setError(null);
    setIsLoading(false);

    // If transaction already has a draft receipt, fetch and load it
    if (transaction?.receipt?.status === 'draft') {
      setIsLoading(true);
      getReceipt(transaction.receipt.id)
        .then((fullReceipt) => {
          setDraftReceipt(fullReceipt);
          setStep('preview');
          // Pre-populate notes if any
          if (fullReceipt.notes) {
            setNotes(fullReceipt.notes);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : t('receipts.errors.failedToLoadDraft'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }
}, [isOpen, transaction]);

const handleCreateDraft = async () => {
  if (!transaction) return;

  setIsLoading(true);
  setError(null);

  try {
    // Check if there's already an existing draft receipt
    if (transaction.receipt?.status === 'draft') {
      // Update existing draft instead of creating new one
      const receipt = await updateReceipt(transaction.receipt.id, {
        customerId: selectedCustomer?.id || null,
        notes: notes || null,
      });
      setDraftReceipt(receipt);
      setStep('preview');
    } else {
      // Create new draft receipt
      const receipt = await createReceipt({
        transactionId: transaction.id,
        customerId: selectedCustomer?.id || undefined,
        notes: notes || undefined,
      });
      setDraftReceipt(receipt);
      setStep('preview');
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : t('receipts.errors.failedToCreate'));
  } finally {
    setIsLoading(false);
  }
};

  const handleIssueReceipt = async () => {
    if (!draftReceipt) return;

    setIsLoading(true);
    setError(null);

    try {
      const receipt = await issueReceipt(draftReceipt.id, { generatePdf: true });
      setIssuedReceipt(receipt);
      setStep('success');
      if (onReceiptGenerated) {
        onReceiptGenerated(receipt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('receipts.errors.failedToIssue'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!issuedReceipt) return;

    try {
      await downloadReceiptPdf(issuedReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('receipts.errors.failedToDownload'));
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);

    // If we have a draft, update it
    if (draftReceipt && draftReceipt.status === 'draft') {
      try {
        const updated = await updateReceipt(draftReceipt.id, { customerId: customer.id });
        setDraftReceipt(updated);
      } catch (err) {
        console.error('Failed to update receipt customer:', err);
      }
    }

    setShowCustomerModal(false);
  };

  const handleCreateNewCustomer = async (data: CreateCustomerInput): Promise<Customer> => {
    const customer = await createCustomer(data);
    return customer;
  };

  const handleClose = () => {
    if (step === 'success') {
      onClose();
    } else if (step === 'preview' && draftReceipt) {
      // Go back to details
      setStep('details');
      setDraftReceipt(null);
    } else {
      onClose();
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 border border-slate-700 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-amber-400">
              {step === 'success'
                ? t('receipts.success.title')
                : step === 'preview'
                ? t('receipts.preview.title')
                : t('receipts.generate.title')}
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition"
              aria-label={t('receipts.close')}
            >
              &times;
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="flex-grow overflow-y-auto pb-4">
            {/* Step: Details */}
            {step === 'details' && (
              <div className="space-y-4">
                {/* Transaction Summary */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">
                    {t('receipts.transactionSummary')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('transactions.details.subtotal')}</span>
                      <span className="text-white">{formatCurrency(transaction.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('transactions.details.tax')}</span>
                      <span className="text-white">{formatCurrency(transaction.tax)}</span>
                    </div>
                    {transaction.discount > 0 && (
                      <div className="flex justify-between text-purple-400">
                        <span>{t('transactions.details.discount')}</span>
                        <span>-{formatCurrency(transaction.discount)}</span>
                      </div>
                    )}
                    {transaction.tip > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('transactions.details.tip')}</span>
                        <span className="text-white">{formatCurrency(transaction.tip)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-700">
                      <span className="text-slate-300">{t('transactions.details.total')}</span>
                      <span className="text-green-400">{formatCurrency(transaction.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-2">
                      <span>{t('receipts.paymentMethod')}</span>
                      <span>{transaction.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{t('receipts.transactionDate')}</span>
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Selection */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">
                    {t('receipts.customer.title')}
                  </h3>
                  {selectedCustomer ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-white">{selectedCustomer.name}</div>
                        {selectedCustomer.email && (
                          <div className="text-sm text-slate-400">{selectedCustomer.email}</div>
                        )}
                        {selectedCustomer.vatNumber && (
                          <div className="text-xs text-slate-500">{t('receipts.customer.vatNumber')}: {selectedCustomer.vatNumber}</div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="text-amber-400 hover:text-amber-300 text-sm underline"
                      >
                        {t('receipts.customer.change')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition"
                    >
                      {t('receipts.customer.selectOrCreate')}
                    </button>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">
                    {t('receipts.notes.title')}
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-800 p-3 rounded-md border border-slate-700 text-white text-sm resize-none"
                    placeholder={t('receipts.notes.placeholder')}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && draftReceipt && (
              <div className="space-y-4">
                {/* Receipt Preview */}
                <div className="bg-white text-black rounded-lg p-6">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold">{t('receipts.preview.receipt')} #{draftReceipt.receiptNumber}</div>
                    <div className="text-sm text-gray-600">{formatDate(draftReceipt.createdAt)}</div>
                  </div>

                  {/* Business Info */}
                  {draftReceipt.businessSnapshot && (
                    <div className="text-center mb-4 text-sm">
                      <div className="font-semibold">{draftReceipt.businessSnapshot.name}</div>
                      {draftReceipt.businessSnapshot.address && (
                        <div>{draftReceipt.businessSnapshot.address}</div>
                      )}
                      {draftReceipt.businessSnapshot.city && (
                        <div>{draftReceipt.businessSnapshot.postalCode} {draftReceipt.businessSnapshot.city}</div>
                      )}
                      {draftReceipt.businessSnapshot.vatNumber && (
                        <div className="mt-1">{t('receipts.vatNumber')}: {draftReceipt.businessSnapshot.vatNumber}</div>
                      )}
                    </div>
                  )}

                  {/* Customer Info */}
                  {draftReceipt.customerSnapshot && (
                    <div className="border-t border-b border-gray-300 py-2 mb-4 text-sm">
                      <div className="font-semibold">{draftReceipt.customerSnapshot.name}</div>
                      {draftReceipt.customerSnapshot.vatNumber && (
                        <div>{t('receipts.vatNumber')}: {draftReceipt.customerSnapshot.vatNumber}</div>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-1">{t('receipts.preview.item')}</th>
                          <th className="text-center py-1">{t('receipts.preview.qty')}</th>
                          <th className="text-right py-1">{t('receipts.preview.price')}</th>
                          <th className="text-right py-1">{t('receipts.preview.total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftReceipt.itemsSnapshot.map((item, index) => (
                          <tr key={index}>
                            <td className="py-1">{item.name}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">{formatCurrency(item.price)}</td>
                            <td className="text-right py-1">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-300 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('transactions.details.subtotal')}</span>
                      <span>{formatCurrency(draftReceipt.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('transactions.details.tax')}</span>
                      <span>{formatCurrency(draftReceipt.tax)}</span>
                    </div>
                    {draftReceipt.discount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>{t('transactions.details.discount')}</span>
                        <span>-{formatCurrency(draftReceipt.discount)}</span>
                      </div>
                    )}
                    {draftReceipt.tip > 0 && (
                      <div className="flex justify-between">
                        <span>{t('transactions.details.tip')}</span>
                        <span>{formatCurrency(draftReceipt.tip)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 mt-2">
                      <span>{t('transactions.details.total')}</span>
                      <span>{formatCurrency(draftReceipt.total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="text-center mt-4 text-sm text-gray-600">
                    {t('receipts.paymentMethod')}: {draftReceipt.paymentMethod}
                  </div>

                  {/* Notes */}
                  {draftReceipt.notes && (
                    <div className="text-center mt-2 text-sm text-gray-600 italic">
                      {draftReceipt.notes}
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-400 text-center">
                  {t('receipts.preview.issueNote')}
                </p>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && issuedReceipt && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{t('receipts.success.issued')}</h3>
                  <p className="text-lg text-amber-400 mt-2">{issuedReceipt.receiptNumber}</p>
                </div>

                <p className="text-slate-400">
                  {t('receipts.success.transactionId')}: {issuedReceipt.transactionId}
                </p>

                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-6 rounded-md transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('receipts.success.downloadPdf')}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-700 flex-shrink-0 flex gap-3">
            {step === 'details' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-md transition"
                >
                  {t('stockItems.cancel')}
                </button>
                <button
                  onClick={handleCreateDraft}
                  disabled={isLoading}
                  className={`flex-1 font-bold py-3 px-4 rounded-md transition ${
                    isLoading
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-white'
                  }`}
                >
                  {isLoading ? t('receipts.generating') : t('receipts.generate.preview')}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => {
                    setStep('details');
                    setDraftReceipt(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-md transition disabled:opacity-50"
                >
                  {t('stockItems.cancel')}
                </button>
                <button
                  onClick={handleIssueReceipt}
                  disabled={isLoading}
                  className={`flex-1 font-bold py-3 px-4 rounded-md transition ${
                    isLoading
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {isLoading ? t('receipts.issuing') : t('receipts.issueButton')}
                </button>
              </>
            )}

            {step === 'success' && (
              <button
                onClick={onClose}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-4 rounded-md transition"
              >
                {t('stockItems.ok')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleSelectCustomer}
        onCreateCustomer={handleCreateNewCustomer}
        onViewAllCustomers={onViewAllCustomers}
      />
    </>
  );
};
