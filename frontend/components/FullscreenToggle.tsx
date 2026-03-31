import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const FULLSCREEN_STORAGE_KEY = 'pos_fullscreen_preference';

const FullscreenToggle: React.FC = () => {
  const { t } = useTranslation('common');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const checkFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }, []);

  const requestFullscreen = async (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      } else {
        setIsSupported(false);
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) {
        await exitFullscreen();
        localStorage.setItem(FULLSCREEN_STORAGE_KEY, 'false');
      } else {
        await requestFullscreen(document.documentElement);
        localStorage.setItem(FULLSCREEN_STORAGE_KEY, 'true');
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = checkFullscreen();
      setIsFullscreen(fullscreenActive);
      localStorage.setItem(FULLSCREEN_STORAGE_KEY, String(fullscreenActive));
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    const savedPreference = localStorage.getItem(FULLSCREEN_STORAGE_KEY);
    if (savedPreference === 'true' && !checkFullscreen()) {
      requestFullscreen(document.documentElement);
    }

    setIsFullscreen(checkFullscreen());

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, [checkFullscreen]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="flex items-center justify-center min-h-11 min-w-11 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800"
      aria-label={isFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')}
      aria-pressed={isFullscreen}
      title={isFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')}
    >
      {isFullscreen ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15"
          />
        </svg>
      )}
    </button>
  );
};

export default FullscreenToggle;
