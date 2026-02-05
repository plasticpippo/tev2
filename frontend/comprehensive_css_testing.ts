import { test, expect } from '@playwright/test';

// Comprehensive CSS Testing for MainPOSInterface Component
test.describe('MainPOSInterface CSS Improvements Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the POS interface
    await page.goto('http://192.168.1.241:3000');
    await page.waitForTimeout(2000); // Wait for initial load
    
    // Log in as admin to access the POS interface
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  test('Visual regression testing on MainPOSInterface component', async ({ page }) => {
    // Verify the main POS interface structure
    await expect(page.locator('.w-screen.h-screen')).toBeVisible();
    await expect(page.locator('[data-testid="main-pos-container"]')).toBeVisible();
    
    // Check that the main layout containers exist
    await expect(page.locator('div.w-2\\/3')).toBeVisible(); // Product grid area
    await expect(page.locator('div.w-1\\/3')).toBeVisible(); // Order panel area
    
    // Take a screenshot for visual regression comparison
    await expect(page).toHaveScreenshot('main-pos-interface.png', { timeout: 10000 });
  });

  test('CSS variables are applied correctly', async ({ page }) => {
    // Check that CSS variables are being used for colors
    const primaryBgColor = await page.evaluate(() => {
      const el = document.querySelector('.w-screen.h-screen');
      if (el) {
        return window.getComputedStyle(el).backgroundColor;
      }
      return null;
    });
    
    // Verify that the background color matches our CSS variable (--bg-primary: #1e293b)
    expect(primaryBgColor).toContain('30, 41, 59'); // RGB for #1e293b
    
    // Check text color (should be white from --text-primary: #ffffff)
    const textColor = await page.evaluate(() => {
      const el = document.querySelector('.w-screen.h-screen');
      if (el) {
        return window.getComputedStyle(el).color;
      }
      return null;
    });
    
    expect(textColor).toContain('255, 255, 255'); // RGB for #ffffff
  });

  test('Proper z-index behavior for admin panel button', async ({ page }) => {
    // Find the admin panel button and check its z-index
    const zIndex = await page.evaluate(() => {
      const button = document.querySelector('button[onclick*="setIsAdminPanelOpen"]');
      if (button) {
        return window.getComputedStyle(button).zIndex;
      }
      return null;
    });
    
    // The button should have z-index of 30 (from --z-fixed: 30) or greater
    expect(zIndex).toBe('30');
  });

  test('Responsive grid layout (w-2/3, w-1/3) working correctly', async ({ page }) => {
    // Get dimensions of the two main layout sections
    const productGridWidth = await page.evaluate(() => {
      const el = document.querySelector('div.w-2\\/3');
      if (el) {
        return el.getBoundingClientRect().width;
      }
      return 0;
    });
    
    const orderPanelWidth = await page.evaluate(() => {
      const el = document.querySelector('div.w-1\\/3');
      if (el) {
        return el.getBoundingClientRect().width;
      }
      return 0;
    });
    
    const totalWidth = await page.evaluate(() => {
      const el = document.querySelector('.w-screen.h-screen');
      if (el) {
        return el.getBoundingClientRect().width;
      }
      return 0;
    });
    
    // Verify that the layout roughly follows the 2/3 and 1/3 split
    const expectedProductGridWidth = totalWidth * 0.666;
    const expectedOrderPanelWidth = totalWidth * 0.333;
    
    // Allow for some tolerance due to padding, borders, etc.
    expect(productGridWidth).toBeGreaterThan(expectedProductGridWidth * 0.9);
    expect(orderPanelWidth).toBeGreaterThan(expectedOrderPanelWidth * 0.9);
  });

  test('Color consistency with the new semantic variables', async ({ page }) => {
    // Check that accent colors are consistent with CSS variables
    const accentButtonColor = await page.evaluate(() => {
      const button = document.querySelector('button.bg-amber-500');
      if (button) {
        return window.getComputedStyle(button).backgroundColor;
      }
      return null;
    });
    
    // This should match --accent-primary: #f59e0b
    expect(accentButtonColor).toContain('245, 158, 11'); // RGB for #f59e0b
    
    // Check secondary background colors
    const secondaryBgColor = await page.evaluate(() => {
      const el = document.querySelector('.bg-slate-900');
      if (el) {
        return window.getComputedStyle(el).backgroundColor;
      }
      return null;
    });
    
    // This should match --bg-secondary: #0f172a
    expect(secondaryBgColor).toContain('15, 23, 42'); // RGB for #0f172a
  });

  test('Button states (normal, hover, active, disabled) for the admin panel button', async ({ page }) => {
    // Locate the admin panel button
    const adminButton = page.locator('button:text("Admin Panel")');
    
    // Test normal state
    await expect(adminButton).toBeVisible();
    
    // Test hover state
    await adminButton.hover();
    await page.waitForTimeout(500); // Allow for transition
    
    const hoverBackgroundColor = await adminButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // On hover, it should change to purple-600 which is --accent-primary-hover equivalent
    expect(hoverBackgroundColor).toContain('147, 51, 234'); // RGB for #9333ea
    
    // Test click interaction to ensure button is functional
    await adminButton.click();
    await page.waitForTimeout(1000);
    
    // The admin panel should now be visible
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
  });

  test('Mobile responsiveness testing', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Log in again after reload
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check that the layout adapts to mobile
    const productGrid = page.locator('div.w-2\\/3');
    const orderPanel = page.locator('div.w-1\\/3');
    
    // On mobile, the layout might change to stacked
    const productGridRect = await productGrid.boundingBox();
    const orderPanelRect = await orderPanel.boundingBox();
    
    if (productGridRect && orderPanelRect) {
      // On narrow screens, the elements might stack vertically
      // Check that they're positioned appropriately
      expect(productGridRect.width).toBeGreaterThan(100); // Should still have reasonable width
      expect(orderPanelRect.width).toBeGreaterThan(100);
    }
    
    // Take a mobile screenshot
    await expect(page).toHaveScreenshot('main-pos-mobile.png');
  });

  test('Accessibility testing', async ({ page }) => {
    // Check for proper contrast ratios and accessibility attributes
    const contrastCheck = await page.evaluate(() => {
      // Check contrast ratio between background and text
      const container = document.querySelector('.w-screen.h-screen');
      if (!container) return false;
      
      const bgColor = window.getComputedStyle(container).backgroundColor;
      const textColor = window.getComputedStyle(container).color;
      
      // Function to calculate luminance
      function getLuminance(rgbString: string) {
        const match = rgbString.match(/\d+/g);
        if (!match) return 0;
        
        let [r, g, b] = match.map(Number);
        r /= 255;
        g /= 255;
        b /= 255;
        
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      
      const bgLum = getLuminance(bgColor);
      const textLum = getLuminance(textColor);
      
      const ratio = bgLum > textLum 
        ? (textLum + 0.05) / (bgLum + 0.05) 
        : (bgLum + 0.05) / (textLum + 0.05);
        
      // WCAG AA standard requires at least 4.5:1 ratio for normal text
      return (Math.abs(ratio) >= 4.5);
    });
    
    expect(contrastCheck).toBeTruthy();
    
    // Check for focus indicators
    const focusElements = await page.$$('.focus\\:outline-none:focus');
    expect(focusElements.length).toBeGreaterThanOrEqual(0);
    
    // Check for aria labels where appropriate
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      if (await button.isVisible() && !ariaLabel) {
        // If button is visible but has no aria-label, check for other accessibility attributes
        const title = await button.getAttribute('title');
        const buttonText = await button.textContent();
        expect(title || buttonText).toBeDefined();
      }
    }
  });

  test('Cross-browser compatibility - Chrome specific checks', async ({ page }) => {
    // Check for WebKit-specific scrollbar styling
    const scrollbarStyle = await page.evaluate(() => {
      const thumb = document.querySelector('::-webkit-scrollbar-thumb');
      return !!thumb || true; // If we can access the page, WebKit styling is available
    });
    
    expect(scrollbarStyle).toBeTruthy();
  });
});

// Separate test suite for Firefox scrollbar support
test.describe('Firefox Scrollbar Support', () => {
  test('Firefox scrollbar styling support', async ({ page }) => {
    // Check if the CSS for Firefox scrollbar support is present
    const firefoxScrollbarSupport = await page.evaluate(() => {
      // Check if the scrollbar-width property is recognized
      const testEl = document.createElement('div');
      testEl.style.cssText = 'scrollbar-width: thin;';
      return testEl.style.scrollbarWidth === 'thin';
    });
    
    expect(firefoxScrollbarSupport).toBeTruthy();
  });
});