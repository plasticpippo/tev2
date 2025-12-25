import React, { useState } from 'react';
import type { User, Product, Category, Settings, Transaction, Till, StockItem, StockAdjustment, OrderActivityLog, Tab, Room, Table } from '@shared/types';
import { ProductManagement } from './ProductManagement';
import { CategoryManagement } from './CategoryManagement';
import { UserManagement } from './UserManagement';
import { TillManagement } from './TillManagement';
import { InventoryManagement } from './InventoryManagement';
import { SettingsModal } from './SettingsModal';
import { TransactionHistory } from './TransactionHistory';
import { OrderActivityHistory } from './OrderActivityHistory';
import { ManagerDashboard } from './ManagerDashboard';
import { StockItemManagement } from './StockItemManagement';
import { AnalyticsPanel } from './AnalyticsPanel';
import { TableManagement } from './TableManagement';
import { TableProvider } from './TableContext';
import { DailyClosingSummaryView } from './DailyClosingSummaryView';
import * as userApi from '../services/userService';
import * as productApi from '../services/productService';
import * as inventoryApi from '../services/inventoryService';
import * as tillApi from '../services/tillService';
import * as settingApi from '../services/settingService';
import * as transactionApi from '../services/transactionService';
import * as orderApi from '../services/orderService';
import * as tableApi from '../services/tableService';
import * as dailyClosingApi from '../services/dailyClosingService';

interface AdminPanelProps {
  currentUser: User;
  onLogout: () => void;
  onDataUpdate: () => void;
  onAssignDevice: (tillId: number) => void;
  products: Product[];
  categories: Category[];
  users: User[];
  tills: Till[];
  settings: Settings;
  transactions: Transaction[];
  tabs: Tab[];
  stockItems: StockItem[];
  stockAdjustments: StockAdjustment[];
  orderActivityLogs: OrderActivityLog[];
  rooms: Room[];
  tables: Table[];
 assignedTillId: number | null;
  onSwitchToPos: () => void;
}

type AdminView = 'dashboard' | 'analytics' | 'products' | 'categories' | 'stockItems' | 'inventory' | 'users' | 'tills' | 'settings' | 'transactions' | 'activity' | 'tables' | 'dailyClosingSummary';

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const {
    currentUser, onLogout, onAssignDevice, assignedTillId, onSwitchToPos,
    onDataUpdate, products, categories, users, tills, settings,
    transactions, tabs, stockItems, stockAdjustments, orderActivityLogs,
    rooms, tables
 } = props;
  
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  const handleSettingsUpdate = async (newSettings: Settings) => {
    // 1. Save the new settings to the persistent source.
    await settingApi.saveSettings(newSettings);
    // 2. Trigger the global data refresh in the App component. This is now the single source of truth.
    onDataUpdate();
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ManagerDashboard
            transactions={transactions}
            tabs={tabs}
            users={users}
            tills={tills}
            settings={settings}
            currentUser={currentUser}
        />;
      case 'analytics':
        return <AnalyticsPanel transactions={transactions} products={products} categories={categories} settings={settings} />;
      case 'products':
        return <ProductManagement products={products} categories={categories} stockItems={stockItems} onDataUpdate={onDataUpdate} />;
      case 'categories':
        return <CategoryManagement categories={categories} tills={tills} onDataUpdate={onDataUpdate} />;
      case 'stockItems':
        return <StockItemManagement stockItems={stockItems} products={products} onDataUpdate={onDataUpdate} />;
      case 'inventory':
          return <InventoryManagement stockItems={stockItems} stockAdjustments={stockAdjustments} currentUser={currentUser} products={products} categories={categories} onDataUpdate={onDataUpdate} />
      case 'users':
        return <UserManagement users={users} transactions={transactions} orderActivityLogs={orderActivityLogs} settings={settings} onDataUpdate={onDataUpdate} />;
      case 'tills':
          return <TillManagement tills={tills} onDataUpdate={onDataUpdate} assignedTillId={assignedTillId} onAssignDevice={onAssignDevice} />;
      case 'settings':
          return <SettingsModal isOpen={true} onClose={() => {}} settings={settings} onUpdate={handleSettingsUpdate} />
      case 'transactions':
          return <TransactionHistory transactions={transactions} users={users} tills={tills} settings={settings} />;
      case 'activity':
          return <OrderActivityHistory logs={orderActivityLogs} />;
      case 'tables':
          return (
            <TableProvider>
              <TableManagement />
            </TableProvider>
          );
      case 'dailyClosingSummary':
          return <DailyClosingSummaryView currentUserRole={currentUser.role} />;
      default:
        return <p>Select a view</p>;
    }
  };
  
  const NavButton: React.FC<{ view: AdminView; label: string; isFirst?: boolean }> = ({ view, label, isFirst = false }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full text-left p-3 rounded-md font-semibold transition ${isFirst ? '' : 'mt-1'} ${activeView === view ? 'bg-amber-600 text-white' : 'hover:bg-slate-700'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-screen h-screen bg-slate-800 text-white flex flex-col">
       <header className="flex-shrink-0 bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
            <div>
                <h1 className="text-2xl font-bold text-amber-400">Admin Panel</h1>
                <p className="text-sm text-slate-400">Logged in as {currentUser.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onSwitchToPos} className="bg-sky-600 hover:bg-sky-500 font-bold py-2 px-4 rounded-md transition">
                  Switch to POS
              </button>
              <button onClick={onLogout} className="bg-red-700 hover:bg-red-600 font-bold py-2 px-4 rounded-md transition">
                  Logout
              </button>
            </div>
        </header>
        <div className="flex-grow flex overflow-hidden">
            <nav className="w-64 bg-slate-900 p-4 space-y-1 overflow-y-auto flex-shrink-0">
                <NavButton view="dashboard" label="Dashboard" isFirst/>
                <NavButton view="analytics" label="Analytics"/>
                <div className="pt-2"></div>
                <NavButton view="transactions" label="Transactions" />
                <NavButton view="activity" label="Activity Log" />
                <NavButton view="dailyClosingSummary" label="Daily Closing Summary" />
                <div className="pt-2"></div>
                <NavButton view="products" label="Products" isFirst/>
                <NavButton view="categories" label="Categories" />
                <NavButton view="stockItems" label="Stock Items" />
                <NavButton view="inventory" label="Inventory" />
                <div className="pt-2"></div>
                <NavButton view="users" label="Users" isFirst/>
                <NavButton view="tills" label="Tills" />
                <NavButton view="tables" label="Tables & Layout" />
                <div className="pt-2"></div>
                <NavButton view="settings" label="Settings" isFirst/>
            </nav>
            <main className="flex-grow p-6 overflow-y-auto bg-slate-900">
                {renderView()}
            </main>
        </div>
    </div>
  );
};
