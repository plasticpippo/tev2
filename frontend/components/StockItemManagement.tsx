import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// Fix: Import the 'Product' type to resolve type errors in prop definitions.
import type { StockItem, PurchasingUnit, Product, TaxRate } from '../shared/types';
import * as inventoryApi from '../services/inventoryService';
import * as productApi from '../services/productService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import { v4 as uuidv4 } from 'uuid';
import { getTaxRateLabel } from '../utils/taxRateUtils';
import { formatCurrency } from '../utils/formatting';

interface StockItemModalProps {
  item?: StockItem;
  onClose: () => void;
  onSave: () => void;
  products: Product[];
  taxRates?: TaxRate[];
}

const StockItemModal: React.FC<StockItemModalProps> = ({ item, onClose, onSave, products, taxRates = [] }) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<'Ingredient' | 'Sellable Good'>(item?.type || 'Sellable Good');
  const [baseUnit, setBaseUnit] = useState(item?.baseUnit || 'pcs');
  const [quantity, setQuantity] = useState(item?.quantity || 0);
  const [purchasingUnits, setPurchasingUnits] = useState<PurchasingUnit[]>(
    item?.purchasingUnits?.map(pu => ({
      ...pu,
      costPerUnit: pu.costPerUnit ?? 0,
      isDefault: pu.isDefault ?? false
    })) || []
  );
  const [defaultUnitId, setDefaultUnitId] = useState<string | null>(
    item?.purchasingUnits?.find(pu => pu.isDefault)?.id || 
    (item?.purchasingUnits?.length ? item.purchasingUnits[0].id : null)
  );
  const [costPerUnit, setCostPerUnit] = useState<number | null>(item?.costPerUnit ?? null);
  const [taxRateId, setTaxRateId] = useState<number | null>(item?.taxRateId ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Calculate cost per base unit for display
  const getCostPerBaseUnit = (unit: PurchasingUnit): number => {
    if (!unit.multiplier || unit.multiplier === 0) return 0;
    return (unit.costPerUnit || 0) / unit.multiplier;
  };

  const handleAddPurchasingUnit = () => {
    const newUnit: PurchasingUnit = {
      id: uuidv4(),
      name: '',
      multiplier: 1,
      costPerUnit: 0,
      isDefault: purchasingUnits.length === 0
    };
    setPurchasingUnits([...purchasingUnits, newUnit]);
    // Set as default if it's the first unit
    if (purchasingUnits.length === 0) {
      setDefaultUnitId(newUnit.id);
    }
  };

  const handleUpdatePurchasingUnit = (index: number, field: keyof PurchasingUnit, value: string | number | boolean) => {
    const newUnits = [...purchasingUnits];
    if (field === 'isDefault' && value === true) {
      // If setting as default, update all units
      setDefaultUnitId(newUnits[index].id);
      newUnits[index] = { ...newUnits[index], isDefault: true };
    } else if (typeof newUnits[index][field] === 'number') {
      newUnits[index] = { ...newUnits[index], [field]: Number(value) };
    } else {
      newUnits[index] = { ...newUnits[index], [field]: value };
    }
    setPurchasingUnits(newUnits);
  };
  
  const handleRemovePurchasingUnit = (index: number) => {
    const unitToRemove = purchasingUnits[index];
    const newUnits = purchasingUnits.filter((_, i) => i !== index);
    
    // If we removed the default unit, set a new default
    if (unitToRemove.id === defaultUnitId && newUnits.length > 0) {
      setDefaultUnitId(newUnits[0].id);
      newUnits[0] = { ...newUnits[0], isDefault: true };
    }
    setPurchasingUnits(newUnits);
  };

  const handleSetDefault = (unitId: string) => {
    setDefaultUnitId(unitId);
    setPurchasingUnits(purchasingUnits.map(pu => ({
      ...pu,
      isDefault: pu.id === unitId
    })));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = t('stockItems.validation.nameRequired');
    } else if (name.length > 255) {
      newErrors.name = t('stockItems.validation.nameMaxLength');
    }
    
    if (!baseUnit.trim()) {
      newErrors.baseUnit = t('stockItems.validation.baseUnitRequired');
    } else if (baseUnit.length > 50) {
      newErrors.baseUnit = t('stockItems.validation.baseUnitMaxLength');
    }
    
    if (quantity < 0) {
      newErrors.quantity = t('stockItems.validation.quantityMin');
    }
    
    // Validate purchasing units
    for (let i = 0; i < purchasingUnits.length; i++) {
      const unit = purchasingUnits[i];
      if (unit.name && unit.name.length > 50) {
        newErrors[`purchasingUnit-${i}-name`] = t('stockItems.validation.unitNameMaxLength');
      }
      if (unit.name && unit.multiplier <= 0) {
        newErrors[`purchasingUnit-${i}-multiplier`] = t('stockItems.validation.multiplierMin');
      }
      if (unit.name && unit.costPerUnit < 0) {
        newErrors[`purchasingUnit-${i}-costPerUnit`] = t('stockItems.validation.costPerUnitMin');
      }
    }
    
    // Ensure at least one default unit if there are purchasing units
    if (purchasingUnits.length > 0 && !defaultUnitId) {
      newErrors.defaultUnit = t('stockItems.validation.defaultUnitRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const validUnits = purchasingUnits.filter(pu => pu.name && pu.name.trim() && pu.multiplier > 0);
      const itemData = {
          id: item?.id,
          name,
          type,
          baseUnit,
          quantity: item?.id ? item.quantity : quantity,
          purchasingUnits: validUnits.map(pu => ({
            id: pu.id,
            name: pu.name,
            multiplier: pu.multiplier,
            costPerUnit: pu.costPerUnit || 0,
            isDefault: pu.id === defaultUnitId
          })),
          activePurchasingUnitId: defaultUnitId,
          costPerUnit,
          taxRateId
      };
      await inventoryApi.saveStockItem(itemData);
      onSave();
    } catch (error) {
      console.error('Error saving stock item:', error);
      alert(error instanceof Error ? error.message : t('stockItems.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl lg:max-w-3xl max-h-[95vh] flex flex-col border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 p-6 pb-0">{item ? t('stockItems.editStockItem') : t('stockItems.addStockItem')}</h3>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-400">{t('stockItems.itemName')}</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => {
                  const {[name]: _, ...rest} = prev;
                  return rest;
                });
              }}
              className={`w-full mt-1 p-3 bg-slate-800 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
              required
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400">{t('stockItems.type')}</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md">
                    <option value="Sellable Good">{t('stockItems.types.sellableGood')}</option>
                    <option value="Ingredient">{t('stockItems.types.ingredient')}</option>
                </select>
              </div>
               <div>
                <label className="block text-sm text-slate-400">{t('stockItems.baseTrackingUnit')}</label>
                <VKeyboardInput
                  k-type="full"
                  type="text"
                  value={baseUnit}
                  onChange={(e) => {
                    setBaseUnit(e.target.value);
                    if (errors.baseUnit) setErrors(prev => {
                      const {[baseUnit]: _, ...rest} = prev;
                      return rest;
                    });
                  }}
                  placeholder={t('stockItems.unitPlaceholder')}
                  className={`w-full mt-1 p-3 bg-slate-800 border rounded-md ${errors.baseUnit ? 'border-red-500' : 'border-slate-700'}`}
                  required
                />
                {errors.baseUnit && <p className="text-red-500 text-xs mt-1">{errors.baseUnit}</p>}
              </div>
          </div>
          {!item && (
              <div>
                <label className="block text-sm text-slate-400">{t('stockItems.initialQuantity')}</label>
                <VKeyboardInput
                  k-type="numeric"
                  type="number"
                  value={quantity === 0 ? '' : quantity}
                  onChange={e => {
                    const value = parseFloat(e.target.value) || 0;
                    setQuantity(value);
                    if (errors.quantity) setErrors(prev => {
                      const {[quantity]: _, ...rest} = prev;
                      return rest;
                    });
                  }}
                  className={`w-full mt-1 p-3 bg-slate-800 border rounded-md ${errors.quantity ? 'border-red-500' : 'border-slate-700'}`}
                  required
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>
          )}
          
          <div className="border-t border-slate-700 pt-4">
              <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('stockItems.purchasingUnits')}</h4>
              <p className="text-xs text-slate-500 mb-3">{t('stockItems.purchasingUnitsDescription')}</p>
              
              {/* Table Header - Hidden on mobile, visible on larger screens */}
              <div className="hidden md:grid grid-cols-7 gap-3 mb-2 text-xs text-slate-400 font-semibold px-2">
                <div className="col-span-2">{t('stockItems.unitName')}</div>
                <div className="col-span-1">{t('stockItems.multiplier')} ({baseUnit})</div>
                <div className="col-span-1">{t('stockItems.costPerUnit')}</div>
                <div className="col-span-1">{t('stockItems.costPerBase', { base: baseUnit })}</div>
                <div className="col-span-1 text-center">{t('stockItems.default')}</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="space-y-3">
                  {purchasingUnits.map((unit, index) => (
                      <div key={unit.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 items-center p-3 bg-slate-800 rounded-md">
                          <div className="col-span-1 md:col-span-2">
                              <label className="md:hidden text-xs text-slate-500 mb-1 block">{t('stockItems.unitName')}</label>
                              <VKeyboardInput
                                k-type="full"
                                type="text"
                                value={unit.name}
                                onChange={e => {
                                  handleUpdatePurchasingUnit(index, 'name', e.target.value);
                                  if (errors[`purchasingUnit-${index}-name`] || errors[`purchasingUnit-${index}-multiplier`] || errors[`purchasingUnit-${index}-costPerUnit`]) setErrors(prev => {
                                    const {[`purchasingUnit-${index}-name`]: _, [`purchasingUnit-${index}-multiplier`]: __, [`purchasingUnit-${index}-costPerUnit`]: ___, ...rest} = prev;
                                    return rest;
                                  });
                                }}
                                maxLength={50}
                                placeholder={t('stockItems.unitNamePlaceholder')}
                                className={`w-full p-2 bg-slate-700 border rounded-md text-sm ${errors[`purchasingUnit-${index}-name`] || errors[`purchasingUnit-${index}-multiplier`] ? 'border-red-500' : 'border-slate-600'}`}
                              />
                          </div>
                          <div className="col-span-1 md:col-span-1">
                              <label className="md:hidden text-xs text-slate-500 mb-1 block">{t('stockItems.multiplier')} ({baseUnit})</label>
                              <VKeyboardInput
                                k-type="numeric"
                                type="number"
                                value={unit.multiplier}
                                onChange={e => {
                                  const value = parseFloat(e.target.value) || 1;
                                  handleUpdatePurchasingUnit(index, 'multiplier', value);
                                  if (errors[`purchasingUnit-${index}-name`] || errors[`purchasingUnit-${index}-multiplier`] || errors[`purchasingUnit-${index}-costPerUnit`]) setErrors(prev => {
                                    const {[`purchasingUnit-${index}-name`]: _, [`purchasingUnit-${index}-multiplier`]: __, [`purchasingUnit-${index}-costPerUnit`]: ___, ...rest} = prev;
                                    return rest;
                                  });
                                }}
                                placeholder={t('stockItems.multiplierPlaceholder')}
                                className={`w-full p-2 bg-slate-700 border rounded-md text-sm ${errors[`purchasingUnit-${index}-name`] || errors[`purchasingUnit-${index}-multiplier`] ? 'border-red-500' : 'border-slate-600'}`}
                              />
                          </div>
                          <div className="col-span-1 md:col-span-1">
                              <label className="md:hidden text-xs text-slate-500 mb-1 block">{t('stockItems.costPerUnit')}</label>
                              <VKeyboardInput
                                k-type="numeric"
                                type="number"
                                value={unit.costPerUnit === 0 ? '' : unit.costPerUnit}
                                onChange={e => {
                                  const value = parseFloat(e.target.value) || 0;
                                  handleUpdatePurchasingUnit(index, 'costPerUnit', value);
                                  if (errors[`purchasingUnit-${index}-costPerUnit`]) setErrors(prev => {
                                    const {[`purchasingUnit-${index}-costPerUnit`]: _, ...rest} = prev;
                                    return rest;
                                  });
                                }}
                                placeholder={t('stockItems.costPerUnitPlaceholder')}
                                className={`w-full p-2 bg-slate-700 border rounded-md text-sm ${errors[`purchasingUnit-${index}-costPerUnit`] ? 'border-red-500' : 'border-slate-600'}`}
                                step="0.01"
                                min="0"
                              />
                          </div>
                          <div className="col-span-1 md:col-span-1">
                              <label className="md:hidden text-xs text-slate-500 mb-1 block">{t('stockItems.costPerBase', { base: baseUnit })}</label>
                              <div className="text-green-400 text-sm font-mono bg-slate-900/50 p-2 rounded-md border border-slate-600 min-h-[42px] flex items-center justify-center">
                                {formatCurrency(getCostPerBaseUnit(unit))}/{baseUnit}
                              </div>
                          </div>
                          <div className="col-span-1 md:col-span-1 flex items-center justify-center gap-2">
                              <label className="md:hidden text-xs text-slate-500">{t('stockItems.default')}</label>
                            <button
                              type="button"
                              onClick={() => handleSetDefault(unit.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                unit.id === defaultUnitId 
                                  ? 'border-amber-500 bg-amber-500' 
                                  : 'border-slate-500 hover:border-amber-400'
                              }`}
                            >
                              {unit.id === defaultUnitId && (
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              )}
                            </button>
                          </div>
                          <div className="col-span-1 md:col-span-1 flex justify-center">
                            <button type="button" onClick={() => handleRemovePurchasingUnit(index)} className="text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded-md hover:bg-red-500/10 text-lg">&times;</button>
                          </div>
                      </div>
                  ))}
              </div>
              {(errors[`purchasingUnit-${0}-name`] || errors[`purchasingUnit-${0}-multiplier`] || errors[`purchasingUnit-${0}-costPerUnit`] || errors.defaultUnit) && (
                <p className="text-red-500 text-xs mt-2">
                  {errors.defaultUnit || errors[`purchasingUnit-0-name`] || errors[`purchasingUnit-0-multiplier`] || errors[`purchasingUnit-0-costPerUnit`]}
                </p>
              )}
              <button type="button" onClick={handleAddPurchasingUnit} className="mt-3 w-full bg-sky-700 hover:bg-sky-600 text-white font-bold py-2 rounded-md text-sm">{t('stockItems.addPurchasingUnit')}</button>
          </div>

          <div className="border-t border-slate-700 pt-4">
              <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('stockItems.costSettings')}</h4>
              <p className="text-xs text-slate-500 mb-3">{t('stockItems.costSettingsDescription')}</p>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm text-slate-400">{t('stockItems.costPerUnit')}</label>
                      <VKeyboardInput
                        k-type="numeric"
                        type="number"
                        value={costPerUnit === null ? '' : costPerUnit}
                        onChange={e => {
                          const value = e.target.value ? parseFloat(e.target.value) : null;
                          setCostPerUnit(value);
                        }}
                        placeholder={t('stockItems.costPerUnitPlaceholder')}
                        className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                        step="0.01"
                        min="0"
                      />
                  </div>
                  <div>
                      <label className="block text-sm text-slate-400">{t('stockItems.taxRate')}</label>
                      <select
                          value={taxRateId || ''}
                          onChange={e => setTaxRateId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                      >
                          <option value="">{t('stockItems.taxRateNone')}</option>
                          {taxRates.map(tr => (
                              <option key={tr.id} value={tr.id}>{getTaxRateLabel(tr)}</option>
                          ))}
                      </select>
                  </div>
              </div>
          </div>

        </div>
        <div className="flex justify-end gap-2 mt-auto p-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">{t('stockItems.cancel')}</button>
          <button type="submit" disabled={isSaving} className={`bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}>
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('stockItems.saving')}
              </span>
            ) : t('stockItems.save')}
          </button>
        </div>
      </form>
    </div>
  );
};


interface StockItemManagementProps {
    stockItems: StockItem[];
    products: Product[];
    taxRates?: TaxRate[];
    onDataUpdate: () => void;
}

export const StockItemManagement: React.FC<StockItemManagementProps> = ({ stockItems, products, taxRates = [], onDataUpdate }) => {
    const { t } = useTranslation('admin');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | undefined>(undefined);
    const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
    const [deleteError, setDeleteError] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

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
            setIsDeleting(true);
            try {
                const result = await inventoryApi.deleteStockItem(deletingItem.id);
                if (result.success) {
                    setDeletingItem(null);
                    onDataUpdate();
                } else {
                    setDeleteError(result.message || t('stockItems.unknownError'));
                }
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-300">{t('stockItems.stockItems')}</h3>
                <button
                    onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
                >
                    {t('stockItems.addStockItem')}
                </button>
            </div>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                {stockItems.map(item => (
                    <div key={item.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-400">{item.type} ({t('stockItems.trackedIn', { unit: item.baseUnit })})</p>
                            {item.costPerUnit !== undefined && item.costPerUnit !== null && (
                                <p className="text-xs text-green-400">{t('stockItems.costPerUnitLabel')}: {formatCurrency(item.costPerUnit)}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-amber-400">{t('stockItems.inStockValue', { quantity: item.quantity, unit: item.baseUnit })}</span>
                            <button
                                onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                            >
                                {t('stockItems.edit')}
                            </button>
                            <button
                                onClick={() => handleDeleteClick(item)}
                                disabled={isDeleting}
                                className={`font-bold py-1 px-3 text-sm rounded-md ${
                                  isDeleting
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-red-700 hover:bg-red-600 text-white'
                                }`}
                            >
                              {isDeleting ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t('stockItems.deleting')}
                                </span>
                              ) : t('stockItems.delete')}
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
                    taxRates={taxRates}
                />
            )}
            <ConfirmationModal
                show={!!deletingItem}
                title={t('stockItems.confirmDeleteTitle')}
                message={deleteError || t('stockItems.confirmDeleteMessage', { name: deletingItem?.name })}
                onConfirm={deleteError ? () => { setDeletingItem(null); setDeleteError(''); } : confirmDelete}
                onCancel={() => { setDeletingItem(null); setDeleteError(''); }}
                confirmText={isDeleting ? t('stockItems.deleting') : (deleteError ? t('stockItems.ok') : t('stockItems.confirm'))}
                disabled={isDeleting}
            />
        </div>
    );
};