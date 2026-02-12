import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ConsumptionReportItem } from '../../../shared/types';

interface TableProps {
  consumptionData: ConsumptionReportItem[];
  isLoading: boolean;
}

export const ItemisedConsumptionTable: React.FC<TableProps> = ({ 
  consumptionData, 
  isLoading 
}) => {
  const { t } = useTranslation('admin');

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (consumptionData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <p className="text-slate-400">{t('itemisedConsumption.noDataFound')}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-750">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.date')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.product')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.variant')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.category')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.stockItem')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.type')}</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.quantityConsumed')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {consumptionData.map((item) => (
            <tr key={`${item.transactionDate}-${item.id}`} className="hover:bg-slate-750">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                {new Date(item.transactionDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.productName}</td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.variantName}</td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.categoryName}</td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.stockItemName}</td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.stockItemType}</td>
              <td className="px-4 py-3 text-sm text-slate-300">{item.quantityConsumed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};