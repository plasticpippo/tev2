import React from 'react';
import type { Product, ProductVariant } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';

interface ProductGridItemProps {
  product: Product;
  variant: ProductVariant;
  widthSpan: number; // Number of grid columns this item should span
  heightSpan: number; // Number of grid rows this item should span
  isMakable: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

interface ProductGridItemProps {
  product: Product;
  variant: ProductVariant;
  widthSpan: number; // Number of grid columns this item should span
  heightSpan: number; // Number of grid rows this item should span
  isMakable: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  useParentDimensions?: boolean; // Flag to indicate whether to use parent container's dimensions
}

const ProductGridItem: React.FC<ProductGridItemProps> = ({
  product,
  variant,
  widthSpan,
  heightSpan,
  isMakable,
  onClick,
  disabled = false,
  className = '',
  useParentDimensions = false
}) => {
  // Calculate the height based on the heightSpan (each grid unit is approximately 128px tall)
  const calculatedHeight = heightSpan * 128; // 128px per grid unit as used in EnhancedGridCanvas

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isMakable}
      className={`
        rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden
        flex flex-col justify-between
        ${variant.backgroundColor}
        ${isMakable ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed'}
        ${className}
      `}
      style={{
        ...(useParentDimensions ? {} : {
          gridColumn: `span ${widthSpan}`,
          gridRow: `span ${heightSpan}`,
          minHeight: `${calculatedHeight}px`,
          height: `${calculatedHeight}px` // Set explicit height for consistency
        })
      }}
    >
      <p className={`font-bold ${variant.textColor} text-lg`}>{product.name}</p>
      <div>
        <p className={`text-base font-semibold ${variant.textColor}`}>{variant.name}</p>
        <p className={`text-base ${variant.textColor} opacity-80`}>{formatCurrency(variant.price)}</p>
      </div>
      {!isMakable && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">
            OUT OF STOCK
          </span>
        </div>
      )}
    </button>
  );
};

export default ProductGridItem;
