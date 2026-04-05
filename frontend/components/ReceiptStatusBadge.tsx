import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as receiptService from '../services/receiptService';

interface ReceiptStatusBadgeProps {
  onClick?: () => void;
  collapsed?: boolean;
}

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({ onClick, collapsed = false }) => {
  const { t } = useTranslation('admin');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPendingCount = useCallback(async () => {
    try {
      const pendingReceipts = await receiptService.getPendingReceipts();
      setCount(pendingReceipts.length);
    } catch (error) {
      console.error('Error fetching pending receipts count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  if (loading || count === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        ${collapsed ? 'w-5 h-5 text-[10px]' : 'px-2 py-0.5 text-xs'}
        bg-red-500 hover:bg-red-400 text-white font-bold rounded-full
        transition-colors duration-200
        ${collapsed ? 'absolute -top-1 -right-1' : 'ml-2'}
      `}
      title={t('receipts.statusBadge.title', { count })}
    >
      {count > 99 ? '99+' : count}
    </button>
  );
};

export default ReceiptStatusBadge;
