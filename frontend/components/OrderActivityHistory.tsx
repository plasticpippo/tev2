import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderActivityLog, OrderItem } from '@shared/types';
import { formatDate } from '../utils/formatting';

export const OrderActivityHistory: React.FC<{ logs: OrderActivityLog[] }> = ({ logs }) => {
    const { t } = useTranslation();

    const renderLogDetails = (details: string | OrderItem[]) => {
        if (typeof details === 'string') {
            return <p className="text-sm text-slate-300">{details}</p>;
        }
        const totalItems = details.reduce((sum, item) => sum + item.quantity, 0);
        return <p className="text-sm text-slate-300">{t('orderActivityHistory.orderCleared', { count: totalItems })}</p>;
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">{t('orderActivityHistory.title')}</h3>
             <p className="text-slate-400 mb-6 text-sm">{t('orderActivityHistory.description')}</p>
            {logs.length === 0 ? (
                <p className="text-slate-500 text-center">{t('orderActivityHistory.noActivity')}</p>
            ) : (
                <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2">
                    {[...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(log => (
                        <div key={log.id} className="bg-slate-800 p-4 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-red-400">{log.action}</p>
                                    {renderLogDetails(log.details)}
                                </div>
                                <div className="text-right text-sm text-slate-400 flex-shrink-0 ml-4">
                                    <p>{formatDate(log.createdAt)}</p>
                                    <p>{t('orderActivityHistory.by')} {log.userName}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};