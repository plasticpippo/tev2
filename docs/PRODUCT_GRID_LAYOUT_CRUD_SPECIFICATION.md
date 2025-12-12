# Product Grid Layout CRUD Operations - Technical Specification

## Overview

This document outlines the technical requirements and implementation plan for enhancing the `ProductGridLayoutCustomizer.tsx` component to support full CRUD (Create, Read, Update, Delete) operations for entire layouts, not just grid items. The current implementation only supports creating and saving layouts, but lacks comprehensive management capabilities.

## Current State Analysis

### ProductGridLayoutCustomizer.tsx
- Currently supports creating new layouts and saving them
- Supports setting layouts as default
- Does not support:
  - Loading existing layouts for editing
  - Deleting layouts
  - Managing multiple layouts
  - Updating existing layout metadata (name, filter type, etc.)

### Backend (gridLayout.ts)
- Full CRUD operations are already implemented at the API level:
  - GET `/api/tills/:tillId/grid-layouts` - Get all layouts for a till
  - POST `/api/tills/:tillId/grid-layouts` - Create a new layout
 - GET `/api/grid-layouts/:layoutId` - Get specific layout
  - PUT `/api/grid-layouts/:layoutId` - Update a layout
  - DELETE `/api/grid-layouts/:layoutId` - Delete a layout
  - PUT `/api/grid-layouts/:layoutId/set-default` - Set as default

### Frontend Service (gridLayoutService.ts)
- Service functions are already available for all CRUD operations:
  - `saveGridLayout` (POST/PUT)
  - `getGridLayoutsForTill` (GET)
  - `getLayoutById` (GET)
  - `deleteGridLayout` (DELETE)
  - `setLayoutAsDefault` (PUT)

## Requirements

### Functional Requirements

#### 1. Create Operation
- Allow users to create new empty layouts
- Allow users to create new layouts based on existing ones (copy functionality)
- Support layout metadata: name, till assignment, filter type, category ID, default status

#### 2. Read Operation
- Load existing layouts for a specific till
- Display list of available layouts with filtering options
- Allow users to select and load an existing layout for editing

#### 3. Update Operation
- Allow editing of layout metadata (name, filter type, category, default status)
- Allow modification of grid items within the layout
- Support saving changes to existing layouts

#### 4. Delete Operation
- Allow deletion of layouts with confirmation
- Prevent deletion of the only layout for a till
- Prevent deletion of default layout if it's the only one for the filter type

### Non-Functional Requirements

#### 1. User Experience
- Maintain existing drag-and-drop grid editing functionality
- Provide clear visual feedback during operations
- Implement proper loading states
- Show error messages when operations fail

#### 2. Data Integrity
- Prevent deletion of default layouts when they are the only layout for a filter type
- Maintain proper default layout assignments when updating/deleting
- Validate layout names to prevent duplicates

#### 3. Performance
- Efficiently load and display layout lists
- Optimize grid rendering for layouts with many items

## Implementation Plan

### Phase 1: UI/UX Enhancements

#### 1.1 Layout Selection Panel
Add a new panel to the `ProductGridLayoutCustomizer.tsx` component that allows:
- Displaying a list of existing layouts for the current till
- Filtering layouts by type (all, favorites, category)
- Searching layouts by name
- Loading existing layouts into the editor
- Creating new layouts from scratch

#### 1.2 Enhanced Layout Management
- Add a dropdown/list of existing layouts above the current layout settings
- Implement "Load Layout" functionality
- Add "Save As New" functionality to create a copy with a new name
- Add "Delete Current Layout" functionality with confirmation

### Phase 2: Data Management

#### 2.1 State Management
Enhance the component state to handle:
- List of available layouts
- Currently selected layout ID
- Layout loading status
- Error states

#### 2.2 Service Integration
- Implement calls to existing service functions
- Add proper error handling
- Implement loading states

### Phase 3: Feature Implementation

#### 3.1 Layout Loading
```typescript
// Pseudo-code for loading a layout
const loadLayout = async (layoutId: string | number) => {
  setLoading(true);
  try {
    const layout = await getLayoutById(layoutId.toString());
    // Update component state with layout data
    setLayoutName(layout.name);
    setSelectedTill(layout.tillId);
    setIsDefault(layout.isDefault);
    setActiveFilterType(layout.filterType || 'all');
    setActiveCategoryId(layout.categoryId);
    // Parse and set grid items
    setGridItems(parseGridItems(layout.layout.gridItems));
  } catch (error) {
    setError('Failed to load layout: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

#### 3.2 Layout Deletion
```typescript
// Pseudo-code for deleting a layout
const handleDeleteLayout = async (layoutId: string | number) => {
  try {
    await deleteGridLayout(layoutId.toString());
    // Remove from local list and reload layouts
    loadLayoutsForTill(selectedTill);
    // If current layout was deleted, load a different one or reset
    if (currentLayoutId === layoutId) {
      resetLayout();
    }
  } catch (error) {
    setError('Failed to delete layout: ' + error.message);
  }
};
```

#### 3.3 Layout Saving
- Enhance existing `handleSaveLayout` to handle updates to existing layouts
- Add "Save As New" functionality for creating copies

## UI/UX Design

### Layout Management Panel
```
┌─────────────────────────────────────────────────┐
│ Product Grid Layout Customizer                          │
├─────────────────────────────────────────────────┤
│ Layout Settings    │ Available Layouts                  │
│ ┌────────────────┐ │ ┌────────────────────────────────┐ │
│ │Layout Name:    │ │ │ Filter: [All ▼]                │ │
│ │[New Layout   ] │ │ │ Search: [___________________]   │ │
│ │                │ │ │                                │ │
│ │Select Till:    │ │ │ ● [Default Layout] (All)       │ │
│ │[Till 1 ▼]      │ │ │   Set as default | Edit | Del  │ │
│ │                │ │ ● [Favorites Grid] (Favorites) │ │
│ │[ ] Set default │ │ │   Set as default | Edit | Del  │ │
│ │                │ │ │ ● [Beverages] (Category: 2)    │ │
│ │[Save Layout]   │ │ │   Set as default | Edit | Del  │ │
│ │[Cancel]        │ │ │                                │ │
│ │[Clear Grid]    │ │ │ [+ Create New Layout]          │ │
│ └────────────────┘ │ └────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Available Products                                      │
│ [Product 1] [Product 2] [Product 3] ...                 │
├─────────────────────────────────────────────────┤
│ Grid Layout (drag and drop area)                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Product 1]  [Product 2]                            │ │
│ │ [Product 3]                    [Product 4]          │ │
│ │                                                   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Enhanced Layout Operations

#### 1. Layout List View
- Show layout name, type, category (if applicable), default status
- Icons to set as default, edit, delete
- Visual indicators for default layouts

#### 2. Confirmation Modals
- Confirm deletion with layout name
- Warn when deleting default layouts

#### 3. Loading States
- Show loading spinner when fetching layouts
- Disable controls during operations
- Show success/error messages

## Data Structures

### Extended Component State
```typescript
interface ProductGridLayoutCustomizerState {
  // Existing state...
  gridItems: GridItem[];
  selectedTill: number | null;
  layoutName: string;
  isDefault: boolean;
  // ... other existing state
  
  // New state for CRUD operations
  availableLayouts: ProductGridLayoutData[];
  loadingLayouts: boolean;
  loadingCurrentLayout: boolean;
 error: string | null;
  currentLayoutId: string | number | null; // null for new layout
  filterType: FilterType;
  searchQuery: string;
}
```

### Layout Data Interface
The existing `ProductGridLayoutData` interface is sufficient:
```typescript
export interface ProductGridLayoutData {
  id?: string | number;
 name: string;
 tillId: number;
  layout: ProductGridLayout;
  isDefault: boolean;
 filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
}
```

## API Integration

### Service Functions to Use
- `getGridLayoutsForTill(tillId)` - Load all layouts for a till
- `getLayoutById(layoutId)` - Load specific layout
- `saveGridLayout(layoutData)` - Create/update layout
- `deleteGridLayout(layoutId)` - Delete layout
- `setLayoutAsDefault(layoutId)` - Set as default

### Error Handling
- Handle 404 errors when layout doesn't exist
- Handle 400 errors for validation issues
- Handle 500 errors for server issues
- Provide user-friendly error messages

## Implementation Steps

### Step 1: Enhance Component State Management
- Add state variables for layout management
- Implement loading and error states
- Add functions to manage state updates

### Step 2: Implement Layout Loading
- Add function to fetch layouts for current till
- Implement layout selection mechanism
- Add loading state for individual layouts

### Step 3: Add Layout Management UI
- Create layout list panel
- Add filtering and search functionality
- Implement layout action buttons (edit, delete, set default)

### Step 4: Enhance Save Functionality
- Modify existing save to handle updates vs creates
- Add "Save As New" functionality
- Implement proper ID handling

### Step 5: Add Delete Functionality
- Implement delete with confirmation
- Add proper error handling
- Update local state after deletion

### Step 6: Testing
- Test all CRUD operations
- Test edge cases (deleting default, only layout, etc.)
- Test with different filter types
- Test with multiple tills

## Security Considerations

- Validate user permissions for layout operations
- Ensure users can only modify layouts for their assigned tills
- Implement proper authentication checks in API endpoints

## Performance Considerations

- Implement pagination for large numbers of layouts
- Optimize grid rendering for layouts with many items
- Use virtualization if needed for layout lists

## Migration Strategy

- The enhancements will be backward compatible
- Existing functionality will remain unchanged
- New features will be added without disrupting current workflows

## Risks and Mitigation

### Risk: Complexity Increase
- Mitigation: Maintain clear separation between new and existing functionality
- Mitigation: Thorough documentation and comments

### Risk: Performance Degradation
- Mitigation: Implement proper loading states
- Mitigation: Optimize data fetching and rendering

### Risk: User Confusion
- Mitigation: Clear UI design with intuitive workflows
- Mitigation: Proper tooltips and guidance

## Success Criteria

- Users can create new layouts from scratch
- Users can load existing layouts for editing
- Users can save changes to existing layouts
- Users can delete layouts with proper confirmation
- Users can set layouts as default
- All operations provide clear feedback
- The UI remains responsive and intuitive
- Error handling is comprehensive and user-friendly