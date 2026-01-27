import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const { key, ctrl, shift, alt, callback } = shortcut;
      
      // Check if the pressed key matches the shortcut key
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase() || 
                        event.code.toLowerCase() === `key${key}`.toLowerCase() ||
                        event.code.toLowerCase() === `${key}`.toLowerCase();
      
      // Check modifier keys
      const isCtrlMatch = (ctrl && event.ctrlKey) || (!ctrl && !event.ctrlKey);
      const isShiftMatch = (shift && event.shiftKey) || (!shift && !event.shiftKey);
      const isAltMatch = (alt && event.altKey) || (!alt && !event.altKey);
      
      if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch) {
        event.preventDefault();
        callback();
        return; // Stop processing other shortcuts once one is matched
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  return null;
};