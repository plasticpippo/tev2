# Available Layouts Panel Test Plan

## Overview
This document outlines the testing approach for the available layouts panel in the Customize Product Grid Layout modal. The available layouts panel allows users to view, filter, search, and manage their saved grid layouts.

## Components Under Test
- `AvailableLayoutsSection.tsx` - Main component for the available layouts panel
- `AvailableLayoutsPanel.tsx` - Alternative implementation (similar functionality)
- `useProductGridLayoutCustomizer.ts` - Hook managing layout state and operations
- `gridLayoutService.ts` - Service handling API interactions

## Test Objectives

### Primary Functions to Test
1. Display of available layouts
2. Filtering by layout type (All, Favorites, Category)
3. Searching by layout name
4. Pagination (if applicable)
5. Layout card information display
6. Layout card actions (Load, Delete, Set as Default)
7. Error handling
8. Console and network monitoring

## Detailed Test Cases

### 1. Navigation to Customize Product Grid Layout Modal
**Objective**: Verify access to the modal containing the available layouts panel
- [ ] Navigate to POS interface
- [ ] Locate and click "Customize Grid Layout" button
- [ ] Verify modal opens with "Customize Product Grid Layout" title
- [ ] Verify available layouts panel is visible within modal

### 2. Available Layouts Panel Display Verification
**Objective**: Ensure the panel renders correctly with proper structure
- [ ] Verify panel header shows "Available Layouts"
- [ ] Verify filter dropdown is present and accessible
- [ ] Verify search input field is present and accessible
- [ ] Verify layout list container is visible
- [ ] Verify "Create New Layout" button is present
- [ ] Verify loading states display appropriately
- [ ] Verify error states display appropriately

### 3. Filtering Functionality Testing
**Objective**: Test filtering of layouts by type
- [ ] Verify default filter is set to "All"
- [ ] Test "All" filter - show all layouts regardless of type
- [ ] Test "Favorites" filter - show only favorite-type layouts
- [ ] Test "Category" filter - show only category-type layouts
- [ ] Verify filter selection persists after other interactions
- [ ] Verify filter combinations work with search functionality
- [ ] Verify filter type indicators display correctly on layout cards

### 4. Search Functionality Testing
**Objective**: Test searching for layouts by name
- [ ] Verify search input accepts text input
- [ ] Test searching for existing layout names
- [ ] Test searching with partial matches
- [ ] Test searching with case-insensitive matches
- [ ] Verify search works in combination with filters
- [ ] Test clearing search returns all matching filtered layouts
- [ ] Verify "No layouts found" message appears for non-matching searches

### 5. Pagination Testing (if applicable)
**Objective**: Test pagination when many layouts exist
- [ ] Verify pagination controls appear when needed
- [ ] Test navigation between pages
- [ ] Verify search/filter results maintain pagination
- [ ] Verify consistent layout display across pages

### 6. Layout Card Information Display
**Objective**: Verify each layout card shows relevant information
- [ ] Verify layout name is displayed prominently
- [ ] Verify filter type indicator is shown (All Products, Favorites Only, Category: X)
- [ ] Verify "Default" indicator appears for default layouts
- [ ] Verify category name appears when filter type is "Category"
- [ ] Verify layout-specific metadata is displayed
- [ ] Verify proper truncation of long names
- [ ] Verify visual distinction between default and non-default layouts

### 7. Layout Card Action Testing
**Objective**: Test all actions available on layout cards
#### Load Action
- [ ] Verify "Load" button is present on each layout card
- [ ] Test loading a layout populates the grid editor
- [ ] Verify layout name updates in the editor
- [ ] Verify filter type and category selections update correctly
- [ ] Verify grid items are populated correctly
- [ ] Verify till selection updates if needed

#### Delete Action
- [ ] Verify "Del" button is present on each layout card
- [ ] Test clicking delete shows confirmation modal
- [ ] Verify confirmation modal shows correct layout name
- [ ] Test canceling deletion preserves layout
- [ ] Test confirming deletion removes layout from list
- [ ] Verify deletion works for both default and non-default layouts
- [ ] Verify error handling for failed deletions

#### Set as Default Action
- [ ] Verify "Set Default" button appears on non-default layouts
- [ ] Verify "Default" badge appears on default layouts
- [ ] Test setting a layout as default updates the UI immediately
- [ ] Verify previous default layout loses its default status
- [ ] Verify default status persists after closing and reopening modal
- [ ] Test error handling for failed default setting operations

### 8. Console Log Monitoring
**Objective**: Monitor for any errors or warnings during operations
- [ ] Open browser developer console
- [ ] Perform all major operations (filter, search, load, delete, set default)
- [ ] Monitor for JavaScript errors
- [ ] Monitor for API-related warnings
- [ ] Monitor for React-specific warnings
- [ ] Document any unexpected console messages

### 9. Network Request Monitoring
**Objective**: Monitor API calls during operations
- [ ] Open browser developer network tab
- [ ] Perform layout loading operation - verify GET request to `/api/grid-layouts/{id}`
- [ ] Perform layout deletion - verify DELETE request to `/api/grid-layouts/{id}`
- [ ] Perform set as default operation - verify PUT request to `/api/grid-layouts/{id}/set-default`
- [ ] Perform layout listing - verify GET request to `/api/grid-layouts/tills/{tillId}/grid-layouts`
- [ ] Verify all requests return appropriate status codes
- [ ] Monitor payload data for correctness

### 10. Edge Case Testing
**Objective**: Test boundary conditions and error scenarios
- [ ] Test with empty layout list
- [ ] Test with very long layout names
- [ ] Test with layouts having special characters in names
- [ ] Test network failure scenarios
- [ ] Test rapid succession of operations
- [ ] Test concurrent modifications from multiple sessions
- [ ] Verify proper cleanup when modal is closed

## Expected Behaviors

### UI Behavior
- Filter dropdown should update layout list immediately
- Search should filter in real-time as user types
- Layout cards should update to reflect current state
- Actions should provide visual feedback during processing
- Error messages should be clear and actionable

### Performance Requirements
- Layout list should load within 2 seconds
- Filter operations should update within 500ms
- Search operations should filter within 300ms
- Individual actions should complete within 2 seconds

### Data Consistency
- Deleted layouts should not reappear after refresh
- Default layout changes should persist across sessions
- Loaded layouts should completely replace current editor state
- Filter and search states should reset appropriately when needed

## Success Criteria
- All layout cards display properly with correct information
- Filter functionality works as expected
- Search functionality works as expected
- All card actions (Load, Delete, Set Default) work correctly
- No console errors occur during normal operations
- All network requests succeed and return appropriate responses
- UI remains responsive throughout all operations