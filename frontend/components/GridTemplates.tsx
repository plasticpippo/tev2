import React, { useState } from 'react';
import type { ProductGridLayout, ProductVariant, Product } from '../../shared/types';

// Define preset templates
export interface GridTemplate {
  id: string;
  name: string;
  description: string;
  category: 'restaurant' | 'retail' | 'bar' | 'cafe' | 'custom';
  layout: Omit<ProductGridLayout, 'version'>;
}

interface GridTemplatesProps {
  onApplyTemplate: (template: GridTemplate) => void;
  products: Product[];
  variants: ProductVariant[];
  currentLayoutName?: string;
  onCancel?: () => void;
}

const GridTemplates: React.FC<GridTemplatesProps> = ({
  onApplyTemplate,
  products,
  variants,
  currentLayoutName = 'Current Layout',
  onCancel
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Generate template with actual product data
  const generateTemplateLayout = (templateType: 'restaurant' | 'retail' | 'bar' | 'cafe'): Omit<ProductGridLayout, 'version'> => {
    // Find some sample products to use in templates
    const sampleProducts = products.slice(0, 20); // Take first 20 products as samples
    
    if (templateType === 'restaurant') {
      // Restaurant template with common food items
      return {
        columns: 6,
        gridItems: [
          // Appetizers - top row
          { id: 'app-1', variantId: sampleProducts[0]?.variants[0]?.id || 1, productId: sampleProducts[0]?.id || 1, x: 0, y: 0, width: 1, height: 1 },
          { id: 'app-2', variantId: sampleProducts[1]?.variants[0]?.id || 2, productId: sampleProducts[1]?.id || 2, x: 1, y: 0, width: 1, height: 1 },
          { id: 'app-3', variantId: sampleProducts[2]?.variants[0]?.id || 3, productId: sampleProducts[2]?.id || 3, x: 2, y: 0, width: 1, height: 1 },
          { id: 'app-4', variantId: sampleProducts[3]?.variants[0]?.id || 4, productId: sampleProducts[3]?.id || 4, x: 3, y: 0, width: 1, height: 1 },
          
          // Main courses - middle rows
          { id: 'main-1', variantId: sampleProducts[4]?.variants[0]?.id || 5, productId: sampleProducts[4]?.id || 5, x: 0, y: 1, width: 1, height: 1 },
          { id: 'main-2', variantId: sampleProducts[5]?.variants[0]?.id || 6, productId: sampleProducts[5]?.id || 6, x: 1, y: 1, width: 1, height: 1 },
          { id: 'main-3', variantId: sampleProducts[6]?.variants[0]?.id || 7, productId: sampleProducts[6]?.id || 7, x: 2, y: 1, width: 1, height: 1 },
          { id: 'main-4', variantId: sampleProducts[7]?.variants[0]?.id || 8, productId: sampleProducts[7]?.id || 8, x: 3, y: 1, width: 1, height: 1 },
          
          // Desserts - bottom left
          { id: 'dessert-1', variantId: sampleProducts[8]?.variants[0]?.id || 9, productId: sampleProducts[8]?.id || 9, x: 0, y: 2, width: 1, height: 1 },
          { id: 'dessert-2', variantId: sampleProducts[9]?.variants[0]?.id || 10, productId: sampleProducts[9]?.id || 10, x: 1, y: 2, width: 1, height: 1 },
          
          // Drinks - right side
          { id: 'drink-1', variantId: sampleProducts[10]?.variants[0]?.id || 11, productId: sampleProducts[10]?.id || 11, x: 4, y: 0, width: 1, height: 1 },
          { id: 'drink-2', variantId: sampleProducts[11]?.variants[0]?.id || 12, productId: sampleProducts[11]?.id || 12, x: 5, y: 0, width: 1, height: 1 },
          { id: 'drink-3', variantId: sampleProducts[12]?.variants[0]?.id || 13, productId: sampleProducts[12]?.id || 13, x: 4, y: 1, width: 1, height: 1 },
          { id: 'drink-4', variantId: sampleProducts[13]?.variants[0]?.id || 14, productId: sampleProducts[13]?.id || 14, x: 5, y: 1, width: 1, height: 1 },
        ]
      };
    } else if (templateType === 'retail') {
      // Retail template with common retail categories
      return {
        columns: 6,
        gridItems: [
          // Electronics - top row
          { id: 'elec-1', variantId: sampleProducts[0]?.variants[0]?.id || 1, productId: sampleProducts[0]?.id || 1, x: 0, y: 0, width: 1, height: 1 },
          { id: 'elec-2', variantId: sampleProducts[1]?.variants[0]?.id || 2, productId: sampleProducts[1]?.id || 2, x: 1, y: 0, width: 1, height: 1 },
          { id: 'elec-3', variantId: sampleProducts[2]?.variants[0]?.id || 3, productId: sampleProducts[2]?.id || 3, x: 2, y: 0, width: 1, height: 1 },
          
          // Clothing - middle row
          { id: 'cloth-1', variantId: sampleProducts[3]?.variants[0]?.id || 4, productId: sampleProducts[3]?.id || 4, x: 0, y: 1, width: 1, height: 1 },
          { id: 'cloth-2', variantId: sampleProducts[4]?.variants[0]?.id || 5, productId: sampleProducts[4]?.id || 5, x: 1, y: 1, width: 1, height: 1 },
          { id: 'cloth-3', variantId: sampleProducts[5]?.variants[0]?.id || 6, productId: sampleProducts[5]?.id || 6, x: 2, y: 1, width: 1, height: 1 },
          
          // Home Goods - third row
          { id: 'home-1', variantId: sampleProducts[6]?.variants[0]?.id || 7, productId: sampleProducts[6]?.id || 7, x: 3, y: 0, width: 1, height: 1 },
          { id: 'home-2', variantId: sampleProducts[7]?.variants[0]?.id || 8, productId: sampleProducts[7]?.id || 8, x: 4, y: 0, width: 1, height: 1 },
          { id: 'home-3', variantId: sampleProducts[8]?.variants[0]?.id || 9, productId: sampleProducts[8]?.id || 9, x: 3, y: 1, width: 1, height: 1 },
          
          // Special Offers - right column
          { id: 'offer-1', variantId: sampleProducts[9]?.variants[0]?.id || 10, productId: sampleProducts[9]?.id || 10, x: 5, y: 0, width: 1, height: 2 },
        ]
      };
    } else if (templateType === 'bar') {
      // Bar template with drinks organized by type
      return {
        columns: 6,
        gridItems: [
          // Beers - top row
          { id: 'beer-1', variantId: sampleProducts[0]?.variants[0]?.id || 1, productId: sampleProducts[0]?.id || 1, x: 0, y: 0, width: 1, height: 1 },
          { id: 'beer-2', variantId: sampleProducts[1]?.variants[0]?.id || 2, productId: sampleProducts[1]?.id || 2, x: 1, y: 0, width: 1, height: 1 },
          { id: 'beer-3', variantId: sampleProducts[2]?.variants[0]?.id || 3, productId: sampleProducts[2]?.id || 3, x: 2, y: 0, width: 1, height: 1 },
          
          // Wines - second row
          { id: 'wine-1', variantId: sampleProducts[3]?.variants[0]?.id || 4, productId: sampleProducts[3]?.id || 4, x: 0, y: 1, width: 1, height: 1 },
          { id: 'wine-2', variantId: sampleProducts[4]?.variants[0]?.id || 5, productId: sampleProducts[4]?.id || 5, x: 1, y: 1, width: 1, height: 1 },
          { id: 'wine-3', variantId: sampleProducts[5]?.variants[0]?.id || 6, productId: sampleProducts[5]?.id || 6, x: 2, y: 1, width: 1, height: 1 },
          
          // Spirits - third row
          { id: 'spirit-1', variantId: sampleProducts[6]?.variants[0]?.id || 7, productId: sampleProducts[6]?.id || 7, x: 3, y: 0, width: 1, height: 1 },
          { id: 'spirit-2', variantId: sampleProducts[7]?.variants[0]?.id || 8, productId: sampleProducts[7]?.id || 8, x: 4, y: 0, width: 1, height: 1 },
          { id: 'spirit-3', variantId: sampleProducts[8]?.variants[0]?.id || 9, productId: sampleProducts[8]?.id || 9, x: 3, y: 1, width: 1, height: 1 },
          { id: 'spirit-4', variantId: sampleProducts[9]?.variants[0]?.id || 10, productId: sampleProducts[9]?.id || 10, x: 4, y: 1, width: 1, height: 1 },
          
          // Cocktails - right column
          { id: 'cocktail-1', variantId: sampleProducts[10]?.variants[0]?.id || 11, productId: sampleProducts[10]?.id || 11, x: 5, y: 0, width: 1, height: 2 },
        ]
      };
    } else { // cafe
      // Cafe template with coffee and pastries
      return {
        columns: 6,
        gridItems: [
          // Coffee Types - top row
          { id: 'coffee-1', variantId: sampleProducts[0]?.variants[0]?.id || 1, productId: sampleProducts[0]?.id || 1, x: 0, y: 0, width: 1, height: 1 },
          { id: 'coffee-2', variantId: sampleProducts[1]?.variants[0]?.id || 2, productId: sampleProducts[1]?.id || 2, x: 1, y: 0, width: 1, height: 1 },
          { id: 'coffee-3', variantId: sampleProducts[2]?.variants[0]?.id || 3, productId: sampleProducts[2]?.id || 3, x: 2, y: 0, width: 1, height: 1 },
          { id: 'coffee-4', variantId: sampleProducts[3]?.variants[0]?.id || 4, productId: sampleProducts[3]?.id || 4, x: 3, y: 0, width: 1, height: 1 },
          
          // Pastries - second row
          { id: 'pastry-1', variantId: sampleProducts[4]?.variants[0]?.id || 5, productId: sampleProducts[4]?.id || 5, x: 0, y: 1, width: 1, height: 1 },
          { id: 'pastry-2', variantId: sampleProducts[5]?.variants[0]?.id || 6, productId: sampleProducts[5]?.id || 6, x: 1, y: 1, width: 1, height: 1 },
          { id: 'pastry-3', variantId: sampleProducts[6]?.variants[0]?.id || 7, productId: sampleProducts[6]?.id || 7, x: 2, y: 1, width: 1, height: 1 },
          
          // Specials - right column
          { id: 'special-1', variantId: sampleProducts[7]?.variants[0]?.id || 8, productId: sampleProducts[7]?.id || 8, x: 4, y: 0, width: 2, height: 2 },
        ]
      };
    }
  };

  // Define templates with dynamic generation
  const TEMPLATES = [
    {
      id: 'restaurant-standard',
      name: 'Restaurant Standard',
      description: 'Common restaurant layout with food categories organized by sections',
      category: 'restaurant' as const,
      layout: generateTemplateLayout('restaurant')
    },
    {
      id: 'retail-standard',
      name: 'Retail Standard',
      description: 'Basic retail layout with common product categories',
      category: 'retail' as const,
      layout: generateTemplateLayout('retail')
    },
    {
      id: 'bar-standard',
      name: 'Bar Standard',
      description: 'Bar layout with drinks organized by type',
      category: 'bar' as const,
      layout: generateTemplateLayout('bar')
    },
    {
      id: 'cafe-standard',
      name: 'Cafe Standard',
      description: 'Cafe layout with coffee and pastries',
      category: 'cafe' as const,
      layout: generateTemplateLayout('cafe')
    }
  ];

  const categories = ['all', 'restaurant', 'retail', 'bar', 'cafe'];

  const filteredTemplates = filterCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(template => template.category === filterCategory);

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        onApplyTemplate(template);
      }
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId === selectedTemplate ? null : templateId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="templates-title">
      <div className="bg-slate-800 rounded-lg p-6 w-11/12 h-5/6 max-w-xs sm:max-w-4xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="templates-title" className="text-2xl font-bold text-amber-300">Grid Templates</h2>
          <button
            onClick={onCancel}
            className="text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="template-category" className="block text-sm font-medium text-slate-300 mb-2">
            Filter by category:
          </label>
          <select
            id="template-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedTemplate === template.id
                  ? 'border-amber-400 bg-amber-900 bg-opacity-20'
                  : 'border-slate-600 hover:border-amber-500 hover:bg-slate-700'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
              role="button"
              tabIndex={0}
              aria-checked={selectedTemplate === template.id}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTemplateSelect(template.id);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-amber-200">{template.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    Items: {template.layout.gridItems.length} | Columns: {template.layout.columns}
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                  {template.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              selectedTemplate
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridTemplates;