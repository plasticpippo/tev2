import React, { useState, useEffect } from 'react';
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
import GridTemplates from './GridTemplates';
import EnhancedGridLayout from './EnhancedGridLayout';
import { useProductGridLayoutCustomizer, type ProductGridLayoutData } from './useProductGridLayoutCustomizer';
import HelpSystem from './HelpSystem';
import HelpGuide from './HelpGuide';

interface ProductGridLayoutCustomizerProps {
  products: Product[];
  categories: Category[];
  tills: Till[];
  currentTillId: number | null;
  onSaveLayout: (layoutData: ProductGridLayoutData) => void;
  onCancel: () => void;
  initialFilterType?: 'all' | 'favorites' | 'category';
  initialCategoryId?: number | null;
  forceRefresh?: boolean;
  initialLayoutData?: ProductGridLayoutData | null;  // Add initial layout data prop
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
  forceRefresh,
  initialLayoutData,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHelpTour, setShowHelpTour] = useState(false);
  
  const {
    gridItems,
    setGridItems,
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
    handleUpdateItem,
    handleResizeItem,
    handleSaveLayout,
    handleSaveAsNewLayout,
    handleLoadLayout,
    handleAddItemToGrid,
    handleDeleteLayout,
    handleSetAsDefault,
    handleCreateNewLayout,
    refreshCurrentLayout,
    filteredLayouts,
    handleClearGrid,
    parseGridItems,
    applyTemplate,
    migrateGridItem,
    migrateOldLayoutFormat,
  } = useProductGridLayoutCustomizer({
  products,
  categories,
  tills,
  currentTillId,
  onSaveLayout,
  onCancel,
  initialFilterType,
  initialCategoryId,
  initialLayoutData: initialLayoutData,  // Pass the initial layout data
});
  
  // Refresh the current layout when the component mounts, when currentLayoutId changes, or when forceRefresh is triggered
  useEffect(() => {
    if (currentLayoutId) {
      refreshCurrentLayout();
    }
  }, [currentLayoutId, forceRefresh]); // Removed refreshCurrentLayout from dependencies to prevent infinite loop

  // Handler for applying a template
  const handleApplyTemplate = (template: any) => {
    // Use the hook's applyTemplate function
    applyTemplate(template);
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="layout-customizer-title">
      <div className="bg-slate-800 rounded-lg p-6 w-11/12 h-5/6 max-w-6xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="layout-customizer-title" className="text-2xl font-bold text-amber-300 flex items-center">
            Customize Product Grid Layout
            <HelpGuide feature="main-header" title="Grid Layout Customization" description="Customize the arrangement of products on your POS grid for optimal efficiency." position="right" />
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelpTour(true)}
              className="text-white bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
              aria-label="Show help tour"
            >
              ?
            </button>
            <button
              onClick={onCancel}
              className="text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1" id="layout-management">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-amber-300">Layout Settings</h3>
                <HelpGuide feature="layout-settings" title="Layout Settings" description="Configure the current layout name, assign it to a till, and manage its default status." position="left" />
              </div>
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
              
              <div className="mt-4">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  Apply Template
                  <HelpGuide feature="templates" title="Layout Templates" description="Apply pre-made templates to quickly set up common grid arrangements." position="top" />
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-1" id="available-layouts-section">
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
            <div id="available-products-panel">
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
            </div>

            <div className="mt-4" id="grid-canvas">
              <EnhancedGridLayout
                layout={{
                  id: currentLayoutId || undefined,
                  name: layoutName,
                  tillId: selectedTill || 0,
                  columns: 6,
                  gridSize: { width: 120, height: 128 },
                  gutter: 8,
                  containerPadding: { x: 16, y: 16 },
                  version: '1.0',
                  gridItems: gridItems,
                  isDefault: isDefault,
                  filterType: activeFilterType,
                  categoryId: activeCategoryId,
                }}
                onUpdateLayout={(updatedLayout) => {
                  // Use the hook's setter functions
                  setGridItems(updatedLayout.gridItems);
                  setLayoutName(updatedLayout.name);
                  setSelectedTill(updatedLayout.tillId);
                  setIsDefault(updatedLayout.isDefault);
                }}
                showGridLines={true}
                snapToGrid={true}
                enableKeyboardNavigation={true}
                enableHistory={true}
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

        {/* Grid Templates Modal */}
        {showTemplates && (
          <GridTemplates
            onApplyTemplate={handleApplyTemplate}
            products={products}
            variants={products.flatMap(p => p.variants)}
            onCancel={() => setShowTemplates(false)}
          />
        )}

        {/* Help Tour */}
        {showHelpTour && (
          <HelpSystem
            isActive={showHelpTour}
            onComplete={() => setShowHelpTour(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductGridLayoutCustomizer;