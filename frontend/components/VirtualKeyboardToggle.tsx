import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualKeyboard } from './VirtualKeyboardContext';
import useDeviceDetection from '../hooks/useDeviceDetection';

interface VirtualKeyboardToggleProps {
  className?: string;
}

const VirtualKeyboardToggle: React.FC<VirtualKeyboardToggleProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { isKeyboardEnabled, toggleKeyboard } = useVirtualKeyboard();
  const { isDesktop } = useDeviceDetection();

  // Only show on desktop devices
  if (!isDesktop) {
    return null;
  }

  return (
    <button
      onClick={toggleKeyboard}
      className={`
        fixed bottom-6 right-6
        w-12 h-12
        rounded-full
        flex items-center justify-center
        shadow-lg
        transition-all duration-200 ease-in-out
        hover:scale-110
        active:scale-95
        z-50
        ${isKeyboardEnabled 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-gray-400 hover:bg-gray-500 text-white'
        }
        ${className}
      `}
      title={isKeyboardEnabled ? t('virtualKeyboard.disable') : t('virtualKeyboard.enable')}
      aria-label={isKeyboardEnabled ? t('virtualKeyboard.disable') : t('virtualKeyboard.enable')}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isKeyboardEnabled ? '' : 'opacity-60'}
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="6" y1="8" x2="6" y2="8" />
        <line x1="10" y1="8" x2="10" y2="8" />
        <line x1="14" y1="8" x2="14" y2="8" />
        <line x1="18" y1="8" x2="18" y2="8" />
        <line x1="6" y1="12" x2="6" y2="12" />
        <line x1="10" y1="12" x2="10" y2="12" />
        <line x1="14" y1="12" x2="14" y2="12" />
        <line x1="18" y1="12" x2="18" y2="12" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
      {isKeyboardEnabled && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
};

export default VirtualKeyboardToggle;
