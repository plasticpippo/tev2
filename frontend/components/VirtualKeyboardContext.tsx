import React, { createContext, useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useDeviceDetection from '../hooks/useDeviceDetection';

type KeyboardType = 'numeric' | 'full' | null;

interface VirtualKeyboardContextType {
  isOpen: boolean;
  keyboardType: KeyboardType;
  isKeyboardEnabled: boolean;
  openKeyboard: (target: HTMLInputElement, type: KeyboardType) => void;
  closeKeyboard: () => void;
  handleKeyPress: (key: string) => void;
  handleBackspace: () => void;
  toggleKeyboard: () => void;
  setKeyboardEnabled: (enabled: boolean) => void;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardType, setKeyboardType] = useState<KeyboardType>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const { isDesktop } = useDeviceDetection();
  
  // Default to false on all devices
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false);

  // Close keyboard when it becomes disabled
  useEffect(() => {
    if (!isKeyboardEnabled && isOpen) {
      setIsOpen(false);
      setKeyboardType(null);
      activeInputRef.current?.blur();
      activeInputRef.current = null;
    }
  }, [isKeyboardEnabled, isOpen]);

  const openKeyboard = useCallback((target: HTMLInputElement, type: KeyboardType) => {
    // Only open keyboard if enabled
    if (!isKeyboardEnabled) {
      return;
    }
    activeInputRef.current = target;
    setKeyboardType(type);
    setIsOpen(true);
  }, [isKeyboardEnabled]);

  const closeKeyboard = useCallback(() => {
    activeInputRef.current?.blur();
    activeInputRef.current = null;
    setIsOpen(false);
    setKeyboardType(null);
  }, []);

  const toggleKeyboard = useCallback(() => {
    setIsKeyboardEnabled(prev => !prev);
  }, []);

  const setKeyboardEnabled = useCallback((enabled: boolean) => {
    setIsKeyboardEnabled(enabled);
  }, []);

  const dispatchInputChange = (target: HTMLInputElement, newValue: string) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(target, newValue);
      const event = new Event('input', { bubbles: true });
      target.dispatchEvent(event);
  };

  const handleKeyPress = useCallback((key: string) => {
    if (activeInputRef.current) {
      if (key === 'Enter') {
        // Trigger both keypress and keydown events for Enter key to properly handle form submission
        const keypressEvent = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true });
        const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        activeInputRef.current.dispatchEvent(keypressEvent);
        activeInputRef.current.dispatchEvent(keydownEvent);
      } else {
        const target = activeInputRef.current;
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const newValue = target.value.substring(0, start) + key + target.value.substring(end);
        
        dispatchInputChange(target, newValue);

        target.focus();
        target.selectionStart = target.selectionEnd = start + key.length;
      }
    }
  }, []);

  const handleBackspace = useCallback(() => {
    if (activeInputRef.current) {
      const target = activeInputRef.current;
      
      // Check if target is a spinbutton element (type="number" with stepper buttons)
      // Spinbuttons don't support selectionStart/selectionEnd properly
      const isSpinbutton = target.type === 'number';
      
      if (isSpinbutton) {
        // For spinbutton elements, use cursor position to delete character at cursor - 1
        // Spinbuttons don't support selectionStart/selectionEnd properly in all browsers
        // so we use a fallback approach
        const currentValue = target.value;
        const cursorPos = target.selectionStart ?? currentValue.length;
        
        if (currentValue.length > 0 && cursorPos > 0) {
          // Delete character before cursor position
          const newValue = currentValue.slice(0, cursorPos - 1) + currentValue.slice(cursorPos);
          dispatchInputChange(target, newValue);
          target.focus();
          // Restore cursor position after the deleted character
          try {
            target.setSelectionRange(cursorPos - 1, cursorPos - 1);
          } catch (e) {
            // Some input types don't support setSelectionRange, fall back to end
          }
        } else if (currentValue.length > 0) {
          // Cursor at position 0, just slice off the last character
          const newValue = currentValue.slice(0, -1);
          dispatchInputChange(target, newValue);
          target.focus();
        }
      } else {
        // Use selection-based approach for regular inputs
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        
        if (start === end && start > 0) {
          const newValue = target.value.substring(0, start - 1) + target.value.substring(end);
          dispatchInputChange(target, newValue);
          target.focus();
          target.selectionStart = target.selectionEnd = start - 1;
        } else {
          const newValue = target.value.substring(0, start) + target.value.substring(end);
          dispatchInputChange(target, newValue);
          target.focus();
          target.selectionStart = target.selectionEnd = start;
        }
      }
    }
  }, []);

  return (
    <VirtualKeyboardContext.Provider value={{ isOpen, keyboardType, isKeyboardEnabled, openKeyboard, closeKeyboard, handleKeyPress, handleBackspace, toggleKeyboard, setKeyboardEnabled }}>
      {children}
    </VirtualKeyboardContext.Provider>
  );
};

export const useVirtualKeyboard = () => {
  const context = useContext(VirtualKeyboardContext);
  const { t } = useTranslation();
  if (context === undefined) {
    throw new Error(t('common.virtualKeyboard.contextError'));
  }
  return context;
};