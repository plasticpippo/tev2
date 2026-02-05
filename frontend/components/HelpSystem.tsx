import React, { useState, useEffect } from 'react';
import HelpGuide from './HelpGuide';

interface HelpStep {
  id: string;
  title: string;
  description: string;
  elementId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpSystemProps {
  isActive?: boolean;
  onComplete?: () => void;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isActive = false, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(isActive);
  
  const helpSteps: HelpStep[] = [
    {
      id: 'step1',
      title: 'Welcome to Grid Customization',
      description: 'This guide will help you understand how to customize your product grid layout.',
      elementId: 'layout-customizer-title',
      position: 'bottom'
    },
    {
      id: 'step2',
      title: 'Available Products Panel',
      description: 'Drag products from this panel onto the grid canvas to add them to your layout.',
      elementId: 'available-products-panel',
      position: 'right'
    },
    {
      id: 'step3',
      title: 'Grid Layout Canvas',
      description: 'This is where you arrange your products. Drag items to reposition them.',
      elementId: 'grid-canvas',
      position: 'top'
    },
    {
      id: 'step4',
      title: 'Grid Controls',
      description: 'Adjust grid settings like columns, size, and spacing to fit your needs.',
      elementId: 'grid-controls',
      position: 'bottom'
    },
    {
      id: 'step5',
      title: 'Layout Management',
      description: 'Save, load, and manage different grid layouts for different purposes.',
      elementId: 'layout-management',
      position: 'left'
    },
    {
      id: 'step6',
      title: 'Keyboard Shortcuts',
      description: 'Use Ctrl+Z to undo, Ctrl+Y to redo, and arrow keys to fine-tune item positions.',
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
            aria-label="Close help tour"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-amber-300">{currentHelpStep.title}</h3>
            <span className="text-slate-400 text-sm">
              Step {currentStep + 1} of {helpSteps.length}
            </span>
          </div>
          <p className="mt-2 text-slate-300">{currentHelpStep.description}</p>
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
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
          >
            {currentStep === helpSteps.length - 1 ? 'Finish' : 'Next'}
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