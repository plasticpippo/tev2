import React from 'react';
import DataProvider from './components/DataProvider';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DataProvider />
    </ErrorBoundary>
  );
};

export default App;