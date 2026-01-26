import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LayoutProvider, useLayout } from '../src/contexts/LayoutContext';
import { ProductGridLayout } from '../src/components/layout/ProductGridLayout';

import { LoginScreen } from './LoginScreen';
import { OrderPanel } from './OrderPanel';
import { AdminPanel } from './AdminPanel';
import { PaymentModal } from './PaymentModal';
import { TabManager } from './TabManager';
import { TransferItemsModal } from './TransferItemsModal';
import { TillSetupScreen } from './TillSetupScreen';
import { VirtualKeyboard } from './VirtualKeyboard';
import { TableAssignmentModal } from './TableAssignmentModal';

export const MainPOSInterface: React.FC = () => {
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
  if (isLoading) {
    return <div className="bg-slate-90 text-white w-screen h-screen flex items-center justify-center">Loading POS...</div>;
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
      <div className="w-screen h-screen bg-slate-800 text-white flex flex-col p-4 gap-4">
        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setIsAdminPanelOpen(true)}
            className="absolute top-2 right-2 bg-purple-700 hover:bg-purple-60 text-white font-bold py-2 px-4 rounded-md z-30"
          >
            Admin Panel
          </button>
        )}
        
        <main className="flex-grow flex gap-4 overflow-hidden">
          {assignedTillId ? (
            <LayoutProvider tillId={assignedTillId} initialCategoryId={'favourites'}>
              <>
                <div className="w-2/3 h-full flex flex-col">
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
                
                <div className="w-1/3 h-full">
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
                <LayoutLoadingOverlay />
              </>
            </LayoutProvider>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 w-full">
              Please assign a till to continue
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
  const { isLoading, isSaving } = useLayout();
  
  if (isLoading || isSaving) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-white mt-4">
            {isSaving ? 'Saving layout...' : 'Loading layout...'}
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};