import React, { useState } from 'react';
import type { Product, ProductVariant, Category, StockItem } from '../../shared/types';
import * as api from '../services/apiService';
import { VKeyboardInput } from './VKeyboardInput';
import { ConfirmationModal } from './ConfirmationModal';
import { availableColors, getContrastingTextColor } from '../utils/color';
import { formatCurrency } from '../utils/formatting';
import { v4 as uuidv4 } from 'uuid';

interface VariantFormProps {
    variant: Partial<ProductVariant>;
    onUpdate: (variant: Partial<ProductVariant>) => void;
    onRemove: () => void;
    stockItems: StockItem[];
}

const VariantForm: React.FC<VariantFormProps> = ({ variant, onUpdate, onRemove, stockItems }) => {
    
    const handleAddConsumption = () => {
        const firstStockItem = stockItems[0];
        if (!firstStockItem) return;
        const newConsumption = [...(variant.stockConsumption || []), { stockItemId: firstStockItem.id, quantity: 0 }];
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };

    const handleUpdateConsumption = (index: number, field: 'stockItemId' | 'quantity', value: number) => {
        const newConsumption = [...(variant.stockConsumption || [])];
        newConsumption[index] = { ...newConsumption[index], [field]: value };
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };
    
    const handleRemoveConsumption = (index: number) => {
        const newConsumption = (variant.stockConsumption || []).filter((_, i) => i !== index);
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };

    const getBaseUnitForStockItem = (id: number) => stockItems.find(si => si.id === id)?.baseUnit || '';

    return (
        <div className="bg-slate-700 p-4 rounded-md space-y-4 border border-slate-600">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-200">Selling Variant</h4>
                <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-300 text-sm font-semibold">Remove Variant</button>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Variant Name</label>
                    <VKeyboardInput k-type="full" type="text" placeholder="e.g., Bottle" value={variant.name || ''} onChange={e => onUpdate({ ...variant, name: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Price</label>
                    <VKeyboardInput k-type="numeric" type="number" placeholder="e.g., 25.00" value={variant.price || ''} onChange={e => onUpdate({ ...variant, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md" required />
                 </div>
             </div>
             <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={variant.isFavourite}
                        onChange={(e) => onUpdate({ ...variant, isFavourite: e.target.checked })}
                        className="h-4 w-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-400">Mark as Favourite</span>
                </label>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Button Color</label>
                 <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-2 flex-grow">
                        {availableColors.map(color => (
                            <button type="button" key={color} onClick={() => onUpdate({ ...variant, backgroundColor: color, textColor: getContrastingTextColor(color) })} className={`w-8 h-8 rounded-full ${color} ${variant.backgroundColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-700 ring-white' : ''} transition`}></button>
                        ))}
                    </div>
                    <div className={`${variant.backgroundColor || 'bg-slate-600'} ${variant.textColor || 'text-white'} rounded-md p-3 text-center w-32 h-20 flex flex-col justify-center`}>
                        <p className="font-bold text-sm">Preview</p>
                        <p className="text-xs">{variant.name}</p>
                    </div>
                 </div>
            </div>
            <div className="border-t border-slate-600 pt-4">
                <h5 className="text-sm font-medium text-slate-400 mb-2">Stock Consumption (Recipe)</h5>
                <p className="text-xs text-slate-500 mb-3">Define which stock items are used when this variant is sold.</p>
                <div className="space-y-2">
                    {(variant.stockConsumption || []).map((sc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded-md">
                            <select value={sc.stockItemId} onChange={e => handleUpdateConsumption(index, 'stockItemId', Number(e.target.value))} className="flex-grow p-2 bg-slate-600 border border-slate-500 rounded-md text-sm">
                                {stockItems.map(si => <option key={si.id} value={si.id}>{si.name}</option>)}
                            </select>
                            <VKeyboardInput k-type="numeric" type="number" value={sc.quantity} onChange={e => handleUpdateConsumption(index, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Qty" className="w-24 p-2 bg-slate-600 border border-slate-500 rounded-md text-sm" />
                            <span className="text-slate-400 text-sm w-12 text-center">{getBaseUnitForStockItem(sc.stockItemId)}</span>
                            <button type="button" onClick={() => handleRemoveConsumption(index)} className="text-red-500 hover:text-red-400 font-bold px-2">&times;</button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddConsumption} className="mt-3 w-full bg-sky-800 hover:bg-sky-700 text-white font-bold py-2 rounded-md text-sm">+ Add Stock Item to Recipe</button>
            </div>
        </div>
    )
};


interface ProductModalProps {
  product?: Product;
  categories: Category[];
  stockItems: StockItem[];
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, stockItems, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState<number | ''>(product?.categoryId || '');
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(product?.variants || [{ id: Date.now() * -1, name: 'Standard', price: 0, isFavourite: false, stockConsumption: [], backgroundColor: 'bg-slate-700', textColor: 'text-white' }]);

  const handleAddVariant = () => {
    setVariants([...variants, { id: Date.now() * -1, name: '', price: 0, isFavourite: false, stockConsumption: [], backgroundColor: 'bg-slate-700', textColor: 'text-white' }]);
  };

  const handleUpdateVariant = (index: number, updatedVariant: Partial<ProductVariant>) => {
    const newVariants = [...variants];
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };
  
  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    } else {
      // Maybe show an alert that at least one variant is required
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || variants.some(v => !v.name?.trim())) return;
    
    await api.saveProduct({ id: product?.id, name, categoryId: Number(categoryId), variants: variants as any });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 pb-4 border-b border-slate-700">
            <h3 className="text-xl font-bold text-amber-400">{product ? 'Edit' : 'Add'} Product</h3>
            <p className="text-sm text-slate-400">Define the product's base details and its selling variants.</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Product Name</label>
                    <VKeyboardInput k-type="full" type="text" placeholder="e.g., Merlot" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md" required autoFocus />
                    <p className="text-xs text-slate-500 mt-1">This is the base name for all variants (e.g., "Vodka & Tonic").</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md" required>
                        <option value="" disabled>Select a category...</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                {variants.map((v, index) => (
                    <VariantForm key={v.id || index} variant={v} onUpdate={(uv) => handleUpdateVariant(index, uv)} onRemove={() => handleRemoveVariant(index)} stockItems={stockItems} />
                ))}
            </div>
            <button type="button" onClick={handleAddVariant} className="w-full bg-sky-700 hover:bg-sky-600 text-white font-bold py-2 rounded-md">+ Add Selling Variant</button>
        </div>
        <div className="flex justify-end gap-2 mt-auto p-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save Product</button>
        </div>
      </form>
    </div>
  );
};

interface ProductManagementProps {
    products: Product[];
    categories: Category[];
    stockItems: StockItem[];
    onDataUpdate: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ products, categories, stockItems, onDataUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
    onDataUpdate();
  };

  const confirmDelete = async () => {
    if (deletingProduct) {
        await api.deleteProduct(deletingProduct.id);
        setDeletingProduct(null);
        onDataUpdate();
    }
  };

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Uncategorized';
  
  if (!categories || categories.length === 0) {
      return <div>Loading categories...</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">Product Management</h3>
        <button
          onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
        >
          Add Product
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {products.map(product => (
          <div key={product.id} className="bg-slate-800 p-4 rounded-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-400">{getCategoryName(product.categoryId)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md">Edit</button>
                    <button onClick={() => setDeletingProduct(product)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md">Delete</button>
                </div>
            </div>
             <div className="mt-2 pt-2 border-t border-slate-700 text-sm space-y-1">
                <p className="font-semibold text-slate-400 text-xs">Variants:</p>
                {product.variants.map(v => (
                    <div key={v.id} className="flex justify-between">
                        <span>{v.name} {v.isFavourite && <span className="text-amber-400">★</span>}</span>
                        <span>{formatCurrency(v.price)}</span>
                    </div>
                ))}
             </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          stockItems={stockItems}
          onClose={() => { setIsModalOpen(false); setEditingProduct(undefined); }}
          onSave={handleSave}
        />
      )}
       <ConfirmationModal
        isOpen={!!deletingProduct}
        message={`Are you sure you want to delete "${deletingProduct?.name}"? This will delete all its variants.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
};