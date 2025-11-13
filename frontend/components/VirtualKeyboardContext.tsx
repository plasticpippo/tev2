import React, { createContext, useState, useContext, useRef, useCallback } from 'react';

type KeyboardType = 'numeric' | 'full' | null;

interface VirtualKeyboardContextType {
  isOpen: boolean;
  keyboardType: KeyboardType;
  openKeyboard: (target: HTMLInputElement, type: KeyboardType) => void;
  closeKeyboard: () => void;
  handleKeyPress: (key: string) => void;
  handleBackspace: () => void;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardType, setKeyboardType] = useState<KeyboardType>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  const openKeyboard = useCallback((target: HTMLInputElement, type: KeyboardType) => {
    activeInputRef.current = target;
    setKeyboardType(type);
    setIsOpen(true);
  }, []);

  const closeKeyboard = useCallback(() => {
    activeInputRef.current?.blur();
    activeInputRef.current = null;
    setIsOpen(false);
    setKeyboardType(null);
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
  }, []);

  return (
    <VirtualKeyboardContext.Provider value={{ isOpen, keyboardType, openKeyboard, closeKeyboard, handleKeyPress, handleBackspace }}>
      {children}
    </VirtualKeyboardContext.Provider>
  );
};

export const useVirtualKeyboard = () => {
  const context = useContext(VirtualKeyboardContext);
  if (context === undefined) {
    throw new Error('useVirtualKeyboard must be used within a VirtualKeyboardProvider');
  }
  return context;
};