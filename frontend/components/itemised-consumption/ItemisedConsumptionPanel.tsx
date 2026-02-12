import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category, StockItem, ConsumptionReportResponse, ConsumptionReportItem, ConsumptionReportTotal } from '../../../shared/types';
import { getConsumptionReport } from '../../services/consumptionService';
import { ItemisedConsumptionFilter } from './ItemisedConsumptionFilter';
import { ItemisedConsumptionTable } from './ItemisedConsumptionTable';

interface ItemisedConsumptionPanelProps {
  categories: Category[];
  stockItems: StockItem[];
}

export const ItemisedConsumptionPanel: React.FC<ItemisedConsumptionPanelProps> = ({ 
  categories, 
  stockItems 
}) => {
  const { t } = useTranslation('admin');
  const [consumptionData, setConsumptionData] = useState<ConsumptionReportItem[]>([]);
  const [consumptionTotals, setConsumptionTotals] = useState<ConsumptionReportTotal[]>([]);
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    stockItemType?: string;
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchConsumptionData();
  }, [filters]);

  const fetchConsumptionData = async () => {
    setIsLoading(true);
    try {
      const data = await getConsumptionReport(filters);
      setConsumptionData(data.details);
      setConsumptionTotals(data.totals);
    } catch (error) {
      console.error('Error fetching consumption report:', error);
      setConsumptionData([]);
      setConsumptionTotals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    stockItemType?: string;
  }) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-300 self-start sm:self-center">{t('itemisedConsumption.title')}</h2>
      </div>

      <ItemisedConsumptionFilter
        categories={categories}
        stockItems={stockItems}
        onFilterChange={handleFilterChange}
      />

      {/* Totals Section */}
      {!isLoading && consumptionTotals.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-3">{t('itemisedConsumption.consumptionTotals')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-750">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.stockItem')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('itemisedConsumption.totalQuantity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {consumptionTotals.map((total) => (
                  <tr key={total.stockItemId} className="hover:bg-slate-750">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{total.stockItemName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{total.stockItemType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 font-semibold">{total.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ItemisedConsumptionTable
        consumptionData={consumptionData}
        isLoading={isLoading}
      />
    </div>
  );
};