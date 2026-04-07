import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { BusinessSettings } from '@shared/types';
import { LogoUploader } from './LogoUploader';

interface BusinessInfoSettingsProps {
  settings: BusinessSettings;
  onUpdate: (settings: BusinessSettings) => void;
}

interface ValidationErrors {
  name?: string;
}

export const BusinessInfoSettings: React.FC<BusinessInfoSettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useTranslation('admin');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [localValues, setLocalValues] = useState({
    name: settings?.name ?? '',
    address: settings?.address ?? '',
    city: settings?.city ?? '',
    postalCode: settings?.postalCode ?? '',
    country: settings?.country ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    vatNumber: settings?.vatNumber ?? '',
    legalText: settings?.legalText ?? '',
  });

  const [logoPath, setLogoPath] = useState<string | null>(settings?.logoPath ?? null);

  useEffect(() => {
    setLocalValues({
      name: settings?.name ?? '',
      address: settings?.address ?? '',
      city: settings?.city ?? '',
      postalCode: settings?.postalCode ?? '',
      country: settings?.country ?? '',
      phone: settings?.phone ?? '',
      email: settings?.email ?? '',
      vatNumber: settings?.vatNumber ?? '',
      legalText: settings?.legalText ?? '',
    });
    setLogoPath(settings?.logoPath ?? null);
  }, [settings]);

  const validate = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!localValues.name.trim()) {
      errors.name = t('settings.businessInfo.validation.nameRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localValues.name, t]);

  const handleTextChange = useCallback((field: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    setValidationErrors({});
    setSaveResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSaveResult(null);

    try {
      const updatedSettings: BusinessSettings = {
        name: localValues.name.trim() || null,
        address: localValues.address.trim() || null,
        city: localValues.city.trim() || null,
        postalCode: localValues.postalCode.trim() || null,
        country: localValues.country.trim() || null,
        phone: localValues.phone.trim() || null,
        email: localValues.email.trim() || null,
        vatNumber: localValues.vatNumber.trim() || null,
        logoPath,
        legalText: localValues.legalText.trim() || null,
      };

      onUpdate(updatedSettings);

      setSaveResult({
        success: true,
        message: t('settings.businessInfo.saveSuccess'),
      });
    } catch {
      setSaveResult({
        success: false,
        message: t('settings.businessInfo.saveError'),
      });
    } finally {
      setIsSaving(false);
    }
  }, [localValues, logoPath, onUpdate, t, validate]);

  const handleLogoUploadSuccess = useCallback((newLogoPath: string) => {
    setLogoPath(newLogoPath);
    setSaveResult(null);
  }, []);

  const handleLogoDeleteSuccess = useCallback(() => {
    setLogoPath(null);
    setSaveResult(null);
  }, []);

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.businessInfo.title')}</h3>
      <p className="text-slate-400 mb-4">{t('settings.businessInfo.description')}</p>

      <div className="space-y-4 bg-slate-800 p-4 rounded-md">
        {/* Logo Upload */}
        <LogoUploader
          currentLogoPath={logoPath}
          onUploadSuccess={handleLogoUploadSuccess}
          onDeleteSuccess={handleLogoDeleteSuccess}
        />

        {/* Business Name */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.businessInfo.businessName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={localValues.name}
            onChange={(e) => handleTextChange('name', e.target.value)}
            placeholder={t('settings.businessInfo.businessNamePlaceholder')}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {validationErrors.name && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.businessInfo.address')}
          </label>
          <input
            type="text"
            value={localValues.address}
            onChange={(e) => handleTextChange('address', e.target.value)}
            placeholder={t('settings.businessInfo.addressPlaceholder')}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* City and Postal Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              {t('settings.businessInfo.city')}
            </label>
            <input
              type="text"
              value={localValues.city}
              onChange={(e) => handleTextChange('city', e.target.value)}
              placeholder={t('settings.businessInfo.cityPlaceholder')}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              {t('settings.businessInfo.postalCode')}
            </label>
            <input
              type="text"
              value={localValues.postalCode}
              onChange={(e) => handleTextChange('postalCode', e.target.value)}
              placeholder={t('settings.businessInfo.postalCodePlaceholder')}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.businessInfo.country')}
          </label>
          <input
            type="text"
            value={localValues.country}
            onChange={(e) => handleTextChange('country', e.target.value)}
            placeholder={t('settings.businessInfo.countryPlaceholder')}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Phone and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              {t('settings.businessInfo.phone')}
            </label>
            <input
              type="tel"
              value={localValues.phone}
              onChange={(e) => handleTextChange('phone', e.target.value)}
              placeholder={t('settings.businessInfo.phonePlaceholder')}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              {t('settings.businessInfo.email')}
            </label>
            <input
              type="email"
              value={localValues.email}
              onChange={(e) => handleTextChange('email', e.target.value)}
              placeholder={t('settings.businessInfo.emailPlaceholder')}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* VAT Number */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.businessInfo.vatNumber')}
          </label>
          <input
            type="text"
            value={localValues.vatNumber}
            onChange={(e) => handleTextChange('vatNumber', e.target.value)}
            placeholder={t('settings.businessInfo.vatNumberPlaceholder')}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Legal Text */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.businessInfo.legalText')}
          </label>
          <textarea
            value={localValues.legalText}
            onChange={(e) => handleTextChange('legalText', e.target.value)}
            placeholder={t('settings.businessInfo.legalTextPlaceholder')}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500 resize-y"
          />
        </div>

        {/* Save Result */}
        {saveResult && (
          <div
            className={
              saveResult.success
                ? 'bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md'
                : 'bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md'
            }
          >
            {saveResult.message}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? t('settings.businessInfo.saving') : t('settings.businessInfo.save')}
        </button>
      </div>
    </div>
  );
};
