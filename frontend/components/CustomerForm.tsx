import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, CreateCustomerInput } from '../../shared/types';

interface CustomerFormProps {
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Customer>;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { t } = useTranslation('admin');

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: initialData?.name || '',
    email: initialData?.email || null,
    phone: initialData?.phone || null,
    vatNumber: initialData?.vatNumber || null,
    address: initialData?.address || null,
    city: initialData?.city || null,
    postalCode: initialData?.postalCode || null,
    country: initialData?.country || null,
    notes: initialData?.notes || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('receipts.customer.validation.nameRequired');
    } else if (formData.name.length > 200) {
      newErrors.name = t('receipts.customer.validation.nameMaxLength');
    }

    if (formData.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      newErrors.email = t('receipts.customer.validation.emailInvalid');
    }

    if (formData.vatNumber && formData.vatNumber.length > 50) {
      newErrors.vatNumber = t('receipts.customer.validation.vatNumberMaxLength');
    }

    if (formData.phone && formData.phone.length > 50) {
      newErrors.phone = t('receipts.customer.validation.phoneMaxLength');
    }

    if (formData.address && formData.address.length > 500) {
      newErrors.address = t('receipts.customer.validation.addressMaxLength');
    }

    if (formData.city && formData.city.length > 100) {
      newErrors.city = t('receipts.customer.validation.cityMaxLength');
    }

    if (formData.postalCode && formData.postalCode.length > 20) {
      newErrors.postalCode = t('receipts.customer.validation.postalCodeMaxLength');
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = t('receipts.customer.validation.notesMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        vatNumber: formData.vatNumber?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        postalCode: formData.postalCode?.trim() || null,
        country: formData.country?.trim() || null,
        notes: formData.notes?.trim() || null,
      });
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  const handleChange = (field: keyof CreateCustomerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name - Required */}
      <div>
        <label htmlFor="customer-name" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.name')} *
        </label>
        <input
          id="customer-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.name ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.namePlaceholder')}
          maxLength={200}
          disabled={isLoading}
          autoFocus
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="customer-email" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.email')}
        </label>
        <input
          id="customer-email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.email ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.emailPlaceholder')}
          maxLength={255}
          disabled={isLoading}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="customer-phone" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.phone')}
        </label>
        <input
          id="customer-phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.phone ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.phonePlaceholder')}
          maxLength={50}
          disabled={isLoading}
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* VAT Number */}
      <div>
        <label htmlFor="customer-vat" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.vatNumber')}
        </label>
        <input
          id="customer-vat"
          type="text"
          value={formData.vatNumber || ''}
          onChange={(e) => handleChange('vatNumber', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.vatNumber ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.vatNumberPlaceholder')}
          maxLength={50}
          disabled={isLoading}
        />
        {errors.vatNumber && <p className="text-red-400 text-xs mt-1">{errors.vatNumber}</p>}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="customer-address" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.address')}
        </label>
        <input
          id="customer-address"
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.address ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.addressPlaceholder')}
          maxLength={500}
          disabled={isLoading}
        />
        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
      </div>

      {/* City and Postal Code - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="customer-city" className="block text-sm font-medium text-slate-300 mb-1">
            {t('receipts.customer.city')}
          </label>
          <input
            id="customer-city"
            type="text"
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            className={`w-full bg-slate-900 p-2 rounded-md border ${errors.city ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
            placeholder={t('receipts.customer.cityPlaceholder')}
            maxLength={100}
            disabled={isLoading}
          />
          {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
        </div>

        <div>
          <label htmlFor="customer-postal" className="block text-sm font-medium text-slate-300 mb-1">
            {t('receipts.customer.postalCode')}
          </label>
          <input
            id="customer-postal"
            type="text"
            value={formData.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className={`w-full bg-slate-900 p-2 rounded-md border ${errors.postalCode ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
            placeholder={t('receipts.customer.postalCodePlaceholder')}
            maxLength={20}
            disabled={isLoading}
          />
          {errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
        </div>
      </div>

      {/* Country */}
      <div>
        <label htmlFor="customer-country" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.country')}
        </label>
        <input
          id="customer-country"
          type="text"
          value={formData.country || ''}
          onChange={(e) => handleChange('country', e.target.value)}
          className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-white text-sm"
          placeholder={t('receipts.customer.countryPlaceholder')}
          maxLength={2}
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="customer-notes" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.notes')}
        </label>
        <textarea
          id="customer-notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.notes ? 'border-red-500' : 'border-slate-700'} text-white text-sm resize-none`}
          placeholder={t('receipts.customer.notesPlaceholder')}
          maxLength={1000}
          rows={3}
          disabled={isLoading}
        />
        {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('stockItems.cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('stockItems.saving') : t('stockItems.save')}
        </button>
      </div>
    </form>
  );
};
