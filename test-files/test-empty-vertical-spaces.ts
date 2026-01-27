import { test, expect } from '@playwright/test';

/**
 * Test for empty vertical spaces in layout (non-sequential row placement)
 * This test verifies that the layout system preserves empty rows between buttons
 */

test.describe('Empty Vertical Spaces in Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('http://192.168.1.241:3000');
    
    // Login as admin
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/pos');
  });

  test('should preserve empty rows between positioned buttons', async ({ page }) => {
    // Enable edit mode
    await page.click('button:has-text("Edit Layout")');
    
    // Wait for edit mode to activate
    await page.waitForSelector('.grid-template-columns');
    
    // Find a category to test with
    await page.click('button:has-text("Test Category")'); // Assuming there's a test category
    
    // Place a button at row 1, column 1
    const firstButton = await page.locator('.draggable-product-button').first();
    await firstButton.dragTo(page.locator('[data-grid-cell="1-1"]'));
    
    // Place another button at row 5, column 1 (skipping rows 2, 3, 4)
    const secondButton = await page.locator('.draggable-product-button').nth(1);
    await secondButton.dragTo(page.locator('[data-grid-cell="5-1"]'));
    
    // Verify that there are empty rows between the buttons
    const row2 = await page.locator('[data-row="2"]').count();
    const row3 = await page.locator('[data-row="3"]').count();
    const row4 = await page.locator('[data-row="4"]').count();
    
    expect(row2).toBeGreaterThan(0); // Row 2 should exist
    expect(row3).toBeGreaterThan(0); // Row 3 should exist
    expect(row4).toBeGreaterThan(0); // Row 4 should exist
    
    // Check that rows 2, 3, 4 are empty (no buttons)
    const row2Buttons = await page.locator('[data-row="2"] .draggable-product-button').count();
    const row3Buttons = await page.locator('[data-row="3"] .draggable-product-button').count();
    const row4Buttons = await page.locator('[data-row="4"] .draggable-product-button').count();
    
    expect(row2Buttons).toBe(0); // Should be empty
    expect(row3Buttons).toBe(0); // Should be empty
    expect(row4Buttons).toBe(0); // Should be empty
    
    // Save the layout
    await page.click('button:has-text("Save Layout")');
    
    // Exit edit mode
    await page.click('button:has-text("Exit Edit Mode")');
    
    // Verify the layout is preserved after exiting edit mode
    // The empty rows should still be visible
    await expect(page.locator('[data-row="2"]')).toBeVisible();
    await expect(page.locator('[data-row="3"]')).toBeVisible();
    await expect(page.locator('[data-row="4"]')).toBeVisible();
  });

  test('should maintain exact row positions after refresh', async ({ page }) => {
    // Enable edit mode
    await page.click('button:has-text("Edit Layout")');
    
    // Place buttons at specific non-sequential rows
    const firstButton = await page.locator('.draggable-product-button').first();
    await firstButton.dragTo(page.locator('[data-grid-cell="1-1"]')); // Row 1, Col 1
    
    const secondButton = await page.locator('.draggable-product-button').nth(1);
    await secondButton.dragTo(page.locator('[data-grid-cell="3-2"]')); // Row 3, Col 2
    
    const thirdButton = await page.locator('.draggable-product-button').nth(2);
    await thirdButton.dragTo(page.locator('[data-grid-cell="6-1"]')); // Row 6, Col 1
    
    // Verify rows 2, 4, 5 are empty
    const row2HasButton = await page.locator('[data-row="2"] .draggable-product-button').isVisible();
    const row4HasButton = await page.locator('[data-row="4"] .draggable-product-button').isVisible();
    const row5HasButton = await page.locator('[data-row="5"] .draggable-product-button').isVisible();
    
    expect(row2HasButton).toBe(false);
    expect(row4HasButton).toBe(false);
    expect(row5HasButton).toBe(false);
    
    // Save layout
    await page.click('button:has-text("Save Layout")');
    
    // Refresh the page
    await page.reload();
    
    // Login again if needed
    if (await page.isVisible('input[name="username"]')) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos');
    }
    
    // Re-enter edit mode
    await page.click('button:has-text("Edit Layout")');
    
    // Verify that the layout is preserved after refresh
    // Buttons should still be at their exact positions
    const buttonAtRow1 = await page.locator('[data-row="1"] .draggable-product-button').count();
    const buttonAtRow3 = await page.locator('[data-row="3"] .draggable-product-button').count();
    const buttonAtRow6 = await page.locator('[data-row="6"] .draggable-product-button').count();
    
    expect(buttonAtRow1).toBeGreaterThanOrEqual(1); // At least 1 button at row 1
    expect(buttonAtRow3).toBeGreaterThanOrEqual(1); // At least 1 button at row 3
    expect(buttonAtRow6).toBeGreaterThanOrEqual(1); // At least 1 button at row 6
    
    // Verify rows 2, 4, 5 are still empty
    expect(await page.locator('[data-row="2"] .draggable-product-button').count()).toBe(0);
    expect(await page.locator('[data-row="4"] .draggable-product-button').count()).toBe(0);
    expect(await page.locator('[data-row="5"] .draggable-product-button').count()).toBe(0);
  });

  test('should expand grid to accommodate high row numbers', async ({ page }) => {
    // Enable edit mode
    await page.click('button:has-text("Edit Layout")');
    
    // Place a button at a high row number (e.g., row 10)
    const button = await page.locator('.draggable-product-button').first();
    await button.dragTo(page.locator('[data-grid-cell="10-2"]')); // Row 10, Col 2
    
    // Verify the grid expands to show at least 10 rows
    const totalRows = await page.locator('[data-row]').count();
    expect(totalRows).toBeGreaterThanOrEqual(10);
    
    // Verify all intermediate rows (1-9) are visible even if empty
    for (let i = 1; i <= 9; i++) {
      await expect(page.locator(`[data-row="${i}"]`)).toBeVisible();
    }
    
    // Verify row 10 is visible
    await expect(page.locator('[data-row="10"]')).toBeVisible();
    
    // Save layout
    await page.click('button:has-text("Save Layout")');
    
    // Exit edit mode
    await page.click('button:has-text("Exit Edit Mode")');
    
    // The expanded grid should still be visible in normal mode
    await expect(page.locator('[data-row="10"]')).toBeVisible();
  });
});