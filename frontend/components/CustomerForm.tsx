import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../shared/types';

interface CustomerFormProps {
  mode?: 'create' | 'edit';
  initialData?: Customer;
  onSubmit: (data: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
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
  const [submitting, setSubmitting] = useState(false);

  const notesCharacterCount = formData.notes?.length || 0;
  const maxNotesLength = 1000;

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

    if (formData.notes && formData.notes.length > maxNotesLength) {
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

    setSubmitting(true);
    try {
      const cleanedData = {
        ...formData,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        vatNumber: formData.vatNumber?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        postalCode: formData.postalCode?.trim() || null,
        country: formData.country?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      await onSubmit(cleanedData);
    } catch (error) {
      // Error handling is done by the parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCustomerInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isFormDisabled = isLoading || submitting;
  const submitButtonText = mode === 'edit'
    ? t('customers.form.saveChanges', 'Save Changes')
    : t('customers.form.createCustomer', 'Create Customer');
  const loadingButtonText = mode === 'edit'
    ? t('customers.form.saving', 'Saving...')
    : t('customers.form.creating', 'Creating...');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="customer-name" className="block text-sm font-medium text-slate-300 mb-1">
          {t('receipts.customer.name')} <span className="text-red-400">*</span>
        </label>
        <input
          id="customer-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full bg-slate-900 p-2 rounded-md border ${errors.name ? 'border-red-500' : 'border-slate-700'} text-white text-sm`}
          placeholder={t('receipts.customer.namePlaceholder')}
          maxLength={200}
          disabled={isFormDisabled}
          autoFocus
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

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
          disabled={isFormDisabled}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        <p className="text-xs text-slate-500 mt-1">{t('customers.form.emailHint', 'Used for receipt delivery')}</p>
      </div>

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
          disabled={isFormDisabled}
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
      </div>

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
          disabled={isFormDisabled}
        />
        {errors.vatNumber && <p className="text-red-400 text-xs mt-1">{errors.vatNumber}</p>}
        <p className="text-xs text-slate-500 mt-1">{t('customers.form.vatHint', 'Required for business receipts')}</p>
      </div>

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
          disabled={isFormDisabled}
        />
        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
      </div>

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
            disabled={isFormDisabled}
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
            disabled={isFormDisabled}
          />
          {errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
        </div>
      </div>

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
          maxLength={100}
          disabled={isFormDisabled}
        />
      </div>

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
          maxLength={maxNotesLength}
          rows={3}
          disabled={isFormDisabled}
        />
        {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
        <p className={`text-xs mt-1 ${maxNotesLength - notesCharacterCount < 100 ? 'text-amber-400' : 'text-slate-500'}`}>
          {maxNotesLength - notesCharacterCount} {t('customers.form.charactersRemaining', 'characters remaining')}
        </p>
      </div>

      <div className="text-xs text-slate-500 pt-2">
        <span className="text-red-400">*</span> {t('customers.form.requiredFields', 'Required fields')}
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isFormDisabled}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('stockItems.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isFormDisabled}
            className={`${onCancel ? 'flex-1' : 'w-full'} bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isFormDisabled ? loadingButtonText : submitButtonText}
        </button>
      </div>
    </form>
  );
};
