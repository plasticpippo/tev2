import React from 'react';
import { useToast } from '../contexts/ToastContext';

const TestToastComponent: React.FC = () => {
  const { addToast } = useToast();

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    addToast(message, type);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3">Test Toast Notifications</h3>
      <div className="space-y-2">
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
          onClick={() => showToast('success', 'This is a success message!')}
        >
          Success Toast
        </button>
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
          onClick={() => showToast('error', 'This is an error message!')}
        >
          Error Toast
        </button>
        <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
          onClick={() => showToast('warning', 'This is a warning message!')}
        >
          Warning Toast
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => showToast('info', 'This is an info message!')}
        >
          Info Toast
        </button>
      </div>
    </div>
  );
};

export default TestToastComponent;