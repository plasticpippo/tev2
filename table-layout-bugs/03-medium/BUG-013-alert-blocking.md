# BUG-013: Synchronous Alert Dialogs Block UI Thread

## Severity Level
**MEDIUM**

## File Location
- `frontend/components/LayoutEditor.tsx` (lines 200-250)
- `frontend/services/gridLayoutService.ts` (lines 45-80)
- `frontend/hooks/useLayoutActions.ts` (lines 30-60)

## Description

The application uses native `alert()` and `confirm()` dialogs for error handling and user confirmations. These synchronous dialogs block the main UI thread, preventing users from interacting with the application and creating a poor user experience. They also break automated testing and can cause issues with browser security policies.

## Current Vulnerable Code

```tsx
// frontend/components/LayoutEditor.tsx - Line 200-250
const handleSave = async () => {
  try {
    await saveLayout(layoutData);
    // BUG: Native alert blocks UI thread
    alert('Layout saved successfully!');
  } catch (error) {
    // BUG: Another blocking alert
    alert('Error saving layout: ' + error.message);
  }
};

const handleDelete = async () => {
  // BUG: confirm() blocks the entire page
  if (confirm('Are you sure you want to delete this layout?')) {
    await deleteLayout(layoutId);
    alert('Layout deleted!');
  }
};

const handleUnsavedChanges = () => {
  // BUG: Blocking dialog prevents navigation
  const shouldLeave = confirm(
    'You have unsaved changes. Are you sure you want to leave?'
  );
  return shouldLeave;
};
```

```typescript
// frontend/services/gridLayoutService.ts - Line 45-80
export const validateLayout = (layout: Layout): boolean => {
  if (layout.items.length === 0) {
    // BUG: Service layer should not use alert
    alert('Layout must have at least one item');
    return false;
  }
  
  if (layout.name.trim() === '') {
    alert('Layout name is required');
    return false;
  }
  
  return true;
};

export const saveGridLayout = async (layout: Layout) => {
  try {
    const response = await api.post('/layouts', layout);
    alert('Layout saved!'); // BUG: Service should not handle UI
    return response.data;
  } catch (error) {
    alert('Failed to save: ' + error.message); // BUG: Wrong layer
    throw error;
  }
};
```

```typescript
// frontend/hooks/useLayoutActions.ts - Line 30-60
export const useLayoutActions = () => {
  const duplicateLayout = async (layoutId: string) => {
    const newName = prompt('Enter name for duplicated layout:'); // BUG: Blocks thread
    
    if (!newName) {
      alert('Duplication cancelled'); // BUG: Unnecessary blocking
      return;
    }
    
    await api.post(`/layouts/${layoutId}/duplicate`, { name: newName });
    alert('Layout duplicated successfully!'); // BUG: Blocking success message
  };
  
  return { duplicateLayout };
};
```

## User Experience Issues

```javascript
// Problems caused by native dialogs:

// 1. Modal blocking - User cannot interact with page at all
// 2. Styling inconsistency - Uses browser default styling
// 3. No rich content - Cannot display formatted error details
// 4. Accessibility issues - Poor screen reader support
// 5. Testing problems - Hard to automate in e2e tests
// 6. Mobile issues - Poor touch experience
// 7. z-index problems - Can appear behind modals in some browsers
```

## Root Cause Analysis

1. **Quick Development Path**: Native dialogs are easy to implement
2. **No Design System**: Missing standardized modal/toast components
3. **Layer Confusion**: UI logic in service layer
4. **Legacy Code**: Pre-dates modern UI component libraries
5. **No UX Guidelines**: No standards for user feedback

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Poor UX | HIGH | Disruptive user experience |
| Accessibility | MEDIUM | Poor screen reader support |
| Testing | MEDIUM | Blocks automated tests |
| Mobile | MEDIUM | Poor mobile experience |
| Consistency | LOW | Mismatched with app design |

## Suggested Fix

### Option 1: Custom Modal Components (Recommended)

```tsx
// frontend/components/ui/Modal/Modal.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import './Modal.css';

interface ModalOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);
  
  const showModal = useCallback((options: ModalOptions) => {
    setModal(options);
  }, []);
  
  const hideModal = useCallback(() => {
    setModal(null);
  }, []);
  
  const handleConfirm = () => {
    modal?.onConfirm?.();
    hideModal();
  };
  
  const handleCancel = () => {
    modal?.onCancel?.();
    hideModal();
  };
  
  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header modal-header--${modal.type}`}>
              <h3>{modal.title}</h3>
              <button className="modal-close" onClick={handleCancel}>×</button>
            </div>
            <div className="modal-body">
              {modal.message}
            </div>
            <div className="modal-footer">
              {modal.type === 'confirm' && (
                <button className="btn btn-secondary" onClick={handleCancel}>
                  {modal.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                className={`btn btn-${modal.type === 'error' ? 'danger' : 'primary'}`}
                onClick={handleConfirm}
              >
                {modal.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
```

```tsx
// frontend/components/ui/Toast/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((
    message: string, 
    type: Toast['type'] = 'info',
    duration = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => hideToast(id), duration);
    }
  }, []);
  
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast--${toast.type}`}
            role="alert"
          >
            <span className="toast-message">{toast.message}</span>
            <button 
              className="toast-close"
              onClick={() => hideToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
```

```tsx
// frontend/components/LayoutEditor.tsx - Fixed
import { useModal } from '../components/ui/Modal/Modal';
import { useToast } from '../components/ui/Toast/Toast';

export const LayoutEditor: React.FC = () => {
  const { showModal } = useModal();
  const { showToast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const handleSave = async () => {
    try {
      await saveLayout(layoutData);
      // Non-blocking success notification
      showToast('Layout saved successfully!', 'success');
      setHasUnsavedChanges(false);
    } catch (error) {
      // Non-blocking error with rich content
      showModal({
        title: 'Save Failed',
        message: (
          <div>
            <p>Unable to save your layout:</p>
            <pre className="error-details">{error.message}</pre>
            <p>Please try again or contact support if the problem persists.</p>
          </div>
        ),
        type: 'error',
        confirmText: 'OK',
      });
    }
  };
  
  const handleDelete = async () => {
    showModal({
      title: 'Delete Layout',
      message: (
        <div>
          <p>Are you sure you want to delete <strong>{layoutData.name}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
      ),
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteLayout(layoutId);
          showToast('Layout deleted successfully', 'success');
          navigate('/layouts');
        } catch (error) {
          showToast('Failed to delete layout', 'error');
        }
      },
    });
  };
  
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  }, [hasUnsavedChanges]);
  
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
  
  return (
    // ... component JSX
  );
};
```

### Option 2: Use Existing UI Library

```bash
npm install @radix-ui/react-dialog @radix-ui/react-toast
# or
npm install @headlessui/react
# or
npm install react-hot-toast
```

```tsx
// Using react-hot-toast
import toast, { Toaster } from 'react-hot-toast';

// Simple toast notifications
toast.success('Layout saved!');
toast.error('Failed to save layout');
toast.loading('Saving...', { duration: 2000 });

// With promise
toast.promise(
  saveLayout(layoutData),
  {
    loading: 'Saving layout...',
    success: 'Layout saved successfully!',
    error: 'Failed to save layout',
  }
);
```

### Option 3: Create a Dialog Hook with Promise API

```typescript
// frontend/hooks/useConfirmDialog.ts
import { useModal } from '../components/ui/Modal/Modal';

export const useConfirmDialog = () => {
  const { showModal, hideModal } = useModal();
  
  const confirm = (options: {
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      showModal({
        title: options.title,
        message: options.message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };
  
  return { confirm };
};
```

```tsx
// Usage
const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const shouldDelete = await confirm({
    title: 'Delete Layout',
    message: 'Are you sure you want to delete this layout? This cannot be undone.',
    type: 'danger',
    confirmText: 'Delete',
  });
  
  if (shouldDelete) {
    await deleteLayout(layoutId);
  }
};
```

## Testing Strategy

```typescript
// modal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalProvider, useModal } from './Modal';

describe('Modal Component', () => {
  it('should display modal with correct content', () => {
    const TestComponent = () => {
      const { showModal } = useModal();
      return (
        <button onClick={() => showModal({ title: 'Test', message: 'Message' })}>
          Show
        </button>
      );
    };
    
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );
    
    fireEvent.click(screen.getByText('Show'));
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
  
  it('should call onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    // ... test implementation
  });
  
  it('should be accessible with keyboard navigation', () => {
    // Test ESC key closes modal
    // Test Tab cycles through focusable elements
    // Test Enter activates focused button
  });
});

// toast.test.tsx
describe('Toast Component', () => {
  it('should auto-dismiss after duration', () => {
    jest.useFakeTimers();
    // ... test implementation
    jest.advanceTimersByTime(3000);
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
  
  it('should stack multiple toasts', () => {
    // ... test implementation
  });
});
```

## CSS Styling

```css
/* Modal.css */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header--error {
  background: #fef2f2;
  color: #dc2626;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* Toast.css */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  min-width: 300px;
  animation: slideInRight 0.3s ease;
}

.toast--success {
  background: #dcfce7;
  color: #166534;
  border-left: 4px solid #22c55e;
}

.toast--error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create Modal component | 1.5 hours |
| Create Toast component | 1 hour |
| Replace all alert() calls | 1 hour |
| Replace all confirm() calls | 1 hour |
| Styling and polish | 1 hour |
| Testing | 1 hour |
| **Total** | **6.5 hours** |

## Related Issues

- [BUG-015: Verbose Error Messages](./../04-low/BUG-015-verbose-errors.md)
- [Frontend UI Guidelines](../../docs/frontend-ui-guidelines.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
