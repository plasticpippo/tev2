import React from 'react';
import type { Product, ProductVariant, Till, Category } from '../../shared/types';
import LayoutSettingsPanel from './LayoutSettingsPanel';
import AvailableProductsPanel from './AvailableProductsPanel';
import GridLayoutPanel from './GridLayoutPanel';
import LayoutConfigurationForm from './LayoutConfigurationForm';
import AvailableLayoutsPanel from './AvailableLayoutsPanel';
import ProductGridPreview from './ProductGridPreview';
import ConfirmationModal from './ConfirmationModal';
import LayoutConfigurationSection from './LayoutConfigurationSection';
import AvailableLayoutsSection from './AvailableLayoutsSection';
import GridLayoutSection from './GridLayoutSection';
import { useProductGridLayoutCustomizer, type ProductGridLayoutData } from './useProductGridLayoutCustomizer';

interface ProductGridLayoutCustomizerProps {
  products: Product[];
  categories: Category[];
  tills: Till[];
  currentTillId: number | null;
  onSaveLayout: (layoutData: ProductGridLayoutData) => void;
  onCancel: () => void;
  initialFilterType?: 'all' | 'favorites' | 'category';
  initialCategoryId?: number | null;
}

const ProductGridLayoutCustomizer: React.FC<ProductGridLayoutCustomizerProps> = ({
  products,
  categories,
  tills,
  currentTillId,
  onSaveLayout,
  onCancel,
  initialFilterType,
  initialCategoryId,
}) => {
  const {
    gridItems,
    selectedTill,
    setSelectedTill,
    layoutName,
    setLayoutName,
    isDefault,
    setIsDefault,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    activeFilterType,
    setActiveFilterType,
    activeCategoryId,
    setActiveCategoryId,
    availableLayouts,
    loadingLayouts,
    loadingCurrentLayout,
    error,
    currentLayoutId,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    showConfirmationModal,
    setShowConfirmationModal,
    handleMoveItem,
    handleSaveLayout,
    handleSaveAsNewLayout,
    handleLoadLayout,
    handleAddItemToGrid,
    handleDeleteLayout,
    handleSetAsDefault,
    handleCreateNewLayout,
    filteredLayouts,
    handleClearGrid,
  } = useProductGridLayoutCustomizer({
    products,
    categories,
    tills,
    currentTillId,
    onSaveLayout,
    onCancel,
    initialFilterType,
    initialCategoryId,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="layout-customizer-title">
      <div className="bg-slate-800 rounded-lg p-6 w-11/12 h-5/6 max-w-6xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="layout-customizer-title" className="text-2xl font-bold text-amber-300">Customize Product Grid Layout</h2>
          <button
            onClick={onCancel}
            className="text-white bg-red-60 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-amber-300">Layout Settings</h3>
              <LayoutConfigurationSection
                layoutName={layoutName}
                setLayoutName={setLayoutName}
                selectedTill={selectedTill}
                setSelectedTill={setSelectedTill}
                tills={tills}
                isDefault={isDefault}
                setIsDefault={setIsDefault}
                handleSaveLayout={handleSaveLayout}
                handleSaveAsNewLayout={handleSaveAsNewLayout}
                onCancel={onCancel}
                currentLayoutId={currentLayoutId}
                handleClearGrid={handleClearGrid}
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <AvailableLayoutsSection
              loadingLayouts={loadingLayouts}
              error={error}
              filterType={filterType}
              setFilterType={setFilterType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredLayouts={filteredLayouts}
              categories={categories}
              handleSetAsDefault={handleSetAsDefault}
              handleLoadLayout={handleLoadLayout}
              handleDeleteLayout={handleDeleteLayout}
              setShowConfirmationModal={setShowConfirmationModal}
              handleCreateNewLayout={handleCreateNewLayout}
              currentLayoutId={currentLayoutId}
            />
          </div>

          <div className="md:col-span-2">
            <AvailableProductsPanel
              products={products}
              categories={categories}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              activeFilterType={activeFilterType}
              setActiveFilterType={setActiveFilterType}
              activeCategoryId={activeCategoryId}
              setActiveCategoryId={setActiveCategoryId}
              handleAddItemToGrid={handleAddItemToGrid}
            />

            <div className="mt-4">
              <GridLayoutSection
                gridItems={gridItems}
                handleMoveItem={handleMoveItem}
              />
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmationModal.show && (
          <ConfirmationModal
            show={showConfirmationModal.show}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the layout "${showConfirmationModal.layoutName}"?`}
            onConfirm={() => {
              if (showConfirmationModal.layoutId) {
                handleDeleteLayout(showConfirmationModal.layoutId);
              }
              setShowConfirmationModal({show: false});
            }}
            onCancel={() => setShowConfirmationModal({show: false})}
            confirmText="Delete"
            cancelText="Cancel"
            confirmButtonType="danger"
          />
        )}
      </div>
    </div>
  );
};

export default ProductGridLayoutCustomizer;