import React from 'react';
import type { Settings } from '../../shared/types';

interface TaxSettingsProps {
  settings: Settings['tax'];
  onUpdate: (taxSettings: Settings['tax']) => void;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ settings, onUpdate }) => {
  const handleModeChange = (mode: Settings['tax']['mode']) => {
    onUpdate({ ...settings, mode });
  };

  return (
    <div>
        <h3 className="text-xl font-bold text-slate-300 mb-4">Tax Settings</h3>
        <div>
            <p className="text-slate-400 mb-3">How should taxes be handled?</p>
            <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="exclusive"
                        checked={settings.mode === 'exclusive'}
                        onChange={() => handleModeChange('exclusive')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                    <div>
                        <span className="font-semibold">Exclusive</span>
                        <p className="text-xs text-slate-400">Tax is added on top of the product price. (e.g., $10.00 + 7% = $10.70)</p>
                    </div>
                </label>
                 <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="inclusive"
                        checked={settings.mode === 'inclusive'}
                        onChange={() => handleModeChange('inclusive')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                    <div>
                        <span className="font-semibold">Inclusive</span>
                        <p className="text-xs text-slate-400">Product price already includes tax. (e.g., $10.00 is $9.35 + $0.65 tax)</p>
                    </div>
                </label>
                 <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="none"
                        checked={settings.mode === 'none'}
                        onChange={() => handleModeChange('none')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                     <div>
                        <span className="font-semibold">No Tax</span>
                        <p className="text-xs text-slate-400">No taxes are calculated or applied.</p>
                    </div>
                </label>
            </div>
        </div>
    </div>
  );
};