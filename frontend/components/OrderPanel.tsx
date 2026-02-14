import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderItem, User, Tab, Table } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { EditLayoutButton } from '../src/components/EditLayoutButton';
import { EditModeOverlay } from '../src/components/EditModeOverlay';
import { useLayout } from '../src/contexts/LayoutContext';

interface OrderPanelProps {
  orderItems: OrderItem[];
  user: User;
  // Fix: Changed productId from number to orderItemId (string) to match the OrderItem type and the handler in App.tsx.
  onUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
  onClearOrder: () => void;
  onPayment: () => void;
  onOpenTabs: () => void;
  onLogout: () => void;
  activeTab: Tab | null;
  onSaveTab: () => void;
  assignedTable: Table | null;
  onOpenTableAssignment: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ orderItems, user, onUpdateQuantity, onClearOrder, onPayment, onOpenTabs, onLogout, activeTab, onSaveTab, assignedTable, onOpenTableAssignment }) => {
  const { t } = useTranslation(['pos', 'common']);
  
  // Try to get layout context (will be undefined if not within LayoutProvider)
  let layoutContext;
  try {
    layoutContext = useLayout();
  } catch {
    // Not within LayoutProvider, that's okay
    layoutContext = null;
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Renders individual order items with quantity controls
   */
  const renderOrderItems = () => {
    if (orderItems.length === 0) {
      return <p className="text-slate-500 text-center mt-10">{t('pos:cart.empty')}</p>;
    }

    return (
      <div className="space-y-3">
        {orderItems.map(item => (
          <div key={item.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.name || t('pos:cart.itemVariant', { variantId: item.variantId })}</p>
              <p className="text-slate-400 text-sm">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Fix: item.id is a string, and onUpdateQuantity now correctly accepts it. */}
              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center">-</button>
              <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
              {/* Fix: item.id is a string, and onUpdateQuantity now correctly accepts it. */}
              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center">+</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders the action buttons when a tab is active
   */
  const renderActiveTabButtons = () => (
    <>
      <button
        onClick={onSaveTab}
        className="btn btn-primary w-full"
      >
        {t('pos:cart.saveTabStartNew')}
      </button>
      
      {orderItems.length > 0 && (
        <button onClick={onPayment} className="btn btn-success w-full">
          {t('pos:cart.payment')}
        </button>
      )}
    </>
  );

  /**
   * Renders the action buttons when no tab is active
   */
  const renderNoTabButtons = () => (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenTabs}
          className={`btn btn-info w-full ${orderItems.length === 0 ? 'col-span-2' : ''}`}
        >
          {orderItems.length > 0 ? t('pos:tabs.title') : t('pos:tabs.viewOpenTabs')}
        </button>
        {orderItems.length > 0 && (
          <button onClick={onClearOrder} className="btn btn-danger w-full">
            {t('pos:cart.clearOrder')}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Assign to Table button - only show when there are items */}
        {orderItems.length > 0 && (
          <button
            onClick={onOpenTableAssignment}
            className={`btn w-full ${
              assignedTable
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            {assignedTable ? t('pos:order.tableLabel', { name: assignedTable.name }).toUpperCase() : t('pos:table.assignTable').toUpperCase()}
          </button>
        )}
        
        {orderItems.length > 0 && (
          <button
            onClick={onPayment}
            className="btn btn-success w-full"
          >
            {t('pos:cart.payment')}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="w-full md:w-96 bg-slate-800 border-l border-slate-700 relative flex flex-col h-full min-w-[300px]">
      {/* Header section - stays at top */}
      <div className="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">{t('pos:order.loggedInAs')}</p>
          <p className="text-white font-semibold">
            {user?.name}
            <span className="text-purple-400 text-xs ml-2">
              ({user?.role})
            </span>
          </p>
        </div>
        <button onClick={onLogout} className="btn btn-danger btn-sm">
          {t('common:buttons.logout')}
        </button>
      </div>

      {/* Active Tab indicator */}
      {activeTab && (
        <div className="bg-sky-800 p-2 rounded-md my-2 mx-4 text-center border border-sky-600">
          <p className="font-bold text-sky-200">{t('pos:order.editingTab', { name: activeTab.name })}</p>
        </div>
      )}

      {/* Assigned Table indicator */}
      {assignedTable && (
        <div className="bg-green-800 p-2 rounded-md my-2 mx-4 text-center border border-green-600 flex justify-between items-center">
          <div>
            <p className="font-bold text-green-200">{t('pos:order.tableLabel', { name: assignedTable.name })}</p>
            <p className="text-xs text-green-300">{t(`pos:table.status.${assignedTable.status}`)}</p>
          </div>
          <button
            onClick={onOpenTableAssignment}
            className="btn btn-primary btn-sm"
          >
            {t('pos:table.changeTable')}
          </button>
        </div>
      )}

      {/* Scrollable order items section - constrained height */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 flex-shrink-0">{t('pos:cart.title')}</h2>
        
        {/* Scrollable order items container */}
        <div className="overflow-y-auto flex-grow">
          {orderItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              {t('pos:cart.empty')}
            </div>
          ) : (
            <div>
              {renderOrderItems()}
            </div>
          )}
        </div>

        {/* Edit Mode Overlay - covers this section when in edit mode */}
        {layoutContext && <EditModeOverlay />}
      </div>

      {/* Edit Layout Button Section - above bottom actions */}
      {layoutContext && user?.role === 'Admin' && (
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <EditLayoutButton userRole="admin" />
        </div>
      )}

      {/* Fixed bottom section with payment controls */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
        {orderItems.length > 0 && (
          <div className="flex justify-between text-xl mb-4">
            <span>{t('pos:cart.subtotal')}</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>
        )}

        {activeTab
          ? renderActiveTabButtons()
          : renderNoTabButtons()
        }
      </div>
    </div>
  );
};
