import { useState, useEffect } from 'react';

export const MOBILE_BREAKPOINT = 768;
export const SMALL_BREAKPOINT = 400;
export const GRID_COLUMNS_DESKTOP = 4;
export const GRID_COLUMNS_MOBILE = 3;
export const GRID_COLUMNS_SMALL = 2;

export interface ViewportInfo {
  isSmall: boolean;
  isMobile: boolean;
  currentGridColumns: number;
}

export const useViewport = (): ViewportInfo => {
  const [isSmall, setIsSmall] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsSmall(window.innerWidth < SMALL_BREAKPOINT);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const currentGridColumns = isSmall ? GRID_COLUMNS_SMALL : (isMobile ? GRID_COLUMNS_MOBILE : GRID_COLUMNS_DESKTOP);

  return { isSmall, isMobile, currentGridColumns };
};