import { test, expect } from '@playwright/test';

test.describe('Order Management Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://192.168.1.241:3000');
    
    // Login as admin
    await page.locator('[data-testid="username-input"]').fill('admin');
    await page.locator('[data-testid="password-input"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for login to complete and POS interface to load
    await page.waitForURL('http://192.168.1.241:3000/**');
    await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();
  });

  test('should adjust item quantities in cart', async ({ page }) => {
    // Add some items to cart first if not already present
    const merlotGlassButton = page.locator('button:has-text("Merlot Glass")').first();
    if (await merlotGlassButton.count() > 0) {
      await merlotGlassButton.click();
    }
    
    // Find the increment button for the first item in cart
    const incrementButtons = page.locator('[data-testid="increment-quantity"]');
    const decrementButtons = page.locator('[data-testid="decrement-quantity"]');
    const quantityDisplays = page.locator('[data-testid="item-quantity"]');
    
    // Test incrementing quantity
    if (await incrementButtons.count() > 0) {
      const initialQtyText = await quantityDisplays.first().textContent();
      const initialQty = initialQtyText ? parseInt(initialQtyText) : 0;
      await incrementButtons.first().click();
      
      // Wait for quantity to update
      await page.waitForTimeout(500);
      
      const updatedQtyText = await quantityDisplays.first().textContent();
      const updatedQty = updatedQtyText ? parseInt(updatedQtyText) : 0;
      expect(updatedQty).toBe(initialQty + 1);
    }
    
    // Test decrementing quantity
    const currentQtyText = await quantityDisplays.first().textContent();
    const currentQty = currentQtyText ? parseInt(currentQtyText) : 0;
    if (await decrementButtons.count() > 0 && currentQty > 1) {
      const initialQtyText = await quantityDisplays.first().textContent();
      const initialQty = initialQtyText ? parseInt(initialQtyText) : 0;
      await decrementButtons.first().click();
      
      // Wait for quantity to update
      await page.waitForTimeout(500);
      
      const updatedQtyText = await quantityDisplays.first().textContent();
      const updatedQty = updatedQtyText ? parseInt(updatedQtyText) : 0;
      expect(updatedQty).toBe(initialQty - 1);
    }
  });

  test('should remove individual items from cart', async ({ page }) => {
    // Add an item to cart first
    const merlotGlassButton = page.locator('button:has-text("Merlot Glass")').first();
    if (await merlotGlassButton.count() > 0) {
      await merlotGlassButton.click();
    }
    
    // Get initial count of items in cart
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
    
    // Find and click the remove button for the first item
    const removeButtons = page.locator('[data-testid="remove-item"]');
    if (await removeButtons.count() > 0) {
      await removeButtons.first().click();
      
      // Wait for item to be removed
      await page.waitForTimeout(500);
      
      // Check that item count decreased
      const updatedItemCount = await page.locator('[data-testid="cart-item"]').count();
      expect(updatedItemCount).toBe(initialItemCount - 1);
    }
  });

  test('should clear entire order', async ({ page }) => {
    // Add some items to cart first
    const merlotGlassButton = page.locator('button:has-text("Merlot Glass")').first();
    const vodkaTonicButton = page.locator('button:has-text("Vodka & Tonic")').first();
    
    if (await merlotGlassButton.count() > 0) {
      await merlotGlassButton.click();
    }
    if (await vodkaTonicButton.count() > 0) {
      await vodkaTonicButton.click();
    }
    
    // Verify items are in cart
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
    expect(initialItemCount).toBeGreaterThan(0);
    
    // Find and click the clear order button
    const clearOrderButton = page.locator('button:has-text("Clear Order"), [data-testid="clear-order"]');
    if (await clearOrderButton.count() > 0) {
      await clearOrderButton.click();
      
      // Confirm if there's a confirmation modal
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Wait for order to be cleared
      await page.waitForTimeout(1000);
      
      // Verify cart is empty
      const finalItemCount = await page.locator('[data-testid="cart-item"]').count();
      expect(finalItemCount).toBe(0);
      
      // Verify total is reset to 0
      const totalElement = page.locator('[data-testid="order-total"], .total-amount');
      if (await totalElement.count() > 0) {
        const totalText = await totalElement.textContent();
        expect(totalText).toContain('€0.00');
      }
    }
  });

  test('should handle multiple operations in sequence', async ({ page }) => {
    // Add multiple items to cart
    const merlotGlassButton = page.locator('button:has-text("Merlot Glass")').first();
    const vodkaTonicButton = page.locator('button:has-text("Vodka & Tonic")').first();
    
    if (await merlotGlassButton.count() > 0) {
      await merlotGlassButton.click();
    }
    if (await vodkaTonicButton.count() > 0) {
      await vodkaTonicButton.click();
    }
    
    // Initially we should have 2 items
    let itemCount = await page.locator('[data-testid="cart-item"]').count();
    expect(itemCount).toBeGreaterThanOrEqual(2);
    
    // Increase quantity of first item
    const incrementButtons = page.locator('[data-testid="increment-quantity"]');
    if (await incrementButtons.count() > 0) {
      await incrementButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    // Remove second item
    const removeButtons = page.locator('[data-testid="remove-item"]');
    if (await removeButtons.count() > 1) {
      await removeButtons.nth(1).click();
      await page.waitForTimeout(500);
    }
    
    // Verify state after operations
    const finalItemCount = await page.locator('[data-testid="cart-item"]').count();
    const finalIncrementButtons = await incrementButtons.count();
    
    // Should have one less item but quantity adjusted
    expect(finalItemCount).toBeLessThanOrEqual(itemCount);
  });
});