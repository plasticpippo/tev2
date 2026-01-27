import { test, expect } from '@playwright/test';

test.describe('Grid Size Verification Test', () => {
  test('should verify grid is now 4x5 in edit mode', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://192.168.1.241:3000');
    
    // Login with admin credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to main page
    await page.waitForURL('http://192.168.1.241:3000/**');
    
    // Select a category to view the grid
    const categoryTabs = page.locator('.category-tab');
    if (await categoryTabs.count() > 0) {
      await categoryTabs.first().click();
    }
    
    // Enter edit mode
    const editModeButton = page.locator('button:has-text("Edit Layout")');
    if (await editModeButton.isVisible()) {
      await editModeButton.click();
    }
    
    // Wait for edit mode to activate
    await page.waitForTimeout(1000);
    
    // Take a screenshot to visually verify the grid
    await page.screenshot({ 
      path: './test-files/grid-verification.png',
      fullPage: true 
    });
    
    // Verify that the grid has at least 5 rows by checking the grid structure
    const gridCells = page.locator('[class*="border-dashed"]');
    const cellCount = await gridCells.count();
    
    // In a 4x5 grid, we should have at least 20 cells (4 columns x 5 rows)
    // Even if there are fewer products, the grid should still show 5 rows minimum
    expect(cellCount).toBeGreaterThanOrEqual(20); // 4 columns x 5 rows = 20 cells minimum
    
    console.log(`Grid verification: Found ${cellCount} grid cells`);
    console.log('Grid should now display minimum 5 rows instead of the previous 3 rows');
  });
});