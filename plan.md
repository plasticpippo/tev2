# Product Grid Layout Enhancement Plan

## Objective
Implement the following features:
1. Create a layout for every single category (including favourites and "all")
2. Enable applying saved layouts to different tills
3. Enable renaming layouts with full CRUD functionality

## Current State Analysis
- The system already supports filter types: 'all', 'favorites', 'category'
- Each filter type can have its own layout
- Layouts are currently tied to specific tills
- Basic CRUD functionality exists but needs enhancement
- A frontend function `getSharedLayouts()` exists but no backend endpoint

## Subtasks for Implementation

### Subtask 1: Enhance Database Schema for Shared Layouts
- [ ] Add a `shared` boolean field to the `product_grid_layouts` table
- [ ] Consider creating a separate approach for truly shared layouts

### Subtask 2: Implement Backend Endpoints for Shared Layouts
- [ ] Create GET /api/grid-layouts/shared endpoint
- [ ] Implement logic to handle truly shared layouts (not tied to specific tills)
- [ ] Update existing endpoints to properly handle shared layouts

### Subtask 3: Enhance Layout Management Interface
- [ ] Improve the ProductGridLayoutManagement component with better CRUD operations
- [ ] Add proper rename functionality
- [ ] Enhance the UI for managing layouts per category/filter type

### Subtask 4: Implement Layout Assignment Across Tills
- [ ] Create endpoint to apply a layout to a different till
- [ ] Update the copy functionality to work more like assignment
- [ ] Add UI controls for applying shared layouts to specific tills

### Subtask 5: Update Frontend Components
- [ ] Update ProductGrid component to properly handle category-specific layouts
- [ ] Enhance LayoutSelectionDropdown to show shared layouts
- [ ] Update ProductGridLayoutCustomizer with better management features

### Subtask 6: Testing
- [ ] Create tests for the new shared layouts functionality
- [ ] Test layout assignment across tills
- [ ] Verify CRUD operations work properly
- [ ] Ensure category-specific layouts work correctly

## Implementation Approach
Each subtask will be implemented in small, manageable chunks to keep token usage low and ensure proper testing at each step.