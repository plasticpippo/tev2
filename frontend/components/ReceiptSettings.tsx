import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../shared/types';

interface ReceiptSettingsProps {
  settings: Settings['receiptFromPaymentModal'];
  onUpdate: (receiptSettings: Settings['receiptFromPaymentModal']) => void;
}

export const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useTranslation('admin');

  const handleToggleChange = (field: 'allowReceiptFromPaymentModal' | 'receiptIssueDefaultSelected', value: boolean) => {
    onUpdate({
      ...settings,
      [field]: value,
    });
  };

  const handleIssueModeChange = (mode: 'immediate' | 'draft') => {
    onUpdate({
      ...settings,
      receiptIssueMode: mode,
    });
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.receiptFromPayment.title')}</h3>
      <div className="space-y-4 bg-slate-800 p-4 rounded-md">
        {/* Allow receipt from payment modal toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 pr-4">
            <label htmlFor="allow-receipt-from-payment" className="font-semibold text-slate-300">
              {t('settings.receiptFromPayment.allowReceiptLabel')}
            </label>
            <p className="text-xs text-slate-400">{t('settings.receiptFromPayment.allowReceiptDescription')}</p>
          </div>
          <button
            id="allow-receipt-from-payment"
            type="button"
            role="switch"
            aria-checked={settings.allowReceiptFromPaymentModal}
            onClick={() => handleToggleChange('allowReceiptFromPaymentModal', !settings.allowReceiptFromPaymentModal)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.allowReceiptFromPaymentModal ? 'bg-green-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.allowReceiptFromPaymentModal ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Default selected toggle - only shown when main toggle is enabled */}
        {settings.allowReceiptFromPaymentModal && (
          <div className="flex items-center justify-between py-3 border-t border-slate-700">
            <div className="flex-1 pr-4">
              <label htmlFor="receipt-default-selected" className="font-semibold text-slate-300">
                {t('settings.receiptFromPayment.defaultSelectedLabel')}
              </label>
              <p className="text-xs text-slate-400">{t('settings.receiptFromPayment.defaultSelectedDescription')}</p>
            </div>
            <button
              id="receipt-default-selected"
              type="button"
              role="switch"
              aria-checked={settings.receiptIssueDefaultSelected}
              onClick={() => handleToggleChange('receiptIssueDefaultSelected', !settings.receiptIssueDefaultSelected)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.receiptIssueDefaultSelected ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.receiptIssueDefaultSelected ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Issue mode radio buttons - only shown when main toggle is enabled */}
        {settings.allowReceiptFromPaymentModal && (
          <div className="border-t border-slate-700 pt-4">
            <label className="font-semibold text-slate-300 block mb-3">
              {t('settings.receiptFromPayment.issueModeLabel')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="receiptIssueMode"
                  value="immediate"
                  checked={settings.receiptIssueMode === 'immediate'}
                  onChange={() => handleIssueModeChange('immediate')}
                  className="h-4 w-4 text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-300">{t('settings.receiptFromPayment.issueModeImmediate')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="receiptIssueMode"
                  value="draft"
                  checked={settings.receiptIssueMode === 'draft'}
                  onChange={() => handleIssueModeChange('draft')}
                  className="h-4 w-4 text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-300">{t('settings.receiptFromPayment.issueModeDraft')}</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
