

import React, { useMemo } from 'react';
import type { Transaction, User, Till, Settings } from '../../../shared/types';
import { formatCurrency } from '../../utils/formatting';
import { getBusinessDayStart, isWithinBusinessDay } from '../../utils/time';

export const TillStatus: React.FC<{ tills: Till[], transactions: Transaction[], users: User[], settings: Settings }> = ({ tills, transactions, users, settings }) => {

    const tillData = useMemo(() => {
        const businessDayStart = getBusinessDayStart(settings);
        const todaysTransactions = transactions.filter(t => isWithinBusinessDay(t.createdAt, businessDayStart));

        return tills.map(till => {
            const tillTransactions = todaysTransactions.filter(t => t.tillId === till.id);
            const totalSales = tillTransactions.reduce((sum, t) => sum + t.total, 0);
            
            const { totalCash, totalCard } = tillTransactions.reduce((acc, t) => {
                if (t.paymentMethod === 'Cash') {
                    acc.totalCash += t.total;
                } else if (t.paymentMethod === 'Card') {
                    acc.totalCard += t.total;
                }
                return acc;
            }, { totalCash: 0, totalCard: 0 });
            
            // Find the user from the most recent transaction for this till
            const lastTransaction = tillTransactions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const currentUser = lastTransaction ? users.find(u => u.id === lastTransaction.userId) : null;

            return {
                ...till,
                totalSales,
                totalCash,
                totalCard,
                currentUser: currentUser?.name || 'No Activity',
                status: lastTransaction ? 'Active' : 'Idle'
            };
        });
    }, [tills, transactions, users, settings]);

    return (
        <div className="bg-slate-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-slate-300 mb-3">Till Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tillData.map(till => (
                    <div key={till.id} className="bg-slate-800 p-4 rounded-lg flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">{till.name}</h3>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${till.status === 'Active' ? 'bg-green-500 text-green-900' : 'bg-slate-600 text-slate-300'}`}>
                                    {till.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400">User: {till.currentUser}</p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-700">
                             <p className="text-sm text-slate-400">Current Day Sales</p>
                            <p className="font-bold text-2xl text-green-400">{formatCurrency(till.totalSales)}</p>
                            <div className="text-sm text-slate-300 mt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span>Cash:</span>
                                    <span className="font-semibold">{formatCurrency(till.totalCash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Card:</span>
                                    <span className="font-semibold">{formatCurrency(till.totalCard)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};