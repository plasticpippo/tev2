import React from 'react';
import { AppProvider } from './contexts/AppProvider';
import { VirtualKeyboardProvider } from './components/VirtualKeyboardContext';
import { LoginScreen } from './LoginScreen';
import { MainPOSInterface } from './components/MainPOSInterface';
import { useAppContext } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
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
      <VirtualKeyboardProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </VirtualKeyboardProvider>
    </ErrorBoundary>
  );
}

export default App;