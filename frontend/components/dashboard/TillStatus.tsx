

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, User, Till, Settings } from '../@shared/types';
import { addMoney, roundMoney, formatMoney, getSafe } from '../../utils/money';
import { getBusinessDayStart, isWithinBusinessDay } from '../../utils/time';

export const TillStatus: React.FC<{ tills: Till[], transactions: Transaction[], users: User[], settings: Settings }> = ({ tills, transactions, users, settings }) => {
    const { t } = useTranslation('admin');

    const tillData = useMemo(() => {
        const businessDayStart = getBusinessDayStart(settings);
        const todaysTransactions = transactions.filter(t => isWithinBusinessDay(t.createdAt, businessDayStart));

        return tills.map(till => {
            const tillTransactions = todaysTransactions.filter(t => t.tillId === till.id);
            const totalSales = tillTransactions.reduce((sum, t) => addMoney(sum, (t.total ?? 0)), 0);
            
            const { totalCash, totalCard } = tillTransactions.reduce((acc, t) => {
                const paymentMethod = t.paymentMethod ?? '';
                const total = t.total ?? 0;
                if (paymentMethod === 'Cash') {
                    acc.totalCash = addMoney(acc.totalCash, total);
                } else if (paymentMethod === 'Card') {
                    acc.totalCard = addMoney(acc.totalCard, total);
                }
                return acc;
            }, { totalCash: 0, totalCard: 0 });
            
            // Find the user from the most recent transaction for this till - use spread to avoid mutating original array
            const sortedTransactions = [...tillTransactions].sort((a,b) => new Date(getSafe(b, 'createdAt', '1970-01-01')).getTime() - new Date(getSafe(a, 'createdAt', '1970-01-01')).getTime());
            const lastTransaction = sortedTransactions[0];
            const currentUser = lastTransaction ? users.find(u => u.id === lastTransaction.userId) : null;

            return {
                ...till,
                totalSales: roundMoney(totalSales),
                totalCash: roundMoney(totalCash),
                totalCard: roundMoney(totalCard),
                currentUser: getSafe(currentUser, 'name', '') || t('dashboard.noActivity'),
                status: lastTransaction ? t('dashboard.active') : t('dashboard.idle')
            };
        });
    }, [tills, transactions, users, settings, t]);

return (
    <div className="@container bg-slate-900 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-slate-300 mb-3">{t('dashboard.tillStatus')}</h2>
      <div className="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 gap-4">
                {tillData.map(till => (
                    <div key={till.id} className="bg-slate-800 p-4 rounded-lg flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">{till.name}</h3>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${till.status === t('dashboard.active') ? 'bg-green-500 text-green-900' : 'bg-slate-600 text-slate-300'}`}>
                                    {till.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400">{t('dashboard.user')}: {till.currentUser}</p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-700">
                             <p className="text-sm text-slate-400">{t('dashboard.currentDaySales')}</p>
                            <p className="font-bold text-2xl text-green-400">{formatMoney(getSafe(till, 'totalSales', 0))}</p>
                            <div className="text-sm text-slate-300 mt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span>{t('dashboard.cash')}:</span>
                                    <span className="font-semibold">{formatMoney(getSafe(till, 'totalCash', 0))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('dashboard.card')}:</span>
                                    <span className="font-semibold">{formatMoney(getSafe(till, 'totalCard', 0))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};