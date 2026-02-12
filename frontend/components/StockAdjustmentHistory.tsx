import React from 'react';
import { useTranslation } from 'react-i18next';
import type { StockAdjustment } from '@shared/types';
import { formatDate } from '../utils/formatting';

export const StockAdjustmentHistory: React.FC<{ adjustments: StockAdjustment[] }> = ({ adjustments }) => {
    const { t } = useTranslation('admin');
    
    if (adjustments.length === 0) {
        return <p className="text-slate-500 text-center">{t('inventory.noStockAdjustments')}</p>;
    }
    return (
        <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">{t('inventory.stockAdjustmentHistory')}</h3>
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2">
                {[...adjustments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(adj => (
                    <div key={adj.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{adj.itemName}</p>
                            <p className="text-sm text-slate-400">{formatDate(adj.createdAt)} {t('inventory.byUser', { user: adj.userName || 'N/A' })}</p>
                            <p className="text-sm text-slate-500 italic mt-1">{t('inventory.reasonLabel', { reason: adj.reason })}</p>
                        </div>
                        <div>
                            <p className={`font-bold text-lg ${adj.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};