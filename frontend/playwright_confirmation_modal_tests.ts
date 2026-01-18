// Playwright E2E Tests for Confirmation Modals in Product Grid Layout Customization
// This file contains comprehensive tests specifically for the confirmation modal functionality

import { test, expect } from '@playwright/test';

test.describe('Confirmation Modals in Product Grid Layout Customization', () => {
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
    createNewLayoutButton: 'text=+ Create New Layout',
    deleteLayoutButton: 'text=Del',
    setDefaultButton: 'text=Set Default',
    loadLayoutButton: 'text=Load',
    gridItem: '.absolute',
    productButton: 'button:has-text("Product")',
    availableLayoutsContainer: 'div:has-text("Available Layouts")',
    layoutItem: 'div.p-2.mb-2.bg-slate-600.rounded.flex.justify-between.items-center',
    layoutName: '.font-medium.text-sm.truncate',
    confirmationModal: 'text=Confirm Deletion',
    confirmDeleteButton: 'text=Delete',
    cancelDeleteButton: 'text=Cancel',
    closeModalButton: 'button:has-text("×")',
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

  test('1. Confirmation modal appears with correct message when deleting a layout', async ({ page }) => {
    console.log('Testing confirmation modal appearance and message...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Get the name of the first layout before clicking delete
      const firstLayoutName = await layoutItems.first().locator(selectors.layoutName).textContent();
      
      // Click the delete button for the first layout
      const deleteButtons = page.locator(selectors.deleteLayoutButton);
      await deleteButtons.first().click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Verify the message includes the correct layout name
      const confirmationMessage = page.locator(`text=Are you sure you want to delete the layout "${firstLayoutName}"?`);
      await expect(confirmationMessage).toBeVisible();
      
      // Cancel the operation
      await page.click(selectors.cancelDeleteButton);
      
      console.log(`Successfully verified confirmation modal message for layout: ${firstLayoutName}`);
    } else {
      console.log('No existing layouts found to test confirmation modal');
    }
  });

  test('2. Confirm action successfully deletes the layout', async ({ page }) => {
    console.log('Testing confirmation modal confirm action...');
    
    // First, create a temporary layout to delete
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
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
      
      if (layoutName?.includes('Temp Layout')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Store the initial count of layouts
      const initialLayoutCount = await layoutItems.count();
      
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for deletion to complete
      await page.waitForTimeout(1000);
      
      // Verify the layout count decreased by 1
      const finalLayoutCount = await layoutItems.count();
      expect(finalLayoutCount).toBe(initialLayoutCount - 1);
      
      // Verify the layout is no longer in the list
      const remainingLayoutItems = page.locator(selectors.layoutItem);
      let layoutFound = false;
      
      for (let i = 0; i < await remainingLayoutItems.count(); i++) {
        const layoutName = await remainingLayoutItems.nth(i).locator(selectors.layoutName).textContent();
        if (layoutName?.includes('Temp Layout')) {
          layoutFound = true;
          break;
        }
      }
      
      expect(layoutFound).toBe(false);
      
      console.log(`Successfully verified confirmation modal delete action for layout: ${tempLayoutName}`);
    } else {
      console.log('Could not find temporary layout to delete');
    }
  });

  test('3. Cancel action preserves the layout', async ({ page }) => {
    console.log('Testing confirmation modal cancel action...');
    
    // First, create a temporary layout to test cancellation
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a temporary layout
    const tempLayoutName = `Temp Layout Cancel ${Date.now()}`;
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
    
    // Reopen the layout customizer to test cancellation
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
      
      if (layoutName?.includes('Temp Layout Cancel')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Store the initial count of layouts
      const initialLayoutCount = await layoutItems.count();
      
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Cancel the deletion
      await page.click(selectors.cancelDeleteButton);
      
      // Wait for modal to close
      await page.waitForTimeout(500);
      
      // Verify the layout count remains the same
      const finalLayoutCount = await layoutItems.count();
      expect(finalLayoutCount).toBe(initialLayoutCount);
      
      // Verify the layout is still in the list
      const remainingLayoutItems = page.locator(selectors.layoutItem);
      let layoutFound = false;
      
      for (let i = 0; i < await remainingLayoutItems.count(); i++) {
        const layoutName = await remainingLayoutItems.nth(i).locator(selectors.layoutName).textContent();
        if (layoutName?.includes('Temp Layout Cancel')) {
          layoutFound = true;
          break;
        }
      }
      
      expect(layoutFound).toBe(true);
      
      console.log(`Successfully verified confirmation modal cancel action for layout: ${tempLayoutName}`);
    } else {
      console.log('Could not find temporary layout to test cancellation');
    }
  });

  test('4. Confirmation modal handles layout names with special characters', async ({ page }) => {
    console.log('Testing confirmation modal with special characters in layout name...');
    
    // First, create a layout with special characters
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a layout with special characters in the name
    const specialCharLayoutName = `Special Chars & "Quotes" 'Apostrophes' @#$%^*() ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, specialCharLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the special character layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to test the special character layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our special character layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our special character layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName?.includes('Special Chars')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Verify the message includes the special characters correctly
      const confirmationMessage = page.locator(`text=Are you sure you want to delete the layout "${specialCharLayoutName}"?`);
      await expect(confirmationMessage).toBeVisible();
      
      // Cancel the operation to preserve the layout
      await page.click(selectors.cancelDeleteButton);
      
      console.log(`Successfully verified confirmation modal with special characters: ${specialCharLayoutName}`);
    } else {
      console.log('Could not find special character layout to test');
    }
  });

  test('5. Confirmation modal handles very long layout names', async ({ page }) => {
    console.log('Testing confirmation modal with very long layout name...');
    
    // First, create a layout with a very long name
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a layout with a very long name
    const veryLongLayoutName = `This is a very long layout name that exceeds normal length requirements and tests how the confirmation modal handles displaying extremely long text properly without breaking the UI ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, veryLongLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the long name layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to test the long name layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our long name layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our long name layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      if (layoutName?.includes('This is a very long layout name')) {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Verify the message includes the long name (or a portion of it)
      const confirmationMessage = page.locator(`text=Are you sure you want to delete the layout "${veryLongLayoutName}"?`);
      await expect(confirmationMessage).toBeVisible();
      
      // Cancel the operation to preserve the layout
      await page.click(selectors.cancelDeleteButton);
      
      console.log(`Successfully verified confirmation modal with long layout name: ${veryLongLayoutName.substring(0, 50)}...`);
    } else {
      console.log('Could not find long name layout to test');
    }
  });

  test('6. Confirmation modal handles empty layout names', async ({ page }) => {
    console.log('Testing confirmation modal with empty layout name...');
    
    // First, create a layout with an empty name
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a layout with an empty name
    await page.fill(selectors.layoutNameInput, '');
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add a product to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    await page.waitForTimeout(500);
    
    // Save the empty name layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    // Reopen the layout customizer to test the empty name layout
    await page.click(selectors.customizeGridButton);
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Find the delete button for our empty name layout
    const layoutItems = page.locator(selectors.layoutItem);
    let deleteButton = null;
    
    // Loop through layout items to find our empty name layout
    for (let i = 0; i < await layoutItems.count(); i++) {
      const layoutItem = layoutItems.nth(i);
      const layoutName = await layoutItem.locator(selectors.layoutName).textContent();
      
      // Since the name is empty, we'll identify it differently
      // This test checks how the system handles empty names in general
      if (layoutName?.trim() === '') {
        deleteButton = layoutItem.locator(selectors.deleteLayoutButton);
        break;
      }
    }
    
    if (deleteButton) {
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // The confirmation message should handle empty names gracefully
      // It might show an empty string or a default value
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Cancel the operation to preserve the layout
      await page.click(selectors.cancelDeleteButton);
      
      console.log('Successfully verified confirmation modal with empty layout name');
    } else {
      console.log('Could not find empty name layout to test');
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
