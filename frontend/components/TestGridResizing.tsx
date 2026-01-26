import React, { useState } from 'react';
import EnhancedGridLayout from './EnhancedGridLayout';

// Define the layout type
interface TestGridItem {
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
  rotation?: number;
  borderRadius?: number;
  zIndex?: number;
  locked?: boolean;
}

interface TestLayout {
  id?: string | number;
  name: string;
  tillId: number;
  columns: number;
  gridSize: { width: number; height: number };
  gutter: number;
  containerPadding: { x: number; y: number };
  version: string;
  gridItems: TestGridItem[];
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
  };
}

const TestGridResizing: React.FC = () => {
  const [layout, setLayout] = useState<TestLayout>({
    id: 'test-layout',
    name: 'Test Layout',
    tillId: 1,
    columns: 6,
    gridSize: { width: 100, height: 100 },
    gutter: 8,
    containerPadding: { x: 16, y: 16 },
    version: '1.0',
    isDefault: false,
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
        x: 2,
        y: 1,
        width: 1,
        height: 1,
      },
      {
        id: 'item-3',
        variantId: 3,
        productId: 3,
        name: 'Cake',
        price: 3.5,
        backgroundColor: 'bg-pink-500',
        textColor: 'text-white',
        x: 4,
        y: 0,
        width: 2,
        height: 1,
      },
    ],
  });

  const handleUpdateLayout = (updatedLayout: TestLayout) => {
    setLayout(updatedLayout);
    console.log('Layout updated:', updatedLayout);
  };

  return (
    <div className="p-4 bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-amber-300 mb-4">Grid Resizing Test</h1>
      <p className="text-slate-300 mb-4">Try resizing the grid items using the handles on the edges and corners.</p>
      
      <EnhancedGridLayout
        layout={layout}
        onUpdateLayout={handleUpdateLayout}
        disabled={false}
        showGridLines={true}
        snapToGrid={true}
        enableHistory={true}
      />
      
      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold text-amber-200 mb-2">Current Items:</h2>
        <ul className="space-y-2">
          {layout.gridItems.map(item => (
            <li key={item.id} className="text-slate-300">
              {item.name}: Position ({item.x}, {item.y}), Size ({item.width}x{item.height})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TestGridResizing;