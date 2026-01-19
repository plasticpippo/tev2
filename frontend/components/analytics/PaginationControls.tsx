import React from 'react';

interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationControlsProps {
  metadata: PaginationMetadata;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  currentLimit?: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  metadata,
  onPageChange,
  onLimitChange,
  currentLimit = 10
}) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage } = metadata;

  const handlePrevious = () => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Show ellipsis if we skip pages at the beginning
      if (currentPage > 3) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Show ellipsis if we skip pages at the end
      if (currentPage < totalPages - 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pt-4">
      <div className="mb-4 sm:mb-0">
        <span className="text-sm text-slate-400">
          Showing {(currentPage - 1) * currentLimit + 1}-{Math.min(currentPage * currentLimit, metadata.totalCount)} of {metadata.totalCount} results
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Limit selection */}
        {onLimitChange && (
          <div className="mr-4">
            <select
              value={currentLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
        
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={!hasPrevPage}
          className={`px-3 py-1 rounded-md text-sm ${
            hasPrevPage
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Previous
        </button>
        
        {/* Page numbers */}
        <div className="flex space-x-1 mx-2">
          {pageNumbers.map((pageNum, index) => (
            <button
              key={index}
              onClick={() => pageNum !== -1 && handlePageSelect(pageNum)}
              className={`px-2 py-1 rounded-md text-sm min-w-[32px] ${
                pageNum === -1
                  ? 'text-slate-500 cursor-default'
                  : pageNum === currentPage
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {pageNum === -1 ? '...' : pageNum}
            </button>
          ))}
        </div>
        
        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!hasNextPage}
          className={`px-3 py-1 rounded-md text-sm ${
            hasNextPage
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};