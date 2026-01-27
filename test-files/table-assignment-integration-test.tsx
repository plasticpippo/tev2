import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableAssignmentProvider, useTableAssignmentContext } from '../frontend/contexts/TableAssignmentContext';

// Simple test component to validate context functionality
const TestComponent = () => {
  const { assignedTable, handleTableAssign, handleTableUnassign, syncTableWithActiveTab } = useTableAssignmentContext();
  
  return (
    <div>
      <div data-testid="assigned-table">{assignedTable?.name || 'No table assigned'}</div>
      <button onClick={() => handleTableAssign('table1')}>Assign Table 1</button>
      <button onClick={() => handleTableUnassign()}>Unassign Table</button>
      <button onClick={() => syncTableWithActiveTab('table2')}>Sync with Table 2</button>
    </div>
  );
};

// Wrapper component that includes all required providers
const ContextWrapper = ({ children }: { children: React.ReactNode }) => (
  <TableAssignmentProvider>
    {children}
  </TableAssignmentProvider>
);

describe('TableAssignmentContext Integration Test', () => {
  it('should render without crashing and provide context methods', () => {
    render(
      <ContextWrapper>
        <TestComponent />
      </ContextWrapper>
    );

    // Check that the initial state shows no table assigned
    expect(screen.getByTestId('assigned-table')).toHaveTextContent('No table assigned');
    
    // Check that buttons exist
    expect(screen.getByText('Assign Table 1')).toBeInTheDocument();
    expect(screen.getByText('Unassign Table')).toBeInTheDocument();
    expect(screen.getByText('Sync with Table 2')).toBeInTheDocument();
  });
});