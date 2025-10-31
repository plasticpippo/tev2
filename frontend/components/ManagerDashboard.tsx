import React from 'react';
import type { Transaction, Tab, User, Till, Settings } from '../../shared/types';

import { TotalSalesTicker } from './dashboard/TotalSalesTicker';
import { TillStatus } from './dashboard/TillStatus';
import { UnifiedOpenTabs } from './dashboard/UnifiedOpenTabs';

interface ManagerDashboardProps {
    transactions: Transaction[];
    tabs: Tab[];
    users: User[];
    tills: Till[];
    settings: Settings;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ transactions, tabs, users, tills, settings }) => {
    
    if (!settings) {
        return <div className="text-center text-slate-400">Loading Dashboard...</div>;
    }
    
    return (
        <div className="h-full flex flex-col gap-6">
            <TotalSalesTicker transactions={transactions} settings={settings} />
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 h-full flex flex-col gap-6 overflow-hidden">
                    <TillStatus tills={tills} transactions={transactions} users={users} settings={settings} />
                    <UnifiedOpenTabs tabs={tabs} />
                </div>
            </div>
        </div>
    );
};