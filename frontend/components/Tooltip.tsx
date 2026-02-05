import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 500,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-sm font-medium text-white bg-bg-primary rounded-lg shadow-lg
            ${positionClasses[position]}
            ${className}
          `}
          role="tooltip"
        >
          <div className="relative">
            {content}
            <div className={`
              absolute w-0 h-0 border-8 border-transparent
              ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-800' : ''}
              ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800' : ''}
              ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 border-l-slate-800' : ''}
              ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 border-r-slate-800' : ''}
            `}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;