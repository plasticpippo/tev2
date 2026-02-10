// Quick test to verify logout endpoint preserves items
const { chromium } = require('playwright');

async function testLogoutPreservesItems() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Test: Logout Preserves Items ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://192.168.1.241:80');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✓ Logged in successfully\n');

    // Step 2: Add products
    console.log('Step 2: Adding products...');
    await page.waitForSelector('.product-item', { timeout: 10000 });

    // Click first 2 products
    const products = await page.$$('.product-item');
    for (let i = 0; i < Math.min(2, products.length); i++) {
      await products[i].click();
      await page.waitForTimeout(500);
    }
    console.log('✓ Added 2 products\n');

    // Step 3: Check session before logout
    console.log('Step 3: Checking session before logout...');
    const sessionBefore = await page.evaluate(async () => {
      const response = await fetch('http://192.168.1.241:80/api/order-sessions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return await response.json();
    });
    console.log('Session before logout:', JSON.stringify(sessionBefore, null, 2));
    console.log(`Items count before logout: ${sessionBefore.items?.length || 0}\n`);

    // Step 4: Logout
    console.log('Step 4: Logging out...');
    await page.evaluate(async () => {
      // Call logout endpoint
      await fetch('http://192.168.1.241:80/api/order-sessions/current/logout', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
    });
    await page.waitForTimeout(1000);
    console.log('✓ Logged out\n');

    // Step 5: Check session after logout
    console.log('Step 5: Checking session after logout...');
    const sessionAfterLogout = await page.evaluate(async () => {
      const response = await fetch('http://192.168.1.241:80/api/order-sessions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return await response.json();
    });
    console.log('Session after logout:', JSON.stringify(sessionAfterLogout, null, 2));
    console.log(`Items count after logout: ${sessionAfterLogout.items?.length || 0}\n`);

    // Step 6: Re-login
    console.log('Step 6: Re-logging in...');
    await page.goto('http://192.168.1.241:80');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✓ Re-logged in successfully\n');

    // Step 7: Check session after re-login
    console.log('Step 7: Checking session after re-login...');
    await page.waitForTimeout(2000); // Wait for session to load
    const sessionAfterRelogin = await page.evaluate(async () => {
      const response = await fetch('http://192.168.1.241:80/api/order-sessions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return await response.json();
    });
    console.log('Session after re-login:', JSON.stringify(sessionAfterRelogin, null, 2));
    console.log(`Items count after re-login: ${sessionAfterRelogin.items?.length || 0}\n`);

    // Step 8: Verify results
    console.log('=== Verification ===');
    const itemsBefore = sessionBefore.items?.length || 0;
    const itemsAfterLogout = sessionAfterLogout.items?.length || 0;
    const itemsAfterRelogin = sessionAfterRelogin.items?.length || 0;

    console.log(`Items before logout: ${itemsBefore}`);
    console.log(`Items after logout: ${itemsAfterLogout}`);
    console.log(`Items after re-login: ${itemsAfterRelogin}`);

    if (itemsAfterLogout === itemsBefore) {
      console.log('✓ PASS: Items preserved after logout');
    } else {
      console.log('✗ FAIL: Items lost after logout');
    }

    if (itemsAfterRelogin === itemsBefore) {
      console.log('✓ PASS: Items preserved after re-login');
    } else {
      console.log('✗ FAIL: Items lost after re-login');
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testLogoutPreservesItems();
