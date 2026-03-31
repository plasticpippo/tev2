import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { LayoutProvider, useLayout } from '../src/contexts/LayoutContext';
import { ProductGridLayout } from '../src/components/layout/ProductGridLayout';

import { LoginScreen } from './LoginScreen';
import { OrderPanel } from './OrderPanel';
import { AdminPanel } from './AdminPanel';
import { EditLayoutButton } from '../src/components/EditLayoutButton';
import { PaymentModal } from './PaymentModal';
import { TabManager } from './TabManager';
import { TransferItemsModal } from './TransferItemsModal';
import { TillSetupScreen } from './TillSetupScreen';
import { VirtualKeyboard } from './VirtualKeyboard';
import { TableAssignmentModal } from './TableAssignmentModal';
import FullscreenToggle from './FullscreenToggle';

export const MainPOSInterface: React.FC = () => {
  const { t } = useTranslation(['pos', 'common']);
  // Mobile tab state for phone/tablet view (< 768px - md breakpoint)
  const [activeMobileTab, setActiveMobileTab] = useState<'grid' | 'cart'>('grid');
  const {
    isLoading,
    currentUser,
    assignedTillId,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    orderItems,
    activeTab,
    assignedTable,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isTabsModalOpen,
    setIsTabsModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isTableAssignmentModalOpen,
    setIsTableAssignmentModalOpen,
    transferSourceTab,
    appData,
    currentTillName,
    handleLogout,
    handleAddToCart,
    handleUpdateQuantity,
    clearOrder,
    handleConfirmPayment,
    handleCreateTab,
    handleAddToTab,
    handleLoadTab,
    handleCloseTab,
    handleOpenTransfer,
    handleTableAssign,
    handleOpenTableAssignment,
    handleConfirmMove,
    handleSaveTab,
    handleTillSelect,
    handleLogin,
    debouncedFetchData,
    handleAssignDevice,
    makableVariantIds
  } = useAppContext();

  // --- RENDER LOGIC ---
  // Check if essential data is loaded (settings is required)
  if (isLoading || !appData.settings) {
    return <div className="bg-slate-900 text-white w-screen h-screen flex items-center justify-center">{t('common:app.loading')}</div>;
  }
  
  if (!assignedTillId && currentUser?.role === 'Admin') {
    return <TillSetupScreen tills={appData.tills} onTillSelect={handleTillSelect} />;
  }
  
  if (!currentUser) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} assignedTillId={assignedTillId} currentTillName={currentTillName} />
        <VirtualKeyboard />
      </>
    );
  }

  if (isAdminPanelOpen && currentUser.role === 'Admin') {
    return (
      <>
        <AdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          products={appData.products}
          categories={appData.categories}
          users={appData.users}
          tills={appData.tills}
          settings={appData.settings!}
          transactions={appData.transactions}
          tabs={appData.tabs}
          stockItems={appData.stockItems}
          stockAdjustments={appData.stockAdjustments}
          orderActivityLogs={appData.orderActivityLogs}
          rooms={appData.rooms}
          tables={appData.tables}
          taxRates={appData.taxRates}
          onDataUpdate={debouncedFetchData}
          assignedTillId={assignedTillId}
          onAssignDevice={handleAssignDevice}
          onSwitchToPos={() => setIsAdminPanelOpen(false)}
        />
        <VirtualKeyboard />
      </>
    );
  }
  
return (
 <>
 <div className="w-screen h-screen bg-slate-800 text-white flex flex-col p-4 gap-4 min-w-[320px]">
 <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
 <FullscreenToggle />
 {currentUser.role === 'Admin' && (
 <button
 onClick={() => setIsAdminPanelOpen(true)}
 className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 min-h-11 rounded-md"
 >
 {t('pos:admin.panel')}
 </button>
 )}
 </div>
        
        <main className="flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
          {assignedTillId ? (
            <LayoutProvider tillId={assignedTillId} initialCategoryId={'favourites'}>
              <>
 {/* Desktop/Tablet: Show both panels side by side */}
 <div className="hidden md:flex flex-row h-full w-full">
 <div className="flex-1 min-w-0 h-full flex flex-col">
 {/* Product Grid with Layout System */}
 <div className="flex-1 overflow-y-auto bg-slate-900">
 <ProductGridLayout
 products={appData.products}
 categories={appData.categories}
 onAddToCart={handleAddToCart}
 makableVariantIds={makableVariantIds}
 assignedTillId={assignedTillId}
 />
 </div>
 </div>

 <div className="w-full md:w-80 lg:w-96 h-full flex-shrink-0">
 <OrderPanel
                      orderItems={orderItems}
                      user={currentUser}
                      onUpdateQuantity={handleUpdateQuantity}
                      onClearOrder={() => clearOrder(true)}
                      onPayment={() => setIsPaymentModalOpen(true)}
                      onOpenTabs={() => setIsTabsModalOpen(true)}
                      onLogout={handleLogout}
                      activeTab={activeTab}
                      onSaveTab={handleSaveTab}
                      assignedTable={assignedTable}
                      onOpenTableAssignment={handleOpenTableAssignment}
                    />
                  </div>
                </div>

                {/* Mobile: Tab-based view with bottom tabs (< 768px) */}
                <div className="flex md:hidden flex-col h-full">
                  {/* Content area - shows either grid or cart based on active tab */}
                  <div className="flex-1 overflow-hidden">
{activeMobileTab === 'grid' ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto bg-slate-900">
                                    <ProductGridLayout
                                        products={appData.products}
                                        categories={appData.categories}
                                        onAddToCart={handleAddToCart}
                                        makableVariantIds={makableVariantIds}
                                        assignedTillId={assignedTillId}
                                    />
                                </div>
                                {currentUser.role === 'Admin' && (
                                    <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-900">
                                        <EditLayoutButton userRole="admin" />
                                    </div>
                                )}
                            </div>
                        ) : (
                      <div className="h-full">
                        <OrderPanel
                          orderItems={orderItems}
                          user={currentUser}
                          onUpdateQuantity={handleUpdateQuantity}
                          onClearOrder={() => clearOrder(true)}
                          onPayment={() => setIsPaymentModalOpen(true)}
                          onOpenTabs={() => setIsTabsModalOpen(true)}
                          onLogout={handleLogout}
                          activeTab={activeTab}
                          onSaveTab={handleSaveTab}
                          assignedTable={assignedTable}
                          onOpenTableAssignment={handleOpenTableAssignment}
                        />
                      </div>
                    )}
                  </div>

                  {/* Bottom Tab Bar for Mobile */}
                  <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700">
                    <div className="flex">
                      <button
                        onClick={() => setActiveMobileTab('grid')}
                        aria-label={t('pos:productGrid.title')}
                        aria-pressed={activeMobileTab === 'grid'}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition ${
                          activeMobileTab === 'grid'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        {t('pos:productGrid.title') || 'Products'}
                      </button>
                      <button
                        onClick={() => setActiveMobileTab('cart')}
                        aria-label={t('pos:cart.title', { defaultValue: 'Cart' })}
                        aria-pressed={activeMobileTab === 'cart'}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition relative ${
                          activeMobileTab === 'cart'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {t('pos:cart.title', { defaultValue: 'Cart' })}
                        {orderItems.length > 0 && (
                          <span className="absolute -top-1 right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold" aria-label={`${orderItems.length} items`}>
                            {orderItems.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <LayoutLoadingOverlay />
              </>
            </LayoutProvider>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 w-full">
              {t('pos:till.pleaseAssignTill')}
            </div>
          )}
        </main>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderItems={orderItems}
        taxSettings={appData.settings!.tax}
        onConfirmPayment={handleConfirmPayment}
        assignedTable={assignedTable}
      />
      
      <TabManager
        isOpen={isTabsModalOpen}
        onClose={() => setIsTabsModalOpen(false)}
        tabs={appData.tabs}
        onCreateTab={handleCreateTab}
        onAddToTab={handleAddToTab}
        onLoadTab={handleLoadTab}
        onCloseTab={handleCloseTab}
        onOpenTransfer={handleOpenTransfer}
        currentOrder={orderItems}
      />

      <TransferItemsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sourceTab={transferSourceTab}
        allTabs={appData.tabs}
        onConfirmMove={handleConfirmMove}
      />
      
      <TableAssignmentModal
        isOpen={isTableAssignmentModalOpen}
        onClose={() => setIsTableAssignmentModalOpen(false)}
        tables={appData.tables}
        rooms={appData.rooms}
        onTableAssign={handleTableAssign}
        currentTableId={assignedTable?.id}
      />
      
      <VirtualKeyboard />
    </>
  );
};

// Component to show loading states for layout operations
const LayoutLoadingOverlay: React.FC = () => {
  const { t } = useTranslation('pos');
  const { isLoading, isSaving } = useLayout();
  
  if (isLoading || isSaving) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-white mt-4">
            {isSaving ? t('layout.saving') : t('layout.loading')}
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};