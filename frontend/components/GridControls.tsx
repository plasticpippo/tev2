import React from 'react';
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
  return (
    <div className="bg-slate-700 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-amber-300">Grid Controls</h3>
        <HelpGuide feature="grid-controls" title="Grid Controls" description="Adjust the grid layout settings like columns, size, spacing, and snapping behavior to customize your product grid." />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Columns Control */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
            Columns: {columns}
            <HelpGuide feature="columns" title="Columns" description="Number of columns in the grid. More columns allow for wider grids but smaller items." position="top" />
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
            Grid Unit Size: {gridSize.width}px × {gridSize.height}px
            <HelpGuide feature="grid-size" title="Grid Unit Size" description="Size of each grid cell in pixels. Larger cells mean bigger items but fewer items visible at once." position="top" />
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
            Gutter: {gutter}px
            <HelpGuide feature="gutter" title="Gutter" description="Spacing between grid items in pixels. Increase for more breathing room between items." position="top" />
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
            Padding: {containerPadding.x}px
            <HelpGuide feature="padding" title="Padding" description="Space around the edges of the grid container. Adjust to control the margin around the grid." position="top" />
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
              Snap to Grid
              <HelpGuide feature="snap-to-grid" title="Snap to Grid" description="When enabled, items will snap to the nearest grid position when moved." position="top" />
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
              Show Grid Lines
              <HelpGuide feature="show-grid-lines" title="Show Grid Lines" description="Toggle visibility of grid lines to help with alignment and positioning." position="top" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default GridControls;