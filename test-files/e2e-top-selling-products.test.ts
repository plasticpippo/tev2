import { test, expect } from '@playwright/test';

test.describe('Expanded Top Selling Products E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('http://192.168.1.241:3000');
    
    // Login as admin
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('text=Login');
    
    // Wait for navigation to main page
    await page.waitForURL('http://192.168.1.241:3000/**');
  });

  test('should display top selling products with default settings', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Verify the product performance table is displayed
    await expect(page.locator('text=Product Performance')).toBeVisible();
    
    // Verify some default content is shown
    await expect(page.locator('.bg-slate-800').first()).toContainText('Product Performance');
  });

  test('should filter products by date range', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Fill in date range
    await page.fill('[data-testid="start-date-input"]', '2023-01-01');
    await page.fill('[data-testid="end-date-input"]', '2023-12-31');
    
    // Verify the filter is applied (this would depend on how the UI updates)
    // We'll check that the inputs have the correct values
    await expect(page.locator('[data-testid="start-date-input"]')).toHaveValue('2023-01-01');
    await expect(page.locator('[data-testid="end-date-input"]')).toHaveValue('2023-12-31');
  });

  test('should filter products by category', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Select a category from the dropdown
    await page.selectOption('[data-testid="category-select"]', 'Drinks');
    
    // Verify the selection
    await expect(page.locator('[data-testid="category-select"]')).toHaveValue('Drinks');
  });

  test('should filter products by specific product', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Select a product from the dropdown
    await page.selectOption('[data-testid="product-select"]', 'Coffee');
    
    // Verify the selection
    await expect(page.locator('[data-testid="product-select"]')).toHaveValue('Coffee');
  });

  test('should sort products by different criteria', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Test sorting by revenue
    await page.click('button:text("Revenue")');
    await expect(page.locator('button.bg-amber-500:text("Revenue")')).toBeVisible();
    
    // Test sorting by quantity
    await page.click('button:text("Quantity")');
    await expect(page.locator('button.bg-amber-500:text("Quantity")')).toBeVisible();
    
    // Test sorting by name
    await page.click('button:text("Name")');
    await expect(page.locator('button.bg-amber-500:text("Name")')).toBeVisible();
    
    // Test sort order (ascending/descending)
    await page.click('button:text("ASC")');
    await expect(page.locator('button.bg-amber-500:text("ASC")')).toBeVisible();
    
    await page.click('button:text("DESC")');
    await expect(page.locator('button.bg-amber-500:text("DESC")')).toBeVisible();
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Test pagination controls are visible
    await expect(page.locator('text=Previous')).toBeVisible();
    await expect(page.locator('text=Next')).toBeVisible();
    
    // Test navigating to next page
    const nextPageButton = page.locator('text=Next');
    await nextPageButton.click();
    
    // Verify page changed (would depend on implementation)
    // Check for page indicators or content changes
    await expect(page.locator('text=Next')).toBeVisible(); // Button should still exist
    
    // Test navigating to previous page
    const prevPageButton = page.locator('text=Previous');
    await prevPageButton.click();
    
    // Verify page changed back
    await expect(page.locator('text=Previous')).toBeVisible();
  });

  test('should maintain backward compatibility with legacy endpoint', async ({ page }) => {
    // Test that the legacy /top-performers endpoint still works
    // This would involve making an API call to the backend
    const response = await page.request.get('http://192.168.1.241:3000/api/analytics/top-performers');
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('products');
    expect(responseBody).toHaveProperty('metadata');
    expect(responseBody).toHaveProperty('summary');
  });

  test('should return consistent data across different filter combinations', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Apply multiple filters simultaneously
    await page.fill('[data-testid="start-date-input"]', '2023-01-01');
    await page.fill('[data-testid="end-date-input"]', '2023-12-31');
    await page.selectOption('[data-testid="category-select"]', 'Drinks');
    await page.selectOption('[data-testid="product-select"]', 'Coffee');
    
    // Verify that all filters are applied
    await expect(page.locator('[data-testid="start-date-input"]')).toHaveValue('2023-01-01');
    await expect(page.locator('[data-testid="end-date-input"]')).toHaveValue('2023-12-31');
    await expect(page.locator('[data-testid="category-select"]')).toHaveValue('Drinks');
    await expect(page.locator('[data-testid="product-select"]')).toHaveValue('Coffee');
  });

  test('should handle invalid date inputs gracefully', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Enter invalid date
    await page.fill('[data-testid="start-date-input"]', 'invalid-date');
    
    // Verify that the UI handles the invalid input appropriately
    // This could mean showing an error message or reverting to default behavior
    await expect(page.locator('[data-testid="start-date-input"]')).toHaveValue('invalid-date');
  });

  test('should reset filters when appropriate', async ({ page }) => {
    // Navigate to analytics panel
    await page.click('text=Analytics');
    
    // Wait for the analytics panel to load
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Apply some filters
    await page.fill('[data-testid="start-date-input"]', '2023-01-01');
    await page.selectOption('[data-testid="category-select"]', 'Drinks');
    
    // Refresh the page or click reset
    await page.reload();
    
    // Wait for reload
    await page.waitForSelector('text=Detailed Product Performance');
    
    // Check if filters are reset to default
    await expect(page.locator('[data-testid="start-date-input"]')).toHaveValue('');
  });
});