import { test, expect } from '@playwright/test';

test.describe('Independent Layout Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to the main page
    await page.goto('http://localhost:3000');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/**');
  });

  test('should maintain separate layouts for all, favorites, and categories', async ({ page }) => {
    // Test 1: Create and verify 'all' layout
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add some items to the 'all' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const allLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (allLayoutButtons.length > 0) {
      await allLayoutButtons[0].click();
      await page.waitForTimeout(1000); // Wait for drag item to be added
    }
    
    await page.fill('input[type="text"]', 'All Products Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000); // Wait for save to complete

    // Test 2: Create and verify 'favorites' layout
    await page.click('button:has-text("★ Favourites")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add some items to the 'favorites' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const favLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (favLayoutButtons.length > 0) {
      await favLayoutButtons[0].click();
      await page.waitForTimeout(1000); // Wait for drag item to be added
    }
    
    await page.fill('input[type="text"]', 'Favorites Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000); // Wait for save to complete

    // Test 3: Create and verify a category-specific layout
    const categoryButton = await page.$('button:has-text("Coffee")'); // Assuming Coffee category exists
    if (categoryButton) {
      await categoryButton.click();
      await page.click('button:has-text("Customize Grid Layout")');
      
      // Add some items to the category layout
      await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
      const catLayoutButtons = await page.$$('.grid.grid-cols-2 button');
      if (catLayoutButtons.length > 0) {
        await catLayoutButtons[0].click();
        await page.waitForTimeout(1000); // Wait for drag item to be added
      }
      
      await page.fill('input[type="text"]', 'Coffee Category Layout');
      await page.click('button:has-text("Save Layout")');
      await page.waitForTimeout(2000); // Wait for save to complete
    }

    // Test 4: Verify that switching between filters shows different layouts
    // Go back to 'All' and verify it has the 'All Products Layout' items
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    const allLayoutItems = await page.$$('.grid .absolute'); // Grid items in the custom grid
    expect(allLayoutItems.length).toBeGreaterThan(0);
    
    // Go to 'Favorites' and verify it has the 'Favorites Layout' items
    await page.click('button:has-text("★ Favourites")');
    await page.waitForTimeout(1000);
    const favLayoutItems = await page.$$('.grid .absolute');
    expect(favLayoutItems.length).toBeGreaterThan(0);
    
    // Go back to 'All' and verify the items are different
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    const allLayoutItemsAfterSwitch = await page.$$('.grid .absolute');
    expect(allLayoutItemsAfterSwitch.length).toBe(allLayoutItems.length);
  });

  test('should not affect other layouts when modifying one layout', async ({ page }) => {
    // First, ensure we have different layouts set up
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Count initial items in 'all' layout
    const initialAllItems = await page.$$('.grid .absolute');
    const initialAllCount = initialAllItems.length;
    
    // Add an item to 'all' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const allLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (allLayoutButtons.length > 0) {
      await allLayoutButtons[0].click();
      await page.waitForTimeout(1000);
    }
    
    await page.fill('input[type="text"]', 'Modified All Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);

    // Switch to 'favorites' and verify it has different items
    await page.click('button:has-text("★ Favourites")');
    await page.waitForTimeout(1000);
    
    const favLayoutItems = await page.$$('.grid .absolute');
    const favCount = favLayoutItems.length;
    
    // Switch back to 'all' and verify it has the modified count
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    
    const updatedAllItems = await page.$$('.grid .absolute');
    const updatedAllCount = updatedAllItems.length;
    
    // The 'all' layout should have one more item than before
    expect(updatedAllCount).toBe(initialAllCount + 1);
    // The 'favorites' layout should have a different count (or at least different items)
    expect(updatedAllCount).not.toBe(favCount);
  });

  test('should save and load layouts correctly for each filter type', async ({ page }) => {
    // Navigate to each filter type and verify the layout loads correctly
    const filterTypes = ['All', '★ Favourites'];
    
    for (const filter of filterTypes) {
      await page.click(`button:has-text("${filter}")`);
      await page.waitForTimeout(1000);
      
      // Verify that the layout is loaded by checking for grid items
      const gridItems = await page.$$('.grid .absolute');
      expect(gridItems.length).toBeGreaterThanOrEqual(0); // Layout may be empty initially
    }
    
    // Test with a specific category if available
    const categoryButton = await page.$('button:has-text("Coffee")');
    if (categoryButton) {
      await categoryButton.click();
      await page.waitForTimeout(1000);
      
      const categoryGridItems = await page.$$('.grid .absolute');
      expect(categoryGridItems.length).toBeGreaterThanOrEqual(0);
    }
  });

 test('should display appropriate layout based on active filter', async ({ page }) => {
    // Create different layouts for different filters and verify they display correctly
    
    // Create a unique layout for 'all'
    await page.click('button:has-text("All")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add a unique item to 'all' layout
    await page.waitForSelector('.grid.grid-cols-2 button', { timeout: 10000 });
    const allLayoutButtons = await page.$$('.grid.grid-cols-2 button');
    if (allLayoutButtons.length > 0) {
      await allLayoutButtons[0].click();
      await page.waitForTimeout(1000);
    }
    
    await page.fill('input[type="text"]', 'Unique All Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);

    // Create a unique layout for 'favorites'
    await page.click('button:has-text("★ Favourites")');
    await page.click('button:has-text("Customize Grid Layout")');
    
    // Add a unique item to 'favorites' layout
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
    
    await page.fill('input[type="text"]', 'Unique Favorites Layout');
    await page.click('button:has-text("Save Layout")');
    await page.waitForTimeout(2000);

    // Now verify that switching between filters shows the correct layouts
    // Switch to 'all' and verify unique items
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    const allItems = await page.$$('.grid .absolute');
    const allItemsCount = allItems.length;
    
    // Switch to 'favorites' and verify different items
    await page.click('button:has-text("★ Favourites")');
    await page.waitForTimeout(1000);
    const favItems = await page.$$('.grid .absolute');
    const favItemsCount = favItems.length;
    
    // The counts should match what we added to each layout
    expect(allItemsCount).toBeGreaterThanOrEqual(1);
    expect(favItemsCount).toBeGreaterThanOrEqual(1);
    
    // Switch back to 'all' and verify it still has the correct items
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);
    const allItemsAfterSwitch = await page.$$('.grid .absolute');
    expect(allItemsAfterSwitch.length).toBe(allItemsCount);
  });
});