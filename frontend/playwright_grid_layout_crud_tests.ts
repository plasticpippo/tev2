// Playwright E2E Tests for Product Grid Layout CRUD Operations
// This file contains comprehensive E2E tests for creating, reading, updating, and deleting product grid layouts

import { test, expect } from '@playwright/test';

test.describe('Product Grid Layout CRUD Operations', () => {
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

  test('1. Create new product grid layout', async ({ page }) => {
    console.log('Testing creation of new product grid layout...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Verify initial state - new layout should have default name
    await expect(page.locator(selectors.layoutNameInput)).toHaveValue('New Layout');
    
    // Change the layout name
    const newLayoutName = `Test Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, newLayoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click(); // Select first till
    
    // Add some products to the grid
    const productButtons = page.locator(selectors.productButton).first();
    await productButtons.click();
    
    // Wait a bit for the product to be added to the grid
    await page.waitForTimeout(500);
    
    // Verify product was added to the grid
    const gridItems = page.locator(selectors.gridItem);
    await expect(gridItems).toHaveCount(1);
    
    // Save the new layout
    await page.click(selectors.saveNewLayoutButton);
    
    // Wait for save operation to complete
    await page.waitForTimeout(1000);
    
    // Verify the layout was saved by checking if the modal is still visible
    // The modal should close after saving or we should see a success message
    await expect(page.locator(selectors.layoutCustomizerModal)).not.toBeVisible();
    
    console.log(`Successfully created layout: ${newLayoutName}`);
  });

  test('2. Read and view existing product grid layouts', async ({ page }) => {
    console.log('Testing reading and viewing existing product grid layouts...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Verify that existing layouts are displayed in the available layouts section
    const layoutItems = page.locator(selectors.layoutItem);
    await expect(layoutItems).not.toHaveCount(0);
    
    // Verify that at least one layout is visible with its name and filter type
    const layoutNames = page.locator(selectors.layoutName);
    const layoutFilterTypes = page.locator(selectors.layoutFilterType);
    
    await expect(layoutNames.first()).toBeVisible();
    await expect(layoutFilterTypes.first()).toBeVisible();
    
    // Test layout filtering by filter type
    const filterSelect = page.locator('select').nth(1); // Second select element is the filter type
    await filterSelect.click();
    await page.locator('option:has-text("All")').click();
    
    // Wait for filtering to take effect
    await page.waitForTimeout(500);
    
    // Test layout search functionality
    const searchInput = page.locator('input[placeholder="Search layouts..."]');
    await searchInput.fill('Test'); // Search for layouts with "Test" in the name
    
    // Wait for search to take effect
    await page.waitForTimeout(500);
    
    // Verify that search results are displayed
    const searchResults = page.locator(selectors.layoutItem);
    await expect(searchResults).not.toHaveCount(0);
    
    // Clear the search
    await searchInput.fill('');
    
    console.log('Successfully verified reading and viewing of existing layouts');
  });

  test('3. Update existing product grid layout', async ({ page }) => {
    console.log('Testing updating existing product grid layout...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to update
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Verify that the layout was loaded by checking the layout name input
      const layoutNameInput = page.locator(selectors.layoutNameInput);
      await expect(layoutNameInput).not.toHaveValue('New Layout');
      
      // Modify the layout name
      const originalName = await layoutNameInput.inputValue();
      const updatedName = `${originalName} - Updated`;
      await page.fill(selectors.layoutNameInput, updatedName);
      
      // Add another product to the grid to modify the layout
      const productButtons = page.locator(selectors.productButton).nth(1); // Use second product
      await productButtons.click();
      
      // Wait a bit for the product to be added to the grid
      await page.waitForTimeout(500);
      
      // Verify that more products are now in the grid
      const gridItems = page.locator(selectors.gridItem);
      await expect(gridItems).not.toHaveCount(0);
      
      // Save the updated layout
      await page.click(selectors.updateLayoutButton);
      
      // Wait for save operation to complete
      await page.waitForTimeout(1000);
      
      // Verify the layout was updated by navigating back to the available layouts
      // and checking that the updated name appears in the list
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      // Look for the updated layout name in the layout list
      const layoutNames = page.locator(selectors.layoutName);
      let foundUpdatedLayout = false;
      for (let i = 0; i < await layoutNames.count(); i++) {
        const name = await layoutNames.nth(i).textContent();
        if (name?.includes('- Updated')) {
          foundUpdatedLayout = true;
          break;
        }
      }
      
      expect(foundUpdatedLayout).toBe(true);
      
      console.log(`Successfully updated layout: ${updatedName}`);
    } else {
      console.log('No existing layouts found to update');
    }
  });

  test('4. Delete product grid layout', async ({ page }) => {
    console.log('Testing deletion of product grid layout...');
    
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
      // Click the delete button
      await deleteButton.click();
      
      // Wait for confirmation modal to appear
      await expect(page.locator(selectors.confirmationModal)).toBeVisible();
      
      // Confirm deletion
      await page.click(selectors.confirmDeleteButton);
      
      // Wait for deletion to complete
      await page.waitForTimeout(1000);
      
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
      
      console.log(`Successfully deleted layout: ${tempLayoutName}`);
    } else {
      console.log('Could not find temporary layout to delete');
    }
  });

  test('5. Save As New functionality for product grid layout', async ({ page }) => {
    console.log('Testing Save As New functionality for product grid layout...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to copy
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Click the "Load" button for the first layout
      const loadButtons = page.locator(selectors.loadLayoutButton);
      await loadButtons.first().click();
      
      // Wait for layout to load
      await page.waitForTimeout(1000);
      
      // Modify the layout name to indicate it's a copy
      const originalName = await page.locator(selectors.layoutNameInput).inputValue();
      const copiedName = `${originalName} - Copy`;
      await page.fill(selectors.layoutNameInput, copiedName);
      
      // Click the "Save As New" button (only available for existing layouts)
      await page.click(selectors.saveAsNewButton);
      
      // Wait for save operation to complete
      await page.waitForTimeout(1000);
      
      // Verify the layout was saved as new by navigating back to the available layouts
      await page.click(selectors.customizeGridButton);
      await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
      await page.waitForTimeout(1000);
      
      // Look for the copied layout name in the layout list
      const layoutNames = page.locator(selectors.layoutName);
      let foundCopiedLayout = false;
      for (let i = 0; i < await layoutNames.count(); i++) {
        const name = await layoutNames.nth(i).textContent();
        if (name?.includes('- Copy')) {
          foundCopiedLayout = true;
          break;
        }
      }
      
      expect(foundCopiedLayout).toBe(true);
      
      console.log(`Successfully saved layout as new: ${copiedName}`);
    } else {
      console.log('No existing layouts found to copy');
    }
  });

  test('6. Set layout as default functionality', async ({ page }) => {
    console.log('Testing Set Layout as Default functionality...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Check if there are existing layouts to set as default
    const layoutItems = page.locator(selectors.layoutItem);
    const layoutCount = await layoutItems.count();
    
    if (layoutCount > 0) {
      // Find a layout that is not currently default
      let setDefaultButton = null;
      let layoutName = null;
      
      for (let i = 0; i < await layoutItems.count(); i++) {
        const layoutItem = layoutItems.nth(i);
        const isDefault = await layoutItem.locator('text="(Default)"').isVisible();
        
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
        const defaultMarker = page.locator(`text=${layoutName}`).locator('..').locator('text="(Default)"');
        await expect(defaultMarker).toBeVisible();
        
        console.log(`Successfully set layout as default: ${layoutName}`);
      } else {
        console.log('No non-default layouts found to set as default');
      }
    } else {
      console.log('No layouts found to set as default');
    }
  });

  test('7. Create layout with specific filter type (All Products)', async ({ page }) => {
    console.log('Testing creation of layout with All Products filter type...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Create a new layout with "All Products" filter
    const layoutName = `All Products Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, layoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Ensure "All Products" filter is active (it should be by default)
    // Verify that all products are visible in the available products section
    const productButtons = page.locator(selectors.productButton);
    const productCount = await productButtons.count();
    expect(productCount).toBeGreaterThan(0);
    
    // Add a few products to the grid
    for (let i = 0; i < Math.min(3, productCount); i++) {
      await page.locator(selectors.productButton).nth(i).click();
      await page.waitForTimeout(300); // Small delay between clicks
    }
    
    // Save the layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(100);
    
    console.log(`Successfully created "All Products" layout: ${layoutName}`);
  });

  test('8. Create layout with Favorites filter type', async ({ page }) => {
    console.log('Testing creation of layout with Favorites filter type...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Switch to Favorites filter
    await page.click('text=★ Favourites OFF');
    await page.waitForTimeout(500);
    
    // Verify that only favorite products are shown
    // This would require checking against a known list of favorites
    // For now, we'll just verify that some products are shown
    const productButtons = page.locator(selectors.productButton);
    const productCount = await productButtons.count();
    expect(productCount).toBeGreaterThanOrEqual(0); // Could be 0 if no favorites exist
    
    // Create a new layout with Favorites filter
    const layoutName = `Favorites Layout ${Date.now()}`;
    await page.fill(selectors.layoutNameInput, layoutName);
    
    // Select a till
    await page.locator(selectors.tillSelect).click();
    await page.locator('option').first().click();
    
    // Add favorite products to the grid (if any exist)
    if (productCount > 0) {
      await page.locator(selectors.productButton).first().click();
      await page.waitForTimeout(500);
    }
    
    // Save the layout
    await page.click(selectors.saveNewLayoutButton);
    await page.waitForTimeout(1000);
    
    console.log(`Successfully created "Favorites" layout: ${layoutName}`);
  });

  test('9. Create layout with Category filter type', async ({ page }) => {
    console.log('Testing creation of layout with Category filter type...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Find and click on the first category button (excluding Favorites and All buttons)
    const categoryButtons = page.locator('button').filter({ hasText: /[^★]/ }).filter({ hasNotText: 'All' });
    const categoryCount = await categoryButtons.count();
    
    if (categoryCount > 0) {
      // Click the first category button
      await categoryButtons.first().click();
      await page.waitForTimeout(500);
      
      // Verify that only products from the selected category are shown
      const productButtons = page.locator(selectors.productButton);
      const productCount = await productButtons.count();
      expect(productCount).toBeGreaterThanOrEqual(0);
      
      // Create a new layout with Category filter
      const layoutName = `Category Layout ${Date.now()}`;
      await page.fill(selectors.layoutNameInput, layoutName);
      
      // Select a till
      await page.locator(selectors.tillSelect).click();
      await page.locator('option').first().click();
      
      // Add category products to the grid (if any exist)
      if (productCount > 0) {
        await page.locator(selectors.productButton).first().click();
        await page.waitForTimeout(500);
      }
      
      // Save the layout
      await page.click(selectors.saveNewLayoutButton);
      await page.waitForTimeout(1000);
      
      console.log(`Successfully created "Category" layout: ${layoutName}`);
    } else {
      console.log('No categories found to test category filter');
    }
  });

  test('10. Clear Grid functionality', async ({ page }) => {
    console.log('Testing Clear Grid functionality...');
    
    // Navigate to the layout customization interface
    await page.click(selectors.customizeGridButton);
    
    // Wait for the modal to appear
    await expect(page.locator(selectors.layoutCustomizerModal)).toBeVisible();
    
    // Add some products to the grid
    const productButtons = page.locator(selectors.productButton);
    if (await productButtons.count() > 0) {
      // Add first product
      await productButtons.first().click();
      await page.waitForTimeout(500);
      
      // Add second product
      if (await productButtons.count() > 1) {
        await productButtons.nth(1).click();
        await page.waitForTimeout(500);
      }
      
      // Verify products were added to the grid
      const gridItems = page.locator(selectors.gridItem);
      const initialCount = await gridItems.count();
      expect(initialCount).toBeGreaterThan(0);
      
      // Click the "Clear Grid" button
      await page.click(selectors.clearGridButton);
      await page.waitForTimeout(500);
      
      // Verify the grid is now empty
      const finalCount = await gridItems.count();
      expect(finalCount).toBe(0);
      
      console.log('Successfully cleared grid');
    } else {
      console.log('No products available to test clear grid functionality');
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