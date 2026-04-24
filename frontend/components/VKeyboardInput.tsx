import React, { forwardRef, useRef, useImperativeHandle, useEffect, useCallback } from 'react';
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
  ({ 'k-type': kType, onFocus, onKeyPress, autoOpenOnMount, type = 'text', className, ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null);
    const { openKeyboard } = useVirtualKeyboard();
    const { isMobile, isTablet, isDesktop } = useDeviceDetection();

    // This allows parent components to get a ref to the actual input element
    useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

    // Determine if we should use native keyboard (mobile/tablet) or virtual keyboard (desktop)
    const useNativeKeyboard = isMobile || isTablet;

    // Determine the appropriate input type based on input type and keyboard type
    const getInputType = (): string => {
      if (useNativeKeyboard) {
        // On mobile/tablet, use native keyboard with appropriate type
        if (kType === 'numeric') {
          return 'number';
        }
        // For full keyboard, use text mode (default)
        return 'text';
      }
      // On desktop, prevent native keyboard
      return 'text';
    };

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
            // Focus the input to trigger native keyboard on mobile/tablet
            internalInputRef.current.focus();
            // Only open virtual keyboard on desktop
            if (isDesktop) {
                openKeyboard(internalInputRef.current, kType);
            }
        }
    }, [autoOpenOnMount, kType, openKeyboard, isDesktop]);

    // Handle touch events to ensure native keyboard triggers on mobile/tablet
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
      if (useNativeKeyboard && internalInputRef.current) {
        internalInputRef.current.focus();
      }
    }, [useNativeKeyboard]);


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

    const combinedClassName = `touch-manipulation ${className || ''}`;

    return (
      <input
        ref={internalInputRef}
        className={combinedClassName}
        type={getInputType()}
        inputMode={getInputMode()}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        {...props}
      />
    );
  }
);