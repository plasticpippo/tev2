import React from 'react';
import { useTranslation } from 'react-i18next';

interface ComparisonToggleProps {
  isComparisonMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  isComparisonMode,
  onToggle,
}) => {
  const { t } = useTranslation('admin');
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400">{t('analytics.comparisonMode')}</span>
      <button
        onClick={() => onToggle(!isComparisonMode)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isComparisonMode ? 'bg-amber-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isComparisonMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
