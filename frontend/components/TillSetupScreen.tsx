import React from 'react';
import type { Till } from '../../shared/types';

interface TillSetupScreenProps {
  tills: Till[];
  onTillSelect: (tillId: number) => void;
}

export const TillSetupScreen: React.FC<TillSetupScreenProps> = ({ tills, onTillSelect }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h1 className="text-center text-3xl font-bold text-amber-400 mb-2">Terminal Setup</h1>
        <p className="text-center text-slate-400 mb-8">Select which Till this device will operate as.</p>
        
        {tills.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tills.map(till => (
              <button
                key={till.id}
                onClick={() => onTillSelect(till.id)}
                className="p-6 bg-slate-700 rounded-lg text-white font-bold text-xl hover:bg-amber-600 transition focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {till.name}
              </button>
            ))}
          </div>
        ) : (
            <p className="text-center text-slate-500">No tills have been configured. Please set them up in the Admin Panel on another device.</p>
        )}
      </div>
    </div>
  );
};