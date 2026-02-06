import React, { useState, useEffect, useRef } from 'react';
import { useVirtualKeyboard } from './VirtualKeyboardContext';

const Key: React.FC<{
  value: string;
  label?: string;
  onClick: (value: string) => void;
  className?: string;
}> = ({ value, label, onClick, className = '' }) => (
  <button
    type="button"
    onClick={(e) => {
        e.preventDefault();
        onClick(value);
    }}
    className={`h-14 rounded-lg shadow-md flex items-center justify-center font-semibold text-xl transition transform active:scale-95 ${className}`}
    aria-label={label || value}
  >
    {label || value}
  </button>
);

const NumpadLayout: React.FC = () => {
    const { handleKeyPress, handleBackspace, closeKeyboard } = useVirtualKeyboard();
    return (
        <div className="grid grid-cols-4 gap-2 p-2">
            <Key value="1" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="2" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="3" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <button onClick={closeKeyboard} className="bg-sky-700 hover:bg-sky-600 h-14 rounded-lg shadow-md font-semibold">Done</button>

            <Key value="4" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="5" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="6" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <button onClick={handleBackspace} className="bg-red-700 hover:bg-red-600 h-14 rounded-lg shadow-md font-semibold text-2xl row-span-2 flex items-center justify-center">⌫</button>

            <Key value="7" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="8" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="9" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />

            <Key value="Enter" label="↵" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="0" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
            <Key value="0" label="0" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500" />
        </div>
    );
};

const FullKeyboardLayout: React.FC = () => {
    const { handleKeyPress, handleBackspace, closeKeyboard } = useVirtualKeyboard();
    const [isShift, setIsShift] = useState(false);
    const [isCaps, setIsCaps] = useState(false);

    const handleKeyClick = (key: string) => {
        handleKeyPress(isShift || isCaps ? key.toUpperCase() : key.toLowerCase());
        if (isShift) {
            setIsShift(false);
        }
    };

    const toggleShift = () => setIsShift(prev => !prev);
    const toggleCaps = () => setIsCaps(prev => !prev);

    const keys = { row1: 'qwertyuiop', row2: 'asdfghjkl', row3: 'zxcvbnm' };
    const numbers = '1234567890';
    
    const applyCase = (char: string) => (isShift || isCaps ? char.toUpperCase() : char.toLowerCase());

    return (
        <div className="p-2 space-y-1.5 w-full">
            <div className="flex gap-1.5 justify-center">
                {numbers.split('').map(k => <Key key={k} value={k} onClick={handleKeyClick} className="bg-slate-600 hover:bg-slate-500 flex-1" />)}
                 <Key value="Backspace" label="⌫" onClick={handleBackspace} className="bg-red-700 hover:bg-red-600 flex-1 text-2xl" />
            </div>
            <div className="flex gap-1.5 justify-center">
                {keys.row1.split('').map(k => <Key key={k} value={applyCase(k)} onClick={() => handleKeyClick(k)} className="bg-slate-600 hover:bg-slate-500 flex-1" />)}
            </div>
            <div className="flex gap-1.5 justify-center px-4">
                {keys.row2.split('').map(k => <Key key={k} value={applyCase(k)} onClick={() => handleKeyClick(k)} className="bg-slate-600 hover:bg-slate-500 flex-1" />)}
            </div>
            <div className="flex gap-1.5 justify-center">
                <button onClick={toggleShift} className={`h-14 rounded-lg shadow-md px-6 font-semibold text-xl transition ${isShift ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}>⇧</button>
                {keys.row3.split('').map(k => <Key key={k} value={applyCase(k)} onClick={() => handleKeyClick(k)} className="bg-slate-600 hover:bg-slate-500 flex-1" />)}
                <button onClick={toggleCaps} className={`h-14 rounded-lg shadow-md px-6 font-semibold text-xl transition ${isCaps ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}>⇪</button>
            </div>
            <div className="flex gap-1.5 justify-center">
                <Key value="Enter" label="↵" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500 flex-1" />
                <Key value=" " label="Space" onClick={handleKeyPress} className="bg-slate-600 hover:bg-slate-500 flex-grow-[2]" />
                <button onClick={closeKeyboard} className="bg-sky-700 hover:bg-sky-600 h-14 rounded-lg shadow-md font-semibold px-6">Done</button>
            </div>
        </div>
    );
};


export const VirtualKeyboard: React.FC = () => {
    const { isOpen, keyboardType } = useVirtualKeyboard();
    const [keyboardPosition, setKeyboardPosition] = useState<{
        top: number;
        left: number;
        positionAbove: boolean;
    } | null>(null);
    const keyboardRef = useRef<HTMLDivElement>(null);
    const focusedInputRef = useRef<HTMLInputElement | null>(null);

    // Track the currently focused input element
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                focusedInputRef.current = target as HTMLInputElement;
                updateKeyboardPosition();
            }
        };

        const handleBlur = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                focusedInputRef.current = null;
            }
        };

        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);

        return () => {
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('focusout', handleBlur);
        };
    }, []);

    // Update keyboard position when it opens or when window resizes
    useEffect(() => {
        if (isOpen) {
            updateKeyboardPosition();
        }
    }, [isOpen]);

    // Recalculate position on window resize
    useEffect(() => {
        const handleResize = () => {
            if (isOpen) {
                updateKeyboardPosition();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    const updateKeyboardPosition = () => {
        const input = focusedInputRef.current;
        if (!input || !keyboardRef.current) return;

        const inputRect = input.getBoundingClientRect();
        const keyboardRect = keyboardRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const padding = 8; // Space between input and keyboard
        const keyboardHeight = keyboardRect.height || 300; // Default height if not measured
        const keyboardWidth = keyboardRect.width || 400; // Default width if not measured

        // Calculate vertical position
        let top: number;
        let positionAbove = false;

        // Try to position below the input first
        const spaceBelow = viewportHeight - inputRect.bottom - padding;
        const spaceAbove = inputRect.top - padding;

        if (spaceBelow >= keyboardHeight) {
            // Enough space below, position keyboard below input
            top = inputRect.bottom + padding;
            positionAbove = false;
        } else if (spaceAbove >= keyboardHeight) {
            // Not enough space below, but enough above, position keyboard above input
            top = inputRect.top - keyboardHeight - padding;
            positionAbove = true;
        } else {
            // Not enough space in either direction, position where there's more space
            if (spaceBelow > spaceAbove) {
                top = inputRect.bottom + padding;
                positionAbove = false;
            } else {
                top = inputRect.top - keyboardHeight - padding;
                positionAbove = true;
            }
        }

        // Calculate horizontal position - center the keyboard under the input
        let left = inputRect.left + (inputRect.width / 2) - (keyboardWidth / 2);

        // Ensure keyboard stays within viewport bounds horizontally
        if (left < padding) {
            left = padding;
        } else if (left + keyboardWidth > viewportWidth - padding) {
            left = viewportWidth - keyboardWidth - padding;
        }

        setKeyboardPosition({ top, left, positionAbove });
    };

    if (!isOpen) {
        return null;
    }

    const positionStyle = keyboardPosition
        ? {
            top: `${keyboardPosition.top}px`,
            left: `${keyboardPosition.left}px`,
            transform: 'none',
        }
        : {};

    return (
        <div
            ref={keyboardRef}
            className="fixed z-[100] bg-slate-800 border-2 border-slate-700 shadow-2xl animate-slide-up rounded-lg"
            style={{
                ...positionStyle,
                transition: 'top 0.2s ease-out, left 0.2s ease-out',
            }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="max-w-xs sm:max-w-4xl">
                {keyboardType === 'numeric' && <NumpadLayout />}
                {keyboardType === 'full' && <FullKeyboardLayout />}
            </div>
        </div>
    );
};