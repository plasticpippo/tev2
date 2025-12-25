import React, { useMemo, useState } from 'react';
import type { Transaction, Product, Category, OrderItem } from '../@shared/types';
import { formatCurrency } from '../../utils/formatting';

interface TopPerformersProps {
    transactions: Transaction[];
    products: Product[];
    categories: Category[];
}

type SortBy = 'revenue' | 'quantity';

export const TopPerformers: React.FC<TopPerformersProps> = ({ transactions, products, categories }) => {
    const [sortBy, setSortBy] = useState<SortBy>('revenue');

    const performanceData = useMemo(() => {
        const productMap = new Map<number, Product>(products.map(p => [p.id, p]));
        const categoryMap = new Map<number, Category>(categories.map(c => [c.id, c]));

        const allItems: (OrderItem & { categoryId: number })[] = transactions.flatMap(t =>
            t.items.map(item => {
                const product = productMap.get(item.productId);
                return { ...item, categoryId: product?.categoryId || -1 };
            })
        );

        // Product Performance
        const productPerf = new Map<string, { quantity: number; revenue: number }>();
        allItems.forEach(item => {
            const current = productPerf.get(item.name) || { quantity: 0, revenue: 0 };
            current.quantity += item.quantity;
            current.revenue += item.price * item.quantity;
            productPerf.set(item.name, current);
        });

        const sortedProducts = Array.from(productPerf.entries())
            .sort(([, a], [, b]) => b[sortBy] - a[sortBy])
            .slice(0, 5);

        // Category Performance
        const categoryPerf = new Map<string, { quantity: number; revenue: number }>();
        allItems.forEach(item => {
            const category = categoryMap.get(item.categoryId);
            if (category) {
                const current = categoryPerf.get(category.name) || { quantity: 0, revenue: 0 };
                current.quantity += item.quantity;
                current.revenue += item.price * item.quantity;
                categoryPerf.set(category.name, current);
            }
        });

        const sortedCategories = Array.from(categoryPerf.entries())
            .sort(([, a], [, b]) => b[sortBy] - a[sortBy])
            .slice(0, 5);

        return { products: sortedProducts, categories: sortedCategories };
    }, [transactions, products, categories, sortBy]);

    const SortButton: React.FC<{ type: SortBy, label: string }> = ({ type, label }) => (
        <button
            onClick={() => setSortBy(type)}
            className={`text-xs px-2 py-1 rounded ${sortBy === type ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
            {label}
        </button>
    );

    const PerformanceList: React.FC<{ title: string, data: [string, { quantity: number, revenue: number }][] }> = ({ title, data }) => (
        <div className="bg-slate-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-300">{title}</h3>
                <div className="flex gap-2">
                    <SortButton type="revenue" label="By Revenue" />
                    <SortButton type="quantity" label="By Quantity" />
                </div>
            </div>
            <ul className="space-y-3">
                {data.map(([name, stats]) => (
                    <li key={name} className="flex justify-between items-center text-sm">
                        <span className="font-semibold">{name}</span>
                        <span className="text-slate-400">
                            {sortBy === 'revenue' ? formatCurrency(stats.revenue) : `${stats.quantity} sold`}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );

    // FIX: Added missing return statement. A React component must return a renderable value (JSX, null, etc.).
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceList title="Top Selling Products" data={performanceData.products} />
            <PerformanceList title="Top Selling Categories" data={performanceData.categories} />
        </div>
    );
};
