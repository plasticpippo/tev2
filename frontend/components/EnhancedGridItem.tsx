import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatting';
import type { ProductVariant } from '../../shared/types';

interface Transform {
  x: number;
  y: number;
}

interface ResizeTransform {
  scaleX: number;
  scaleY: number;
}

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
  isResizing?: boolean;
  isHovered?: boolean;
  dragTransform?: Transform;
  resizeTransform?: ResizeTransform;
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
  isResizing = false,
  isHovered = false,
  dragTransform,
  resizeTransform,
  onDoubleClick,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style = {},
  className = '',
}) => {
  const { t } = useTranslation();
  // Combine multiple transforms into a single string
  const getTransform = (): string | undefined => {
    const transforms: string[] = [];

    if (isDragging && dragTransform) {
      transforms.push(`translate(${dragTransform.x}px, ${dragTransform.y}px)`);
    }

    if (isResizing && resizeTransform) {
      transforms.push(`scale(${resizeTransform.scaleX}, ${resizeTransform.scaleY})`);
    }

    if (rotation) {
      transforms.push(`rotate(${rotation}deg)`);
    }

    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };

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
        transform: getTransform(),
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
        zIndex: isDragging ? 50 : (zIndex || 10),
      }}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="gridcell"
      aria-label={t('enhancedGridItem.ariaLabel', { name, price: formatCurrency(price) })}
      tabIndex={0}
    >
      <p className={`font-bold ${textColor}`}>
        {name}
      </p>
      <div>
        <p className={`text-sm ${textColor} opacity-80`}>{formatCurrency(price)}</p>
      </div>
      
      {/* Visual indicator for locked items */}
      {locked && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
          <span className="text-xs text-white">{t('enhancedGridItem.locked')}</span>
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
    prevProps.isResizing === nextProps.isResizing &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.className === nextProps.className &&
    // Compare transform objects deeply
    JSON.stringify(prevProps.dragTransform) === JSON.stringify(nextProps.dragTransform) &&
    JSON.stringify(prevProps.resizeTransform) === JSON.stringify(nextProps.resizeTransform) &&
    // Compare style objects deeply
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});