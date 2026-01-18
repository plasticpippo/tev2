# Filter Type Functionality Test Plan

## Overview
This plan outlines the testing strategy for the filter type functionality in the Customize Product Grid Layout modal. The filter types include 'all', 'favorites', and 'category', which control which products are displayed in the available products panel.

## Components Involved
- `ProductGridLayoutCustomizer.tsx`: Main modal component
- `useProductGridLayoutCustomizer.ts`: Custom hook managing state and logic
- `AvailableProductsPanel.tsx`: Component showing available products with filter controls
- `AvailableLayoutsSection.tsx`: Section showing available layouts with filter controls

## Filter Types Details
1. **All**: Shows all products regardless of category or favorite status
2. **Favorites**: Shows only products that have favorite variants
3. **Category**: Shows products belonging to a specific category

## Test Objectives

### Primary Objectives
1. Verify each filter type works correctly in isolation
2. Verify filter type switching works smoothly
3. Verify filtering affects the available products panel
4. Verify filtering affects the available layouts panel
5. Verify no console errors occur during filter operations
6. Verify network requests are handled properly

### Secondary Objectives
1. Verify filter type is saved with the layout
2. Verify filter type persists when loading existing layouts
3. Verify drag-and-drop functionality works with filtered products

## Test Scenarios

### 1. Navigate to the Customize Product Grid Layout Modal
- Navigate to the main POS interface
- Open the Customize Product Grid Layout modal
- Verify modal loads correctly with all sections visible

### 2. Test the 'all' Filter Type Functionality
- Verify that by default, all products are shown
- Verify that the 'All Products' button is highlighted
- Verify that all categories are displayed in the products panel
- Verify that both favorite and non-favorite products are visible
- Verify that the filter type is set to 'all' in the internal state

### 3. Test the 'favorites' Filter Type Functionality
- Click the '★ Favourites' button
- Verify that only products with favorite variants are displayed
- Verify that non-favorite products are hidden
- Verify that the favorites button shows 'ON' status
- Verify that selecting favorites filter sets the internal state to 'favorites'
- Click the '★ Favourites' button again to turn it off
- Verify that all products are shown again

### 4. Test the 'category' Filter Type Functionality
- Click on a specific category button
- Verify that only products from the selected category are displayed
- Verify that products from other categories are hidden
- Verify that both favorite and non-favorite products from the selected category are visible
- Click on the same category button again to deselect it
- Verify that all products are shown again
- Click on different category buttons and verify the product list updates accordingly

### 5. Verify Filtering Affects the Available Products Panel
- Apply 'all' filter and verify all products are listed
- Apply 'favorites' filter and verify only favorite products are listed
- Apply 'category' filter and verify only products from selected category are listed
- Verify the product count in the panel reflects the active filter
- Verify product cards display correctly with appropriate styling

### 6. Verify Filtering Affects the Available Layouts Panel
- In the Available Layouts section, change the filter type dropdown to 'all'
- Verify all layouts are displayed regardless of their individual filter types
- Change the filter type to 'favorites'
- Verify only layouts with filter type 'favorites' are displayed
- Change the filter type to 'category'
- Verify only layouts with filter type 'category' are displayed
- Verify that search functionality works in conjunction with filter type

### 7. Test Switching Between Different Filter Types
- Start with 'all' filter
- Switch to 'favorites' filter and verify immediate update
- Switch to 'category' filter and verify immediate update
- Switch back to 'all' filter and verify immediate update
- Test rapid switching between filters
- Verify no visual glitches or errors occur during transitions

### 8. Monitor Console Logs During Filter Type Changes
- Open browser developer tools
- Apply each filter type while monitoring console
- Verify no errors are logged when changing filters
- Verify no warnings are generated
- Verify that state updates are logged appropriately (if applicable)

### 9. Monitor Network Requests During Filter Type Changes
- Open browser developer tools Network tab
- Apply each filter type while monitoring network activity
- Verify no unnecessary API calls are triggered by filter changes
- Verify that filter changes are handled client-side without server requests
- Verify that any layout loading operations work correctly with different filters

### 10. Document Any Issues Found with the Filter Type Functionality
- Record any UI inconsistencies
- Record any functional issues
- Record any performance issues
- Record any unexpected behaviors
- Suggest improvements if applicable

## Additional Test Cases

### Edge Cases
- Test with no products available for a selected category
- Test with no favorite products available
- Test with empty products list
- Test with very large products list (performance)

### Integration Tests
- Verify filter type is correctly saved with the layout
- Verify filter type is correctly loaded when loading existing layouts
- Verify that loaded filter type correctly populates the UI
- Verify that filter type changes are reflected in the layout preview

### Cross-browser Compatibility
- Test filter functionality in different browsers
- Verify consistent behavior across Chrome, Firefox, Safari
- Verify responsive behavior on different screen sizes

## Expected Results
- Filter types should work consistently and predictably
- Product display should update immediately when filters change
- No errors should occur during filter operations
- Layout saving/loading should preserve filter type settings
- UI should remain responsive during all operations

## Success Criteria
- All filter types work as expected
- Smooth transitions between filter types
- No console errors or warnings
- Proper product display according to active filter
- Proper layout filtering in the available layouts panel
- Correct saving and loading of filter type with layouts

## Test Data Requirements
- Products with various categories
- Products with favorite and non-favorite variants
- Existing layouts with different filter types
- Categories for testing category filtering