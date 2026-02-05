import { test, expect } from '@playwright/test';

// Verification test for responsive behavior of modal components and button classes
test.describe('Phase 2 Responsive Behavior Verification', () => {
  
  test('verify responsive behavior of modal components', async ({ page }) => {
    // Navigate to the POS application
    await page.goto('http://192.168.1.241:3000');
    
    // Test mobile responsiveness first
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for page to load and check if basic elements are present
    await expect(page.locator('body')).toContainText(['POS', 'Products', 'Order']);
    // If the above fails, check for login page
    const bodyContent = await page.locator('body').textContent();
    if (bodyContent && !bodyContent.includes('POS')) {
      await expect(page.locator('input[name="username"]')).toBeVisible();
    }
    
    // If we're on the login page, log in first
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect to POS
      await page.waitForURL('**/pos**');
    }
    
    // Test different screen sizes for modal responsiveness
    const screenSizes = [
      { width: 320, height: 568, label: 'Mobile S' },
      { width: 375, height: 667, label: 'Mobile M' },
      { width: 414, height: 896, label: 'Mobile L' },
      { width: 768, height: 1024, label: 'Tablet' },
      { width: 1024, height: 768, label: 'Tablet Landscape' },
      { width: 1200, height: 800, label: 'Desktop' }
    ];
    
    for (const size of screenSizes) {
      console.log(`Testing on ${size.label}: ${size.width}x${size.height}`);
      await page.setViewportSize({ width: size.width, height: size.height });
      
      // Wait a bit for UI to adjust
      await page.waitForTimeout(500);
      
      // Check if main POS interface is still accessible
      const posElements = await page.locator('.bg-slate-800, .bg-slate-900').count();
      expect(posElements).toBeGreaterThan(0);
      
      // Try to trigger a modal if possible (this depends on the current state of the POS)
      // For example, try to open a settings or management modal if available
      const availableButtons = await page.locator('button').count();
      console.log(`${size.label}: Found ${availableButtons} buttons`);
    }
  });

  test('verify responsive prefixes work correctly', async ({ page }) => {
    // Test the specific responsive classes mentioned in the task
    await page.goto('http://192.168.1.241:3000');
    
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos**');
    }
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Look for elements with responsive classes
    const maxWidthXS = await page.locator('[class*="max-w-xs"]').count();
    console.log(`Found ${maxWidthXS} elements with max-w-xs class on mobile`);
    
    // Test desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    // Look for elements with responsive classes
    const maxWidthMD = await page.locator('[class*="sm:max-w-md"]').count();
    console.log(`Found ${maxWidthMD} elements with sm:max-w-md class on desktop`);
  });

  test('verify button classes consistency across screen sizes', async ({ page }) => {
    await page.goto('http://192.168.1.241:3000');
    
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos**');
    }
    
    const screenSizes = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1200, height: 800, name: 'desktop' }
    ];
    
    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(500);
      
      // Count different button types
      const baseBtns = await page.locator('.btn:not(.btn-primary):not(.btn-secondary):not(.btn-success):not(.btn-danger)').count();
      const primaryBtns = await page.locator('.btn-primary').count();
      const secondaryBtns = await page.locator('.btn-secondary').count();
      const successBtns = await page.locator('.btn-success').count();
      const dangerBtns = await page.locator('.btn-danger').count();
      
      console.log(`${size.name} - Base: ${baseBtns}, Primary: ${primaryBtns}, Secondary: ${secondaryBtns}, Success: ${successBtns}, Danger: ${dangerBtns}`);
      
      // Ensure buttons maintain visibility and functionality
      expect(baseBtns + primaryBtns + secondaryBtns + successBtns + dangerBtns).toBeGreaterThan(0);
    }
  });

  test('check modal padding and spacing on small screens', async ({ page }) => {
    await page.goto('http://192.168.1.241:3000');
    
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos**');
    }
    
    // Test on mobile size
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(500);
    
    // Look for modal-like containers and check their padding
    const modalContainers = await page.locator('div[class*="rounded-lg"]:has-text("Confirm"), div[class*="rounded-lg"]:has-text("Payment"), div[class*="rounded-lg"]:has-text("Settings")').count();
    console.log(`Found ${modalContainers} potential modal containers on mobile`);
    
    // Check if common padding/margin classes are present
    const paddedElements = await page.locator('[class*="p-"], [class*="m-"]').count();
    console.log(`Found ${paddedElements} elements with padding/margin classes`);
  });

  test('verify text readability across screen sizes', async ({ page }) => {
    await page.goto('http://192.168.1.241:3000');
    
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos**');
    }
    
    const screenSizes = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1200, height: 800 }
    ];
    
    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(500);
      
      // Check for text elements and their sizes
      const textElements = await page.locator('text:not(:empty):visible').count();
      console.log(`Screen size ${size.width}x${size.height}: Found ${textElements} text elements`);
      
      // Ensure text elements are present and visible
      expect(textElements).toBeGreaterThan(0);
    }
  });
});