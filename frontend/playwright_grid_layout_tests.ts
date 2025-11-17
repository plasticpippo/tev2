import { test, expect } from '@playwright/test';

test.describe('Product Grid Layout Customizer Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Login first if needed
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('http://localhost:3000/**');
  });

  test('1. Verify that layout customizations are properly reflected in the order view', async ({ page }) => {
    // Open the order panel (assuming it contains the product grid)
    await page.click('text=Order Panel'); // or however you navigate to the order panel
    
    // Click the "Customize Grid Layout" button
    await page.click('text=Customize Grid Layout');
    
    // Wait for the modal to appear
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Drag and drop a product to a new position
    const productItem = page.locator('.bg-slate-700').getByText('Drag products here').locator('..').locator('button').first();
    const gridArea = page.locator('.bg-slate-900');
    
    // Perform drag and drop operation
    await productItem.hover();
    await page.mouse.down();
    await gridArea.hover({ position: { x: 100, y: 100 } });
    await page.mouse.up();
    
    // Save the layout
    await page.fill('input[type="text"]', 'Test Layout');
    await page.locator('select').click();
    await page.locator('option').first().click(); // Select first till
    await page.click('text=Save Layout');
    
    // Close the modal
    await page.click('button:has-text("×")');
    
    // Verify that the custom layout is now visible in the product grid
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('2. Test that the favorites filtering works in the layout customization modal', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Click the favorites filter
    await page.click('text=★ Favourites');
    
    // Verify that only favorite products are shown
    // This requires checking the UI to ensure only favorite items are displayed
    const productButtons = page.locator('div.grid-cols-2 button');
    await expect(productButtons).toHaveCount(await getFavoriteProductsCount());
    
    // Turn off favorites filter
    await page.click('text=★ Favourites');
    
    // Verify that all products are shown again
    const allProductButtons = page.locator('div.grid-cols-2 button');
    await expect(allProductButtons).toHaveCount(await getAllProductsCount());
  });

  test('3. Test that the categories filtering works in the layout customization modal', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Get the first category button and click it
    const categoryButton = page.locator('button').filter({ hasText: /[^★]/ }).first(); // Exclude favorites button
    const categoryName = await categoryButton.textContent();
    await categoryButton.click();
    
    // Verify that only products from the selected category are shown
    // This requires checking the UI to ensure only category items are displayed
    const productButtons = page.locator('div.grid-cols-2 button');
    await expect(productButtons).toHaveCount(await getCategoryProductsCount(categoryName || ''));
    
    // Click "All" to reset the filter
    await page.click('text=All');
    
    // Verify that all products are shown again
    const allProductButtons = page.locator('div.grid.grid-cols-2 button');
    await expect(allProductButtons).toHaveCount(await getAllProductsCount());
  });

  test('4. Verify that both favorites and categories filtering can work together in the modal', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Get the first category (not favorites)
    const categoryButton = page.locator('button').filter({ hasText: /[^★]/ }).first();
    const categoryName = await categoryButton.textContent();
    await categoryButton.click();
    
    // Then click favorites filter
    await page.click('text=★ Favourites');
    
    // Verify that only favorite products from the selected category are shown
    const productButtons = page.locator('div.grid-cols-2 button');
    await expect(productButtons).toHaveCount(await getCategoryFavoriteProductsCount(categoryName || ''));
    
    // Test clearing both filters
    await page.click('text=All');
    
    // Verify that all products are shown again
    const allProductButtons = page.locator('div.grid.grid-cols-2 button');
    await expect(allProductButtons).toHaveCount(await getAllProductsCount());
  });

 test('5. Ensure the drag-and-drop functionality still works properly with the new filtering', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Apply a filter (favorites)
    await page.click('text=★ Favourites');
    
    // Drag and drop an item from the filtered list to the grid
    const productItem = page.locator('div.grid.grid-cols-2 button').first();
    const gridArea = page.locator('.bg-slate-900');
    
    await productItem.hover();
    await page.mouse.down();
    await gridArea.hover({ position: { x: 100, y: 100 } });
    await page.mouse.up();
    
    // Verify that the item was added to the grid
    await expect(page.locator('.absolute')).toHaveCount(1);
    
    // Apply another filter (category) and verify drag-and-drop still works
    await page.click('text=All'); // Reset filters first
    const categoryButton = page.locator('button').filter({ hasText: /[^★]/ }).first();
    await categoryButton.click();
    
    // Drag another item
    const anotherProductItem = page.locator('div.grid-cols-2 button').first();
    await anotherProductItem.hover();
    await page.mouse.down();
    await gridArea.hover({ position: { x: 200, y: 100 } });
    await page.mouse.up();
    
    // Verify that both items are in the grid
    await expect(page.locator('.absolute')).toHaveCount(2);
  });

 test('6. Confirm that saving layouts works correctly with the filtered products', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Apply a filter and add some items to the grid
    await page.click('text=★ Favourites');
    
    const productItem = page.locator('div.grid.grid-cols-2 button').first();
    const gridArea = page.locator('.bg-slate-900');
    
    await productItem.hover();
    await page.mouse.down();
    await gridArea.hover({ position: { x: 100, y: 100 } });
    await page.mouse.up();
    
    // Save the layout
    await page.fill('input[type="text"]', 'Filtered Layout Test');
    await page.locator('select').click();
    await page.locator('option').first().click(); // Select first till
    await page.click('text=Save Layout');
    
    // Verify success message or that the modal closes
    await expect(page.locator('text=Customize Product Grid Layout')).not.toBeVisible();
  });

  test('7. Validate that UI elements display correctly and are responsive', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Check that all UI elements are visible
    await expect(page.locator('text=Layout Settings')).toBeVisible();
    await expect(page.locator('text=Available Products')).toBeVisible();
    await expect(page.locator('text=Grid Layout')).toBeVisible();
    
    // Check filter buttons are visible
    await expect(page.locator('text=★ Favourites')).toBeVisible();
    await expect(page.locator('text=All')).toBeVisible();
    
    // Test responsiveness by resizing the window
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Resize back
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Close the modal
    await page.click('button:has-text("×")');
  });
});

// Helper functions to get product counts
async function getFavoriteProductsCount() {
 // In a real test, this would fetch data from the API or check the UI
  // For now, we'll return a placeholder
  return 5; // Placeholder value
}

async function getAllProductsCount() {
  // In a real test, this would fetch data from the API or check the UI
  // For now, we'll return a placeholder
  return 20; // Placeholder value
}

async function getCategoryProductsCount(categoryName: string) {
  // In a real test, this would fetch data from the API or check the UI
  // For now, we'll return a placeholder
  return 8; // Placeholder value
}

async function getCategoryFavoriteProductsCount(categoryName: string) {
  // In a real test, this would fetch data from the API or check the UI
  // For now, we'll return a placeholder
  return 3; // Placeholder value
}