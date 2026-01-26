# Layout System Testing Guide

This document provides comprehensive instructions for testing the layout customization system in the POS application. The layout system allows users to customize product grids by dragging and dropping products to preferred positions.

## Table of Contents
1. [Demo Setup](#demo-setup)
2. [Normal Mode Testing](#normal-mode-testing)
3. [Edit Mode Entry](#edit-mode-entry)
4. [Drag and Drop Functionality](#drag-and-drop-functionality)
5. [Save Functionality](#save-functionality)
6. [Reset Functionality](#reset-functionality)
7. [Cancel Functionality](#cancel-functionality)
8. [Persistence Testing](#persistence-testing)
9. [Grid Constraints](#grid-constraints)
10. [Role-Based Access](#role-based-access)
11. [Expected Behavior](#expected-behavior)
12. [Troubleshooting](#troubleshooting)

## Demo Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js and npm installed (for local development)

### Steps to Set Up Demo Environment
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tev2
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the application with Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

4. Wait for all services to start (typically 2-3 minutes)

5. Access the application at `http://192.168.1.241:3000`

6. Log in with admin credentials:
   - Username: `admin`
   - Password: `admin123`

7. Navigate to the main POS interface where the product grid layout can be customized

## Normal Mode Testing

### Test Cases
1. **Product Grid Visibility**
   - Navigate to the main POS interface
   - Verify that the product grid displays correctly with default layout
   - Confirm all products are visible and accessible
   - Check that product buttons are properly labeled and sized

2. **Product Selection**
   - Click on various product buttons
   - Verify that products are added to the order panel correctly
   - Ensure no unexpected behaviors occur during normal product selection

3. **Performance Check**
   - Interact with the product grid extensively
   - Verify that the interface remains responsive
   - Check that scrolling works smoothly if the grid is large

## Edit Mode Entry

### Test Cases
1. **Edit Mode Button Access**
   - Locate the "Edit Layout" button (usually in the top-right corner of the grid)
   - Click the button to enter edit mode
   - Verify that the interface transitions to edit mode correctly

2. **Visual Indicators**
   - Confirm that visual indicators appear in edit mode (grid lines, handles, etc.)
   - Check that all product buttons show draggable handles
   - Verify that the toolbar appears with save/cancel/reset options

3. **Edit Mode Restrictions**
   - Attempt to select products while in edit mode
   - Verify that product selection is disabled during layout editing
   - Confirm that other POS functions remain accessible

## Drag and Drop Functionality

### Test Cases
1. **Basic Drag Operation**
   - Enter edit mode
   - Click and hold a product button
   - Drag it to a different position in the grid
   - Release to drop the item
   - Verify the product moves to the new position

2. **Drag Between Different Areas**
   - Try moving products between different sections of the grid
   - Test dragging to empty spaces in the grid
   - Verify that products can be rearranged freely within constraints

3. **Drag Feedback**
   - Observe visual feedback during drag operations
   - Check that a placeholder appears where the item will be dropped
   - Verify that the dragged item follows cursor movements smoothly

4. **Invalid Drop Locations**
   - Attempt to drag products outside the grid boundaries
   - Verify that invalid drops are prevented
   - Check that appropriate visual feedback is provided

5. **Multiple Drag Operations**
   - Perform several consecutive drag operations
   - Verify that the grid remains stable after multiple changes
   - Test dragging the same item multiple times

## Save Functionality

### Test Cases
1. **Save Button Access**
   - Make changes to the layout through drag and drop
   - Click the "Save" button in the edit mode toolbar
   - Verify that changes are saved successfully

2. **Success Feedback**
   - Check that a success message appears after saving
   - Verify that the application exits edit mode
   - Confirm that the layout reflects the saved changes

3. **API Integration**
   - Monitor network requests to ensure layout data is sent to backend
   - Verify that the correct endpoint is called (typically `/api/product-grid-layouts`)
   - Check that layout data includes all necessary information

4. **Database Persistence**
   - After saving, refresh the page
   - Verify that the custom layout persists after refresh
   - Confirm that the layout remains consistent across sessions

## Reset Functionality

### Test Cases
1. **Reset Button Access**
   - Make several changes to the layout
   - Click the "Reset" button in the edit mode toolbar
   - Verify that the layout reverts to the default configuration

2. **Reset Confirmation**
   - Check if a confirmation dialog appears before resetting
   - Verify that the reset action can be canceled if needed
   - Confirm that the layout returns to its original state after reset

3. **Reset Without Saving**
   - Make changes but don't save them
   - Click reset to revert changes
   - Verify that unsaved changes are discarded correctly

## Cancel Functionality

### Test Cases
1. **Cancel Button Access**
   - Enter edit mode and make changes to the layout
   - Click the "Cancel" button in the edit mode toolbar
   - Verify that changes are discarded and edit mode exits

2. **Cancel Behavior**
   - Confirm that the layout returns to its state before entering edit mode
   - Check that no changes are persisted when canceling
   - Verify that the interface returns to normal mode seamlessly

3. **Unsaved Changes Warning**
   - Check if a warning appears when attempting to exit with unsaved changes
   - Verify that the warning can be dismissed appropriately

## Persistence Testing

### Test Cases
1. **Session Persistence**
   - Customize the layout and save changes
   - Close the browser tab/window
   - Reopen the application and log in
   - Verify that the custom layout persists

2. **Cross-Device Consistency**
   - Log in from different devices/browsers
   - Verify that the same layout appears across all devices
   - Check that changes made on one device appear on others

3. **Data Integrity**
   - Inspect the saved layout data format
   - Verify that all product positions are preserved correctly
   - Check that no data corruption occurs during save/load cycles

## Grid Constraints

### Test Cases
1. **Maximum Grid Size**
   - Attempt to exceed the maximum allowed grid size
   - Verify that appropriate limits are enforced
   - Check that error messages appear when constraints are violated

2. **Minimum Grid Requirements**
   - Verify that essential products remain accessible
   - Check that the grid maintains minimum functionality requirements
   - Ensure that removing too many items doesn't break the layout

3. **Responsive Behavior**
   - Resize the browser window during layout editing
   - Verify that the grid adapts appropriately to different screen sizes
   - Check that drag and drop continues to work during resizing

## Role-Based Access

### Test Cases
1. **Admin User Access**
   - Log in as admin user (admin/admin123)
   - Verify that layout customization options are available
   - Test all edit mode functionality

2. **Regular User Restrictions**
   - Log in as a non-admin user
   - Verify that layout editing options are not available
   - Confirm that the grid appears in normal mode only

3. **Permission Verification**
   - Check that unauthorized users cannot access layout settings
   - Verify that attempts to modify layout without permissions are blocked
   - Ensure that appropriate error messages appear for unauthorized access

## Expected Behavior

### Normal Mode
- Product grid displays according to saved layout
- Products are selectable and add to order panel
- Edit mode controls are hidden
- All POS functionality operates normally
- Performance remains optimal

### Edit Mode
- Visual indicators show available positions
- Products have draggable handles
- Toolbar with save/cancel/reset options appears
- Product selection is temporarily disabled
- Grid shows active editing state

### After Saving
- Custom layout becomes the new default
- Edit mode exits automatically
- Success notification appears
- Layout persists across sessions
- All functionality returns to normal mode

## Troubleshooting

### Common Issues and Solutions

#### Issue: Drag and drop not working
**Symptoms:** Unable to move products around the grid
**Solutions:**
- Ensure you're in edit mode
- Refresh the page and try again
- Check browser console for JavaScript errors
- Verify that no overlays are blocking interactions

#### Issue: Layout not saving
**Symptoms:** Changes disappear after saving or refreshing
**Solutions:**
- Check network connectivity
- Verify that you have sufficient permissions
- Look for error messages in browser console
- Ensure the backend service is running properly

#### Issue: Grid appears broken after customization
**Symptoms:** Products overlapping or grid misaligned
**Solutions:**
- Use the reset button to restore default layout
- Check for any layout constraint violations
- Verify that the layout data format is correct
- Contact support if issue persists

#### Issue: Edit mode not accessible
**Symptoms:** Edit button not visible or unresponsive
**Solutions:**
- Verify user permissions
- Check if you're logged in as an authorized user
- Refresh the page
- Clear browser cache and cookies

#### Issue: Performance degradation
**Symptoms:** Slow response during drag operations
**Solutions:**
- Reduce the number of products in the grid
- Close other browser tabs to free memory
- Check system resources
- Consider optimizing product images

### Debugging Steps
1. Open browser developer tools (F12)
2. Check Console tab for error messages
3. Examine Network tab for failed API requests
4. Review Sources tab for breakpoints
5. Test in an incognito/private browsing window
6. Try a different browser to isolate issues

### Logging Information
- Enable detailed logging in the frontend configuration
- Check backend logs in the Docker container
- Monitor network requests for API interactions
- Record timestamps of issues for debugging