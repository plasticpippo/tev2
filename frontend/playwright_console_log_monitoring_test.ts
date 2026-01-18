// Playwright Test for Console Log Monitoring During Customize Product Grid Layout Operations
// This test monitors console logs during various operations in the Customize Product Grid Layout modal

import { test, expect } from '@playwright/test';

test.describe('Console Log Monitoring for Product Grid Layout Customizer', () => {
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

  test('1. Monitor console logs during modal opening and closing', async ({ page }) => {
    console.log('Monitoring console logs during modal opening and closing...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Record initial console messages
    const initialMessageCount = consoleMessages.length;

    // Open the modal
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(500);

    // Record messages after opening modal
    const afterOpenMessageCount = consoleMessages.length;
    const messagesDuringOpen = consoleMessages.slice(initialMessageCount, afterOpenMessageCount);

    // Close the modal
    await page.click(selectors.closeModalButton);
    await page.waitForTimeout(500);

    // Record messages after closing modal
    const finalMessageCount = consoleMessages.length;
    const messagesDuringClose = consoleMessages.slice(afterOpenMessageCount, finalMessageCount);

    // Analyze messages during opening
    console.log(`Console messages during modal opening: ${messagesDuringOpen.length}`);
    messagesDuringOpen.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Analyze messages during closing
    console.log(`Console messages during modal closing: ${messagesDuringClose.length}`);
    messagesDuringClose.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Check for errors during opening
    const openErrors = messagesDuringOpen.filter(msg => msg.type === 'error');
    expect(openErrors.length).toBe(0);

    // Check for errors during closing
    const closeErrors = messagesDuringClose.filter(msg => msg.type === 'error');
    expect(closeErrors.length).toBe(0);

    console.log('Successfully monitored console logs during modal opening and closing - no errors detected');
  });

  test('2. Monitor console logs during layout creation', async ({ page }) => {
    console.log('Monitoring console logs during layout creation...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Open the modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(500);

    // Record messages before creation
    const beforeCreateMessageCount = consoleMessages.length;

    // Create a new layout
    const newLayoutName = `Test Layout Creation ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, newLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    if (await productButtons.count() > 0) {
      await productButtons.click();
      await page.waitForTimeout(500);
    }

    // Save the layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1500); // Wait for save operation to complete

    // Record messages after creation
    const afterCreateMessageCount = consoleMessages.length;
    const messagesDuringCreation = consoleMessages.slice(beforeCreateMessageCount, afterCreateMessageCount);

    // Analyze messages during creation
    console.log(`Console messages during layout creation: ${messagesDuringCreation.length}`);
    messagesDuringCreation.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Check for errors during creation
    const creationErrors = messagesDuringCreation.filter(msg => msg.type === 'error');
    expect(creationErrors.length).toBe(0);

    // Check for warnings during creation
    const creationWarnings = messagesDuringCreation.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
    if (creationWarnings.length > 0) {
      console.log(`Warnings during creation: ${creationWarnings.length}`);
      creationWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
    }

    console.log(`Successfully monitored console logs during layout creation: ${newLayoutName}`);
  });

  test('3. Monitor console logs during layout loading', async ({ page }) => {
    console.log('Monitoring console logs during layout loading...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Open the modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);

    // Check if there are existing layouts to load
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();

    if (layoutCount > 0) {
      // Record messages before loading
      const beforeLoadMessageCount = consoleMessages.length;

      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1500);

      // Record messages after loading
      const afterLoadMessageCount = consoleMessages.length;
      const messagesDuringLoading = consoleMessages.slice(beforeLoadMessageCount, afterLoadMessageCount);

      // Analyze messages during loading
      console.log(`Console messages during layout loading: ${messagesDuringLoading.length}`);
      messagesDuringLoading.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

      // Check for errors during loading
      const loadErrors = messagesDuringLoading.filter(msg => msg.type === 'error');
      expect(loadErrors.length).toBe(0);

      // Check for warnings during loading
      const loadWarnings = messagesDuringLoading.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
      if (loadWarnings.length > 0) {
        console.log(`Warnings during loading: ${loadWarnings.length}`);
        loadWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
      }

      console.log('Successfully monitored console logs during layout loading - no errors detected');
    } else {
      console.log('No existing layouts found to monitor loading logs');
      // Create a temporary layout for testing
      const tempLayoutName = `Temp Load Test ${Date.now()}`;
      await page.fill(selectors.layoutNameInput, tempLayoutName);
      
      // Select a till
      await page.locator(selectors.tillSelect).click();
      await page.locator('option').first().click(); // Select first till
      
      // Add a product to the grid
      const productButtons = page.locator(selectors.productButton).first();
      if (await productButtons.count() > 0) {
        await productButtons.click();
        await page.waitForTimeout(500);
      }

      // Save the temporary layout
      await page.click(selectors.saveNewLayoutButton);
      await page.waitForTimeout(1500);

      // Reopen the modal to test loading
      await page.click(selectors.closeModalButton);
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);

      // Now load the newly created layout
      const newLayoutItems = page.locator(selectors.layoutItem);
      const newLoadButtons = page.locator(selectors.loadLayoutButton);
      if (await newLoadButtons.count() > 0) {
        const beforeLoadMessageCount = consoleMessages.length;
        await newLoadButtons.first().click();
        await page.waitForTimeout(1500);

        const afterLoadMessageCount = consoleMessages.length;
        const messagesDuringLoading = consoleMessages.slice(beforeLoadMessageCount, afterLoadMessageCount);

        // Analyze messages during loading
        console.log(`Console messages during layout loading: ${messagesDuringLoading.length}`);
        messagesDuringLoading.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

        // Check for errors during loading
        const loadErrors = messagesDuringLoading.filter(msg => msg.type === 'error');
        expect(loadErrors.length).toBe(0);

        console.log('Successfully monitored console logs during layout loading - no errors detected');
      }
    }
  });

  test('4. Monitor console logs during layout deletion', async ({ page }) => {
    console.log('Monitoring console logs during layout deletion...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Create a temporary layout for deletion test
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(500);

    const tempLayoutName = `Temp Delete Test ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, tempLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    if (await productButtons.count() > 0) {
      await productButtons.click();
      await page.waitForTimeout(500);
    }

    // Save the temporary layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1500);

    // Record messages before deletion
    const beforeDeleteMessageCount = consoleMessages.length;

    // Now find the newly created layout and delete it
    await page.click(selectors.closeModalButton); // Close and reopen to refresh list
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);

    // Find the temporary layout
    const layoutItems = page.locator(selectors.layoutItem);
    let tempLayoutFound = false;
    let tempLayoutIndex = -1;
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutName = await layoutItems.nth(i).locator(selectors.layoutName).textContent();
      if (layoutName?.includes('Temp Delete Test')) {
        tempLayoutFound = true;
        tempLayoutIndex = i;
        break;
      }
    }

    if (tempLayoutFound) {
      // Click the delete button for the temporary layout
      const deleteButtons = page.locator(selectors.deleteLayoutButton);
      await deleteButtons.nth(tempLayoutIndex).click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      await page.waitForTimeout(500);
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      await page.waitForTimeout(1500);

      // Record messages after deletion
      const afterDeleteMessageCount = consoleMessages.length;
      const messagesDuringDeletion = consoleMessages.slice(beforeDeleteMessageCount, afterDeleteMessageCount);

      // Analyze messages during deletion
      console.log(`Console messages during layout deletion: ${messagesDuringDeletion.length}`);
      messagesDuringDeletion.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

      // Check for errors during deletion
      const deletionErrors = messagesDuringDeletion.filter(msg => msg.type === 'error');
      expect(deletionErrors.length).toBe(0);

      // Check for warnings during deletion
      const deletionWarnings = messagesDuringDeletion.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
      if (deletionWarnings.length > 0) {
        console.log(`Warnings during deletion: ${deletionWarnings.length}`);
        deletionWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
      }

      console.log('Successfully monitored console logs during layout deletion - no errors detected');
    } else {
      console.log('Could not find temporary layout to delete');
      expect(tempLayoutFound).toBe(true);
    }
  });

  test('5. Monitor console logs during filter operations', async ({ page }) => {
    console.log('Monitoring console logs during filter operations...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Open the modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(500);

    // Record messages before filter operations
    const beforeFilterMessageCount = consoleMessages.length;

    // Apply 'All Products' filter (typically the default, but explicitly set)
    // This might involve clicking on a category button or using a dropdown
    const allProductsButton = page.locator('text=All');
    if (await allProductsButton.count() > 0) {
      await allProductsButton.click();
      await page.waitForTimeout(500);
    }

    // Apply 'Favorites' filter
    const favoritesButton = page.locator('text=★ Favourites');
    if (await favoritesButton.count() > 0) {
      await favoritesButton.click();
      await page.waitForTimeout(500);
    }

    // Apply 'Category' filter (if categories exist)
    const categoryButtons = page.locator('button').filter({ hasText: /[^★]/ }); // Exclude favorites button
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(500);
      
      // Then reset to 'All' again
      const resetButton = page.locator('text=All');
      if (await resetButton.count() > 0) {
        await resetButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Record messages after filter operations
    const afterFilterMessageCount = consoleMessages.length;
    const messagesDuringFilters = consoleMessages.slice(beforeFilterMessageCount, afterFilterMessageCount);

    // Analyze messages during filter operations
    console.log(`Console messages during filter operations: ${messagesDuringFilters.length}`);
    messagesDuringFilters.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Check for errors during filter operations
    const filterErrors = messagesDuringFilters.filter(msg => msg.type === 'error');
    expect(filterErrors.length).toBe(0);

    // Check for warnings during filter operations
    const filterWarnings = messagesDuringFilters.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
    if (filterWarnings.length > 0) {
      console.log(`Warnings during filter operations: ${filterWarnings.length}`);
      filterWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
    }

    console.log('Successfully monitored console logs during filter operations - no errors detected');
  });

  test('6. Monitor console logs during grid manipulation', async ({ page }) => {
    console.log('Monitoring console logs during grid manipulation...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Open the modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(500);

    // Record messages before grid manipulation
    const beforeGridMessageCount = consoleMessages.length;

    // Add products to grid
    const productButtons = page.locator(selectors.productButton);
    const productCount = await productButtons.count();
    
    // Add up to 3 products to the grid
    for (let i = 0; i < Math.min(3, productCount); i++) {
      await productButtons.nth(i).click();
      await page.waitForTimeout(300);
    }

    // Wait for grid items to be added
    await page.waitForTimeout(1000);

    // Clear grid if there are items
    const gridItems = page.locator(selectors.gridItem);
    if (await gridItems.count() > 0) {
      await page.click(selectors.clearGridButton);
      await page.waitForTimeout(1000);
    }

    // Record messages after grid manipulation
    const afterGridMessageCount = consoleMessages.length;
    const messagesDuringGrid = consoleMessages.slice(beforeGridMessageCount, afterGridMessageCount);

    // Analyze messages during grid manipulation
    console.log(`Console messages during grid manipulation: ${messagesDuringGrid.length}`);
    messagesDuringGrid.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Check for errors during grid manipulation
    const gridErrors = messagesDuringGrid.filter(msg => msg.type === 'error');
    expect(gridErrors.length).toBe(0);

    // Check for warnings during grid manipulation
    const gridWarnings = messagesDuringGrid.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
    if (gridWarnings.length > 0) {
      console.log(`Warnings during grid manipulation: ${gridWarnings.length}`);
      gridWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
    }

    console.log('Successfully monitored console logs during grid manipulation - no errors detected');
  });

  test('7. Monitor console logs during multiple layout operations', async ({ page }) => {
    console.log('Monitoring console logs during multiple layout operations...');
    
    // Set up console listener
    const consoleMessages: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', message => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now()
      });
    });

    // Additional event listeners
    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
    });

    // Open the modal
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);

    // Record messages before multiple operations
    const beforeMultipleMessageCount = consoleMessages.length;

    // Perform multiple operations in sequence
    // 1. Create a layout
    const multiLayoutName = `Multi Op Test ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, multiLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    if (await productButtons.count() > 0) {
      await productButtons.click();
      await page.waitForTimeout(500);
    }

    // Save the layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);

    // 2. Create another layout
    const multiLayoutName2 = `Multi Op Test 2 ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, multiLayoutName2);
    
    // Select the same till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Save the second layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);

    // 3. Load the first layout
    await page.click(selectors.closeModalButton); // Close and reopen to refresh
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);

    // Find and load the first layout
    const layoutItems = page.locator(selectors.layoutItem);
    let firstLayoutFound = false;
    let firstLayoutIndex = -1;
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutName = await layoutItems.nth(i).locator(selectors.layoutName).textContent();
      if (layoutName?.includes('Multi Op Test') && !layoutName?.includes('Multi Op Test 2')) {
        firstLayoutFound = true;
        firstLayoutIndex = i;
        break;
      }
    }

    if (firstLayoutFound) {
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.nth(firstLayoutIndex).click();
      await page.waitForTimeout(1000);
    }

    // Record messages after multiple operations
    const afterMultipleMessageCount = consoleMessages.length;
    const messagesDuringMultiple = consoleMessages.slice(beforeMultipleMessageCount, afterMultipleMessageCount);

    // Analyze messages during multiple operations
    console.log(`Console messages during multiple layout operations: ${messagesDuringMultiple.length}`);
    messagesDuringMultiple.forEach(msg => console.log(`  ${msg.type}: ${msg.text}`));

    // Check for errors during multiple operations
    const multipleErrors = messagesDuringMultiple.filter(msg => msg.type === 'error');
    expect(multipleErrors.length).toBe(0);

    // Check for warnings during multiple operations
    const multipleWarnings = messagesDuringMultiple.filter(msg => msg.type === 'warning' || msg.text.includes('warn'));
    if (multipleWarnings.length > 0) {
      console.log(`Warnings during multiple operations: ${multipleWarnings.length}`);
      multipleWarnings.forEach(warn => console.log(`  WARNING: ${warn.text}`));
    }

    console.log('Successfully monitored console logs during multiple layout operations - no errors detected');
  });

  test.afterEach(async ({ page }) => {
    // Close the modal if it's open
    try {
      await page.locator(selectors.closeModalButton).click({ timeout: 2000 });
    } catch (e) {
      // Modal might not be open, which is fine
    }
  });
