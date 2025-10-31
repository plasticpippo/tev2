import React, { useState } from 'react';
// Fix: Import the 'Product' type to resolve type errors in prop definitions.
import type { StockItem, PurchasingUnit, Product } from '../../shared/types';
import * as api from '../services/apiService';
import { VKeyboardInput } from './VKeyboardInput';
import { ConfirmationModal } from './ConfirmationModal';
import { v4 as uuidv4 } from 'uuid';

interface StockItemModalProps {
  item?: StockItem;
  onClose: () => void;
  onSave: () => void;
  products: Product[];
}

const StockItemModal: React.FC<StockItemModalProps> = ({ item, onClose, onSave, products }) => {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<'Ingredient' | 'Sellable Good'>(item?.type || 'Sellable Good');
  const [baseUnit, setBaseUnit] = useState(item?.baseUnit || 'pcs');
  const [quantity, setQuantity] = useState(item?.quantity || 0);
  const [purchasingUnits, setPurchasingUnits] = useState<PurchasingUnit[]>(item?.purchasingUnits || []);

  const handleAddPurchasingUnit = () => {
    setPurchasingUnits([...purchasingUnits, { id: uuidv4(), name: '', multiplier: 1 }]);
  };

  const handleUpdatePurchasingUnit = (index: number, field: keyof PurchasingUnit, value: string | number) => {
    const newUnits = [...purchasingUnits];
    if (typeof newUnits[index][field] === 'number') {
        newUnits[index] = { ...newUnits[index], [field]: Number(value) };
    } else {
        newUnits[index] = { ...newUnits[index], [field]: value };
    }
    setPurchasingUnits(newUnits);
  };
  
  const handleRemovePurchasingUnit = (index: number) => {
    setPurchasingUnits(purchasingUnits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUnit.trim()) return;

    const itemData = { 
        id: item?.id, 
        name, 
        type, 
        baseUnit,
        quantity: item?.id ? item.quantity : quantity,
        purchasingUnits: purchasingUnits.filter(pu => pu.name && pu.multiplier > 0)
    };
    await api.saveStockItem(itemData);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 p-6 pb-0">{item ? 'Edit' : 'Add'} Stock Item</h3>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-400">Item Name</label>
            <VKeyboardInput k-type="full" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <option value="Sellable Good">Sellable Good</option>
                    <option value="Ingredient">Ingredient</option>
                </select>
              </div>
               <div>
                <label className="block text-sm text-slate-400">Base Tracking Unit</label>
                <VKeyboardInput k-type="full" type="text" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} placeholder="e.g., pcs, ml, g" className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required />
              </div>
          </div>
          {!item && (
              <div>
                <label className="block text-sm text-slate-400">Initial Quantity (in Base Unit)</label>
                <VKeyboardInput k-type="numeric" type="number" value={quantity === 0 ? '' : quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md" required />
              </div>
          )}
          
          <div className="border-t border-slate-700 pt-4">
              <h4 className="text-lg font-semibold text-slate-300 mb-2">Purchasing Units</h4>
              <p className="text-xs text-slate-500 mb-3">Define how you buy this item for easy stock intake (e.g., a "Bottle" is 750 base units of "ml").</p>
              <div className="space-y-2">
                  {purchasingUnits.map((unit, index) => (
                      <div key={unit.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded-md">
                          <VKeyboardInput k-type="full" type="text" value={unit.name} onChange={e => handleUpdatePurchasingUnit(index, 'name', e.target.value)} placeholder="Unit Name (e.g., Bottle)" className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-sm"/>
                          <span className="text-slate-400">=</span>
                          <VKeyboardInput k-type="numeric" type="number" value={unit.multiplier} onChange={e => handleUpdatePurchasingUnit(index, 'multiplier', e.target.value)} placeholder="Multiplier" className="w-24 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm" />
                          <span className="text-slate-400 text-sm">{baseUnit}</span>
                          <button type="button" onClick={() => handleRemovePurchasingUnit(index)} className="text-red-500 hover:text-red-400 font-bold px-2">&times;</button>
                      </div>
                  ))}
              </div>
              <button type="button" onClick={handleAddPurchasingUnit} className="mt-3 w-full bg-sky-700 hover:bg-sky-600 text-white font-bold py-2 rounded-md text-sm">+ Add Purchasing Unit</button>
          </div>

        </div>
        <div className="flex justify-end gap-2 mt-auto p-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
};


interface StockItemManagementProps {
    stockItems: StockItem[];
    products: Product[];
    onDataUpdate: () => void;
}

export const StockItemManagement: React.FC<StockItemManagementProps> = ({ stockItems, products, onDataUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | undefined>(undefined);
    const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
    const [deleteError, setDeleteError] = useState<string>('');

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingItem(undefined);
        onDataUpdate();
    };

    const handleDeleteClick = (item: StockItem) => {
        setDeleteError('');
        setDeletingItem(item);
    };

    const confirmDelete = async () => {
        if (deletingItem) {
            const result = await api.deleteStockItem(deletingItem.id);
            if (result.success) {
                setDeletingItem(null);
                onDataUpdate();
            } else {
                setDeleteError(result.message || 'An unknown error occurred.');
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-300">Stock Items</h3>
                <button
                    onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
                >
                    Add Stock Item
                </button>
            </div>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                {stockItems.map(item => (
                    <div key={item.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-400">{item.type} (Tracked in {item.baseUnit})</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-amber-400">{item.quantity} {item.baseUnit} in stock</span>
                            <button
                                onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteClick(item)}
                                className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <StockItemModal
                    item={editingItem}
                    onClose={() => { setIsModalOpen(false); setEditingItem(undefined); }}
                    onSave={handleSave}
                    products={products}
                />
            )}
            <ConfirmationModal
                isOpen={!!deletingItem}
                message={deleteError || `Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
                onConfirm={deleteError ? () => { setDeletingItem(null); setDeleteError(''); } : confirmDelete}
                onCancel={() => { setDeletingItem(null); setDeleteError(''); }}
                confirmText={deleteError ? 'OK' : 'Confirm'}
            />
        </div>
    );
};