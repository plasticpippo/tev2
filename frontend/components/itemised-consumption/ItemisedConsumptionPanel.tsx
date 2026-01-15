import React, { useState, useEffect } from 'react';
import type { Category, StockItem, ConsumptionReportItem } from '../../../shared/types';
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
  const [consumptionData, setConsumptionData] = useState<ConsumptionReportItem[]>([]);
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
      setConsumptionData(data);
    } catch (error) {
      console.error('Error fetching consumption report:', error);
      setConsumptionData([]);
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
        <h2 className="text-2xl font-bold text-slate-300 self-start sm:self-center">Itemised Consumption Report</h2>
      </div>

      <ItemisedConsumptionFilter
        categories={categories}
        stockItems={stockItems}
        onFilterChange={handleFilterChange}
      />

      <ItemisedConsumptionTable
        consumptionData={consumptionData}
        isLoading={isLoading}
      />
    </div>
  );
};