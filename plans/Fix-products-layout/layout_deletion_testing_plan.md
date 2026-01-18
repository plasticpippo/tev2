 # Layout Deletion Functionality Testing Plan

## Overview
This document outlines a comprehensive testing plan for the layout deletion functionality in the Customize Product Grid Layout modal. The purpose is to ensure the deletion feature works correctly, handles edge cases appropriately, and maintains data integrity.

## Test Environment Setup
- Application running in Docker containers
- Backend on port 5432 (PostgreSQL database)
- Frontend on port 3000
- Admin credentials: admin/admin123
- Testing from LAN with browser access

## Test Scenarios

### 1. Basic Layout Deletion
**Objective**: Verify that a user can successfully delete an existing layout

**Preconditions**:
- User is logged in as admin
- At least one layout exists in the system

**Steps**:
1. Navigate to the Customize Product Grid Layout modal
2. Locate an existing layout in the available layouts list
3. Click the delete button for that layout
4. Verify the confirmation modal appears with correct layout name
5. Confirm the deletion in the modal
6. Verify the layout is removed from the list
7. Verify the layout is removed from the database

**Expected Results**:
- Confirmation modal displays with correct layout name
- Layout is successfully removed from the UI list
- Layout is permanently removed from the database
- No error messages appear

### 2. Confirmation Modal Validation
**Objective**: Verify that the confirmation modal appears correctly and displays the proper layout information

**Preconditions**:
- User is logged in as admin
- At least one layout exists in the system

**Steps**:
1. Navigate to the Customize Product Grid Layout modal
2. Click the delete button for any layout
3. Examine the confirmation modal content
4. Verify the layout name is displayed correctly
5. Verify the modal has "Confirm" and "Cancel" buttons
6. Test the "Cancel" button functionality
7. Test the "Confirm" button functionality

**Expected Results**:
- Confirmation modal appears immediately after clicking delete
- Layout name is clearly displayed in the modal message
- Both "Confirm" and "Cancel" buttons are present
- Cancel button closes the modal without deleting
- Confirm button proceeds with deletion

### 3. Default Layout Deletion Prevention
**Objective**: Verify that the system prevents deletion of the default layout if it's the only layout for a till

**Preconditions**:
- User is logged in as admin
- A till exists with only one layout that is set as default

**Steps**:
1. Navigate to the Customize Product Grid Layout modal
2. Identify a layout that is the only layout for its till and is set as default
3. Attempt to delete this layout
4. Observe the behavior and any error messages

**Expected Results**:
- Either the delete button is disabled for default layouts
- Or attempting deletion shows an error message explaining why deletion isn't allowed
- The layout remains in the system after attempted deletion

### 4. Currently Loaded Layout Deletion
**Objective**: Verify the behavior when attempting to delete a layout that is currently loaded in the editor

**Preconditions**:
- User is logged in as admin
- At least one layout exists and can be loaded

**Steps**:
1. Navigate to the Customize Product Grid Layout modal
2. Load a layout into the editor
3. Return to the layout list
4. Attempt to delete the currently loaded layout
5. Observe the behavior

**Expected Results**:
- System either prevents deletion of currently loaded layout
- Or properly handles the scenario by resetting the editor state after deletion
- No errors occur during the process

### 5. Database Consistency Verification
**Objective**: Verify that deleted layouts are properly removed from the database

**Preconditions**:
- User is logged in as admin
- At least one layout exists in the system

**Steps**:
1. Record the current state of the product_grid_layouts table
2. Delete a specific layout via the UI
3. Query the database directly to verify the layout was removed
4. Verify foreign key relationships remain intact

**Expected Results**:
- Layout record is completely removed from the database
- No orphaned records are left in related tables
- Database constraints are maintained

### 6. Error Handling During Deletion
**Objective**: Verify proper error handling when deletion fails

**Preconditions**:
- User is logged in as admin

**Steps**:
1. Simulate a condition where deletion would fail (e.g., database connection issue)
2. Attempt to delete a layout
3. Observe the error handling and user feedback

**Expected Results**:
- Appropriate error message is displayed to the user
- Layout remains in the list if deletion failed
- No crash or unexpected behavior occurs

### 7. Network Request Validation
**Objective**: Verify the correct API endpoint is called during deletion

**Preconditions**:
- Developer tools available to monitor network requests

**Steps**:
1. Open browser developer tools and navigate to Network tab
2. Navigate to the Customize Product Grid Layout modal
3. Delete a layout
4. Monitor the network request made during deletion

**Expected Results**:
- DELETE request is made to `/api/grid-layouts/{layoutId}`
- Request returns appropriate status code (204 for success)
- Request includes proper authentication headers

### 8. Console Log Monitoring
**Objective**: Verify there are no errors or warnings in console during deletion

**Preconditions**:
- Browser developer tools open with Console tab visible

**Steps**:
1. Open browser developer tools and navigate to Console tab
2. Navigate to the Customize Product Grid Layout modal
3. Delete a layout
4. Monitor console for any errors or warnings

**Expected Results**:
- No JavaScript errors appear in the console
- No warnings related to the deletion process
- Successful completion messages may appear (optional)

## Backend Logic Review

Based on code analysis, the backend deletion logic includes:

1. **Validation**: Checks if layout ID is valid
2. **Existence Check**: Verifies the layout exists before deletion
3. **Default Layout Protection**: Prevents deletion of the only layout for a till if it's the default
4. **Database Operation**: Performs the actual deletion via Prisma ORM
5. **Response**: Returns 204 status on successful deletion

## Edge Cases to Consider

1. **Concurrent Deletion**: Multiple users attempting to delete the same layout simultaneously
2. **Large Layout Data**: Deleting layouts with extensive grid configurations
3. **Network Interruption**: What happens if network drops during deletion
4. **Cancelled Request**: User closes browser during deletion process
5. **Special Characters**: Layout names with special characters or very long names

## Success Criteria

A successful test of the layout deletion functionality will demonstrate:
- Users can delete non-critical layouts safely
- Confirmation modal prevents accidental deletions
- Default layout protection works as intended
- Database consistency is maintained
- Proper error handling when operations fail
- Clean UI experience with no console errors

## Post-Test Verification

After running all tests:
1. Verify all existing layouts remain accessible
2. Verify new layouts can still be created
3. Verify layout loading functionality remains intact
4. Verify other layout operations (save, update, set as default) still work