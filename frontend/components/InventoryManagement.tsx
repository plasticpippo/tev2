import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { StockItem, StockAdjustment, User, Category, Product } from '@shared/types';
import * as inventoryApi from '../services/inventoryService';
import * as productApi from '../services/productService';
import * as userApi from '../services/userService';
import { StockAdjustmentHistory } from './StockAdjustmentHistory';
import { VKeyboardInput } from './VKeyboardInput';

interface AdjustmentModalProps {
    stockItems: StockItem[];
    currentUser: User;
    onClose: () => void;
    onSave: () => void;
    preselectedItemId?: string;
}

const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ stockItems, currentUser, onClose, onSave, preselectedItemId }) => {
    const { t } = useTranslation();
    const [stockItemId, setStockItemId] = useState<string | ''>(preselectedItemId || '');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [selectedUnitId, setSelectedUnitId] = useState<string>('base');
    const [reason, setReason] = useState('');
    
    const selectedItem = useMemo(() => stockItems.find(si => si.id === stockItemId), [stockItems, stockItemId]);
    const availableUnits = useMemo(() => {
        if (!selectedItem) return [];
        return [{ id: 'base', name: selectedItem.baseUnit, multiplier: 1 }, ...selectedItem.purchasingUnits];
    }, [selectedItem]);
    
    // Reset unit when item changes
    React.useEffect(() => {
        setSelectedUnitId('base');
    }, [stockItemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockItemId || quantity === '' || quantity === 0 || !reason.trim()) return;

        const unit = availableUnits.find(u => u.id === selectedUnitId);
        if (!unit) return;

        const finalQuantityInBaseUnits = Number(quantity) * unit.multiplier;

        await inventoryApi.saveStockAdjustment({
            stockItemId,
            itemName: selectedItem?.name || t('inventoryManagement.unknown'),
            quantity: finalQuantityInBaseUnits,
            reason,
            userId: currentUser.id,
            userName: currentUser.name
        });
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-amber-400 mb-4">{t('inventoryManagement.newStockAdjustment')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400">{t('inventoryManagement.stockItem')}</label>
                <select value={stockItemId} onChange={e => setStockItemId(e.target.value)} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required>
                    <option value="" disabled>{t('inventoryManagement.selectAnItem')}</option>
                    {stockItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-grow">
                    <label className="block text-sm text-slate-400">{t('inventoryManagement.quantity')}</label>
                    <VKeyboardInput k-type="numeric" type="number" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder={t('inventoryManagement.quantityPlaceholder')} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required />
                </div>
                <div className="w-1/3">
                    <label className="block text-sm text-slate-400">{t('inventoryManagement.unit')}</label>
                    <select value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)} disabled={!selectedItem} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md disabled:opacity-50">
                        {availableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                </div>
              </div>
               <div>
                <label className="block text-sm text-slate-400">{t('inventoryManagement.reason')}</label>
                <VKeyboardInput k-type="full" type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('inventoryManagement.reasonPlaceholder')} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
              <button type="button" onClick={onClose} className="btn btn-secondary">{t('buttons.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('inventoryManagement.saveAdjustment')}</button>
            </div>
          </form>
        </div>
    );
};


interface InventoryManagementProps {
    stockItems: StockItem[];
    stockAdjustments: StockAdjustment[];
    currentUser: User;
    products: Product[];
    categories: Category[];
    onDataUpdate: () => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ stockItems, stockAdjustments, currentUser, products, categories, onDataUpdate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'ingredients' | 'goods'>('ingredients');
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'out'>('all');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');

    const handleSave = () => {
        setIsAdjustmentModalOpen(false);
        setPreselectedItemId(undefined);
        onDataUpdate();
    };

    const handleOpenAdjustModal = (itemId: string) => {
        setPreselectedItemId(itemId);
        setIsAdjustmentModalOpen(true);
    };

    const filteredStockItems = useMemo(() => {
        let items = stockItems.filter(item => {
            if (activeTab === 'ingredients') return item.type === 'Ingredient';
            return item.type === 'Sellable Good';
        });

        if (categoryFilter !== 'all') {
            const stockItemIdsInCategory = new Set<string>();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            products.forEach(p => {
                if (p.categoryId === categoryFilter) {
                    p.variants.forEach(v => {
                        v.stockConsumption.forEach(sc => {
                            // Only add to the set if the stockItemId is a valid UUID format
                            if (uuidRegex.test(sc.stockItemId)) {
                                stockItemIdsInCategory.add(sc.stockItemId);
                            }
                        });
                    });
                }
            });
            items = items.filter(item => stockItemIdsInCategory.has(item.id));
        }

        if (searchTerm) {
            items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (stockLevelFilter === 'low') {
            items = items.filter(item => item.quantity > 0 && item.quantity <= 10);
        } else if (stockLevelFilter === 'out') {
            items = items.filter(item => item.quantity <= 0);
        }
        
        return items;
    }, [stockItems, activeTab, searchTerm, stockLevelFilter, categoryFilter, products]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 space-y-4">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('ingredients')} className={`btn ${activeTab === 'ingredients' ? 'btn-primary' : 'btn-secondary'}`}>
                        {t('inventoryManagement.ingredients')}
                    </button>
                    <button onClick={() => setActiveTab('goods')} className={`btn ${activeTab === 'goods' ? 'btn-primary' : 'btn-secondary'}`}>
                        {t('inventoryManagement.sellableGoods')}
                    </button>
                </div>
                <div className="bg-slate-800 p-2 rounded-md flex gap-2 items-center">
                    <input type="text" placeholder={t('inventoryManagement.searchByName')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 bg-slate-900 border border-slate-700 rounded-md text-sm" />
                    <select onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} value={categoryFilter} className="bg-slate-900 border border-slate-700 p-2 rounded-md text-sm">
                        <option value="all">{t('inventoryManagement.allCategories')}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => setStockLevelFilter('all')} className={`btn ${stockLevelFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>{t('inventoryManagement.all')}</button>
                    <button onClick={() => setStockLevelFilter('low')} className={`btn ${stockLevelFilter === 'low' ? 'btn-warning' : 'btn-secondary'} btn-sm`}>{t('inventoryManagement.low')}</button>
                    <button onClick={() => setStockLevelFilter('out')} className={`btn ${stockLevelFilter === 'out' ? 'btn-danger' : 'btn-secondary'} btn-sm`}>{t('inventoryManagement.out')}</button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 mt-4 space-y-2">
                {filteredStockItems.map(item => (
                    <div key={item.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-400">{t('inventoryManagement.trackedIn', { unit: item.baseUnit })}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`text-xl font-bold ${item.quantity <= 0 ? 'text-red-400' : item.quantity <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {t('inventoryManagement.inStock', { quantity: item.quantity })}
                            </span>
                             <button onClick={() => handleOpenAdjustModal(item.id)} className="btn btn-success btn-sm">
                                {t('inventoryManagement.adjust')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 mt-4">
                 <StockAdjustmentHistory adjustments={stockAdjustments} />
             </div>

            {isAdjustmentModalOpen && (
                <AdjustmentModal
                    stockItems={stockItems}
                    currentUser={currentUser}
                    onClose={() => setIsAdjustmentModalOpen(false)}
                    onSave={handleSave}
                    preselectedItemId={preselectedItemId}
                />
            )}
        </div>
    );
};
