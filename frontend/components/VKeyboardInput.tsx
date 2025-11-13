import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { useVirtualKeyboard } from './VirtualKeyboardContext';

type KeyboardType = 'numeric' | 'full';

type VKeyboardInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  'k-type': KeyboardType;
  autoOpenOnMount?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} & {
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const VKeyboardInput = forwardRef<HTMLInputElement, VKeyboardInputProps>(
  ({ 'k-type': kType, onFocus, onKeyPress, autoOpenOnMount, ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null);
    const { openKeyboard } = useVirtualKeyboard();

    // This allows parent components to get a ref to the actual input element
    useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);
    
    // This effect handles opening the keyboard automatically on mount.
    useEffect(() => {
        if (autoOpenOnMount && internalInputRef.current) {
            // A small delay ensures the UI is ready before we interact with it.
            const timer = setTimeout(() => {
                if (internalInputRef.current) {
                    // Directly open the keyboard AND focus the input for the cursor.
                    openKeyboard(internalInputRef.current, kType);
                    internalInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoOpenOnMount, kType, openKeyboard]);


    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // This handler now primarily serves user-initiated focus (tapping the input).
      if (internalInputRef.current) {
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

    return <input ref={internalInputRef} onFocus={handleFocus} onKeyDown={handleKeyDown} inputMode="none" {...props} />;
  }
);