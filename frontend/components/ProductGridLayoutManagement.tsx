import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { ProductGridLayoutList } from './ProductGridLayoutList';
import { CreateLayoutModal } from './CreateLayoutModal';
import { EditLayoutModal } from './EditLayoutModal';
import { CopyLayoutModal } from './CopyLayoutModal';
import { useLayoutManagement, LayoutWithTillInfo } from './useLayoutManagement';

// Define the Till and Category interfaces locally since @shared/types is not available
interface Till {
  id: number;
  name: string;
  // Add other properties as needed
}

interface Category {
  id: number;
  name: string;
  // Add other properties as needed
}

interface ProductGridLayoutManagementProps {
  tills: Till[];
  categories: Category[];
  onDataUpdate: () => void;
}

export const ProductGridLayoutManagement: React.FC<ProductGridLayoutManagementProps> = ({ tills, categories, onDataUpdate }) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingLayout, setEditingLayout] = useState<any | null>(null);
  const [layoutToCopy, setLayoutToCopy] = useState<any | null>(null);
  const [deletingLayout, setDeletingLayout] = useState<any | null>(null);
  
  const {
    layouts,
    loading,
    error,
    deletingLayoutId,
    updatingLayoutId,
    creatingLayout,
    filterTillId,
    filterType,
    searchTerm,
    setFilterTillId,
    setFilterType,
    setSearchTerm,
    loadLayouts,
    handleDeleteLayout,
    handleSetAsDefault,
    handleSaveLayout,
    handleCreateNewLayout: handleCreateNewLayoutFromHook, // Renamed to avoid conflict
    getCategoryName
  } = useLayoutManagement(tills, categories, onDataUpdate);

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleEditLayout = (layout: any) => {
    setEditingLayout(layout);
  };

  const handleCopyLayout = (layout: any) => {
    setLayoutToCopy(layout);
  };

  const handleConfirmDelete = async () => {
    if (deletingLayout) {
      await handleDeleteLayout(deletingLayout);
      setDeletingLayout(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Product Grid Layout Management</h2>
        
        <div className="flex items-end">
          <button
            onClick={handleShowCreateModal}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md text-sm"
          >
            Create New Layout
          </button>
        </div>
      </div>
      
      {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <ProductGridLayoutList
          tills={tills}
          categories={categories}
          onDataUpdate={onDataUpdate}
          onEditLayout={handleEditLayout}
          onDeleteLayout={(layout) => setDeletingLayout(layout)}
          onSetAsDefault={handleSetAsDefault}
          onCopyLayout={handleCopyLayout}
        />
      
      {/* Create Layout Modal */}
      <CreateLayoutModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tills={tills}
        onCreate={handleCreateNewLayoutFromHook}
        onDataUpdate={onDataUpdate}
      />
      
      {/* Edit Layout Modal */}
      <EditLayoutModal
        show={!!editingLayout}
        layout={editingLayout}
        onClose={() => setEditingLayout(null)}
        onSave={(updatedLayout) => {
          handleSaveLayout(updatedLayout);
          setEditingLayout(null);
        }}
        categories={categories}
      />
      
      {/* Copy Layout Modal */}
      <CopyLayoutModal
        show={!!layoutToCopy}
        layout={layoutToCopy}
        tills={tills}
        onClose={() => setLayoutToCopy(null)}
        onCopy={(newLayout) => {
          // Refresh the layout list after copying
          loadLayouts();
          setLayoutToCopy(null);
        }}
        onDataUpdate={onDataUpdate}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={!!deletingLayout}
        title="Confirm Delete"
        message={`Are you sure you want to delete the layout "${deletingLayout?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLayout(null)}
      />
    </div>
  );
};
