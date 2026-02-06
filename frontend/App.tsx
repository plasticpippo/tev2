import React from 'react';
import { AppProvider } from './contexts/AppProvider';
import { VirtualKeyboardProvider } from './components/VirtualKeyboardContext';
import { LoginScreen } from './LoginScreen';
import { MainPOSInterface } from './components/MainPOSInterface';
import { useAppContext } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import VirtualKeyboardToggle from './components/VirtualKeyboardToggle';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import './src/index.css';

const AppContent: React.FC = () => {
  const { currentUser, assignedTillId, currentTillName, handleLogin } = useAppContext();

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} assignedTillId={assignedTillId} currentTillName={currentTillName} />;
  }

  return <MainPOSInterface />;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <VirtualKeyboardProvider>
          <AppProvider>
            <AppContent />
            <ToastContainer />
          </AppProvider>
          <VirtualKeyboardToggle />
          <VirtualKeyboard />
        </VirtualKeyboardProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;