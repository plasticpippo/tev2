import { test, expect } from '@playwright/test';

// Test loading indicators for various operations
test.describe('Loading Indicators Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://192.168.1.241:3000');
    
    // Login as admin
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/pos');
  });

  test('should show loading indicator when saving product', async ({ page }) => {
    // Navigate to product management
    await page.click('text=Admin Panel');
    await page.click('text=Product Management');
    
    // Click add product
    await page.click('button:has-text("Add Product")');
    
    // Fill in product details
    await page.fill('[placeholder="e.g., Merlot"]', 'Test Product');
    await page.click('select >> nth=0');
    await page.click('text=Select a category...');
    await page.click('text=Beverages'); // assuming Beverages category exists
    
    // Click save and check for loading indicator
    await page.click('button:has-text("Save Product")');
    
    // Check that loading indicator appears
    await expect(page.locator('text=Saving...')).toBeVisible();
    
    // Wait for save to complete
    await page.waitForSelector('button:has-text("Save Product")', { state: 'detached' });
  });

  test('should show loading indicator when deleting product', async ({ page }) => {
    // Navigate to product management
    await page.click('text=Admin Panel');
    await page.click('text=Product Management');
    
    // Find a product and click delete
    const deleteButton = page.locator('.flex.items-center.gap-2 >> button:has-text("Delete")').first();
    await deleteButton.click();
    
    // Confirm deletion in modal
    await page.click('button:has-text("Delete")');
    
    // Check that loading indicator appears
    await expect(page.locator('text=Deleting...')).toBeVisible();
    
    // Wait for deletion to complete
    await page.waitForSelector('text=Deleting...', { state: 'detached' });
  });

  test('should show loading indicator when saving stock item', async ({ page }) => {
    // Navigate to inventory management
    await page.click('text=Admin Panel');
    await page.click('text=Inventory Management');
    
    // Click add stock item
    await page.click('button:has-text("Add Stock Item")');
    
    // Fill in stock item details
    await page.fill('input[placeholder="e.g., Wine Glasses"]', 'Test Stock Item');
    await page.fill('input[placeholder="e.g., pcs, ml, g"]', 'pcs');
    
    // Click save and check for loading indicator
    await page.click('button:has-text("Save")');
    
    // Check that loading indicator appears
    await expect(page.locator('text=Saving...')).toBeVisible();
    
    // Wait for save to complete
    await page.waitForSelector('button:has-text("Save")', { state: 'detached' });
  });

  test('should show loading indicator when deleting stock item', async ({ page }) => {
    // Navigate to inventory management
    await page.click('text=Admin Panel');
    await page.click('text=Inventory Management');
    
    // Find a stock item and click delete
    const deleteButton = page.locator('.flex.items-center.gap-2 >> button:has-text("Delete")').first();
    await deleteButton.click();
    
    // Confirm deletion in modal
    await page.click('button:has-text("Confirm")');
    
    // Check that loading indicator appears
    await expect(page.locator('text=Deleting...')).toBeVisible();
    
    // Wait for deletion to complete
    await page.waitForSelector('text=Deleting...', { state: 'detached' });
  });
});
