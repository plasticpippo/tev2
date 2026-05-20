import { useState, useEffect, useCallback, type RefObject } from 'react';

export const GRID_COLUMNS_DESKTOP = 4;
export const GRID_COLUMNS_MOBILE = 3;
export const GRID_COLUMNS_SMALL = 2;

export const GRID_BREAKPOINTS = {
  COLUMNS_4: 500,
  COLUMNS_3: 300,
} as const;

export interface ViewportInfo {
  isSmall: boolean;
  isMobile: boolean;
  currentGridColumns: number;
}

const getColumnsForWidth = (width: number): number => {
  if (width >= GRID_BREAKPOINTS.COLUMNS_4) return GRID_COLUMNS_DESKTOP;
  if (width >= GRID_BREAKPOINTS.COLUMNS_3) return GRID_COLUMNS_MOBILE;
  return GRID_COLUMNS_SMALL;
};

const getViewportFallback = (width: number): number => {
  if (width < 400) return GRID_COLUMNS_SMALL;
  if (width < 768) return GRID_COLUMNS_MOBILE;
  return GRID_COLUMNS_DESKTOP;
};

export const useViewport = (containerRef?: RefObject<HTMLElement | null>): ViewportInfo => {
  const [isSmall, setIsSmall] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentGridColumns, setCurrentGridColumns] = useState(GRID_COLUMNS_DESKTOP);

  const updateFromContainer = useCallback((el: HTMLElement) => {
    const style = getComputedStyle(el);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const contentWidth = el.offsetWidth - padL - padR;
    if (contentWidth > 0) {
      setCurrentGridColumns(getColumnsForWidth(contentWidth));
    }
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      const width = document.documentElement.clientWidth;
      setIsSmall(width < 400);
      setIsMobile(width < 768);
    };

    checkViewport();

    const el = containerRef?.current ?? null;
    let observer: ResizeObserver | null = null;

    if (el && el.offsetWidth > 0) {
      updateFromContainer(el);
      observer = new ResizeObserver(() => {
        if (containerRef?.current && containerRef.current.offsetWidth > 0) {
          updateFromContainer(containerRef.current);
        }
      });
      observer.observe(el);
    } else {
      setCurrentGridColumns(getViewportFallback(document.documentElement.clientWidth));
    }

    const handleResize = () => {
      checkViewport();
      const target = containerRef?.current;
      if (target) {
        updateFromContainer(target);
      } else {
        setCurrentGridColumns(getViewportFallback(document.documentElement.clientWidth));
      }
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 50);
    };

    window.addEventListener('resize', debouncedResize);
    const orientationHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    window.addEventListener('orientationchange', orientationHandler);

    return () => {
      observer?.disconnect();
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', orientationHandler);
    };
  }, [containerRef, updateFromContainer]);

  return { isSmall, isMobile, currentGridColumns };
};
