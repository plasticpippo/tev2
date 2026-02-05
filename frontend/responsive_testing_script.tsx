import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PaymentModal } from './components/PaymentModal';
import { TableAssignmentModal } from './components/TableAssignmentModal';
import ConfirmationModal from './components/ConfirmationModal';

// Mock data for testing
const mockOrderItems = [
  { id: '1', name: 'Coffee', price: 2.50, quantity: 1, effectiveTaxRate: 0.1, variantId: 1, productId: 1 },
  { id: '2', name: 'Sandwich', price: 8.00, quantity: 1, effectiveTaxRate: 0.1, variantId: 2, productId: 2 }
];

const mockTaxSettings = {
  mode: 'exclusive' as const,
  defaultRate: 0.1,
  reducedRate: 0.05
};

const mockTables = [
  {
    id: '1',
    name: 'Table 1',
    status: 'available' as const,
    roomId: 'room1',
    x: 100,
    y: 100,
    width: 64,
    height: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tables: [] },
    tabs: []
  },
  {
    id: '2',
    name: 'Table 2',
    status: 'occupied' as const,
    roomId: 'room1',
    x: 200,
    y: 100,
    width: 64,
    height: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tables: [] },
    tabs: []
  },
  {
    id: '3',
    name: 'Table 3',
    status: 'reserved' as const,
    roomId: 'room2',
    x: 100,
    y: 200,
    width: 64,
    height: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: { id: 'room2', name: 'Bar Area', description: 'Bar and lounge area', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tables: [] },
    tabs: []
  }
];

const mockRooms = [
  {
    id: 'room1',
    name: 'Main Dining',
    description: 'Main dining area',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tables: []
  },
  {
    id: 'room2',
    name: 'Bar Area',
    description: 'Bar and lounge area',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tables: []
  }
];

// Responsive testing component
const ResponsiveTestingApp = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update window size on resize
  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleConfirmPayment = (method: string, tip: number) => {
    console.log('Payment confirmed:', method, tip);
    closeModal();
  };

  const handleTableAssign = (tableId: string) => {
    console.log('Table assigned:', tableId);
    return Promise.resolve();
  };

  const handleConfirm = () => {
    console.log('Confirmed');
    closeModal();
  };

  const handleCancel = () => {
    console.log('Cancelled');
    closeModal();
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6 text-amber-400">Responsive Testing Suite</h1>
      
      <div className="mb-4 p-4 bg-slate-800 rounded-lg">
        <p className="text-lg">Current Window Size: {windowSize.width} x {windowSize.height}</p>
        <p className="text-sm text-slate-400">Resize your browser to test responsive behavior</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          className="bg-amber-600 hover:bg-amber-500 text-white py-3 px-4 rounded-md font-semibold transition"
          onClick={() => openModal('payment')}
        >
          Test Payment Modal
        </button>
        
        <button 
          className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-md font-semibold transition"
          onClick={() => openModal('table')}
        >
          Test Table Assignment Modal
        </button>
        
        <button 
          className="bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-md font-semibold transition"
          onClick={() => openModal('confirmation')}
        >
          Test Confirmation Modal
        </button>
      </div>

      {/* Button Class Testing Section */}
      <div className="mt-8 p-6 bg-slate-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-amber-400">Button Class Testing</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button className="btn">Base Btn</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-danger">Danger</button>
          <button className="btn btn-sm">Small</button>
          <button className="btn btn-lg">Large</button>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal 
        isOpen={activeModal === 'payment'} 
        onClose={closeModal} 
        orderItems={mockOrderItems} 
        taxSettings={mockTaxSettings} 
        onConfirmPayment={handleConfirmPayment}
        assignedTable={{ name: 'Test Table' }}
      />

      <TableAssignmentModal 
        isOpen={activeModal === 'table'} 
        onClose={closeModal} 
        tables={mockTables} 
        rooms={mockRooms} 
        onTableAssign={handleTableAssign}
      />

      <ConfirmationModal 
        show={activeModal === 'confirmation'} 
        title="Test Confirmation" 
        message="This is a test confirmation modal to verify responsive behavior." 
        onConfirm={handleConfirm} 
        onCancel={handleCancel}
        confirmText="Confirm Test"
        cancelText="Cancel Test"
      />
    </div>
  );
};

// Render the testing app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<ResponsiveTestingApp />);