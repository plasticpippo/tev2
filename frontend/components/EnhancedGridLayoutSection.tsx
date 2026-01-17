import React, { useState, useCallback, useMemo } from 'react';
import EnhancedGridLayout, { EnhancedGridItemData, EnhancedProductGridLayout } from './EnhancedGridLayout';
import HelpGuide from './HelpGuide';

interface BasicGridItem {
  id: string;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  backgroundColor: string;
  textColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EnhancedGridLayoutSectionProps {
  gridItems: BasicGridItem[];
  handleMoveItem: (id: string, newX: number, newY: number) => void;
  columns?: number;
  gridSize?: { width: number; height: number };
  gutter?: number;
  containerPadding?: { x: number; y: number };
}

const EnhancedGridLayoutSection: React.FC<EnhancedGridLayoutSectionProps> = ({
  gridItems,
  handleMoveItem,
  columns = 6,
  gridSize = { width: 100, height: 100 },
  gutter = 8,
  containerPadding = { x: 16, y: 16 },
}) => {
  // Convert the basic grid items to the enhanced format
  const enhancedGridItems = useMemo(() => {
    return gridItems.map(item => ({
      ...item,
      rotation: 0, // Default rotation
      borderRadius: 4, // Default border radius
      zIndex: 10, // Default z-index
      locked: false, // Not locked by default
    }));
  }, [gridItems]);

  // Create the enhanced layout object
  const enhancedLayout: EnhancedProductGridLayout = {
    name: 'Current Layout',
    tillId: 1, // Placeholder till ID
    columns,
    gridSize,
    gutter,
    containerPadding,
    version: '1.0',
    gridItems: enhancedGridItems,
    isDefault: false,
    filterType: 'all',
  };

  // Handle updates to the layout
  const handleUpdateLayout = useCallback((updatedLayout: EnhancedProductGridLayout) => {
    // Extract the basic grid items format for compatibility with existing system
    const basicGridItems = updatedLayout.gridItems.map(({ id, variantId, productId, name, price, backgroundColor, textColor, x, y, width, height }) => ({
      id,
      variantId,
      productId,
      name,
      price,
      backgroundColor,
      textColor,
      x,
      y,
      width,
      height,
    }));

    // Update individual items that have moved
    basicGridItems.forEach((item: BasicGridItem) => {
      const originalItem = gridItems.find(original => original.id === item.id);
      if (originalItem && (originalItem.x !== item.x || originalItem.y !== item.y)) {
        handleMoveItem(item.id, item.x, item.y);
      }
    });
  }, [gridItems, handleMoveItem]);

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-amber-200 flex items-center">
        Enhanced Grid Layout
        <HelpGuide feature="grid-section" title="Grid Layout Section" description="This is the main grid layout area where you can arrange your product items." position="right" />
      </h3>
      <EnhancedGridLayout
        layout={enhancedLayout}
        onUpdateLayout={handleUpdateLayout}
        showGridLines={true}
        snapToGrid={true}
        enableKeyboardNavigation={true}
        enableHistory={true}
      />
    </div>
  );
};

export default EnhancedGridLayoutSection;