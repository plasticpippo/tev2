import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, Product, Category, Settings, Transaction, Till, StockItem, StockAdjustment, OrderActivityLog, Tab, Room, Table, TaxRate } from '../../shared/types';
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
import { ItemisedConsumptionPanel } from './itemised-consumption/ItemisedConsumptionPanel';
import TableErrorBoundary from './TableErrorBoundary';
import * as userApi from '../services/userService';
import * as productApi from '../services/productService';
import * as inventoryApi from '../services/inventoryService';
import * as tillApi from '../services/tillService';
import * as settingApi from '../services/settingService';
import * as transactionApi from '../services/transactionService';
import * as orderApi from '../services/orderService';
import * as tableApi from '../services/tableService';
import * as dailyClosingApi from '../services/dailyClosingService';
import { getTaxRates } from '../services/apiService';

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
  taxRates: TaxRate[];
 assignedTillId: number | null;
  onSwitchToPos: () => void;
}

type AdminView = 'dashboard' | 'analytics' | 'products' | 'categories' | 'stockItems' | 'inventory' | 'users' | 'tills' | 'settings' | 'transactions' | 'activity' | 'tables' | 'dailyClosingSummary' | 'itemisedConsumption';

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const {
    currentUser, onLogout, onAssignDevice, assignedTillId, onSwitchToPos,
    onDataUpdate, products, categories, users, tills, settings,
    transactions, tabs, stockItems, stockAdjustments, orderActivityLogs,
    rooms, tables, taxRates
  } = props;
  
  const { t } = useTranslation('admin');
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
        return <ProductManagement products={products} categories={categories} stockItems={stockItems} taxRates={taxRates} onDataUpdate={onDataUpdate} />;
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
            <TableErrorBoundary>
              <TableProvider>
                <TableManagement />
              </TableProvider>
            </TableErrorBoundary>
          );
      case 'dailyClosingSummary':
          return <DailyClosingSummaryView currentUserRole={currentUser.role} />;
      case 'itemisedConsumption':
          return <ItemisedConsumptionPanel categories={categories} stockItems={stockItems} />;
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
                <h1 className="text-2xl font-bold text-amber-400">{t('title')}</h1>
                <p className="text-sm text-slate-400">{t('header.loggedInAs', { name: currentUser.name })}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onSwitchToPos} className="bg-sky-600 hover:bg-sky-500 font-bold py-2 px-4 rounded-md transition">
                  {t('header.switchToPos')}
              </button>
              <button onClick={onLogout} className="bg-red-700 hover:bg-red-600 font-bold py-2 px-4 rounded-md transition">
                  {t('header.logout')}
              </button>
            </div>
        </header>
        <div className="flex-grow flex overflow-hidden">
            <nav className="w-64 bg-slate-900 p-4 space-y-1 overflow-y-auto flex-shrink-0">
                <NavButton view="dashboard" label={t('navigation.dashboard')} isFirst/>
                <NavButton view="analytics" label={t('navigation.analytics')}/>
                <div className="pt-2"></div>
                <NavButton view="transactions" label={t('navigation.transactions')} />
                <NavButton view="activity" label={t('navigation.activity')} />
                <NavButton view="dailyClosingSummary" label={t('navigation.dailyClosingSummary')} />
                <div className="pt-2"></div>
                <NavButton view="products" label={t('navigation.products')} isFirst/>
                <NavButton view="categories" label={t('navigation.categories')} />
                <NavButton view="stockItems" label={t('navigation.stockItems')} />
                <NavButton view="inventory" label={t('navigation.inventory')} />
                <div className="pt-2"></div>
                <NavButton view="users" label={t('navigation.users')} isFirst/>
                <NavButton view="tills" label={t('navigation.tills')} />
                <NavButton view="tables" label={t('navigation.tables')} />
                <NavButton view="itemisedConsumption" label={t('navigation.itemisedConsumption')} />
                <div className="pt-2"></div>
                <NavButton view="settings" label={t('navigation.settings')} isFirst/>
            </nav>
            <main className="flex-grow p-6 overflow-y-auto bg-slate-900">
                {renderView()}
            </main>
        </div>
    </div>
  );
};
