import React, { useState } from 'react';
import EnhancedGridLayout from './EnhancedGridLayout';
import { EnhancedProductGridLayout } from './EnhancedGridLayout';

const TestEnhancedGrid: React.FC = () => {
  const [layout, setLayout] = useState<EnhancedProductGridLayout>({
    name: 'Test Layout',
    tillId: 1,
    columns: 6,
    gridSize: { width: 100, height: 100 },
    gutter: 8,
    containerPadding: { x: 16, y: 16 },
    version: '1.0',
    gridItems: [
      {
        id: 'item-1',
        variantId: 1,
        productId: 1,
        name: 'Coffee',
        price: 2.5,
        backgroundColor: 'bg-amber-500',
        textColor: 'text-white',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
      {
        id: 'item-2',
        variantId: 2,
        productId: 2,
        name: 'Tea',
        price: 2.0,
        backgroundColor: 'bg-green-500',
        textColor: 'text-white',
        x: 1,
        y: 0,
        width: 1,
        height: 1,
      },
      {
        id: 'item-3',
        variantId: 3,
        productId: 3,
        name: 'Cake',
        price: 3.5,
        backgroundColor: 'bg-purple-500',
        textColor: 'text-white',
        x: 0,
        y: 1,
        width: 2,
        height: 1,
      },
    ],
    isDefault: false,
    filterType: 'all',
  });

  const handleUpdateLayout = (updatedLayout: EnhancedProductGridLayout) => {
    setLayout(updatedLayout);
    console.log('Layout updated:', updatedLayout);
  };

  return (
    <div className="p-4 bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-amber-300 mb-6">Enhanced Grid Layout Test</h1>
      <EnhancedGridLayout
        layout={layout}
        onUpdateLayout={handleUpdateLayout}
        showGridLines={true}
        snapToGrid={true}
        enableKeyboardNavigation={true}
        enableHistory={true}
      />
      
      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-lg font-semibold text-amber-200 mb-2">Current Layout Info</h2>
        <p>Items Count: {layout.gridItems.length}</p>
        <p>Columns: {layout.columns}</p>
        <p>Gutter: {layout.gutter}px</p>
        <p>Grid Size: {layout.gridSize.width}px × {layout.gridSize.height}px</p>
      </div>
    </div>
  );
};

export default TestEnhancedGrid;