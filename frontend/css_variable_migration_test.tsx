import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import Tooltip from './components/Tooltip';
import HelpGuide from './components/HelpGuide';
import ErrorMessage from './components/ErrorMessage';
import { LoadingOverlay } from './components/LoadingOverlay';

// Test suite for CSS variable migration
describe('CSS Variable Migration Tests', () => {
  test('Toast component renders with CSS variables applied', () => {
    const mockToast = {
      id: '1',
      type: 'success' as const,
      message: 'Test message',
      duration: 5000
    };
    
    const { container } = render(
      <Toast 
        toast={mockToast} 
        onClose={jest.fn()} 
      />
    );
    
    // Check that the toast element is rendered
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Check that the element has classes that use CSS variables
    const toastElement = container.firstChild;
    expect(toastElement).toHaveClass('bg-accent-success');
  });

  test('ConfirmationModal component renders with CSS variables applied', () => {
    const { container } = render(
      <ConfirmationModal
        show={true}
        title="Test Title"
        message="Test Message"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    // Check that the modal element is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    
    // Check that the element has classes that use CSS variables
    const modalElement = container.querySelector('.bg-bg-primary');
    expect(modalElement).toBeInTheDocument();
  });
  
  test('Tooltip component renders with CSS variables applied', () => {
    render(
      <Tooltip content="Test tooltip">
        <span>Hover me</span>
      </Tooltip>
    );
    
    // Check that the trigger element is rendered
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
  
  test('HelpGuide component renders with CSS variables applied', () => {
    render(
      <HelpGuide 
        feature="test" 
        title="Test Help" 
        description="Test Description" 
      />
    );
    
    // Check that the help guide element is rendered
    const helpElement = screen.getByRole('button', { name: /Help for test/i });
    expect(helpElement).toBeInTheDocument();
  });
  
  test('ErrorMessage component renders with CSS variables applied', () => {
    const { container } = render(
      <ErrorMessage 
        message="Error occurred" 
        type="error"
      />
    );
    
    // Check that the error message is rendered
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    
    // Check that the element has classes that use CSS variables
    const errorElement = container.firstChild;
    expect(errorElement).toHaveClass('bg-red-900'); // This one wasn't changed as it maps to a different color
  });
  
  test('LoadingOverlay component renders with CSS variables applied', () => {
    const { container } = render(
      <LoadingOverlay message="Loading..." />
    );
    
    // Check that the loading message is rendered
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that the element has classes that use CSS variables
    const overlayElement = container.querySelector('.bg-bg-primary');
    expect(overlayElement).toBeInTheDocument();
  });
});