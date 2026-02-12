import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, Product, Category, OrderItem } from '../../shared/types';
import { formatCurrency } from '../../utils/formatting';
import { AdvancedFilter } from './AdvancedFilter';
import { ProductPerformanceTable } from './ProductPerformanceTable';
import { PaginationControls } from './PaginationControls';
import { fetchProductPerformance, fetchTopPerformers, ProductPerformanceResult, AnalyticsParams } from '../../services/analyticsService';

interface TopPerformersProps {
    transactions: Transaction[];
    products: Product[];
    categories: Category[];
    includeAllProducts?: boolean; // New prop to control whether to show all products or just top performers
}

export const TopPerformers: React.FC<TopPerformersProps> = ({
    transactions,
    products,
    categories,
    includeAllProducts = false
}) => {
    const { t } = useTranslation('admin');
    const [performanceData, setPerformanceData] = useState<ProductPerformanceResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AnalyticsParams>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    // Load data when filters change or component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Prepare params with pagination
                const params: AnalyticsParams = {
                    ...filters,
                    page: currentPage,
                    limit: limit,
                    includeAllProducts
                };
                
                let result: ProductPerformanceResult;
                
                if (includeAllProducts) {
                    // Use the new expanded endpoint
                    result = await fetchProductPerformance(params);
                } else {
                    // Use the legacy endpoint for backward compatibility
                    result = await fetchTopPerformers(params);
                }
                
                setPerformanceData(result);
            } catch (err: any) {
                setError(err.message || 'Failed to load performance data');
                console.error('Error loading performance data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [filters, currentPage, limit, includeAllProducts]);

    const handleFilterChange = (newFilters: AnalyticsParams) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1); // Reset to first page when limit changes
    };

    // Backward compatibility: if not showing all products, display the traditional view
    if (!includeAllProducts) {
        // Calculate category performance for backward compatibility
        const categoryPerformance = performanceData ?
            Array.from(
                performanceData.products.reduce((acc, product) => {
                    const existing = acc.get(product.categoryName) || { totalRevenue: 0, totalQuantity: 0 };
                    existing.totalRevenue += product.totalRevenue;
                    existing.totalQuantity += product.totalQuantity;
                    acc.set(product.categoryName, existing);
                    return acc;
                }, new Map<string, { totalRevenue: number; totalQuantity: number }>())
            )
            .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5) : [];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-300 mb-4">{t('analytics.topSellingProducts')}</h3>
                    {performanceData ? (
                        <ul className="space-y-3">
                            {performanceData.products.map((product) => (
                                <li key={product.id} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold">{product.name}</span>
                                    <span className="text-slate-400">
                                        {formatCurrency(product.totalRevenue)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('analytics.loading')}</p>
                    )}
                </div>
                <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-300 mb-4">{t('analytics.topSellingCategories')}</h3>
                    {performanceData ? (
                        <ul className="space-y-3">
                            {categoryPerformance.map(([name, stats]) => (
                                <li key={name} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold">{name}</span>
                                    <span className="text-slate-400">
                                        {formatCurrency(stats.totalRevenue)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('analytics.loading')}</p>
                    )}
                </div>
            </div>
        );
    }

    // Expanded view with all products and pagination
    return (
        <div className="space-y-6">
            <AdvancedFilter
                categories={categories}
                products={products}
                onFilterChange={handleFilterChange}
            />
            
            {error && (
                <div className="bg-red-800 text-red-100 p-4 rounded-lg">
                    {t('analytics.error')}: {error}
                </div>
            )}
            
            <ProductPerformanceTable
                products={performanceData?.products || []}
                loading={loading}
            />
            
            {performanceData?.metadata && (
                <PaginationControls
                    metadata={performanceData.metadata}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    currentLimit={limit}
                />
            )}
            
            {performanceData?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-400">{t('analytics.totalRevenue')}</h4>
                        <p className="text-xl font-bold text-slate-300">{formatCurrency(performanceData.summary.totalRevenue)}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-400">{t('analytics.totalUnitsSold')}</h4>
                        <p className="text-xl font-bold text-slate-300">{performanceData.summary.totalUnitsSold}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-400">{t('analytics.topProduct')}</h4>
                        <p className="text-xl font-bold text-slate-300">
                            {performanceData.summary.topProduct
                                ? performanceData.summary.topProduct.name
                                : t('analytics.notApplicable')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
