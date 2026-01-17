import React from 'react';
import Tooltip from './Tooltip';
import HelpGuide from './HelpGuide';
import HelpSystem from './HelpSystem';

const VisualGuidesTest: React.FC = () => {
  const [showHelpTour, setShowHelpTour] = React.useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-900 text-white">
      <h1 className="text-2xl font-bold mb-6 text-amber-300">Visual Guides and Tooltips Test</h1>
      
      <div className="mb-8 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-amber-200">Tooltip Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700 rounded">
            <h3 className="font-medium mb-2">Position Variations</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tooltip content="This tooltip appears on top" position="top">
                  <button className="px-3 py-1 bg-blue-600 rounded">Top</button>
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip content="This tooltip appears on bottom" position="bottom">
                  <button className="px-3 py-1 bg-blue-600 rounded">Bottom</button>
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip content="This tooltip appears on left" position="left">
                  <button className="px-3 py-1 bg-blue-600 rounded">Left</button>
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip content="This tooltip appears on right" position="right">
                  <button className="px-3 py-1 bg-blue-600 rounded">Right</button>
                </Tooltip>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-700 rounded">
            <h3 className="font-medium mb-2">Help Guide Examples</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span>Grid Controls:</span>
                <HelpGuide 
                  feature="grid-controls" 
                  title="Grid Controls" 
                  description="Adjust the grid layout settings like columns, size, spacing, and snapping behavior." 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span>Drag & Drop:</span>
                <HelpGuide 
                  feature="drag-and-drop" 
                  title="Drag & Drop Items" 
                  description="Drag products from the left panel onto the grid canvas to add them." 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span>Templates:</span>
                <HelpGuide 
                  feature="templates" 
                  title="Layout Templates" 
                  description="Apply pre-made templates to quickly set up common grid arrangements." 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-amber-200">Help System Integration</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowHelpTour(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded"
          >
            Start Help Tour
          </button>
          <p className="text-slate-300 flex-1">
            Click the button to start an interactive tour that guides users through the grid customization interface.
          </p>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-amber-200">Accessibility Features</h2>
        <ul className="space-y-2 text-slate-300">
          <li>• All interactive elements have proper aria-labels</li>
          <li>• Semantic HTML structure maintained</li>
          <li>• Keyboard navigable components</li>
          <li>• Screen reader friendly content</li>
          <li>• Focus indicators for interactive elements</li>
        </ul>
      </div>
      
      {/* Help Tour Component */}
      {showHelpTour && (
        <HelpSystem 
          isActive={showHelpTour} 
          onComplete={() => setShowHelpTour(false)} 
        />
      )}
    </div>
  );
};

export default VisualGuidesTest;