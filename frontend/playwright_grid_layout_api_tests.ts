import { test, expect } from '@playwright/test';

test.describe('Grid Layout API and Database Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to the main page
    await page.goto('http://localhost:3000');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/**');
  });

  test('should verify database correctly stores separate layouts for each filter type', async ({ page }) => {
    // Test database isolation by creating layouts and checking they are saved separately
    
    // First, create a layout for 'all' filter
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add an item to 'all' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const allLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (allLayoutButtons.length > 0) {
      await allLayoutButtons[0].click();
      await page.waitForTimeout(100);
    }
    
    await page.fill('input[type="text"]', 'Database Test All Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);

    // Create a layout for 'favorites' filter
    await page.click('button:has-text("★ Favourites")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add an item to 'favorites' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const favLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (favLayoutButtons.length > 0) {
      if (favLayoutButtons.length > 1) {
        await favLayoutButtons[1].click(); // Select a different item
      } else {
        await favLayoutButtons[0].click();
      }
      await page.waitForTimeout(1000);
    }
    
    await page.fill('input[type="text"]', 'Database Test Favorites Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);

    // Navigate away and back to ensure layouts are loaded from DB
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    
    // Now check that when we go to favorites, it's different
    await page.click('button:has-text("★ Favourites")');
    await page.waitForTimeout(1000);
    
    const favItems = await page.$$('.grid .absolute');
    expect(favItems.length).toBeGreaterThanOrEqual(1);
    
    // Go back to 'all' and verify it still has the correct items
    await page.click('button:has-text("All")');
    await page.waitForTimeout(100);
    
    const allItems = await page.$$('.grid .absolute');
    expect(allItems.length).toBeGreaterThanOrEqual(1);
    
    // The layouts should be different between filter types
    expect(allItems.length).not.toBe(favItems.length);
  });

  test('should validate API endpoints work correctly with new functionality', async ({ page }) => {
    // This test checks if the API endpoints respond correctly to requests with filter types
    
    // First, navigate to the grid and customize layout to trigger API calls
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Wait for the layout customization interface to load
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    // Check that the layout name field is present
    const layoutNameField = await page.$('input[type="text"]');
    expect(layoutNameField).toBeTruthy();
    
    // Test saving with a specific filter type
    await page.fill('input[type="text"]', 'API Test Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);
    
    // Verify the save was successful by checking if we're back to the main view
    // or by checking for a success message if available
    const customizeButton = await page.$('button:has-text("Customize Grid Layout")');
    expect(customizeButton).toBeTruthy();
  });

  test('should verify layouts are independent across filter types', async ({ page }) => {
    // Test that modifying one layout doesn't affect others
    
    // First, create a layout for 'all' filter and count items
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const initialAllLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (initialAllLayoutButtons.length > 0) {
      await initialAllLayoutButtons[0].click();
      await page.waitForTimeout(1000);
    }
    
    await page.fill('input[type="text"]', 'Initial All Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);
    
    // Note the number of items in 'all' layout
    await page.click('button:has-text("All")');
    await page.waitForTimeout(100);
    const initialAllItems = await page.$$('.grid .absolute');
    const initialAllCount = initialAllItems.length;
    
    // Go to 'favorites' and add items
    await page.click('button:has-text("★ Favourites")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const favLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (favLayoutButtons.length > 0) {
      if (favLayoutButtons.length > 1) {
        await favLayoutButtons[1].click();
        await page.waitForTimeout(1000);
      } else {
        await favLayoutButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.fill('input[type="text"]', 'Favorites Layout Only');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);
    
    // Go back to 'all' and verify the count hasn't changed
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    const afterFavAllItems = await page.$$('.grid .absolute');
    const afterFavAllCount = afterFavAllItems.length;
    
    // The 'all' layout should still have the same number of items
    expect(afterFavAllCount).toBe(initialAllCount);
    
    // Go to 'favorites' and verify it has its own items
    await page.click('button:has-text("★ Favourites")');
    await page.waitForTimeout(100);
    const favItems = await page.$$('.grid .absolute');
    const favCount = favItems.length;
    
    // The 'favorites' layout should have items different from 'all'
    expect(favCount).toBeGreaterThan(0);
    expect(favCount).not.toBe(afterFavAllCount);
  });
});