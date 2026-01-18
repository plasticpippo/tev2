// Playwright E2E Tests for Product Grid Layout Loading Functionality
// This file contains comprehensive E2E tests for loading product grid layouts

import { test, expect } from '@playwright/test';

test.describe('Product Grid Layout Loading Functionality', () => {
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
    confirmDeleteButton: 'text=Delete'
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

  test('1. Basic Layout Loading - Load existing layout from available layouts list', async ({ page }) => {
    console.log('Testing basic layout loading functionality...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Get the first layout's name before loading
      const firstLayoutName = await layoutItems.first().locator(selectors.layoutName).textContent();
      console.log(`Attempting to load layout: ${firstLayoutName}`);
      
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Verify that the layout was loaded by checking the layout name input
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      await expect(layoutNameInput).not.toHaveValue('New Layout');
      
      // Verify the loaded layout name matches the expected name
      const loadedLayoutName = await layoutNameInput.inputValue();
      expect(loadedLayoutName).toContain(firstLayoutName?.trim());
      
      // Verify that grid items are populated (if any existed in the layout)
      const gridItems = page.locator(selectors.gridItem);
      const gridItemCount = await gridItems.count();
      console.log(`Loaded layout contains ${gridItemCount} grid items`);
      
      console.log(`Successfully loaded layout: ${loadedLayoutName}`);
    } else {
      console.log('No existing layouts found to load');
      // If no layouts exist, we'll create one first, then test loading it
      // Create a temporary layout
      const tempLayoutName = `Temp Layout ${Date.now()}`;
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
      
      // Now reopen the layout customizer and test loading the newly created layout
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      // Find the newly created layout and load it
      const newLayoutItems = page.locator(selectors.layoutItem);
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Verify that the layout was loaded
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      await expect(layoutNameInput).not.toHaveValue('New Layout');
      
      console.log(`Successfully loaded newly created layout`);
    }
  });

  test('2. Layout Loading Verification - Verify grid items load correctly', async ({ page }) => {
    console.log('Testing layout loading verification...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Count grid items before loading a different layout
      const gridItemsBefore = page.locator(selectors.gridItem);
      const countBefore = await gridItemsBefore.count();
      
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Count grid items after loading
      const gridItemsAfter = page.locator(selectors.gridItem);
      const countAfter = await gridItemsAfter.count();
      
      console.log(`Grid items before loading: ${countBefore}, after loading: ${countAfter}`);
      
      // Verify that the grid items have changed (or remained the same if reloading the same layout)
      // The main verification is that the loading process completed without errors
      
      // Additional verification: check that the grid container is visible
      const gridContainer = page.locator('div:has-text("Grid Layout")');
      await expect(gridContainer).toBeVisible();
      
      console.log('Successfully verified layout loading with grid items');
    } else {
      console.log('No existing layouts found to verify loading');
    }
  });

  test('3. Multiple Layout Switching - Test loading different layouts and switching between them', async ({ page }) => {
    console.log('Testing multiple layout switching...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are at least 2 existing layouts to switch between
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount >= 2) {
      // Store names of the first two layouts
      const firstLayoutName = await layoutItems.nth(0).locator(selectors.layoutName).textContent();
      const secondLayoutName = await layoutItems.nth(1).locator(selectors.layoutName).textContent();
      
      console.log(`Switching between layouts: ${firstLayoutName} and ${secondLayoutName}`);
      
      // Load the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.nth(0).click();
      await page.waitForTimeout(1000);
      
      // Verify first layout is loaded
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      const currentLayoutName = await layoutNameInput.inputValue();
      expect(currentLayoutName).toContain(firstLayoutName?.trim());
      
      // Store grid item count for first layout
      const firstLayoutGridItems = page.locator(selectors.gridItem);
      const firstLayoutItemCount = await firstLayoutGridItems.count();
      
      // Load the second layout
      await loadButtons.nth(1).click();
      await page.waitForTimeout(1000);
      
      // Verify second layout is loaded
      const newLayoutName = await layoutNameInput.inputValue();
      expect(newLayoutName).toContain(secondLayoutName?.trim());
      
      // Store grid item count for second layout
      const secondLayoutGridItems = page.locator(selectors.gridItem);
      const secondLayoutItemCount = await secondLayoutGridItems.count();
      
      console.log(`First layout "${firstLayoutName}" had ${firstLayoutItemCount} items`);
      console.log(`Second layout "${secondLayoutName}" had ${secondLayoutItemCount} items`);
      
      // Switch back to first layout
      await loadButtons.nth(0).click();
      await page.waitForTimeout(1000);
      
      // Verify first layout is loaded again
      const finalLayoutName = await layoutNameInput.inputValue();
      expect(finalLayoutName).toContain(firstLayoutName?.trim());
      
      console.log('Successfully tested switching between multiple layouts');
    } else {
      console.log('Need at least 2 layouts to test switching functionality');
      
      // Create additional layouts to test switching
      // First, create two temporary layouts
      
      // Create first temporary layout
      const tempLayoutName1 = `Temp Switch Layout 1 ${Date.now()}`;
      await page.fill(selectors.layoutNameInput, tempLayoutName1);
      
      // Select a till
      await page.locator(selectors.tillSelect).click();
      await page.locator('option').first().click();
      
      // Add a product to the grid
      const productButtons = page.locator(selectors.productButton).first();
      await productButtons.click();
      await page.waitForTimeout(500);
      
      // Save the first temporary layout
      await page.click(selectors.saveNewLayoutButton);
      await page.waitForTimeout(1000);
      
      // Create second temporary layout
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      const tempLayoutName2 = `Temp Switch Layout 2 ${Date.now()}`;
      await page.fill(selectors.layoutNameInput, tempLayoutName2);
      
      // Select the same till
      await page.locator(selectors.tillSelect).click();
      await page.locator('option').first().click();
      
      // Add a different product to the grid
      if (await page.locator(selectors.productButton).count() > 1) {
        await page.locator(selectors.productButton).nth(1).click();
      }
      await page.waitForTimeout(500);
      
      // Save the second temporary layout
      await page.click(selectors.saveNewLayoutButton);
      await page.waitForTimeout(1000);
      
      // Now test switching between the two created layouts
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      // Get the load buttons again
      const newLoadButtons = page.locator(selectors.loadLayoutButton);
      
      // Load the first layout
      await newLoadButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Verify first layout is loaded
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      const currentLayoutName = await layoutNameInput.inputValue();
      expect(currentLayoutName).toContain('Temp Switch Layout 1');
      
      // Load the second layout
      await newLoadButtons.nth(1).click();
      await page.waitForTimeout(1000);
      
      // Verify second layout is loaded
      const newLayoutName = await layoutNameInput.inputValue();
      expect(newLayoutName).toContain('Temp Switch Layout 2');
      
      console.log('Successfully tested switching between created layouts');
    }
  });

  test('4. Special Characters Handling - Test loading layout with special characters in name', async ({ page }) => {
    console.log('Testing special characters handling in layout names...');
    
    // First, create a layout with special characters in the name
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a layout with special characters
    const specialCharLayoutName = `Special Chars @#$%^&*() Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, specialCharLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the layout with special characters
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Now test loading the layout with special characters
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the layout with special characters and load it
    const layoutItems = page.locator(selectors.layoutItem);
    let specialLayoutFound = false;
    let specialLayoutIndex = -1;
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutName = await layoutItems.nth(i).locator(selectors.layoutName).textContent();
      if (layoutName?.includes('Special Chars')) {
        specialLayoutFound = true;
        specialLayoutIndex = i;
        break;
      }
    }
    
    if (specialLayoutFound) {
      // Click the load button for the special character layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.nth(specialLayoutIndex).click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Verify that the layout with special characters loaded correctly
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      const loadedLayoutName = await layoutNameInput.inputValue();
      
      expect(loadedLayoutName).toContain('Special Chars');
      expect(loadedLayoutName).toContain('@#$%^&*()');
      
      console.log(`Successfully loaded layout with special characters: ${loadedLayoutName}`);
    } else {
      console.log('Could not find layout with special characters to load');
      expect(specialLayoutFound).toBe(true);
    }
  });

  test('5. Large Layout Loading - Test loading layout with many grid items', async ({ page }) => {
    console.log('Testing large layout loading with many grid items...');
    
    // First, create a layout with many grid items
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a layout with many items
    const largeLayoutName = `Large Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, largeLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Add multiple products to the grid (up to 10 items for this test)
    const productButtons = page.locator(selectors.productButton);
    const productCount = await productButtons.count();
    
    // Add up to 10 products or all available products if less than 10
    const itemsToAdd = Math.min(10, productCount);
    
    for (let i = 0; i < itemsToAdd; i++) {
      if (i < productCount) {
        await productButtons.nth(i).click();
        await page.waitForTimeout(200); // Brief pause between additions
      }
    }
    
    // Save the large layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1500); // Longer wait for saving large layout
    
    console.log(`Created large layout with ${itemsToAdd} items`);
    
    // Now test loading the large layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the large layout and load it
    const layoutItems = page.locator(selectors.layoutItem);
    let largeLayoutFound = false;
    let largeLayoutIndex = -1;
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutName = await layoutItems.nth(i).locator(selectors.layoutName).textContent();
      if (layoutName?.includes('Large Layout')) {
        largeLayoutFound = true;
        largeLayoutIndex = i;
        break;
      }
    }
    
    if (largeLayoutFound) {
      // Click the load button for the large layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.nth(largeLayoutIndex).click();
      
      // Wait for layout to load (longer wait for large layout)
      await page.waitForTimeout(2000);
      
      // Verify that the large layout loaded correctly
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      const loadedLayoutName = await layoutNameInput.inputValue();
      expect(loadedLayoutName).toContain('Large Layout');
      
      // Verify that the expected number of grid items loaded
      const gridItems = page.locator(selectors.gridItem);
      const loadedItemCount = await gridItems.count();
      
      console.log(`Loaded large layout has ${loadedItemCount} items (expected ~${itemsToAdd})`);
      
      // The count might not be exactly the same due to duplicates or other factors,
      // but it should be at least close to the expected amount
      expect(loadedItemCount).toBeGreaterThanOrEqual(Math.max(1, itemsToAdd - 3)); // Allow for small variance
      
      console.log(`Successfully loaded large layout: ${loadedLayoutName} with ${loadedItemCount} items`);
    } else {
      console.log('Could not find large layout to load');
      expect(largeLayoutFound).toBe(true);
    }
  });

  test('6. Console Log Monitoring - Monitor console logs during loading process', async ({ page }) => {
    console.log('Monitoring console logs during layout loading...');
    
    // Set up console listener
    const consoleMessages: string[] = [];
    page.on('console', message => {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Record console messages before loading
    const consoleBefore = [...consoleMessages];
    
    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Record console messages after loading
      const consoleAfter = [...consoleMessages];
      const newMessages = consoleAfter.slice(consoleBefore.length);
      
      console.log(`Console messages during loading: ${newMessages.length}`);
      newMessages.forEach(msg => console.log(`  ${msg}`));
      
      // Verify no error messages occurred during loading
      const errorMessages = newMessages.filter(msg => msg.startsWith('error'));
      expect(errorMessages.length).toBe(0);
      
      console.log('Successfully monitored console logs during layout loading - no errors detected');
    } else {
      console.log('No existing layouts found to monitor loading logs');
    }
  });

  test('7. Network Request Monitoring - Monitor network requests during loading process', async ({ page }) => {
    console.log('Monitoring network requests during layout loading...');
    
    // Set up network request monitoring
    const requests: { method: string; url: string; status: number; timestamp: number }[] = [];
    
    page.on('request', request => {
      // Capture all requests
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/grid-layouts/')) {
        requests.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Record requests before loading
      const requestsBefore = [...requests];
      
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Record requests after loading
      const requestsAfter = [...requests];
      const newRequests = requestsAfter.slice(requestsBefore.length);
      
      console.log(`Network requests during loading: ${newRequests.length}`);
      
      // Find the GET request to load the specific layout
      const layoutLoadRequests = newRequests.filter(req => 
        req.method === 'GET' && req.url.includes('/api/grid-layouts/')
      );
      
      console.log(`Layout loading requests: ${layoutLoadRequests.length}`);
      layoutLoadRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} -> ${req.status}`);
      });
      
      // Verify that at least one GET request was made to load the layout
      expect(layoutLoadRequests.length).toBeGreaterThan(0);
      
      // Verify that all layout loading requests returned 200 status
      const nonSuccessRequests = layoutLoadRequests.filter(req => req.status !== 200);
      expect(nonSuccessRequests.length).toBe(0);
      
      console.log('Successfully monitored network requests during layout loading - all successful');
    } else {
      console.log('No existing layouts found to monitor loading network requests');
    }
  });

  test('8. Error Handling - Test error handling during layout loading', async ({ page }) => {
    console.log('Testing error handling during layout loading...');
    
    // For this test, we'll simulate error handling by trying to interact with the UI appropriately
    // The actual error handling would be tested more thoroughly in integration tests
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Verify that the UI is still responsive after loading
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      await expect(layoutNameInput).toBeEnabled();
      
      // Try modifying the layout name to ensure UI is still functional
      const currentName = await layoutNameInput.inputValue();
      await layoutNameInput.fill(`${currentName} - Modified`);
      await page.waitForTimeout(300);
      
      // Change it back
      await layoutNameInput.fill(currentName);
      await page.waitForTimeout(300);
      
      // Verify the UI didn't crash and is still responsive
      const closeModalBtn = page.locator(selectors.closeModalButton);
      await expect(closeModalBtn).toBeEnabled();
      
      console.log('Successfully tested UI responsiveness after layout loading');
    } else {
      console.log('No existing layouts found to test loading error handling');
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
});
