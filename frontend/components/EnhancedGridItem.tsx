import React, { memo } from 'react';
import { formatCurrency } from '../utils/formatting';
import type { ProductVariant } from '../../shared/types';

interface EnhancedGridItemProps {
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
  isSelected?: boolean;
  isDragging?: boolean;
  isHovered?: boolean;
  onDoubleClick?: () => void;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const EnhancedGridItem: React.FC<EnhancedGridItemProps> = ({
  id,
  name,
  price,
  backgroundColor,
  textColor,
  width,
  height,
  rotation,
  borderRadius,
  zIndex,
  locked = false,
  isSelected = false,
  isDragging = false,
  isHovered = false,
  onDoubleClick,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style = {},
  className = '',
}) => {
  const baseClasses = `
    absolute rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden flex flex-col justify-between
    ${backgroundColor}
    ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-move'}
    ${isSelected ? 'ring-2 ring-yellow-400' : ''}
    ${isHovered && !isDragging ? 'ring-2 ring-blue-400' : ''}
    ${isDragging ? 'opacity-80 scale-95 z-50' : ''}
  `;
  
  const combinedClassName = `${baseClasses} ${className}`;

  return (
    <div
      className={combinedClassName}
      style={{
        ...style,
        transform: rotation ? `rotate(${rotation}deg)` : 'none',
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
        zIndex: isDragging ? 50 : (zIndex || 10),
      }}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="gridcell"
      aria-label={`Product ${name}, price ${formatCurrency(price)}`}
      tabIndex={0}
    >
      <p className={`font-bold ${textColor}`}>
        {name}
      </p>
      <div>
        <p className={`text-sm font-semibold ${textColor}`}>{name}</p>
        <p className={`text-sm ${textColor} opacity-80`}>{formatCurrency(price)}</p>
      </div>
      
      {/* Visual indicator for locked items */}
      {locked && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
          <span className="text-xs text-white">🔒</span>
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders when parent props change
// but this specific item's props remain the same
export default memo(EnhancedGridItem, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.price === nextProps.price &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.zIndex === nextProps.zIndex &&
    prevProps.locked === nextProps.locked &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.className === nextProps.className &&
    // Compare style objects deeply
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});