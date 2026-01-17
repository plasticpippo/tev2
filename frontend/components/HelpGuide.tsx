import React, { useState } from 'react';
import Tooltip from './Tooltip';

interface HelpGuideProps {
  feature: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ 
  feature, 
  title, 
  description, 
  position = 'top', 
  delay = 500 
}) => {
  const [showGuide, setShowGuide] = useState(false);
  
  // Feature-specific help content
  const getHelpContent = () => {
    switch(feature) {
      case 'grid-controls':
        return {
          title: 'Grid Controls',
          description: 'Adjust the grid layout settings like columns, size, spacing, and snapping behavior to customize your product grid.'
        };
      case 'drag-and-drop':
        return {
          title: 'Drag & Drop Items',
          description: 'Drag products from the left panel onto the grid canvas to add them. Drag existing items to reposition them on the grid.'
        };
      case 'layout-management':
        return {
          title: 'Layout Management',
          description: 'Save, load, and manage different grid layouts for different purposes. Set a default layout for new sessions.'
        };
      case 'templates':
        return {
          title: 'Layout Templates',
          description: 'Apply pre-made templates to quickly set up common grid arrangements like kitchen, bar, or retail layouts.'
        };
      case 'undo-redo':
        return {
          title: 'Undo/Redo Actions',
          description: 'Use Ctrl+Z to undo and Ctrl+Y or Ctrl+Shift+Z to redo your layout changes.'
        };
      case 'zoom':
        return {
          title: 'Zoom Controls',
          description: 'Adjust the zoom level to get a better view of your grid layout. Use Ctrl+Plus/Minus to zoom in/out.'
        };
      case 'keyboard-nav':
        return {
          title: 'Keyboard Navigation',
          description: 'Select an item and use arrow keys to move it precisely. Hold Shift for larger movements.'
        };
      default:
        return { title, description };
    }
  };

  const helpContent = getHelpContent();

  return (
    <Tooltip 
      content={`${helpContent.title}: ${helpContent.description}`}
      position={position}
      delay={delay}
    >
      <span 
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold cursor-help"
        onClick={() => setShowGuide(!showGuide)}
        aria-label={`Help for ${feature}`}
        role="button"
      >
        ?
      </span>
    </Tooltip>
  );
};

export default HelpGuide;