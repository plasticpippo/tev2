# E2E Testing Subtasks for POS Application using Playwright MCP

This document outlines comprehensive subtasks for End-to-End testing of the POS application using Playwright MCP. Each section covers a specific component with detailed test scenarios.

## 1. User Management Testing

### 1.1 Navigation and Setup
- Navigate to the POS application admin panel using LAN IP address
- Log in with admin credentials (admin/admin123)
- Verify that the admin panel loads correctly
- Navigate to the "Users" section in the admin panel

### 1.2 Create User Functionality
- Click on the "Add User" or "Create User" button
- Fill in user details:
  - Name: "Test User"
  - Username: "testuser"
  - Password: "password123"
  - Role: "Staff" (or other available roles)
- Submit the form
- Verify that the new user appears in the users list
- Check that the user data is displayed correctly in the table

### 1.3 Read User Functionality
- Verify that all existing users are displayed in the user management table
- Check that user details (ID, name, username, role) are correct
- Test pagination if there are many users
- Verify that the user count matches expected number

### 1.4 Update User Functionality
- Select an existing user from the list
- Click on the "Edit" or "Update" button
- Modify user details:
  - Change the name to "Updated Test User"
  - Change the role to "Manager"
- Save the changes
- Verify that the updated information is reflected in the user list
- Confirm that the changes persist after a page refresh

### 1.5 Delete User Functionality
- Select a test user from the list
- Click on the "Delete" button
- Confirm the deletion in the confirmation modal
- Verify that the user is removed from the user list
- Test that the deleted user cannot log in to the system

### 1.6 User Validation Testing
- Attempt to create a user with an existing username
- Verify that appropriate error message is displayed
- Attempt to create a user with empty required fields
- Verify that validation messages appear for required fields
- Test password strength requirements if implemented

### 1.7 User Role Testing
- Create users with different roles (Admin, Manager, Staff)
- Test that each role has appropriate access to different sections
- Verify that role-based permissions work correctly
- Log in as different user roles and verify functionality

## 2. Product Management Testing

### 2.1 Navigation and Setup
- Navigate to the "Products" section in the admin panel
- Verify that the product management interface loads correctly
- Check that existing products are displayed in the table

### 2.2 Create Product Functionality
- Click on the "Add Product" or "Create Product" button
- Fill in product details:
  - Name: "Test Product"
  - Description: "Test product description"
  - Category: Select an existing category
  - SKU: "TEST001"
- Add a product variant:
  - Variant name: "Small"
  - Price: 5.99
  - Stock consumption: Link to existing stock items if available
- Submit the form
- Verify that the new product appears in the product list
- Check that the product details are displayed correctly

### 2.3 Read Product Functionality
- Verify that all existing products are displayed in the product management table
- Check that product details (ID, name, category, variants) are correct
- Test pagination if there are many products
- Verify that product variants are displayed correctly

### 2.4 Update Product Functionality
- Select an existing product from the list
- Click on the "Edit" or "Update" button
- Modify product details:
  - Change the product name to "Updated Test Product"
  - Update the description
  - Add or modify variants
- Save the changes
- Verify that the updated information is reflected in the product list
- Confirm that the changes persist after a page refresh

### 2.5 Delete Product Functionality
- Select a test product from the list
- Click on the "Delete" button
- Confirm the deletion in the confirmation modal
- Verify that the product is removed from the product list
- Test that the deleted product no longer appears in the POS interface

### 2.6 Product Validation Testing
- Attempt to create a product with an existing name
- Verify that appropriate error message is displayed
- Attempt to create a product with empty required fields
- Verify that validation messages appear for required fields
- Test that product variants can be added and removed correctly

### 2.7 Product Category Association
- Create products associated with different categories
- Verify that products appear under correct categories in POS interface
- Update product category associations
- Verify that changes are reflected in both admin panel and POS interface

## 3. Category Management Testing

### 3.1 Navigation and Setup
- Navigate to the "Categories" section in the admin panel
- Verify that the category management interface loads correctly
- Check that existing categories are displayed in the table

### 3.2 Create Category Functionality
- Click on the "Add Category" or "Create Category" button
- Fill in category details:
  - Name: "Test Category"
  - Description: "Test category description"
  - Color: Select a color if applicable
- Submit the form
- Verify that the new category appears in the category list
- Check that the category details are displayed correctly

### 3.3 Read Category Functionality
- Verify that all existing categories are displayed in the category management table
- Check that category details (ID, name, description) are correct
- Verify that category colors are displayed correctly if applicable

### 3.4 Update Category Functionality
- Select an existing category from the list
- Click on the "Edit" or "Update" button
- Modify category details:
  - Change the category name to "Updated Test Category"
  - Update the description
  - Change the color if applicable
- Save the changes
- Verify that the updated information is reflected in the category list
- Confirm that the changes persist after a page refresh

### 3.5 Delete Category Functionality
- Select a test category from the list
- Click on the "Delete" button
- Confirm the deletion in the confirmation modal
- Verify that the category is removed from the category list
- Test that the deletion fails if the category has associated products (validation)

### 3.6 Category Validation Testing
- Attempt to create a category with an existing name
- Verify that appropriate error message is displayed
- Attempt to create a category with empty required fields
- Verify that validation messages appear for required fields

### 3.7 Category-Product Relationship Testing
- Create products associated with the new category
- Verify that the category appears in the POS product grid
- Update category associations for products
- Verify that changes are reflected in both admin panel and POS interface

## 4. Till Management Testing

### 4.1 Navigation and Setup
- Navigate to the "Tills" section in the admin panel
- Verify that the till management interface loads correctly
- Check that existing tills are displayed in the table

### 4.2 Create Till Functionality
- Click on the "Add Till" or "Create Till" button
- Fill in till details:
  - Name: "Test Till 1"
  - Description: "Test till for E2E testing"
  - Status: Active
- Submit the form
- Verify that the new till appears in the till list
- Check that the till details are displayed correctly

### 4.3 Read Till Functionality
- Verify that all existing tills are displayed in the till management table
- Check that till details (ID, name, description, status) are correct
- Verify that till statuses are displayed correctly

### 4.4 Update Till Functionality
- Select an existing till from the list
- Click on the "Edit" or "Update" button
- Modify till details:
  - Change the till name to "Updated Test Till"
  - Update the description
  - Change the status if applicable
- Save the changes
- Verify that the updated information is reflected in the till list
- Confirm that the changes persist after a page refresh

### 4.5 Delete Till Functionality
- Select a test till from the list
- Click on the "Delete" button
- Confirm the deletion in the confirmation modal
- Verify that the till is removed from the till list
- Test that the deletion fails if the till has associated transactions (validation)

### 4.6 Till Assignment Testing
- Log out and log back in as admin
- Assign the test till to the current session
- Verify that the till assignment is successful
- Test switching between different tills
- Verify that till-specific data is displayed correctly

### 4.7 Till Validation Testing
- Attempt to create a till with an existing name
- Verify that appropriate error message is displayed
- Attempt to create a till with empty required fields
- Verify that validation messages appear for required fields

## 5. Stock Item Management Testing

### 5.1 Navigation and Setup
- Navigate to the "Stock Items" section in the admin panel
- Verify that the stock item management interface loads correctly
- Check that existing stock items are displayed in the table

### 5.2 Create Stock Item Functionality
- Click on the "Add Stock Item" or "Create Stock Item" button
- Fill in stock item details:
  - Name: "Test Stock Item"
  - Description: "Test stock item for E2E testing"
  - Quantity: 100
  - Unit: "pieces" or other appropriate unit
  - Minimum stock level: 10
- Submit the form
- Verify that the new stock item appears in the stock item list
- Check that the stock item details are displayed correctly

### 5.3 Read Stock Item Functionality
- Verify that all existing stock items are displayed in the stock item management table
- Check that stock item details (ID, name, quantity, unit) are correct
- Verify that low stock items are highlighted if applicable

### 5.4 Update Stock Item Functionality
- Select an existing stock item from the list
- Click on the "Edit" or "Update" button
- Modify stock item details:
  - Change the stock item name to "Updated Test Stock Item"
 - Update the quantity to 150
  - Change the description
- Save the changes
- Verify that the updated information is reflected in the stock item list
- Confirm that the changes persist after a page refresh

### 5.5 Delete Stock Item Functionality
- Select a test stock item from the list
- Click on the "Delete" button
- Confirm the deletion in the confirmation modal
- Verify that the stock item is removed from the stock item list
- Test that the deletion fails if the stock item is linked to products (validation)

### 5.6 Stock Level Management
- Update stock levels for an existing stock item
- Verify that the quantity updates correctly
- Test that stock level changes are reflected in product availability
- Verify that low stock warnings appear when appropriate

### 5.7 Stock Item Validation Testing
- Attempt to create a stock item with an existing name
- Verify that appropriate error message is displayed
- Attempt to create a stock item with negative quantity
- Verify that validation messages appear for required fields

## 6. Stock Adjustment Testing

### 6.1 Navigation and Setup
- Navigate to the "Inventory" or "Stock Adjustments" section in the admin panel
- Verify that the stock adjustment interface loads correctly
- Check that existing stock adjustments are displayed in the history

### 6.2 Create Stock Adjustment Functionality
- Click on the "New Adjustment" or "Create Adjustment" button
- Fill in adjustment details:
  - Stock Item: Select an existing stock item
  - Adjustment Type: "Addition" or "Reduction"
  - Quantity: 10 (or other appropriate value)
  - Reason: "Test adjustment for E2E"
  - Date: Current date
- Submit the form
- Verify that the new stock adjustment appears in the adjustment history
- Check that the stock quantity updates accordingly

### 6.3 Read Stock Adjustment Functionality
- Verify that all existing stock adjustments are displayed in the history table
- Check that adjustment details (ID, item, type, quantity, reason, date) are correct
- Verify that the adjustment history is sorted properly

### 6.4 Stock Adjustment Validation
- Attempt to create an adjustment with negative quantity for reduction
- Verify that appropriate validation occurs
- Attempt to create an adjustment with empty required fields
- Verify that validation messages appear for required fields

### 6.5 Stock Adjustment Impact Testing
- Create a stock reduction adjustment that brings quantity below zero
- Verify that appropriate validation or warnings appear
- Verify that stock adjustments correctly update stock levels
- Check that the adjustment history reflects the changes accurately

## 7. Table Management Testing

### 7.1 Navigation and Setup
- Navigate to the "Tables & Layout" section in the admin panel
- Verify that the table management interface loads correctly
- Check that existing rooms and tables are displayed

### 7.2 Create Room Functionality
- Click on the "Add Room" button
- Fill in room details:
  - Name: "Test Room"
  - Description: "Test room for E2E"
- Submit the form
- Verify that the new room appears in the room list

### 7.3 Create Table Functionality
- Within the test room, click on "Add Table"
- Fill in table details:
  - Name: "Test Table 1"
  - Seats: 4
  - Position: Set coordinates via drag-and-drop
- Submit the form
- Verify that the new table appears in the room layout

### 7.4 Update Room and Table Functionality
- Select an existing room and update its details
- Select an existing table and update its details
- Test drag-and-drop functionality to reposition tables
- Verify that changes are saved and persist after refresh

### 7.5 Delete Room and Table Functionality
- Delete a test table from the room layout
- Confirm the deletion and verify it's removed
- Delete a test room (if empty)
- Verify that the room and its tables are removed

### 7.6 Table Assignment in POS
- Switch to POS mode
- Create an order and assign it to a table
- Verify that the table status updates correctly
- Complete the order and verify table status returns to available

### 7.7 Table Management Validation
- Attempt to create rooms/tables with existing names
- Verify that appropriate error messages appear
- Test that table positions are correctly saved and restored

## 8. Tab Management Testing

### 8.1 Navigation and Setup
- Switch to POS mode
- Verify that the tab management functionality is accessible
- Check that existing tabs are displayed if any exist

### 8.2 Create Tab Functionality
- Click on "Open Tabs" or "Manage Tabs" button
- Click on "Create New Tab"
- Enter tab name: "Test Tab"
- Submit the form
- Verify that the new tab appears in the tab list

### 8.3 Add Items to Tab
- Add some products to the current order
- Click on "Add to Tab"
- Select the test tab created earlier
- Verify that items are added to the tab
- Check that the order is cleared after adding to tab

### 8.4 Load Tab Functionality
- Open the tabs modal again
- Select the test tab with items
- Click "Load Tab"
- Verify that items from the tab are loaded into the current order

### 8.5 Save Tab Functionality
- Modify the loaded tab by adding more items
- Click "Save Tab"
- Verify that the tab is updated with new items

### 8.6 Close Tab Functionality
- Load a tab with items
- Process payment or remove all items
- Close the tab
- Verify that the tab is removed from the system

### 8.7 Tab Transfer Functionality
- Open the transfer modal
- Select items to transfer from one tab to another
- Verify that items are moved correctly between tabs
- Check that quantities are updated appropriately

### 8.8 Tab Validation Testing
- Attempt to create tabs with empty names
- Verify that appropriate validation occurs
- Test that tabs with items cannot be closed without processing

## 9. Order Processing Testing

### 9.1 Navigation and Setup
- Ensure you're in POS mode with a logged-in user
- Verify that the product grid and order panel are visible
- Check that products are displayed correctly in the grid

### 9.2 Add Items to Order
- Select a product from the grid
- Add it to the current order
- Verify that the item appears in the order panel
- Test adding multiple quantities of the same item
- Test adding different products to the order

### 9.3 Update Order Quantities
- Increase the quantity of an item in the order
- Decrease the quantity of an item in the order
- Remove an item from the order
- Verify that totals update correctly after each change

### 9.4 Apply Discounts (if applicable)
- If discount functionality exists, test applying discounts
- Verify that the discount is applied to the order total
- Check that the discounted total is calculated correctly

### 9.5 Process Payment
- Click on the "Payment" button
- Select a payment method (Cash, Card, etc.)
- Enter payment amount if required
- Confirm the payment
- Verify that the transaction is completed successfully
- Check that the order is cleared from the panel

### 9.6 Order Cancellation
- Add items to an order
- Clear the entire order
- Verify that all items are removed
- Confirm that the order panel is empty

### 9.7 Order Processing Validation
- Attempt to process payment with empty order
- Verify that appropriate validation occurs
- Test that insufficient payment amounts are handled correctly

## 10. Transaction History Testing

### 10.1 Navigation and Setup
- Navigate to the "Transactions" section in the admin panel
- Verify that the transaction history interface loads correctly
- Check that existing transactions are displayed in the table

### 10.2 Transaction Details Verification
- Select a transaction from the list
- Verify that all transaction details are displayed correctly:
  - Items purchased
  - Subtotal, tax, tip, and total amounts
  - Payment method
  - User who processed the transaction
  - Till where transaction occurred
  - Timestamp

### 10.3 Transaction Filtering
- Test date range filtering for transactions
- Test user-based filtering
- Test payment method filtering
- Verify that filters work correctly and display appropriate results

### 10.4 Transaction Search
- Use search functionality to find specific transactions
- Test searching by user name
- Test searching by transaction amount
- Verify that search results are accurate

### 10.5 Transaction Reports
- Generate daily transaction reports
- Generate weekly/monthly transaction reports
- Verify that report data matches the transaction history

### 10.6 Transaction Validation
- Verify that all required transaction fields are populated
- Check that calculated amounts are correct
- Ensure that tax calculations are applied properly

## 11. Login/Authentication Flow Testing

### 11.1 Login Page Access
- Navigate to the application URL
- Verify that the login screen is displayed by default
- Check that login fields (username, password) are visible

### 11.2 Successful Login
- Enter valid admin credentials (admin/admin123)
- Submit the login form
- Verify that the user is redirected to the appropriate interface
- Check that the user role is displayed correctly

### 11.3 Failed Login
- Enter invalid credentials
- Submit the login form
- Verify that appropriate error message is displayed
- Check that user remains on the login screen

### 11.4 Logout Functionality
- Click on the logout button
- Verify that the user is logged out successfully
- Check that the user is redirected to the login screen
- Verify that the session is cleared properly

### 11.5 Session Management
- Log in as admin user
- Leave the application idle for a period
- Verify that the session remains active (or expires as configured)
- Test that the user needs to log in again after session expiry

### 11.6 Role-Based Access
- Log in as different user roles (Admin, Manager, Staff)
- Verify that each role has appropriate access to features
- Check that restricted features are not accessible to lower roles

### 11.7 Till Assignment Flow
- After login, verify till assignment interface appears if no till is assigned
- Test assigning different tills to the user session
- Verify that the correct till data is loaded after assignment

## 12. Settings Management Testing

### 12.1 Navigation and Setup
- Navigate to the "Settings" section in the admin panel
- Verify that the settings interface loads correctly
- Check that current settings values are displayed

### 12.2 Tax Settings Management
- Navigate to the tax settings section
- Modify tax settings:
  - Change tax mode (none, inclusive, exclusive)
  - Update tax rates if applicable
- Save the changes
- Verify that the tax settings are updated correctly
- Test that tax calculations reflect the new settings in orders

### 12.3 Business Day Settings Management
- Navigate to the business day settings section
- Modify business day settings:
  - Change auto start time
  - Update business day schedule
- Save the changes
- Verify that the business day settings are updated correctly

### 12.4 Settings Validation
- Attempt to save invalid tax rate values
- Verify that appropriate validation occurs
- Test saving settings with empty required fields
- Check that validation messages appear correctly

### 12.5 Settings Persistence
- Save new settings
- Refresh the page
- Verify that the settings persist after refresh
- Log out and log back in to verify settings are maintained

### 12.6 Settings Impact Testing
- Change tax settings
- Create a new order to verify tax calculations are correct
- Update business day settings
- Verify that business day operations reflect the new settings

### 12.7 Settings Permissions
- Log in as non-admin user
- Verify that settings access is restricted appropriately
- Check that non-admin users cannot modify system settings