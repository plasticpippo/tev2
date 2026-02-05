import { test, expect } from '@playwright/test';

// Test responsive behavior of modal components and button classes
test.describe('Responsive Behavior Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the POS application
    await page.goto('http://192.168.1.241:3000');
    
    // Login as admin first to access the POS
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('http://192.168.1.241:3000/**');
  });

  // Test modal responsive behavior on mobile screen sizes
  test.describe('Mobile Screen Sizes', () => {
    const mobileSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 6/7/8' },
      { width: 414, height: 896, name: 'iPhone XR' }
    ];

    for (const size of mobileSizes) {
      test(`should display properly on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        
        // Test Payment Modal
        await page.click('text=Complete Payment');
        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
        
        // Verify responsive classes are applied (max-w-xs sm:max-w-md)
        const modal = page.locator('.max-w-xs');
        await expect(modal).toBeVisible();
        
        // Take screenshot for verification
        await page.screenshot({ path: `screenshots/payment-modal-${size.name}.png` });
        
        // Close modal
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible();
        
        // Test Table Assignment Modal
        await page.click('text=Assign Table');
        await expect(page.locator('[data-testid="table-assignment-modal"]')).toBeVisible();
        
        // Take screenshot for verification
        await page.screenshot({ path: `screenshots/table-modal-${size.name}.png` });
        
        // Close modal
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-testid="table-assignment-modal"]')).not.toBeVisible();
      });
    }
  });

  // Test modal responsive behavior on tablet screen sizes
  test.describe('Tablet Screen Sizes', () => {
    const tabletSizes = [
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' }
    ];

    for (const size of tabletSizes) {
      test(`should display properly on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        
        // Test Payment Modal
        await page.click('text=Complete Payment');
        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
        
        // Verify responsive classes expand appropriately on larger screens
        const modal = page.locator('.sm\\:max-w-md');
        await expect(modal).toBeVisible();
        
        // Take screenshot for verification
        await page.screenshot({ path: `screenshots/payment-modal-tablet-${size.name}.png` });
        
        // Close modal
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible();
      });
    }
  });

  // Test button classes on different screen sizes
  test.describe('Button Classes Testing', () => {
    test('should maintain consistent button styles across screen sizes', async ({ page }) => {
      const screenSizes = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1200, height: 800, name: 'desktop' }
      ];

      for (const size of screenSizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        
        // Test various button classes
        const primaryBtn = page.locator('.btn-primary');
        const secondaryBtn = page.locator('.btn-secondary');
        const successBtn = page.locator('.btn-success');
        const dangerBtn = page.locator('.btn-danger');
        
        // Verify buttons exist and have proper styling
        await expect(primaryBtn).toHaveCount(1); // Assuming one primary button exists
        await expect(secondaryBtn).toHaveCount(1); // Assuming one secondary button exists
        
        // Take screenshot
        await page.screenshot({ path: `screenshots/buttons-${size.name}.png` });
      }
    });
  });

  // Specific test for responsive prefix classes
  test('should verify responsive prefix classes work correctly', async ({ page }) => {
    // Start with mobile size
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Open a modal that uses responsive classes
    await page.click('text=Complete Payment');
    
    // Check that mobile-first classes are applied
    const modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'screenshots/responsive-mobile.png' });
    
    // Change to desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Reload to ensure responsive classes update
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Reopen modal
    await page.click('text=Complete Payment');
    
    // Take desktop screenshot
    await page.screenshot({ path: 'screenshots/responsive-desktop.png' });
    
    // Verify the modal adapts to larger screen
    const modalWidth = await modal.evaluate(node => node.clientWidth);
    expect(modalWidth).toBeGreaterThan(300); // Should be wider on desktop
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  // Test that modals maintain proper padding and spacing
  test('should maintain proper padding and spacing on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Open payment modal
    await page.click('text=Complete Payment');
    
    const modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for proper padding classes
    await expect(modal).toHaveClass(/p-6/); // Should have padding
    
    // Verify text is readable (not too small)
    const textElements = page.locator('text, [class*="text-"]');
    await expect(textElements.first()).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  // Test that interactive elements maintain proper touch targets
  test('should maintain proper touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Open payment modal
    await page.click('text=Complete Payment');
    
    // Check that buttons have adequate size for touch
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          // Minimum touch target should be 44x44 pixels according to WCAG
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    // Close modal
    await page.keyboard.press('Escape');
  });
});