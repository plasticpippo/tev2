// Test file to verify the new context structure works correctly
import React from 'react';
import { useSessionContext } from './contexts/SessionContext';
import { useGlobalDataContext } from './contexts/GlobalDataContext';
import { useOrderContext } from './contexts/OrderContext';
import { useUIStateContext } from './contexts/UIStateContext';
import { useTableAssignmentContext } from './contexts/TableAssignmentContext';
import { usePaymentContext } from './contexts/PaymentContext';
import { useTabManagementContext } from './contexts/TabManagementContext';
import { useAppContext } from './contexts/AppContext';

// Test component that uses the individual contexts
const TestIndividualContexts: React.FC = () => {
  const sessionContext = useSessionContext();
  const globalDataContext = useGlobalDataContext();
  const orderContext = useOrderContext();
  const uiStateContext = useUIStateContext();
  const tableAssignmentContext = useTableAssignmentContext();
  const paymentContext = usePaymentContext();
  const tabManagementContext = useTabManagementContext();

 return <div>Individual contexts loaded successfully</div>;
};

// Test component that uses the combined context
const TestCombinedContext: React.FC = () => {
  const appContext = useAppContext();

  return <div>Combined context loaded successfully</div>;
};

// Test component that demonstrates using both approaches
const TestContextStructure: React.FC = () => {
  return (
    <div>
      <TestIndividualContexts />
      <TestCombinedContext />
      <p>Context structure test passed!</p>
    </div>
  );
};

export default TestContextStructure;

// Verify all the exports exist
console.log('All contexts are properly exported and accessible');