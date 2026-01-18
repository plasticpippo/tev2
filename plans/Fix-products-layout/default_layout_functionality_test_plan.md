# Default Layout Functionality Test Plan

## Overview
This document outlines a comprehensive test plan for verifying the default layout functionality in the Customize Product Grid Layout modal. The tests cover all aspects of setting, unsetting, and managing default layouts.

## Test Environment Setup
- Application URL: `http://192.168.1.241:3000`
- Admin credentials: `admin` / `admin123`
- Test will be performed using Playwright for end-to-end testing

## Prerequisites
- Backend and frontend services are running
- Database is accessible and populated with test data
- At least one till exists in the system

## Test Cases

### Test Case 1: Navigate to Customize Product Grid Layout Modal
**Objective**: Verify that users can successfully navigate to the Customize Product Grid Layout modal.

**Steps**:
1. Log in to the application as admin
2. Navigate to the Admin Panel
3. Click on "Customize Grid Layout" button
4. Verify the modal opens with expected elements

**Expected Results**:
- Modal should appear with title "Customize Product Grid Layout"
- Layout name input field should be visible
- Till selection dropdown should be visible
- Available layouts section should be visible
- Grid customization area should be visible

### Test Case 2: Create Multiple Layouts for a Till
**Objective**: Verify that multiple layouts can be created for a single till.

**Steps**:
1. In the Customize Product Grid Layout modal
2. Create a new layout with name "Test Layout 1"
3. Select a till
4. Add some products to the grid
5. Save the layout
6. Repeat steps 2-5 to create "Test Layout 2" and "Test Layout 3"

**Expected Results**:
- All three layouts should be created successfully
- Each layout should appear in the available layouts list
- Layouts should be associated with the selected till

### Test Case 3: Set One Layout as Default
**Objective**: Verify that a layout can be set as the default layout for a till.

**Steps**:
1. With multiple layouts created for a till
2. Locate the "Set Default" button for one of the layouts
3. Click the "Set Default" button
4. Wait for the operation to complete
5. Verify visual indicators showing the layout is now default

**Expected Results**:
- The selected layout should be marked as default (e.g., "(Default)" label)
- The "Set Default" button should become disabled or change to "Default"
- The operation should complete without errors

### Test Case 4: Verify Default Layout Marked Correctly in UI
**Objective**: Verify that the default layout is visually marked correctly in the UI.

**Steps**:
1. After setting a layout as default
2. Examine the layout card/list item for the default layout
3. Check for visual indicators like labels, colors, or icons
4. Verify the correct layout is marked as default

**Expected Results**:
- Default layout should have a "Default Layout" badge or similar indicator
- Default layout should have a different color/badge compared to other layouts
- The visual marking should be consistent and clear

### Test Case 5: Test Setting Different Layout as Default (Removes Previous Default)
**Objective**: Verify that when a new layout is set as default, the previous default layout loses its default status.

**Steps**:
1. Ensure one layout is already set as default
2. Identify another layout for the same till and filter type
3. Click the "Set Default" button for the second layout
4. Wait for the operation to complete
5. Check both layouts' default status

**Expected Results**:
- The second layout should now be marked as default
- The first layout should no longer be marked as default
- Only one layout should be marked as default at any time
- The operation should complete without errors

### Test Case 6: Test Removing Default Status by Setting Different Layout as Default
**Objective**: Verify that setting a different layout as default properly removes the default status from the previous layout.

**Steps**:
1. Have one layout set as default
2. Create or identify another layout for the same till and filter type
3. Set the new layout as default
4. Verify the previous layout no longer shows as default
5. Verify the new layout shows as default

**Expected Results**:
- Only one layout should be marked as default
- Previous default layout should lose its default marker
- New layout should gain the default marker
- No duplicate default status should exist

### Test Case 7: Test Default Layout Persistence After Page Refresh
**Objective**: Verify that the default layout setting persists after page refresh.

**Steps**:
1. Set a layout as default
2. Refresh the page
3. Navigate back to the Customize Product Grid Layout modal
4. Verify the same layout is still marked as default

**Expected Results**:
- The default layout should remain set after page refresh
- The UI should correctly display the default layout marker
- No loss of default status should occur

### Test Case 8: Monitor Console Logs During Default Layout Operations
**Objective**: Ensure no errors appear in console logs during default layout operations.

**Steps**:
1. Open browser developer tools
2. Navigate to the console tab
3. Perform default layout operations (set default, change default)
4. Monitor console for any errors or warnings

**Expected Results**:
- No JavaScript errors should appear in console
- Network request errors should be handled gracefully
- Any warnings should be non-critical

### Test Case 9: Monitor Network Requests During Default Layout Operations
**Objective**: Verify that network requests for default layout operations are functioning correctly.

**Steps**:
1. Open browser developer tools
2. Navigate to the Network tab
3. Perform default layout operations
4. Monitor network requests to `/api/grid-layouts/:id/set-default`
5. Verify request/response structure and status codes

**Expected Results**:
- PUT request to `/api/grid-layouts/:id/set-default` should return 200 OK
- Request payload should be minimal (only the ID)
- Response should contain updated layout object with `isDefault: true`
- Other layouts should have been updated with `isDefault: false`

### Test Case 10: Test Default Layout Behavior with Different Filter Types
**Objective**: Verify that default layouts work correctly with different filter types (All, Favorites, Category).

**Steps**:
1. Create layouts for different filter types (All Products, Favorites, Category)
2. Set a layout as default for each filter type
3. Verify that defaults are maintained separately for each filter type
4. Switch between filter types and verify correct defaults are shown

**Expected Results**:
- Each filter type should maintain its own default layout
- Setting default for one filter type should not affect others
- Correct default should be loaded when switching filter types

### Test Case 11: Test Default Layout Behavior with Shared Layouts
**Objective**: Verify that default layouts work correctly with shared layouts.

**Steps**:
1. Create shared layouts
2. Test setting shared layouts as default
3. Verify behavior is consistent with till-specific layouts
4. Test default behavior when both shared and till-specific layouts exist

**Expected Results**:
- Shared layouts should support default functionality
- Default logic should work consistently across shared and till-specific layouts
- Only one default should exist per context (till or shared)

## Success Criteria
- All test cases pass without errors
- Default layout functionality works consistently across all scenarios
- UI correctly reflects default status changes
- Network operations complete successfully
- No console errors during operations

## Potential Issues to Monitor
- Race conditions when rapidly changing defaults
- Issues with very large layout configurations
- Problems with concurrent access to layout settings
- Data consistency issues in database
- Performance degradation with many layouts

## Post-Test Actions
- Clean up any test layouts created during testing
- Verify database integrity
- Document any anomalies or unexpected behaviors
- Report any identified bugs with reproduction steps