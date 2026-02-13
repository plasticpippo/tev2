import React from 'react';
import { useTranslation } from 'react-i18next';
import HelpGuide from './HelpGuide';

interface GridControlsProps {
  columns: number;
  setColumns: (cols: number) => void;
  gridSize: { width: number; height: number };
  setGridSize: (size: { width: number; height: number }) => void;
  gutter: number;
  setGutter: (gutter: number) => void;
  containerPadding: { x: number; y: number };
  setContainerPadding: (padding: { x: number; y: number }) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
}

const GridControls: React.FC<GridControlsProps> = ({
  columns,
  setColumns,
  gridSize,
  setGridSize,
  gutter,
  setGutter,
  containerPadding,
  setContainerPadding,
  snapToGrid,
  setSnapToGrid,
  showGridLines,
  setShowGridLines,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-700 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-amber-300">{t('gridControls.title')}</h3>
        <HelpGuide feature="grid-controls" title={t('gridControls.title')} description={t('gridControls.description')} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Columns Control */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
            {t('gridControls.columns')}: {columns}
            <HelpGuide feature="columns" title={t('gridControls.columns')} description={t('gridControls.columnsDescription')} position="top" />
          </label>
          <input
            type="range"
            min="4"
            max="12"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>4</span>
            <span>12</span>
          </div>
        </div>
        
        {/* Grid Size Control */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
            {t('gridControls.gridUnitSize')}: {gridSize.width}px × {gridSize.height}px
            <HelpGuide feature="grid-size" title={t('gridControls.gridUnitSize')} description={t('gridControls.gridUnitSizeDescription')} position="top" />
          </label>
          <div className="flex space-x-2">
            <input
              type="range"
              min="60"
              max="140"
              value={gridSize.width}
              onChange={(e) => setGridSize({ width: parseInt(e.target.value), height: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>60px</span>
            <span>140px</span>
          </div>
        </div>
        
        {/* Gutter Control */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
            {t('gridControls.gutter')}: {gutter}px
            <HelpGuide feature="gutter" title={t('gridControls.gutter')} description={t('gridControls.gutterDescription')} position="top" />
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={gutter}
            onChange={(e) => setGutter(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0px</span>
            <span>20px</span>
          </div>
        </div>
        
        {/* Container Padding Control */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
            {t('gridControls.padding')}: {containerPadding.x}px
            <HelpGuide feature="padding" title={t('gridControls.padding')} description={t('gridControls.paddingDescription')} position="top" />
          </label>
          <input
            type="range"
            min="0"
            max="32"
            value={containerPadding.x}
            onChange={(e) => setContainerPadding({ x: parseInt(e.target.value), y: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0px</span>
            <span>32px</span>
          </div>
        </div>
        
        {/* Snap to Grid Toggle */}
        <div className="flex items-center relative">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${snapToGrid ? 'bg-amber-500' : 'bg-slate-600'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${snapToGrid ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-slate-300 flex items-center">
              {t('gridControls.snapToGrid')}
              <HelpGuide feature="snap-to-grid" title={t('gridControls.snapToGrid')} description={t('gridControls.snapToGridDescription')} position="top" />
            </div>
          </label>
        </div>
        
        {/* Show Grid Lines Toggle */}
        <div className="flex items-center relative">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showGridLines}
                onChange={(e) => setShowGridLines(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${showGridLines ? 'bg-amber-500' : 'bg-slate-600'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showGridLines ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-slate-300 flex items-center">
              {t('gridControls.showGridLines')}
              <HelpGuide feature="show-grid-lines" title={t('gridControls.showGridLines')} description={t('gridControls.showGridLinesDescription')} position="top" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default GridControls;