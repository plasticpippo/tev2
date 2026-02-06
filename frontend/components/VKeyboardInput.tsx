import React, { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react';
import { useVirtualKeyboard } from './VirtualKeyboardContext';
import useDeviceDetection from '../hooks/useDeviceDetection';

type KeyboardType = 'numeric' | 'full';

type VKeyboardInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  'k-type': KeyboardType;
  autoOpenOnMount?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} & {
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const VKeyboardInput = forwardRef<HTMLInputElement, VKeyboardInputProps>(
  ({ 'k-type': kType, onFocus, onKeyPress, autoOpenOnMount, type = 'text', ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null);
    const { openKeyboard } = useVirtualKeyboard();
    const { isMobile, isTablet, isDesktop } = useDeviceDetection();
    const [isDeviceDetected, setIsDeviceDetected] = useState(false);

    // Wait for device detection to complete before rendering
    useEffect(() => {
      // Small delay to ensure device detection has completed
      const timer = setTimeout(() => {
        setIsDeviceDetected(true);
      }, 50);
      return () => clearTimeout(timer);
    }, []);

    // This allows parent components to get a ref to the actual input element
    useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);
    
    // Determine if we should use native keyboard (mobile/tablet) or virtual keyboard (desktop)
    const useNativeKeyboard = isMobile || isTablet;

    // Determine the appropriate inputMode based on input type and keyboard type
    const getInputMode = (): 'search' | 'numeric' | 'email' | 'tel' | 'text' | 'url' | 'none' | 'decimal' => {
      if (useNativeKeyboard) {
        // On mobile/tablet, enable native keyboard with appropriate mode
        if (kType === 'numeric') {
          return 'numeric';
        }
        // For full keyboard, use text mode (default)
        return 'text';
      }
      // On desktop, prevent native keyboard
      return 'none';
    };

    // This effect handles opening the keyboard automatically on mount.
    useEffect(() => {
        if (autoOpenOnMount && internalInputRef.current) {
            // A small delay ensures the UI is ready before we interact with it.
            const timer = setTimeout(() => {
                if (internalInputRef.current) {
                    // Only open virtual keyboard on desktop
                    if (isDesktop) {
                        openKeyboard(internalInputRef.current, kType);
                    }
                    internalInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoOpenOnMount, kType, openKeyboard, isDesktop]);


    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // This handler now primarily serves user-initiated focus (tapping the input).
      // Only open virtual keyboard on desktop
      if (isDesktop && internalInputRef.current) {
        openKeyboard(internalInputRef.current, kType);
      }
      if (onFocus) {
        onFocus(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onKeyPress) {
        onKeyPress(e);
      }
      // Handle the original onKeyDown if provided
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    // Don't render until device detection is complete to ensure correct inputMode
    if (!isDeviceDetected) {
      return null;
    }

    return <input ref={internalInputRef} onFocus={handleFocus} onKeyDown={handleKeyDown} inputMode={getInputMode()} type={type} {...props} />;
  }
);