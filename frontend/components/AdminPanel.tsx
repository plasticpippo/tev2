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
import { ReceiptManagement } from './ReceiptManagement';
import { ReceiptStatusBadge } from './ReceiptStatusBadge';
import { CustomerManagement } from './CustomerManagement';
import CostManagementPanel from './CostManagementPanel';
import { ProfitAnalyticsPanel } from './ProfitAnalyticsPanel';
import VarianceReportPanel from './VarianceReportPanel';
import InventoryCountPanel from './InventoryCountPanel';
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

type AdminView = 'dashboard' | 'analytics' | 'products' | 'categories' | 'stockItems' | 'inventory' | 'users' | 'tills' | 'settings' | 'transactions' | 'activity' | 'tables' | 'dailyClosingSummary' | 'itemisedConsumption' | 'receipts' | 'customers' | 'costManagement' | 'profitAnalytics' | 'varianceReports' | 'inventoryCounts';

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const {
    currentUser, onLogout, onAssignDevice, assignedTillId, onSwitchToPos,
    onDataUpdate, products, categories, users, tills, settings,
    transactions, tabs, stockItems, stockAdjustments, orderActivityLogs,
    rooms, tables, taxRates
  } = props;

  const { t } = useTranslation('admin');
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSettingsUpdate = async (newSettings: Settings) => {
    await settingApi.saveSettings(newSettings);
    onDataUpdate();
  };

  const handleNavClick = (view: AdminView) => {
    setActiveView(view);
    setSidebarOpen(false);
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
        return <TransactionHistory transactions={transactions} users={users} tills={tills} settings={settings} onDataUpdate={onDataUpdate} />;
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
        case 'receipts':
            return <ReceiptManagement onDataUpdate={onDataUpdate} onNavigateToCustomer={(id) => { setActiveView('customers'); }} />;
        case 'customers':
            return <CustomerManagement onDataUpdate={onDataUpdate} />;
      case 'costManagement':
        return <CostManagementPanel stockItems={stockItems} />;
      case 'profitAnalytics':
        return <ProfitAnalyticsPanel />;
      case 'varianceReports':
        return <VarianceReportPanel />;
      case 'inventoryCounts':
        return <InventoryCountPanel />;
    default:
        return <p>{t('selectAView')}</p>;
    }
  };

  const NavButton: React.FC<{ view: AdminView; label: string; isFirst?: boolean; icon: React.ReactNode; badge?: React.ReactNode }> = ({ view, label, isFirst = false, icon, badge }) => (
    <button
      onClick={() => handleNavClick(view)}
      className={`w-full text-left p-3 rounded-md font-semibold transition flex items-center gap-3 ${isFirst ? '' : 'mt-1'} ${activeView === view ? 'bg-amber-600 text-white' : 'hover:bg-slate-700'}`}
      title={sidebarCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0 relative">
        {icon}
        {sidebarCollapsed && badge}
      </span>
      {!sidebarCollapsed && <span className="truncate flex-1">{label}</span>}
      {!sidebarCollapsed && badge}
    </button>
  );

  const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const AnalyticsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const TransactionsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const ActivityIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const DailyClosingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const ProductsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const CategoriesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const StockItemsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );

  const InventoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h4m-2 0v4" />
    </svg>
  );

  const ProfitIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CostIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const CustomersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const VarianceIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const InventoryCountIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const TillsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const TablesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );

  const ItemisedIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const ReceiptsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <div className="w-screen h-screen bg-slate-800 text-white flex flex-col min-w-[320px]">
      <header className="flex-shrink-0 bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden min-h-11 min-w-11 p-2 rounded-md hover:bg-slate-700 transition flex items-center justify-center"
            aria-label={t('openMenu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-amber-400">{t('title')}</h1>
            <p className="text-sm text-slate-400">{t('header.loggedInAs', { name: currentUser.name })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
<button onClick={onSwitchToPos} className="bg-sky-600 hover:bg-sky-500 font-bold py-2 px-4 min-h-11 rounded-md transition">
{t('header.switchToPos')}
</button>
<button onClick={onLogout} className="bg-red-700 hover:bg-red-600 font-bold py-2 px-4 min-h-11 rounded-md transition">
{t('header.logout')}
</button>
        </div>
      </header>
      <div className="flex-grow flex overflow-y-auto relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <nav
          className={`fixed lg:relative inset-y-0 left-0 z-50 bg-slate-900 p-4 space-y-1 overflow-y-auto flex-shrink-0 transform transition-transform duration-300 lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
        >
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h2 className="text-lg font-bold text-amber-400">{t('title')}</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="min-h-11 min-w-11 p-2 rounded-md hover:bg-slate-700 transition flex items-center justify-center"
              aria-label={t('closeMenu')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex justify-end mb-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="min-h-11 min-w-11 p-2 rounded-md hover:bg-slate-700 transition flex items-center justify-center"
              aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <NavButton view="dashboard" label={t('navigation.dashboard')} isFirst icon={<DashboardIcon />} />
          <NavButton view="analytics" label={t('navigation.analytics')} icon={<AnalyticsIcon />} />
          <NavButton view="profitAnalytics" label={t('navigation.profitAnalytics')} icon={<ProfitIcon />} />
          <div className="pt-2"></div>
<NavButton view="transactions" label={t('navigation.transactions')} icon={<TransactionsIcon />} />
      <NavButton 
        view="receipts" 
        label={t('navigation.receipts')} 
        icon={<ReceiptsIcon />} 
        badge={<ReceiptStatusBadge onClick={() => handleNavClick('receipts')} collapsed={sidebarCollapsed} />}
      />
<NavButton view="activity" label={t('navigation.activity')} icon={<ActivityIcon />} />
      <NavButton view="dailyClosingSummary" label={t('navigation.dailyClosingSummary')} icon={<DailyClosingIcon />} />
      <div className="pt-2"></div>
      <NavButton view="customers" label={t('navigation.customers')} isFirst icon={<UsersIcon />} />
      <NavButton view="products" label={t('navigation.products')} icon={<ProductsIcon />} />
          <NavButton view="categories" label={t('navigation.categories')} icon={<CategoriesIcon />} />
          <NavButton view="stockItems" label={t('navigation.stockItems')} icon={<StockItemsIcon />} />
          <NavButton view="inventory" label={t('navigation.inventory')} icon={<InventoryIcon />} />
          <NavButton view="costManagement" label={t('navigation.costManagement')} icon={<CostIcon />} />
          <NavButton view="inventoryCounts" label={t('navigation.inventoryCounts')} icon={<InventoryCountIcon />} />
          <NavButton view="varianceReports" label={t('navigation.varianceReports')} icon={<VarianceIcon />} />
          <div className="pt-2"></div>
          <NavButton view="users" label={t('navigation.users')} isFirst icon={<UsersIcon />} />
          <NavButton view="tills" label={t('navigation.tills')} icon={<TillsIcon />} />
          <NavButton view="tables" label={t('navigation.tables')} icon={<TablesIcon />} />
          <NavButton view="itemisedConsumption" label={t('navigation.itemisedConsumption')} icon={<ItemisedIcon />} />
          <div className="pt-2"></div>
          <NavButton view="settings" label={t('navigation.settings')} isFirst icon={<SettingsIcon />} />
        </nav>
        <main className={`flex-grow p-6 bg-slate-900 flex flex-col overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
};
