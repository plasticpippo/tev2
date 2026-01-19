import { chromium, Browser, Page } from '@playwright/test';

// Validation test suite for the POS application
async function runValidationTests() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  try {
    // Navigate to the application
    await page.goto('http://192.168.1.241:3000');

    // Login first
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to main page
    await page.waitForURL('**/main**');

    // Test 1: Invalid inputs for product creation
    console.log("Testing invalid inputs for product creation...");
    
    // Navigate to product management
    await page.click('text=Products');
    await page.waitForSelector('button:has-text("Create Product")');
    
    // Click create product button
    await page.click('button:has-text("Create Product")');
    
    // Test with invalid inputs
    await page.fill('input[name="productName"]', ''); // Empty name
    await page.fill('input[name="productPrice"]', '-10'); // Negative price
    await page.click('button:has-text("Save Product")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test with very long name
    const longName = 'A'.repeat(1000);
    await page.fill('input[name="productName"]', longName);
    await page.fill('input[name="productPrice"]', '10.99');
    await page.click('button:has-text("Save Product")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test with non-numeric price
    await page.fill('input[name="productName"]', 'Test Product');
    await page.fill('input[name="productPrice"]', 'abc'); // Non-numeric price
    await page.click('button:has-text("Save Product")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test 2: Missing required fields for product creation
    console.log("Testing missing required fields for product creation...");
    
    // Try to save without any input
    await page.fill('input[name="productName"]', '');
    await page.fill('input[name="productPrice"]', '');
    await page.click('button:has-text("Save Product")');
    
    // Check for validation errors
    await page.waitForSelector('.error-message');
    
    // Test 3: Boundary values for product creation
    console.log("Testing boundary values for product creation...");
    
    // Test with maximum price value
    await page.fill('input[name="productName"]', 'Max Price Product');
    await page.fill('input[name="productPrice"]', String(Number.MAX_SAFE_INTEGER));
    await page.click('button:has-text("Save Product")');
    
    // Test with minimum price value (0)
    await page.fill('input[name="productName"]', 'Min Price Product');
    await page.fill('input[name="productPrice"]', '0');
    await page.click('button:has-text("Save Product")');
    
    // Test with very small decimal price
    await page.fill('input[name="productName"]', 'Small Decimal Product');
    await page.fill('input[name="productPrice"]', '0.001');
    await page.click('button:has-text("Save Product")');
    
    // Test 4: Invalid inputs for category creation
    console.log("Testing invalid inputs for category creation...");
    
    // Navigate to category management
    await page.click('text=Categories');
    await page.waitForSelector('button:has-text("Create Category")');
    
    // Click create category button
    await page.click('button:has-text("Create Category")');
    
    // Test with empty name
    await page.fill('input[name="categoryName"]', '');
    await page.click('button:has-text("Save Category")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test with very long category name
    const longCategoryName = 'B'.repeat(1000);
    await page.fill('input[name="categoryName"]', longCategoryName);
    await page.click('button:has-text("Save Category")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test 5: Missing required fields for category creation
    console.log("Testing missing required fields for category creation...");
    
    // Try to save without any input
    await page.fill('input[name="categoryName"]', '');
    await page.click('button:has-text("Save Category")');
    
    // Check for validation errors
    await page.waitForSelector('.error-message');
    
    // Test 6: Invalid inputs for layout creation
    console.log("Testing invalid inputs for layout creation...");
    
    // Navigate to layout management
    await page.click('text=Layouts');
    await page.waitForSelector('button:has-text("Create Layout")');
    
    // Click create layout button
    await page.click('button:has-text("Create Layout")');
    
    // Test with empty layout name
    await page.fill('input[name="layoutName"]', '');
    await page.click('button:has-text("Save Layout")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test with very long layout name
    const longLayoutName = 'C'.repeat(1000);
    await page.fill('input[name="layoutName"]', longLayoutName);
    await page.click('button:has-text("Save Layout")');
    
    // Check for validation error
    await page.waitForSelector('.error-message');
    
    // Test 7: Missing required fields for layout creation
    console.log("Testing missing required fields for layout creation...");
    
    // Try to save layout without name
    await page.fill('input[name="layoutName"]', '');
    await page.click('button:has-text("Save Layout")');
    
    // Check for validation errors
    await page.waitForSelector('.error-message');
    
    // Test 8: Boundary values for various inputs
    console.log("Testing boundary values for various inputs...");
    
    // Test very long text in description fields (if available)
    if (await page.isVisible('textarea[name="description"]')) {
      const longDescription = 'D'.repeat(10000);
      await page.fill('textarea[name="description"]', longDescription);
      await page.click('button:has-text("Save")');
      
      // Check for validation error
      await page.waitForSelector('.error-message');
    }
    
    console.log("All validation tests completed!");
  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    await browser.close();
  }
}

// Run the validation tests
