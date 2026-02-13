import React, { useState, useEffect } from 'react';
import type { Transaction, Tab, User, Till, Settings, DailyClosing } from '@shared/types';
import { getDailyClosings } from '../services/dailyClosingService';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { TotalSalesTicker } from './dashboard/TotalSalesTicker';
import { TillStatus } from './dashboard/TillStatus';
import { UnifiedOpenTabs } from './dashboard/UnifiedOpenTabs';
import { DailyClosingButton } from './DailyClosingButton';

interface ManagerDashboardProps {
    transactions: Transaction[];
    tabs: Tab[];
    users: User[];
    tills: Till[];
    settings: Settings;
    currentUser: User;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ transactions, tabs, users, tills, settings, currentUser }) => {
    const { t } = useTranslation();
    const [recentClosings, setRecentClosings] = useState<DailyClosing[]>([]);
    const [loadingClosings, setLoadingClosings] = useState(true);
    
    // Fetch recent daily closings
    useEffect(() => {
        const fetchRecentClosings = async () => {
            try {
                setLoadingClosings(true);
                // Get closings from the last 7 days
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                const allClosings = await getDailyClosings();
                const recent = allClosings
                    .filter(closing => new Date(closing.closedAt) >= oneWeekAgo)
                    .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime())
                    .slice(0, 5); // Get the 5 most recent
                
                setRecentClosings(recent);
            } catch (error) {
                console.error(t('managerDashboard.errorFetchingClosings'), error);
            } finally {
                setLoadingClosings(false);
            }
        };
        
        fetchRecentClosings();
    }, [t]);
    
    if (!settings) {
        return <div className="text-center text-slate-400">{t('managerDashboard.loadingDashboard')}</div>;
    }
    
    return (
        <div className="h-full flex flex-col gap-6">
            <TotalSalesTicker transactions={transactions} settings={settings} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h2 className="text-lg font-bold text-slate-300 mb-3 text-center">{t('managerDashboard.businessDayManagement')}</h2>
                    <DailyClosingButton
                        settings={settings}
                        userId={currentUser.id}
                        userName={currentUser.name}
                    />
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                    <h2 className="text-lg font-bold text-slate-300 mb-3 text-center">{t('managerDashboard.recentDailyClosings')}</h2>
                    {loadingClosings ? (
                        <div className="text-center text-slate-400 py-4">{t('managerDashboard.loading')}</div>
                    ) : recentClosings.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {recentClosings.map(closing => (
                                <div key={closing.id} className="flex justify-between text-sm border-b border-slate-700 pb-2">
                                    <span className="text-slate-300">{format(new Date(closing.closedAt), 'MMM dd, HH:mm')}</span>
                                    <span className="text-amber-400">{closing.userName}</span>
                                    <span className="text-green-400">{t('managerDashboard.transactions', { count: closing.summary.transactions })}</span>
                                    <span className="text-green-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(closing.summary.totalSales)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4">{t('managerDashboard.noRecentClosings')}</div>
                    )}
                </div>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 h-full flex flex-col gap-6 overflow-hidden">
                    <TillStatus tills={tills} transactions={transactions} users={users} settings={settings} />
                    <UnifiedOpenTabs tabs={tabs} />
                </div>
            </div>
        </div>
    );
};