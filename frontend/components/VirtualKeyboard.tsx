import React, { useState } from 'react';
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

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-800 border-t-2 border-slate-700 shadow-2xl animate-slide-up" onMouseDown={(e) => e.preventDefault()}>
            <div className="max-w-4xl mx-auto">
                {keyboardType === 'numeric' && <NumpadLayout />}
                {keyboardType === 'full' && <FullKeyboardLayout />}
            </div>
        </div>
    );
};