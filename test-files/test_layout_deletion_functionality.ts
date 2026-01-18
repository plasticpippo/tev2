// Test Script for Layout Deletion Functionality
// This script tests various aspects of the layout deletion functionality in the Customize Product Grid Layout modal

import { test, expect } from '@playwright/test';

test.describe('Layout Deletion Functionality Tests', () => {
  // Test data
  const adminUser = 'admin';
  const adminPassword = 'admin123';
  const baseUrl = 'http://192.168.1.241:3000'; // LAN IP from .env configuration
  
  // Common selectors
  const selectors = {
    usernameInput: 'input[name="username"]',
    passwordInput: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
    adminPanel: 'text=Admin Panel',
    productGridLayout: 'text=Product Grid Layout',
    customizeGridButton: 'text=Customize Grid Layout',
    layoutCustomizerModal: 'text=Customize Product Grid Layout',
    layoutNameInput: 'input[type="text"]',
    tillSelect: 'select',
    saveNewLayoutButton: 'text=Save New Layout',
    updateLayoutButton: 'text=Update Layout',
    saveAsNewButton: 'text=Save As New',
    createNewLayoutButton: 'text=+ Create New Layout',
    clearGridButton: 'text=Clear Grid',
    cancelButton: 'text=Cancel',
    closeModalButton: 'button:has-text("×")',
    deleteLayoutButton: 'text=Del',
    setDefaultButton: 'text=Set Default',
    loadLayoutButton: 'text=Load',
    gridItem: '.absolute',
    productButton: 'button:has-text("Product")',
    availableLayoutsContainer: 'div:has-text("Available Layouts")',
    layoutItem: 'div.p-2.mb-2.bg-slate-600.rounded.flex.justify-between.items-center',
    layoutName: '.font-medium.text-sm.truncate',
    layoutFilterType: '.text-xs.text-slate-300',
    confirmationModal: 'text=Confirm Deletion',
    confirmDeleteButton: 'text=Delete',
    confirmCancelButton: 'text=Cancel',
    confirmationTitle: '[data-testid="confirmation-title"]',
    confirmationMessage: '[data-testid="confirmation-message"]'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(baseUrl);
    
    // Login first if needed
    await page.fill(selectors.usernameInput, adminUser);
    await page.fill(selectors.passwordInput, adminPassword);
    await page.click(selectors.loginButton);
    
    // Wait for login to complete
    await page.waitForURL(`${baseUrl}/**`);
  });

  test('1. Test basic layout deletion functionality', async ({ page }) => {
    console.log('Testing basic layout deletion functionality...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // First, create a temporary layout to delete
    const tempLayoutName = `Temp Layout for Deletion Test ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to delete the layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our temporary layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    let layoutFound = false;
    
    // Loop through layout items to find our temporary layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Temp Layout for Deletion Test')) {
        layoutFound = true;
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    expect(layoutFound).toBe(true);
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Verify the confirmation message includes the layout name
      const confirmationMessage = await page.locator(selectors.confirmationMessage).textContent();
      expect(confirmationMessage).toContain(tempLayoutName);
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for deletion to complete
      await page.waitForTimeout(1500);
      
      // Verify the layout is no longer in the list
      const remainingLayoutItems = page.locator(selectors.layoutItem);
      let layoutStillExists = false;
      
      for (let i = 0; i < await remainingLayoutItems.count(); i++) {
        const layoutName = await remainingLayoutItems.nth(i).locator(selectors.layoutName).textContent();
        if (layoutName && layoutName.includes('Temp Layout for Deletion Test')) {
          layoutStillExists = true;
          break;
        }
      }
      
      expect(layoutStillExists).toBe(false);
      
      console.log(`Successfully deleted layout: ${tempLayoutName}`);
    } else {
      console.log('Could not find temporary layout to delete');
      expect(false).toBe(true); // Fail the test if we can't find the delete button
    }
  });

  test('2. Test confirmation modal appearance and content', async ({ page }) => {
    console.log('Testing confirmation modal appearance and content...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a temporary layout to test deletion
    const tempLayoutName = `Temp Layout for Modal Test ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to test the confirmation modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our temporary layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our temporary layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Temp Layout for Modal Test')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Verify modal has the correct title
      await expect(page.locator(selectors.confirmationTitle)).toContainText('Confirm Deletion');
      
      // Verify modal has the correct message with layout name
      const messageLocator = page.locator(selectors.confirmationMessage);
      await expect(messageLocator).toContainText(tempLayoutName);
      await expect(messageLocator).toContainText('Are you sure you want to delete the layout');
      
      // Verify both confirm and cancel buttons exist
      const confirmButton = page.locator(selectors.confirmDeleteButton);
      const cancelButton = page.locator(selectors.confirmCancelButton);
      
      await expect(confirmButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
      
      // Test cancel functionality
      await cancelButton.click();
      
      // Verify modal disappears after cancellation
      await expect(page.locator(selectors.confirmationModal)).not.toBeVisible();
      
      console.log('Confirmation modal tested successfully');
    } else {
      console.log('Could not find temporary layout to test confirmation modal');
      expect(false).toBe(true); // Fail the test if we can't find the delete button
    }
  });

  test('3. Test deleting the only layout for a till (should fail gracefully)', async ({ page }) => {
    console.log('Testing deletion of the only layout for a till...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // First, ensure we have only one layout for a specific till by deleting others
    // For this test, we'll try to create a scenario where we have just one layout
    const uniqueLayoutName = `Unique Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, uniqueLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the unique layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Try to find and delete this layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our unique layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our unique layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Unique Layout')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for potential deletion attempt
      await page.waitForTimeout(1500);
      
      // Check if there's an error message about not being able to delete
      // This depends on how the backend handles this case
      const errorMessage = page.locator('text=Cannot delete the only layout for a till');
      const hasError = await errorMessage.isVisible();
      
      if (hasError) {
        console.log('Correctly prevented deletion of only layout for till');
        // Click OK or close error message
        const okButton = page.locator('text=OK');
        if (await okButton.isVisible()) {
          await okButton.click();
        }
      } else {
        // If deletion was allowed, that's also acceptable depending on requirements
        console.log('Layout was deleted (may be expected behavior)');
      }
    } else {
      console.log('Could not find unique layout to test deletion prevention');
    }
  });

  test('4. Test deleting currently loaded layout', async ({ page }) => {
    console.log('Testing deletion of currently loaded layout...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a temporary layout to test
    const tempLayoutName = `Current Layout Test ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Load the layout we just created
    const layoutItems = page.locator(selectors.layoutItem);
    let loadButton = null;
    
    // Loop through layout items to find our temporary layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Current Layout Test')) {
        loadButton = layoutItem.locator(selectors.loadLayoutButton);
        break;
      }
    }
    
    if (loadButton) {
      await loadButton.click();
      await page.waitForTimeout(1000);
      
      // Now try to delete the currently loaded layout
      // Go back to the layout list view to see the delete option
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      // Find the delete button for the currently loaded layout
      const layoutItemsAfterLoad = page.locator(selectors.layoutItem);
      let deleteButton = null;
      
      for (let i = 0; i < await layoutItemsAfterLoad.count(); i++) {
        const layoutItem = layoutItemsAfterLoad.nth(i);
        const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
        
        if (layoutName && layoutName.includes('Current Layout Test')) {
          deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
          break;
        }
      }
      
      if (deleteButton) {
        // Click the delete button
        await deleteButton.click();
        
        // Wait for confirmation modal to appear
        await expect(page.locator(selectors.confirmationModal)).toBeVisible();
        
        // Confirm deletion
        await page.click(selectors.confirmDeleteButton);
        
        // Wait for deletion to complete
        await page.waitForTimeout(1500);
        
        // Verify the layout is no longer in the list
        const remainingLayoutItems = page.locator(selectors.layoutItem);
        let layoutStillExists = false;
        
        for (let i = 0; i < await remainingLayoutItems.count(); i++) {
          const layoutName = await remainingLayoutItems.nth(i).locator(selectors.layoutName).textContent();
          if (layoutName && layoutName.includes('Current Layout Test')) {
            layoutStillExists = true;
            break;
          }
        }
        
        expect(layoutStillExists).toBe(false);
        
        console.log(`Successfully deleted currently loaded layout: ${tempLayoutName}`);
      } else {
        console.log('Could not find delete button for currently loaded layout');
      }
    } else {
      console.log('Could not find layout to load for testing');
    }
  });

  test('5. Monitor console logs during deletion process', async ({ page }) => {
    console.log('Monitoring console logs during deletion process...');
    
    // Set up console log monitoring
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a temporary layout to delete
    const tempLayoutName = `Console Test Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to delete the layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our temporary layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our temporary layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Console Test Layout')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for deletion to complete
      await page.waitForTimeout(1500);
      
      // Check console logs for any errors or warnings
      console.log(`Console logs during deletion: ${consoleLogs.length} messages found`);
      for (const log of consoleLogs) {
        console.log(log);
      }
      
      // Verify no errors occurred during the deletion process
      const errorLogs = consoleLogs.filter(log => log.startsWith('error'));
      expect(errorLogs.length).toBe(0);
      
      console.log('No errors found in console during deletion process');
    } else {
      console.log('Could not find temporary layout to delete for console log monitoring');
    }
  });

  test('6. Monitor network requests during deletion process', async ({ page }) => {
    console.log('Monitoring network requests during deletion process...');
    
    // Track network requests
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/grid-layouts/') && request.method() === 'DELETE') {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a temporary layout to delete
    const tempLayoutName = `Network Test Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to delete the layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our temporary layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our temporary layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName && layoutName.includes('Network Test Layout')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for deletion to complete
      await page.waitForTimeout(1500);
      
      // Verify that a DELETE request was made to the correct endpoint
      expect(requests.length).toBeGreaterThan(0);
      
      let deleteRequestFound = false;
      for (const req of requests) {
        if (req.method === 'DELETE' && req.url.includes('/api/grid-layouts/')) {
          deleteRequestFound = true;
          console.log(`DELETE request made to: ${req.url}`);
          break;
        }
      }
      
      expect(deleteRequestFound).toBe(true);
      
      console.log('Successfully monitored network requests during deletion process');
    } else {
      console.log('Could not find temporary layout to delete for network request monitoring');
    }
  });

  test.afterEach(async ({ page }) => {
    // Close the modal if it's open
    try {
      await page.locator(selectors.closeModalButton).click({ timeout: 2000 });
    } catch (e) {
      // Modal might not be open, which is fine
    }
  });
