import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  
  // Feature-specific help content
  const getHelpContent = () => {
    switch(feature) {
      case 'grid-controls':
        return {
          title: t('helpGuide.gridControls.title'),
          description: t('helpGuide.gridControls.description')
        };
      case 'drag-and-drop':
        return {
          title: t('helpGuide.dragAndDrop.title'),
          description: t('helpGuide.dragAndDrop.description')
        };
      case 'layout-management':
        return {
          title: t('helpGuide.layoutManagement.title'),
          description: t('helpGuide.layoutManagement.description')
        };
      case 'templates':
        return {
          title: t('helpGuide.templates.title'),
          description: t('helpGuide.templates.description')
        };
      case 'undo-redo':
        return {
          title: t('helpGuide.undoRedo.title'),
          description: t('helpGuide.undoRedo.description')
        };
      case 'zoom':
        return {
          title: t('helpGuide.zoom.title'),
          description: t('helpGuide.zoom.description')
        };
      case 'keyboard-nav':
        return {
          title: t('helpGuide.keyboardNav.title'),
          description: t('helpGuide.keyboardNav.description')
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
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-primary text-white text-xs font-bold cursor-help"
        onClick={() => setShowGuide(!showGuide)}
        aria-label={t('helpGuide.ariaLabel', { feature }) as string}
        role="button"
      >
        ?
      </span>
    </Tooltip>
  );
};

export default HelpGuide;