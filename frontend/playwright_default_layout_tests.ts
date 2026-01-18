// Playwright E2E Tests for Default Layout Functionality
// This file contains comprehensive E2E tests specifically for the default layout functionality in the Customize Product Grid Layout modal

import { test, expect } from '@playwright/test';

test.describe('Default Layout Functionality Tests', () => {
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
    defaultLayoutBadge: 'text=Default Layout',
    customLayoutBadge: 'text=Custom Layout',
    defaultButtonDisabled: '.bg-slate-700.text-slate-400.cursor-not-allowed',
    defaultButtonEnabled: '.bg-amber-600.hover:bg-amber-500.text-white'
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

  test('1. Navigate to Customize Product Grid Layout modal', async ({ page }) => {
    console.log('Testing navigation to Customize Product Grid Layout modal...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Verify expected elements are visible
    await expect(page.locator(selectors.layoutNameInput)).toBeVisible();
    await expect(page.locator(selectors.tillSelect)).toBeVisible();
    await expect(page.locator(selectors.availableLayoutsContainer)).toBeVisible();
    
    console.log('Successfully navigated to Customize Product Grid Layout modal');
  });

  test('2. Create multiple layouts for a till', async ({ page }) => {
    console.log('Testing creation of multiple layouts for a till...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create first layout
    const layoutName1 = `Test Layout 1 ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, layoutName1);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add some products to the grid
    const productButtons = page.locator(selectors.productButton);
    if (await productButtons.count() > 0) {
      await productButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    // Save the first layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the modal to create another layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Create second layout
    const layoutName2 = `Test Layout 2 ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, layoutName2);
    
    // Select the same till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Add some products to the grid
    if (await productButtons.count() > 1) {
      await productButtons.nth(1).click();
      await page.waitForTimeout(500);
    }
    
    // Save the second layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the modal to create third layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Create third layout
    const layoutName3 = `Test Layout 3 ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, layoutName3);
    
    // Select the same till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Add some products to the grid
    if (await productButtons.count() > 2) {
      await productButtons.nth(2).click();
      await page.waitForTimeout(500);
    }
    
    // Save the third layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Verify all three layouts exist
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Count the layouts
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    expect(layoutCount).toBeGreaterThanOrEqual(3);
    
    // Verify that our test layouts exist in the list
    let foundLayout1 = false;
    let foundLayout2 = false;
    let foundLayout3 = false;
    
    for (let i = 0; i < layoutCount; i++) {
      const layoutName = await layoutItems.nth(i).locator(selectors.layoutName).textContent();
      if (layoutName?.includes('Test Layout 1')) foundLayout1 = true;
      if (layoutName?.includes('Test Layout 2')) foundLayout2 = true;
      if (layoutName?.includes('Test Layout 3')) foundLayout3 = true;
    }
    
    expect(foundLayout1).toBe(true);
    expect(foundLayout2).toBe(true);
    expect(foundLayout3).toBe(true);
    
    console.log(`Successfully created 3 layouts for the same till: ${layoutName1}, ${layoutName2}, ${layoutName3}`);
  });

  test('3. Set one layout as default', async ({ page }) => {
    console.log('Testing setting a layout as default...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Find a layout that is not currently default
      let setDefaultButton = null;
      let layoutName = null;
      
      for (let i = 0; i < layoutCount; i++) {
        const layoutItem = layoutItems.nth(i);
        const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
        
        if (!isDefault) {
          setDefaultButton = layoutItem.locator(selectors.setDefaultButton);
          layoutName = await layoutItem.locator(selectors.layoutName).textContent();
          break;
        }
      }
      
      if (setDefaultButton && layoutName) {
        // Click the "Set Default" button
        await setDefaultButton.click();
        
        // Wait for the operation to complete
        await page.waitForTimeout(1000);
        
        // Verify that the layout is now marked as default
        const defaultMarker = page.locator(`text=${layoutName}`).locator('..').locator(selectors.defaultLayoutBadge);
        await expect(defaultMarker).toBeVisible();
        
        // Verify that the Set Default button is now disabled
        const defaultButton = page.locator(`text=${layoutName}`).locator('..').locator(selectors.defaultButtonDisabled);
        await expect(defaultButton).toBeVisible();
        
        console.log(`Successfully set layout as default: ${layoutName}`);
      } else {
        console.log('No non-default layouts found to set as default');
      }
    } else {
      console.log('No layouts found to set as default');
    }
  });

  test('4. Verify default layout is marked correctly in the UI', async ({ page }) => {
    console.log('Testing verification of default layout UI markers...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the default layout
    const layoutItems = page.locator(selectors.layoutItem);
    let defaultLayoutFound = false;
    let defaultLayoutName = '';
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
      
      if (isDefault) {
        defaultLayoutFound = true;
        defaultLayoutName = await layoutItem.locator(selectors.layoutName).textContent();
        break;
      }
    }
    
    if (defaultLayoutFound) {
      // Verify the default layout has correct visual indicators
      const defaultLayoutLocator = page.locator(`text=${defaultLayoutName}`).locator('..');
      
      // Check for default layout badge
      await expect(defaultLayoutLocator.locator(selectors.defaultLayoutBadge)).toBeVisible();
      
      // Check that the Set Default button is disabled for the default layout
      await expect(defaultLayoutLocator.locator(selectors.defaultButtonDisabled)).toBeVisible();
      
      console.log(`Verified default layout UI markers for: ${defaultLayoutName}`);
    } else {
      console.log('No default layout found to verify UI markers');
    }
  });

  test('5. Test setting a different layout as default (removes previous default)', async ({ page }) => {
    console.log('Testing setting a different layout as default (removes previous default)...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Count total layouts
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount >= 2) {
      // Find current default layout and another layout
      let currentDefaultLayoutName = '';
      let newDefaultLayoutName = '';
      let newDefaultSetButton = null;
      
      for (let i = 0; i < layoutCount; i++) {
        const layoutItem = layoutItems.nth(i);
        const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
        const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
        
        if (isDefault) {
          currentDefaultLayoutName = layoutName || '';
        } else if (newDefaultSetButton === null) {
          // Found a non-default layout to set as default
          newDefaultSetButton = layoutItem.locator(selectors.setDefaultButton);
          newDefaultLayoutName = layoutName || '';
        }
      }
      
      if (currentDefaultLayoutName && newDefaultLayoutName && newDefaultSetButton) {
        // Verify that there is currently a default layout
        expect(currentDefaultLayoutName).not.toBe('');
        
        // Click the "Set Default" button for the new layout
        await newDefaultSetButton.click();
        
        // Wait for the operation to complete
        await page.waitForTimeout(1500);
        
        // Verify that the new layout is now marked as default
        const newDefaultLayoutLocator = page.locator(`text=${newDefaultLayoutName}`).locator('..');
        await expect(newDefaultLayoutLocator.locator(selectors.defaultLayoutBadge)).toBeVisible();
        
        // Verify that the old layout is no longer marked as default
        if (currentDefaultLayoutName) {
          const oldDefaultLayoutLocator = page.locator(`text=${currentDefaultLayoutName}`).locator('..');
          await expect(oldDefaultLayoutLocator.locator(selectors.customLayoutBadge)).toBeVisible();
          
          // The old default layout should now have a "Set Default" button that is enabled
          await expect(oldDefaultLayoutLocator.locator(selectors.defaultButtonEnabled)).toBeVisible();
        }
        
        // Verify that only one layout is marked as default
        const allDefaultBadges = page.locator(selectors.defaultLayoutBadge);
        const defaultCount = await allDefaultBadges.count();
        expect(defaultCount).toBe(1);
        
        console.log(`Successfully changed default from "${currentDefaultLayoutName}" to "${newDefaultLayoutName}"`);
      } else {
        console.log('Could not find both a current default and another layout to test default switching');
      }
    } else {
      console.log('Need at least 2 layouts to test default switching functionality');
    }
  });

  test('6. Test removing default status by setting a different layout as default', async ({ page }) => {
    console.log('Testing removal of default status by setting different layout as default...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find all layouts
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount >= 2) {
      // Find current default layout and another layout
      let currentDefaultLayoutName = '';
      let newDefaultLayoutName = '';
      let newDefaultSetButton = null;
      
      for (let i = 0; i < layoutCount; i++) {
        const layoutItem = layoutItems.nth(i);
        const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
        const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
        
        if (isDefault) {
          currentDefaultLayoutName = layoutName || '';
        } else if (newDefaultSetButton === null) {
          // Found a non-default layout to set as default
          newDefaultSetButton = layoutItem.locator(selectors.setDefaultButton);
          newDefaultLayoutName = layoutName || '';
        }
      }
      
      if (currentDefaultLayoutName && newDefaultLayoutName && newDefaultSetButton) {
        // Record the initial state
        const initialOldDefaultLocator = page.locator(`text=${currentDefaultLayoutName}`).locator('..');
        const initialNewDefaultLocator = page.locator(`text=${newDefaultLayoutName}`).locator('..');
        
        // Verify initial state: old is default, new is not
        await expect(initialOldDefaultLocator.locator(selectors.defaultLayoutBadge)).toBeVisible();
        await expect(initialNewDefaultLocator.locator(selectors.customLayoutBadge)).toBeVisible();
        
        // Click the "Set Default" button for the new layout
        await newDefaultSetButton.click();
        
        // Wait for the operation to complete
        await page.waitForTimeout(1500);
        
        // Verify final state: new is default, old is not
        const finalOldDefaultLocator = page.locator(`text=${currentDefaultLayoutName}`).locator('..');
        const finalNewDefaultLocator = page.locator(`text=${newDefaultLayoutName}`).locator('..');
        
        // The old layout should no longer be marked as default
        await expect(finalOldDefaultLocator.locator(selectors.customLayoutBadge)).toBeVisible();
        
        // The new layout should be marked as default
        await expect(finalNewDefaultLocator.locator(selectors.defaultLayoutBadge)).toBeVisible();
        
        // Verify that only one layout is marked as default
        const allDefaultBadges = page.locator(selectors.defaultLayoutBadge);
        const defaultCount = await allDefaultBadges.count();
        expect(defaultCount).toBe(1);
        
        console.log(`Successfully removed default status from "${currentDefaultLayoutName}" and set it to "${newDefaultLayoutName}"`);
      } else {
        console.log('Could not find both a current default and another layout to test default removal');
      }
    } else {
      console.log('Need at least 2 layouts to test default removal functionality');
    }
  });

  test('7. Test default layout persistence after page refresh', async ({ page }) => {
    console.log('Testing default layout persistence after page refresh...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the current default layout
    const layoutItems = page.locator(selectors.layoutItem);
    let initialDefaultLayoutName = '';
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
      
      if (isDefault) {
        initialDefaultLayoutName = await layoutItem.locator(selectors.layoutName).textContent();
        break;
      }
    }
    
    // Close the modal
    await page.locator(selectors.closeModalButton).click();
    await page.waitForTimeout(500);
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Login again
    await page.fill(selectors.usernameInput, adminUser);
    await page.fill(selectors.passwordInput, adminPassword);
    await page.click(selectors.loginButton);
    await page.waitForURL(`${baseUrl}/**`);
    await page.waitForTimeout(1000);
    
    // Navigate back to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the default layout after refresh
    const refreshedLayoutItems = page.locator(selectors.layoutItem);
    let refreshedDefaultLayoutName = '';
    
    for (let i = 0; i < await refreshedLayoutItems.count(); i++) {
      const layoutItem = refreshedLayoutItems.nth(i);
      const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
      
      if (isDefault) {
        refreshedDefaultLayoutName = await layoutItem.locator(selectors.layoutName).textContent();
        break;
      }
    }
    
    // Verify that the same layout is still marked as default
    expect(initialDefaultLayoutName).toBe(refreshedDefaultLayoutName);
    
    if (initialDefaultLayoutName) {
      console.log(`Default layout persisted after refresh: ${initialDefaultLayoutName}`);
    } else {
      console.log('No default layout found to test persistence');
    }
  });

  test('8. Monitor console logs during default layout operations', async ({ page }) => {
    console.log('Monitoring console logs during default layout operations...');
    
    // Set up console log monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find layouts to test default functionality
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount >= 2) {
      // Find current default layout and another layout
      let currentDefaultLayoutName = '';
      let newDefaultLayoutName = '';
      let newDefaultSetButton = null;
      
      for (let i = 0; i < layoutCount; i++) {
        const layoutItem = layoutItems.nth(i);
        const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
        const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
        
        if (isDefault) {
          currentDefaultLayoutName = layoutName || '';
        } else if (newDefaultSetButton === null) {
          // Found a non-default layout to set as default
          newDefaultSetButton = layoutItem.locator(selectors.setDefaultButton);
          newDefaultLayoutName = layoutName || '';
        }
      }
      
      if (currentDefaultLayoutName && newDefaultLayoutName && newDefaultSetButton) {
        // Perform default layout operation
        await newDefaultSetButton.click();
        await page.waitForTimeout(1000);
        
        // Check for console errors after the operation
        if (consoleErrors.length > 0) {
          console.log('Console errors/warnings detected during default layout operation:');
          consoleErrors.forEach(error => console.log(`  ${error}`));
        } else {
          console.log('No console errors detected during default layout operations');
        }
        
        // Verify the operation worked despite any warnings
        const newDefaultLayoutLocator = page.locator(`text=${newDefaultLayoutName}`).locator('..');
        await expect(newDefaultLayoutLocator.locator(selectors.defaultLayoutBadge)).toBeVisible();
      }
    }
    
    // Verify no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Error') || error.includes('error') || error.includes('Failed')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('Console log monitoring completed for default layout operations');
  });

  test('9. Monitor network requests during default layout operations', async ({ page }) => {
    console.log('Monitoring network requests during default layout operations...');
    
    // Track network requests
    const networkRequests: { method: string; url: string; status: number }[] = [];
    
    page.on('requestfinished', request => {
      const response = request.response();
      if (response) {
        const url = request.url();
        if (url.includes('/api/grid-layouts/') && url.includes('/set-default')) {
          networkRequests.push({
            method: request.method(),
            url: url,
            status: response.status()
          });
        }
      }
    });
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find a layout to set as default
    const layoutItems = page.locator(selectors.layoutItem);
    let layoutToSetDefault: { name: string; button: any } | null = null;
    
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const isDefault = await layoutItem.locator(selectors.defaultLayoutBadge).isVisible();
      
      if (!isDefault) {
        const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
        const setDefaultButton = layoutItem.locator(selectors.setDefaultButton);
        layoutToSetDefault = { name: layoutName || '', button: setDefaultButton };
        break;
      }
    }
    
    if (layoutToSetDefault) {
      // Perform the set default operation
      await layoutToSetDefault.button.click();
      await page.waitForTimeout(1500);
      
      // Check network requests
      const setDefaultRequests = networkRequests.filter(req => 
        req.url.includes('/set-default') && req.method === 'PUT'
      );
      
      expect(setDefaultRequests.length).toBeGreaterThan(0);
      
      for (const req of setDefaultRequests) {
        console.log(`Network request: ${req.method} ${req.url} -> ${req.status}`);
        expect(req.status).toBe(200); // Expect success status
      }
      
      console.log(`Successfully monitored network requests for setting "${layoutToSetDefault.name}" as default`);
    } else {
      console.log('No non-default layout found to test network requests');
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
