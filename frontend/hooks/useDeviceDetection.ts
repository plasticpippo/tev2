import { useState, useEffect, useCallback } from 'react';

export interface DeviceDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Hook to detect the type of device being used (mobile, tablet, or desktop).
 * Uses user agent detection as the primary method, touch capability as a secondary indicator,
 * and screen size as a fallback.
 */
const useDeviceDetection = (): DeviceDetectionResult => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    deviceType: 'desktop',
  });

  /**
   * Detect device type based on user agent string
   */
  const detectDeviceByUserAgent = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'desktop';
    }

    const userAgent = navigator.userAgent.toLowerCase();

    // Mobile devices (phones)
    const mobilePatterns = [
      /android(?!.*mobile)/i, // Android tablets are handled separately
      /iphone/i,
      /ipod/i,
      /blackberry/i,
      /iemobile/i,
      /windows phone/i,
      /mobile/i,
    ];

    // Tablet devices
    const tabletPatterns = [
      /ipad/i,
      /android(?!.*mobile)/i,
      /tablet/i,
      /kindle/i,
      /silk/i,
      /playbook/i,
      /rim tablet/i,
    ];

    // Check for tablets first (more specific)
    const isTablet = tabletPatterns.some(pattern => pattern.test(userAgent));
    if (isTablet) {
      return 'tablet';
    }

    // Check for mobile devices
    const isMobile = mobilePatterns.some(pattern => pattern.test(userAgent));
    if (isMobile) {
      return 'mobile';
    }

    // Default to desktop
    return 'desktop';
  }, []);

  /**
   * Detect touch capability
   */
  const detectTouchCapability = useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Check for touch points
    const hasTouchPoints = navigator.maxTouchPoints > 0;
    
    // Check for touch event support
    const hasTouchEvents = 'ontouchstart' in window || 
                          'ontouchend' in window || 
                          'ontouchmove' in window;

    return hasTouchPoints || hasTouchEvents;
  }, []);

  /**
   * Detect device type based on screen size (fallback method)
   */
  const detectDeviceByScreenSize = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') {
      return 'desktop';
    }

    const width = window.innerWidth;

    if (width < 768) {
      return 'mobile';
    } else if (width >= 768 && width <= 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, []);

  /**
   * Update device information
   */
  const updateDeviceInfo = useCallback(() => {
    const deviceTypeByUA = detectDeviceByUserAgent();
    const deviceTypeByScreen = detectDeviceByScreenSize();
    const isTouchDevice = detectTouchCapability();

    // Use user agent detection as primary, screen size as fallback
    // However, if user agent says desktop but screen is small, use screen size
    let finalDeviceType: 'mobile' | 'tablet' | 'desktop';

    if (deviceTypeByUA === 'desktop' && deviceTypeByScreen !== 'desktop') {
      // User agent says desktop but screen suggests otherwise
      finalDeviceType = deviceTypeByScreen;
    } else {
      finalDeviceType = deviceTypeByUA;
    }

    setDeviceInfo({
      isMobile: finalDeviceType === 'mobile',
      isTablet: finalDeviceType === 'tablet',
      isDesktop: finalDeviceType === 'desktop',
      isTouchDevice,
      deviceType: finalDeviceType,
    });
  }, [detectDeviceByUserAgent, detectDeviceByScreenSize, detectTouchCapability]);

  useEffect(() => {
    // Initial detection
    updateDeviceInfo();

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateDeviceInfo();
      }, 250); // Debounce for 250ms
    };

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Clean up event listener on unmount
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
};

export default useDeviceDetection;
