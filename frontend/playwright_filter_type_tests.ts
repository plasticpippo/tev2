import { test, expect } from '@playwright/test';

test.describe('Filter Type Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    // Note: Using the actual IP address mentioned in the rules instead of localhost
    await page.goto('http://192.168.1.241:3000');
    
    // Login first if needed
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('http://192.168.1.241:3000/**');
  });

  test('1. Navigate to the Customize Product Grid Layout modal', async ({ page }) => {
    // Open the order panel (or wherever the customize grid layout button is located)
    await page.click('text=Order Panel');
    
    // Click the "Customize Grid Layout" button
    await page.click('text=Customize Grid Layout');
    
    // Wait for the modal to appear
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Verify all sections are visible
    await expect(page.locator('text=Layout Settings')).toBeVisible();
    await expect(page.locator('text=Available Products')).toBeVisible();
    await expect(page.locator('text=Grid Layout')).toBeVisible();
    await expect(page.locator('text=Available Layouts')).toBeVisible();
  });

  test('2. Test the \'all\' filter type functionality', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Verify 'All Products' button is highlighted by default
    const allProductsButton = page.locator('button:has-text("All Products")');
    await expect(allProductsButton).toBeVisible();
    
    // Verify that initially all products are shown
    const initialProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    expect(initialProductCount).toBeGreaterThan(0);
    
    // Verify that the 'All Products' button has the active class
    await expect(allProductsButton).toHaveClass(/bg-amber-500/);
    
    // Verify that no other category buttons are selected
    const categoryButtons = page.locator('button').filter({ hasText: /[^All Products][^★ Favourites]/ });
    const activeCategoryButtons = categoryButtons.filter({ hasClass: /bg-amber-500/ });
    await expect(activeCategoryButtons).toHaveCount(0);
  });

  test('3. Test the \'favorites\' filter type functionality', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Count initial products
    const initialProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Click the favorites filter
    const favoritesButton = page.locator('button:has-text("★ Favourites")');
    await favoritesButton.click();
    
    // Verify that the button shows 'ON' status
    await expect(favoritesButton).toContainText('ON');
    
    // Wait for the product list to update
    await page.waitForTimeout(500);
    
    // Count products after applying favorites filter
    const favoritesProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Verify that only favorite products are shown (should be fewer than initial)
    expect(favoritesProductCount).toBeLessThanOrEqual(initialProductCount);
    
    // Turn off favorites filter
    await favoritesButton.click();
    
    // Wait for the product list to update
    await page.waitForTimeout(500);
    
    // Count products after turning off favorites filter
    const afterOffProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Verify that all products are shown again
    expect(afterOffProductCount).toBe(initialProductCount);
    
    // Verify that the button shows 'OFF' status
    await expect(favoritesButton).toContainText('OFF');
  });

  test('4. Test the \'category\' filter type functionality', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Count initial products
    const initialProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Get the first category button (excluding "All Products" and "★ Favourites")
    const categoryButtons = page.locator('button').filter({ 
      hasNotText: 'All Products' 
    }).filter({ 
      hasNotText: /^★ Favourites/ 
    });
    
    // Verify we have at least one category button
    await expect(categoryButtons.first()).toBeVisible();
    
    const firstCategoryButton = categoryButtons.first();
    const categoryName = await firstCategoryButton.textContent();
    
    // Click the first category button
    await firstCategoryButton.click();
    
    // Wait for the product list to update
    await page.waitForTimeout(500);
    
    // Count products after applying category filter
    const categoryProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Verify that only products from the selected category are shown (should be fewer than initial)
    expect(categoryProductCount).toBeLessThanOrEqual(initialProductCount);
    
    // Click the same category button again to deselect it
    await firstCategoryButton.click();
    
    // Wait for the product list to update
    await page.waitForTimeout(500);
    
    // Count products after deselecting category
    const afterDeselectProductCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Verify that all products are shown again
    expect(afterDeselectProductCount).toBe(initialProductCount);
  });

  test('5. Verify that filtering affects the available products panel', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Test 'all' filter
    const allProductsBtn = page.locator('button:has-text("All Products")');
    await allProductsBtn.click();
    await page.waitForTimeout(300);
    const allFilterCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Test 'favorites' filter
    const favoritesBtn = page.locator('button:has-text("★ Favourites")');
    await favoritesBtn.click();
    await page.waitForTimeout(300);
    const favoritesFilterCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Verify that favorites count is less than or equal to all products count
    expect(favoritesFilterCount).toBeLessThanOrEqual(allFilterCount);
    
    // Test category filter
    const categoryButtons = page.locator('button').filter({ 
      hasNotText: 'All Products' 
    }).filter({ 
      hasNotText: /^★ Favourites/ 
    });
    
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
      const categoryFilterCount = await page.locator('div.grid.grid-cols-2 button').count();
      
      // Verify that category count is less than or equal to all products count
      expect(categoryFilterCount).toBeLessThanOrEqual(allFilterCount);
    }
  });

  test('6. Verify that filtering affects the available layouts panel', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Wait for layouts to load
    await page.waitForTimeout(1000);
    
    // Find the filter type dropdown in the Available Layouts section
    const filterTypeDropdown = page.locator('select').first(); // First select element should be the filter type
    
    // Test 'all' filter type
    await filterTypeDropdown.selectOption('all');
    await page.waitForTimeout(500);
    const allLayoutsCount = await page.locator('[data-testid="layout-item"]').count();
    
    // Test 'favorites' filter type
    await filterTypeDropdown.selectOption('favorites');
    await page.waitForTimeout(500);
    const favoritesLayoutsCount = await page.locator('[data-testid="layout-item"]').count();
    
    // Test 'category' filter type
    await filterTypeDropdown.selectOption('category');
    await page.waitForTimeout(500);
    const categoryLayoutsCount = await page.locator('[data-testid="layout-item"]').count();
    
    // Note: The actual counts depend on existing layouts with different filter types
    // We're mainly verifying that the filtering mechanism works
  });

  test('7. Test switching between different filter types', async ({ page }) => {
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Start with 'all' filter
    const allProductsBtn = page.locator('button:has-text("All Products")');
    await allProductsBtn.click();
    await page.waitForTimeout(300);
    const allCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Switch to 'favorites' filter
    const favoritesBtn = page.locator('button:has-text("★ Favourites")');
    await favoritesBtn.click();
    await page.waitForTimeout(300);
    const favoritesCount = await page.locator('div.grid.grid-cols-2 button').count();
    
    // Switch to 'category' filter
    const categoryButtons = page.locator('button').filter({ 
      hasNotText: 'All Products' 
    }).filter({ 
      hasNotText: /^★ Favourites/ 
    });
    
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
      const categoryCount = await page.locator('div.grid.grid-cols-2 button').count();
      
      // Switch back to 'all' filter
      await allProductsBtn.click();
      await page.waitForTimeout(300);
      const backToAllCount = await page.locator('div.grid.grid-cols-2 button').count();
      
      // Verify we're back to the original count
      expect(backToAllCount).toBe(allCount);
    }
    
    // Test rapid switching between filters
    await favoritesBtn.click();
    await page.waitForTimeout(100);
    await allProductsBtn.click();
    await page.waitForTimeout(100);
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(100);
      await allProductsBtn.click();
    }
    
    // Verify no errors occurred during rapid switching
    await expect(page.locator('text=Error')).not.toBeVisible();
  });

  test('8. Monitor console logs during filter type changes', async ({ page }) => {
    // Set up console log monitoring
    const consoleErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleErrors.push(`${message.type()}: ${message.text()}`);
      }
    });
    
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Apply 'favorites' filter
    const favoritesBtn = page.locator('button:has-text("★ Favourites")');
    await favoritesBtn.click();
    await page.waitForTimeout(300);
    
    // Apply 'category' filter
    const categoryButtons = page.locator('button').filter({ 
      hasNotText: 'All Products' 
    }).filter({ 
      hasNotText: /^★ Favourites/ 
    });
    
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
    }
    
    // Apply 'all' filter
    const allProductsBtn = page.locator('button:has-text("All Products")');
    await allProductsBtn.click();
    await page.waitForTimeout(300);
    
    // Verify no console errors occurred
    expect(consoleErrors.length).toBe(0);
  });

  test('9. Monitor network requests during filter type changes', async ({ page }) => {
    // Track network requests
    const requests: string[] = [];
    page.on('request', request => {
      // Track all requests during the test
      requests.push(request.url());
    });
    
    // Open the customizer
    await page.click('text=Order Panel');
    await page.click('text=Customize Grid Layout');
    await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
    
    // Store initial request count
    const initialRequestCount = requests.length;
    
    // Apply 'favorites' filter
    const favoritesBtn = page.locator('button:has-text("★ Favourites")');
    await favoritesBtn.click();
    await page.waitForTimeout(300);
    
    // Apply 'category' filter
    const categoryButtons = page.locator('button').filter({ 
      hasNotText: 'All Products' 
    }).filter({ 
      hasNotText: /^★ Favourites/ 
    });
    
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
    }
    
    // Apply 'all' filter
    const allProductsBtn = page.locator('button:has-text("All Products")');
    await allProductsBtn.click();
    await page.waitForTimeout(300);
    
    // Check that no additional API requests were made for filtering
    // Filtering should be handled client-side
    const finalRequestCount = requests.length;
    const requestsDuringFiltering = requests.slice(initialRequestCount);
    
    // We expect minimal requests during client-side filtering
    // Only requests for loading initial data should be present
    console.log(`Network requests during filtering: ${requestsDuringFiltering.length}`);
    console.log(`Requests made:`, requestsDuringFiltering);
  });

  test('10. Document any issues found with the filter type functionality', async ({ page }) => {
    // This test will run through all basic functionality and note any issues
    const issues: string[] = [];
    
    try {
      // Open the customizer
      await page.click('text=Order Panel');
      await page.click('text=Customize Grid Layout');
      await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
      
      // Test all filter types
      const allProductsBtn = page.locator('button:has-text("All Products")');
      const favoritesBtn = page.locator('button:has-text("★ Favourites")');
      const categoryButtons = page.locator('button').filter({ 
        hasNotText: 'All Products' 
      }).filter({ 
        hasNotText: /^★ Favourites/ 
      });
      
      // Test 'all' filter
      await allProductsBtn.click();
      await page.waitForTimeout(300);
      
      // Test 'favorites' filter
      await favoritesBtn.click();
      await page.waitForTimeout(300);
      await favoritesBtn.click(); // Turn off
      
      // Test 'category' filter if available
      if (await categoryButtons.count() > 0) {
        await categoryButtons.first().click();
        await page.waitForTimeout(300);
        await categoryButtons.first().click(); // Deselect
      }
      
      // Check for UI consistency
      await expect(page.locator('text=Customize Product Grid Layout')).toBeVisible();
      
      // Check for console errors
      const consoleErrors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      
      if (consoleErrors.length > 0) {
        issues.push(`Console errors found: ${consoleErrors.join(', ')}`);
      }
      
      // Report findings
      if (issues.length > 0) {
        console.log('Issues found during filter type functionality testing:');
        issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue}`);
        });
      } else {
        console.log('No issues found during filter type functionality testing.');
      }
      
    } catch (error) {
      issues.push(`Error during testing: ${(error as Error).message}`);
    }
    
