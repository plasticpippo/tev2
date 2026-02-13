import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HelpGuide from './HelpGuide';

interface HelpStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  elementId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpSystemProps {
  isActive?: boolean;
  onComplete?: () => void;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isActive = false, onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(isActive);
  
  const helpSteps: HelpStep[] = [
    {
      id: 'step1',
      titleKey: 'helpSystem.steps.welcome.title',
      descriptionKey: 'helpSystem.steps.welcome.description',
      elementId: 'layout-customizer-title',
      position: 'bottom'
    },
    {
      id: 'step2',
      titleKey: 'helpSystem.steps.availableProducts.title',
      descriptionKey: 'helpSystem.steps.availableProducts.description',
      elementId: 'available-products-panel',
      position: 'right'
    },
    {
      id: 'step3',
      titleKey: 'helpSystem.steps.gridCanvas.title',
      descriptionKey: 'helpSystem.steps.gridCanvas.description',
      elementId: 'grid-canvas',
      position: 'top'
    },
    {
      id: 'step4',
      titleKey: 'helpSystem.steps.gridControls.title',
      descriptionKey: 'helpSystem.steps.gridControls.description',
      elementId: 'grid-controls',
      position: 'bottom'
    },
    {
      id: 'step5',
      titleKey: 'helpSystem.steps.layoutManagement.title',
      descriptionKey: 'helpSystem.steps.layoutManagement.description',
      elementId: 'layout-management',
      position: 'left'
    },
    {
      id: 'step6',
      titleKey: 'helpSystem.steps.keyboardShortcuts.title',
      descriptionKey: 'helpSystem.steps.keyboardShortcuts.description',
      elementId: 'keyboard-shortcuts',
      position: 'top'
    }
  ];

  const currentHelpStep = helpSteps[currentStep];

  useEffect(() => {
    if (isActive) {
      setShowTour(true);
      setCurrentStep(0);
    }
  }, [isActive]);

  const handleNext = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTour(false);
      if (onComplete) onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setShowTour(false);
    if (onComplete) onComplete();
  };

  if (!showTour) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[1000] flex items-center justify-center pointer-events-none">
      <div className="bg-slate-800 rounded-lg p-6 max-w-xs sm:max-w-md mx-4 pointer-events-auto relative">
        <div className="absolute top-2 right-2">
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
            aria-label={t('helpSystem.ariaLabel.closeHelpTour')}
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-amber-300">{t(currentHelpStep.titleKey)}</h3>
            <span className="text-slate-400 text-sm">
              {t('helpSystem.stepCounter', { current: currentStep + 1, total: helpSteps.length })}
            </span>
          </div>
          <p className="mt-2 text-slate-300">{t(currentHelpStep.descriptionKey)}</p>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded ${
              currentStep === 0 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-600 hover:bg-slate-500 text-white'
            }`}
          >
            {t('helpSystem.buttons.previous')}
          </button>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
          >
            {currentStep === helpSteps.length - 1 ? t('helpSystem.buttons.finish') : t('helpSystem.buttons.next')}
          </button>
        </div>
      </div>
      
      {/* Highlight the current element */}
      <div 
        className="absolute border-4 border-amber-400 rounded animate-pulse"
        style={{
          top: '20%',
          left: '20%',
          width: '60%',
          height: '60%',
        }}
      ></div>
    </div>
  );
};

export default HelpSystem;