import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product, ProductVariant, Category, StockItem, TaxRate } from '../../shared/types';
import * as productApi from '../services/productService';
import * as inventoryApi from '../services/inventoryService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import ErrorMessage from './ErrorMessage';
import { availableColors, getContrastingTextColor } from '../utils/color';
import { formatCurrency } from '../utils/formatting';
import { getTaxRateLabel } from '../utils/taxRateUtils';
import { v4 as uuidv4 } from 'uuid';
import { useVirtualKeyboard } from './VirtualKeyboardContext';

interface VariantFormProps {
    variant: Partial<ProductVariant>;
    onUpdate: (variant: Partial<ProductVariant>) => void;
    onRemove: () => void;
    stockItems: StockItem[];
    taxRates?: TaxRate[];
}

const VariantForm: React.FC<VariantFormProps> = ({ variant, onUpdate, onRemove, stockItems, taxRates = [] }) => {
    const { t } = useTranslation('admin');
    
    const handleAddConsumption = () => {
        const firstStockItem = stockItems[0];
        if (!firstStockItem) return;
        const newConsumption = [...(variant.stockConsumption || []), { stockItemId: firstStockItem.id, quantity: 0 }];
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };

    const handleUpdateConsumption = (index: number, field: 'stockItemId' | 'quantity', value: string | number) => {
        const newConsumption = [...(variant.stockConsumption || [])];
        newConsumption[index] = { ...newConsumption[index], [field]: value };
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };
    
    const handleRemoveConsumption = (index: number) => {
        const newConsumption = (variant.stockConsumption || []).filter((_: any, i: number) => i !== index);
        onUpdate({ ...variant, stockConsumption: newConsumption });
    };

    const getBaseUnitForStockItem = (id: string) => stockItems.find(si => si.id === id)?.baseUnit || '';

    return (
        <div className="bg-slate-700 p-4 rounded-md space-y-4 border border-slate-600">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-200">{t('products.variants')}</h4>
                <button type="button" onClick={onRemove} className="btn btn-danger btn-sm">{t('products.removeVariant')}</button>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('products.variantName')}</label>
                    <VKeyboardInput k-type="full" type="text" placeholder={t('products.variantNamePlaceholder')} value={variant.name || ''} onChange={e => onUpdate({ ...variant, name: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md" required />
                 </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1">{t('products.price')}</label>
                     <VKeyboardInput k-type="numeric" type="number" placeholder={t('products.pricePlaceholder')} value={variant.price ?? ''} onChange={e => onUpdate({ ...variant, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md" required />
                  </div>
             </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('products.taxRate')}</label>
                <select
                    value={variant.taxRateId || ''}
                    onChange={e => onUpdate({ ...variant, taxRateId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md"
                >
                    <option value="">{t('products.taxRateDefault')}</option>
                    {taxRates.map(tr => (
                        <option key={tr.id} value={tr.id}>{getTaxRateLabel(tr)}</option>
                    ))}
                </select>
            </div>
             <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={variant.isFavourite}
                        onChange={(e) => onUpdate({ ...variant, isFavourite: e.target.checked })}
                        className="h-4 w-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-400">{t('products.markAsFavourite')}</span>
                </label>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t('products.buttonColor')}</label>
                 <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-2 flex-grow max-h-40 overflow-y-auto p-2 border border-slate-600 rounded-md bg-slate-900 bg-opacity-50">
                        {availableColors.map(color => (
                            <button type="button" key={color} onClick={() => onUpdate({ ...variant, backgroundColor: color, textColor: getContrastingTextColor(color) })} className={`w-8 h-8 rounded-full border border-slate-400 p-0 ${color} ${variant.backgroundColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-700 ring-white' : ''} transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-white`} title={color}></button>
                        ))}
                    </div>
                    <div className={`${variant.backgroundColor || 'bg-slate-600'} ${variant.textColor || 'text-white'} rounded-md p-3 text-center w-32 h-20 flex flex-col justify-center`}>
                        <p className="font-bold text-sm">{t('products.preview')}</p>
                        <p className="text-xs">{variant.name}</p>
                    </div>
                 </div>
            </div>
            <div className="border-t border-slate-600 pt-4">
                <h5 className="text-sm font-medium text-slate-400 mb-2">{t('products.stockConsumption')}</h5>
                <p className="text-xs text-slate-500 mb-3">{t('products.stockConsumptionDescription')}</p>
                <div className="space-y-2">
                    {(variant.stockConsumption || []).map((sc: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded-md">
                            <select value={sc.stockItemId} onChange={e => handleUpdateConsumption(index, 'stockItemId', e.target.value)} className="flex-grow p-2 bg-slate-600 border border-slate-500 rounded-md text-sm">
                                {stockItems.map(si => <option key={si.id} value={si.id}>{si.name}</option>)}
                            </select>
                            <VKeyboardInput k-type="numeric" type="number" value={sc.quantity} onChange={e => handleUpdateConsumption(index, 'quantity', parseFloat(e.target.value) || 0)} placeholder={t('products.quantity')} className="w-24 p-2 bg-slate-600 border border-slate-500 rounded-md text-sm" />
                            <span className="text-slate-400 text-sm w-12 text-center">{getBaseUnitForStockItem(sc.stockItemId)}</span>
                            <button type="button" onClick={() => handleRemoveConsumption(index)} className="btn btn-danger btn-sm">&times;</button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddConsumption} className="btn btn-primary w-full">+ {t('products.addStockItem')}</button>
            </div>
        </div>
    )
};
    


interface ProductModalProps {
  product?: Product;
  categories: Category[];
  stockItems: StockItem[];
  taxRates?: TaxRate[];
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, stockItems, taxRates = [], onClose, onSave }) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState<number | ''>(product?.categoryId || '');
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(product?.variants || [{ id: Date.now() * -1, name: 'Standard', price: 0, isFavourite: false, stockConsumption: [], backgroundColor: 'bg-slate-700', textColor: getContrastingTextColor('bg-slate-700') }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const removeError = (key: string) => {
    setErrors(prev => {
      const {[key]: _, ...rest} = prev;
      return rest;
    });
  };
  
  const { closeKeyboard } = useVirtualKeyboard();

  const handleAddVariant = () => {
    setVariants([...variants, { id: Date.now() * -1, name: '', price: 0, isFavourite: false, stockConsumption: [], backgroundColor: 'bg-slate-700', textColor: getContrastingTextColor('bg-slate-700') }]);
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
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate product name
    if (!name.trim()) {
      newErrors.name = t('products.validation.productNameRequired');
    } else if (name.trim().length > 255) {
      newErrors.name = t('products.validation.productNameMaxLength');
    }
    
    // Validate category
    if (!categoryId) {
      newErrors.category = t('products.validation.categoryRequired');
    }
    
    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      if (!variant.name?.trim()) {
        newErrors[`variant-${i}-name`] = t('products.validation.variantNameRequired');
      }
      
      if (typeof variant.price !== 'number' || variant.price < 0) {
        newErrors[`variant-${i}-price`] = t('products.validation.priceNonNegative');
      } else if (variant.price > 999999) {
        newErrors[`variant-${i}-price`] = t('products.validation.priceMaxLength');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRetry = async () => {
    setApiError(null);
    const formValid = validateForm();
    if (!formValid) return;
    
    setIsSaving(true);
    try {
      await productApi.saveProduct({ id: product?.id, name, categoryId: Number(categoryId), variants: variants as any });
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      setApiError(error instanceof Error ? error.message : t('products.errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = () => {
    setName('');
    setCategoryId('');
    setVariants([{ id: Date.now() * -1, name: 'Standard', price: 0, isFavourite: false, stockConsumption: [], backgroundColor: 'bg-slate-700', textColor: getContrastingTextColor('bg-slate-700') }]);
    setErrors({});
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Close the virtual keyboard before processing the form submission
    closeKeyboard();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await productApi.saveProduct({ id: product?.id, name, categoryId: Number(categoryId), variants: variants as any });
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      setApiError(error instanceof Error ? error.message : t('products.errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 pb-4 border-b border-slate-700">
            <h3 className="text-xl font-bold text-amber-400">{product ? t('products.editProduct') : t('products.addProduct')}</h3>
            <p className="text-sm text-slate-400">{t('products.productDescription')}</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            {apiError && (
              <ErrorMessage
                message={apiError}
                type="error"
                onRetry={handleRetry}
                onClear={handleClearForm}
                showRetry={true}
                showClear={true}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('products.productName')}</label>
                    <VKeyboardInput
                      k-type="full"
                      type="text"
                      placeholder={t('products.productNamePlaceholder')}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) removeError('name');
                      }}
                      className={`w-full p-3 bg-slate-900 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
                      required
                      autoFocus
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    <p className="text-xs text-slate-500 mt-1">{t('products.productNameHint')}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('products.category')}</label>
                    <select
                      value={categoryId}
                      onChange={e => {
                        setCategoryId(Number(e.target.value));
                        if (errors.category) removeError('category');
                      }}
                      className={`w-full p-3 bg-slate-900 border rounded-md ${errors.category ? 'border-red-500' : 'border-slate-700'}`}
                      required
                    >
                        <option value="">{t('products.selectCategory')}</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
            </div>
            <div className="space-y-4">
                {variants.map((v, index) => (
                    <VariantForm
                      key={v.id || index}
                      variant={v}
                      onUpdate={(uv) => handleUpdateVariant(index, uv)}
                      onRemove={() => handleRemoveVariant(index)}
                      stockItems={stockItems}
                      taxRates={taxRates}
                    />
                ))}
            </div>
            <button type="button" onClick={handleAddVariant} className="btn btn-primary w-full">+ {t('products.addVariant')}</button>
        </div>
        <div className="flex justify-end gap-2 mt-auto p-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={() => { closeKeyboard(); onClose(); }} className="btn btn-secondary">{t('buttons.cancel', { ns: 'common' })}</button>
          <button type="submit" disabled={isSaving} className={`btn btn-primary ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}>
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('buttons.saving', { ns: 'common' })}
              </span>
            ) : t('products.saveProduct')}
          </button>
        </div>
      </form>
    </div>
  );
};

interface ProductManagementProps {
    products: Product[];
    categories: Category[];
    stockItems: StockItem[];
    taxRates?: TaxRate[];
    onDataUpdate: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ products, categories, stockItems, taxRates = [], onDataUpdate }) => {
  const { t } = useTranslation('admin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
    onDataUpdate();
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deletingProduct) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await productApi.deleteProduct(deletingProduct.id);
        setDeletingProduct(null);
        onDataUpdate();
      } catch (error) {
        console.error('Error deleting product:', error);
        setDeleteError(error instanceof Error ? error.message : t('products.errors.failedToDelete'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRetryDelete = async () => {
    setDeleteError(null);
    await confirmDelete();
  };

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || t('products.uncategorized');
  
  if (!categories || categories.length === 0) {
      return <div>{t('products.loadingCategories')}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('products.title')}</h3>
        <button
          onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          {t('products.addProduct')}
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
                    <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="btn btn-secondary btn-sm">{t('buttons.edit', { ns: 'common' })}</button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      disabled={isDeleting}
                      className={`btn btn-danger btn-sm ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isDeleting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('buttons.deleting', { ns: 'common' })}
                        </span>
                      ) : t('buttons.delete', { ns: 'common' })}
                    </button>
                </div>
            </div>
             <div className="mt-2 pt-2 border-t border-slate-700 text-sm space-y-1">
                <p className="font-semibold text-slate-400 text-xs">{t('products.variants')}:</p>
                {product.variants.map((v: any) => (
                    <div key={v.id} className="flex justify-between">
                        <span>{v.name} {v.isFavourite && <span className="text-amber-400">{t('products.favourite')}</span>}</span>
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
          taxRates={taxRates}
          onClose={() => { setIsModalOpen(false); setEditingProduct(undefined); }}
          onSave={handleSave}
        />
      )}
       <ConfirmationModal
         show={!!deletingProduct}
         title={t('confirmation.confirmDelete', { ns: 'common' })}
         message={t('products.confirmDelete', { name: deletingProduct?.name })}
         onConfirm={confirmDelete}
         onCancel={() => setDeletingProduct(null)}
         confirmText={isDeleting ? t('buttons.deleting', { ns: 'common' }) : t('buttons.delete', { ns: 'common' })}
         confirmButtonType="danger"
         disabled={isDeleting}
       />
      {deleteError && (
        <ErrorMessage
          message={deleteError}
          type="error"
          onRetry={handleRetryDelete}
          showRetry={true}
        />
      )}
      {/* Hidden elements to ensure Tailwind includes all color classes in the build */}
      <div className="hidden">
        <div className={availableColors.join(' ')}></div>
      </div>
    </div>
  );
};