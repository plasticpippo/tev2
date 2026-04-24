import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Till } from '@shared/types';

interface TillSetupScreenProps {
  tills: Till[];
  onTillSelect: (tillId: number) => void;
}

export const TillSetupScreen: React.FC<TillSetupScreenProps> = ({ tills, onTillSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[60] p-4 touch-manipulation">
      <div className="w-full max-w-xs sm:max-w-2xl p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700 relative">
        <h1 className="text-center text-3xl font-bold text-amber-400 mb-2">{t('tillSetupScreen.title')}</h1>
        <p className="text-center text-slate-400 mb-8">{t('tillSetupScreen.subtitle')}</p>

        {tills.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tills.map(till => (
<button
key={till.id}
onClick={() => onTillSelect(till.id)}
className="p-6 min-w-[88px] min-h-[88px] bg-slate-700 rounded-lg text-white font-bold text-xl hover:bg-amber-600 active:bg-amber-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer touch-manipulation"
style={{ touchAction: 'manipulation' }}
>
{till.name}
</button>
            ))}
          </div>
        ) : (
            <p className="text-center text-slate-500">{t('tillSetupScreen.noTillsConfigured')}</p>
        )}
      </div>
    </div>
  );
};