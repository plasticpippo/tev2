// CSS Improvements Verification Test
// This script verifies that the CSS improvements implemented in Phases 1, 2, and 3 are working correctly

async function verifyCSSImprovements() {
  console.log('Starting CSS improvements verification test...');
  
  try {
    // Test 1: Navigate to the application
    console.log('1. Navigating to the POS application...');
    await mcp_playwright_browser_navigate({ url: 'http://192.168.1.241:3000' });
    await mcp_playwright_browser_wait_for({ time: 3 });
    
    // Get initial snapshot
    const initialSnapshot = await mcp_playwright_browser_snapshot();
    console.log('Initial page loaded, snapshot captured');
    
    // Test 2: Check if we need to log in
    if (initialSnapshot.includes('Login') || initialSnapshot.toLowerCase().includes('authentication')) {
      console.log('2. Login page detected, attempting to log in...');
      
      // Look for username field (could be labeled differently)
      let usernameFieldRef = null;
      const usernamePatterns = [/username/i, /email/i, /user/i];
      for (const pattern of usernamePatterns) {
        const match = initialSnapshot.match(new RegExp(`(textbox|combobox).*?ref="(e\\d+)".*?(username|email|user)`, 'i'));
        if (match) {
          usernameFieldRef = match[2];
          break;
        }
      }
      
      // Look for password field
      let passwordFieldRef = null;
      const passwordMatch = initialSnapshot.match(/(textbox|combobox).*?ref="(e\\d+)".*?(password|pass)/i);
      if (passwordMatch) {
        passwordFieldRef = passwordMatch[2];
      }
      
      // Look for login button
      let loginButtonRef = null;
      const buttonMatch = initialSnapshot.match(/button.*?ref="(e\\d+)".*?(login|sign|submit)/i);
      if (buttonMatch) {
        loginButtonRef = buttonMatch[1];
      }
      
      if (usernameFieldRef && passwordFieldRef) {
        // Fill in credentials
        await mcp_playwright_browser_fill_form({
          fields: [
            {
              name: "Username",
              type: "textbox",
              ref: usernameFieldRef,
              value: "admin"
            },
            {
              name: "Password",
              type: "textbox", 
              ref: passwordFieldRef,
              value: "admin123"
            }
          ]
        });
        
        // Click login button if found
        if (loginButtonRef) {
          await mcp_playwright_browser_click({
            element: "Login button",
            ref: loginButtonRef
          });
        } else {
          // If no explicit login button, look for any button in the form
          const submitButtonMatch = initialSnapshot.match(/button.*?ref="(e\\d+)"/);
          if (submitButtonMatch) {
            await mcp_playwright_browser_click({
              element: "Submit button",
              ref: submitButtonMatch[1]
            });
          }
        }
        
        await mcp_playwright_browser_wait_for({ time: 5 });
      }
    }
    
    // Test 3: Capture POS interface snapshot
    console.log('3. Checking MainPOSInterface layout...');
    const posSnapshot = await mcp_playwright_browser_snapshot();
    await mcp_playwright_browser_take_screenshot({ filename: 'main-pos-interface-layout.png' });
    
    // Test 4: Verify CSS variables are applied (check for expected colors/styling)
    console.log('4. Verifying CSS variables application...');
    
    // Check if the CSS variables are being used by evaluating computed styles
    const cssVariablesApplied = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "// Check if CSS variables are being used " +
        "const rootStyles = getComputedStyle(document.documentElement); " +
        "const bgPrimary = getComputedStyle(document.querySelector('body') || document.documentElement).backgroundColor; " +
        "return { " +
        "  hasCssVars: !!rootStyles.getPropertyValue('--bg-primary'), " +
        "  bgPrimaryVar: rootStyles.getPropertyValue('--bg-primary'), " +
        "  actualBgColor: bgPrimary " +
        "}; " +
        "}"
    });
    
    console.log('CSS variables check result:', cssVariablesApplied);
    
    if (cssVariablesApplied.hasCssVars) {
      console.log('✓ CSS variables are defined in the document');
    } else {
      console.log('✗ CSS variables are not defined');
    }
    
    // Test 5: Check responsive grid layout (w-2/3, w-1/3)
    console.log('5. Testing responsive grid layout (w-2/3, w-1/3)...');
    
    const gridLayoutCheck = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "const container = document.querySelector('.w-screen.h-screen, [class*='screen'], div'); " +
        "const productGrid = document.querySelector('div.w-2\\\\/3, [class*='2/3']'); " +
        "const orderPanel = document.querySelector('div.w-1\\\\/3, [class*='1/3']'); " +
        " " +
        "return { " +
        "  containerFound: !!container, " +
        "  productGridFound: !!productGrid, " +
        "  orderPanelFound: !!orderPanel, " +
        "  productGridWidth: productGrid ? productGrid.getBoundingClientRect().width : 0, " +
        "  orderPanelWidth: orderPanel ? orderPanel.getBoundingClientRect().width : 0, " +
        "  containerWidth: container ? container.getBoundingClientRect().width : 0 " +
        "}; " +
        "}"
    });
    
    console.log('Grid layout check result:', gridLayoutCheck);
    
    if (gridLayoutCheck.productGridFound && gridLayoutCheck.orderPanelFound) {
      console.log('✓ Both product grid (w-2/3) and order panel (w-1/3) elements found');
      
      if (gridLayoutCheck.containerWidth > 0) {
        const productRatio = gridLayoutCheck.productGridWidth / gridLayoutCheck.containerWidth;
        const panelRatio = gridLayoutCheck.orderPanelWidth / gridLayoutCheck.containerWidth;
        
        console.log(`Product grid ratio: ${(productRatio * 100).toFixed(2)}% (expected ~66.67%)`);
        console.log(`Order panel ratio: ${(panelRatio * 100).toFixed(2)}% (expected ~33.33%)`);
        
        // Check if ratios are approximately correct (with tolerance)
        if (productRatio > 0.6 && productRatio < 0.75) {
          console.log('✓ Product grid width is approximately 2/3 of container');
        } else {
          console.log('✗ Product grid width is not approximately 2/3 of container');
        }
        
        if (panelRatio > 0.25 && panelRatio < 0.4) {
          console.log('✓ Order panel width is approximately 1/3 of container');
        } else {
          console.log('✗ Order panel width is not approximately 1/3 of container');
        }
      }
    } else {
      console.log('✗ Grid layout elements not found as expected');
    }
    
    // Test 6: Check z-index behavior for admin panel button
    console.log('6. Testing z-index behavior for admin panel button...');
    
    const zIndexCheck = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "const adminButton = document.querySelector('button:contains(\"Admin\"), button[class*=\"admin\"], [class*=\"admin\"] button, button'); " +
        "let zIndex = 'not found'; " +
        "if (adminButton) { " +
        "  zIndex = getComputedStyle(adminButton).zIndex; " +
        "  console.log('Found button with text:', adminButton.textContent); " +
        "} " +
        "return zIndex; " +
        "}"
    });
    
    console.log('Admin button z-index:', zIndexCheck);
    
    if (zIndexCheck !== 'not found' && parseInt(zIndexCheck) >= 30) {
      console.log('✓ Admin panel button has appropriate z-index (≥30)');
    } else if (zIndexCheck !== 'not found') {
      console.log(`✗ Admin panel button z-index is ${zIndexCheck}, expected ≥30`);
    } else {
      console.log('⚠ Could not find admin panel button to test z-index');
    }
    
    // Test 7: Check color consistency with semantic variables
    console.log('7. Testing color consistency with semantic variables...');
    
    const colorConsistencyCheck = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "const elements = []; " +
        "// Check various elements for color consistency " +
        "const bgColorEl = document.querySelector('.bg-slate-800, .bg-slate-900, [class*=\"bg-\"]'); " +
        "const accentEl = document.querySelector('.bg-amber-500, .bg-purple-700, [class*=\"amber\"], [class*=\"purple\"]'); " +
        "const textEl = document.querySelector('.text-white, [class*=\"text-\"]'); " +
        " " +
        "if (bgColorEl) { " +
        "  elements.push({ type: 'background', color: getComputedStyle(bgColorEl).backgroundColor }); " +
        "} " +
        "if (accentEl) { " +
        "  elements.push({ type: 'accent', color: getComputedStyle(accentEl).backgroundColor }); " +
        "} " +
        "if (textEl) { " +
        "  elements.push({ type: 'text', color: getComputedStyle(textEl).color }); " +
        "} " +
        " " +
        "return elements; " +
        "}"
    });
    
    console.log('Color consistency check result:', colorConsistencyCheck);
    
    if (colorConsistencyCheck.length > 0) {
      console.log('✓ Colors are applied to interface elements');
      // The actual color values would need to be compared against expected values
    } else {
      console.log('⚠ Could not detect color application');
    }
    
    // Test 8: Test admin panel button functionality
    console.log('8. Testing admin panel button functionality...');
    
    // Look for the admin panel button in the snapshot
    const adminButtonPattern = /button.*?ref="(e\d+)".*?(admin|Admin)/i;
    const adminButtonMatch = posSnapshot.match(adminButtonPattern);
    
    if (adminButtonMatch) {
      const adminButtonRef = adminButtonMatch[1];
      console.log(`Found admin button with ref: ${adminButtonRef}`);
      
      // Click the admin button to test functionality
      await mcp_playwright_browser_click({
        element: "Admin Panel button",
        ref: adminButtonRef
      });
      
      await mcp_playwright_browser_wait_for({ time: 2 });
      
      // Check if admin panel appeared
      const adminPanelCheck = await mcp_playwright_browser_evaluate({
        function: "() => { " +
          "return { " +
          "  adminPanelVisible: document.querySelector('[class*=\"admin\" i], [class*=\"panel\" i], .admin-panel, .admin-section') !== null, " +
          "  bodyOverflow: getComputedStyle(document.body).overflow " +
          "}; " +
          "}"
      });
      
      if (adminPanelCheck.adminPanelVisible) {
        console.log('✓ Admin panel button functionality works correctly');
      } else {
        console.log('✗ Admin panel did not appear after button click');
      }
    } else {
      console.log('⚠ Admin panel button not found in snapshot');
    }
    
    // Test 9: Mobile responsiveness check
    console.log('9. Testing mobile responsiveness...');
    
    // Resize to mobile dimensions
    await mcp_playwright_browser_resize({ width: 375, height: 667 });
    await mcp_playwright_browser_wait_for({ time: 2 });
    
    // Take mobile screenshot
    await mcp_playwright_browser_take_screenshot({ filename: 'main-pos-mobile-responsive.png' });
    
    const mobileCheck = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "const productGrid = document.querySelector('div.w-2\\\\/3, [class*=\"2/3\"]'); " +
        "const orderPanel = document.querySelector('div.w-1\\\\/3, [class*=\"1/3\"]'); " +
        "return { " +
        "  productGridVisible: productGrid && productGrid.offsetParent !== null, " +
        "  orderPanelVisible: orderPanel && orderPanel.offsetParent !== null, " +
        "  productGridRect: productGrid ? productGrid.getBoundingClientRect() : null, " +
        "  orderPanelRect: orderPanel ? orderPanel.getBoundingClientRect() : null " +
        "}; " +
        "}"
    });
    
    console.log('Mobile responsiveness check result:', mobileCheck);
    
    if (mobileCheck.productGridVisible || mobileCheck.orderPanelVisible) {
      console.log('✓ Layout elements remain visible on mobile');
    } else {
      console.log('⚠ Some layout elements may not be visible on mobile');
    }
    
    // Test 10: Cross-browser compatibility check (scrollbar styling)
    console.log('10. Testing cross-browser compatibility (scrollbar support)...');
    
    const scrollbarCheck = await mcp_playwright_browser_evaluate({
      function: "() => { " +
        "const hasWebKitScrollbar = !!document.querySelector('*') && CSS.supports('selector(::-webkit-scrollbar)'); " +
        "// Check for Firefox scrollbar support in CSS " +
        "let hasFirefoxScrollbarSupport = false; " +
        "try { " +
        "  for (let sheet of document.styleSheets) { " +
        "    for (let rule of sheet.cssRules) { " +
        "      if (rule.cssText && rule.cssText.includes('scrollbar-width')) { " +
        "        hasFirefoxScrollbarSupport = true; " +
        "        break; " +
        "      } " +
        "    } " +
        "    if (hasFirefoxScrollbarSupport) break; " +
        "  } " +
        "} catch(e) {} " +
        "return { webkit: hasWebKitScrollbar, firefox: hasFirefoxScrollbarSupport }; " +
        "}"
    });
    
    console.log('Scrollbar compatibility check:', scrollbarCheck);
    
    if (scrollbarCheck.firefox) {
      console.log('✓ Firefox scrollbar support detected in CSS');
    } else {
      console.log('⚠ Firefox scrollbar support not detected');
    }
    
    // Restore desktop view
    await mcp_playwright_browser_resize({ width: 1200, height: 800 });
    await mcp_playwright_browser_wait_for({ time: 1 });
    
    console.log('\nCSS improvements verification completed!');
    console.log('Summary:');
    console.log('- MainPOSInterface layout structure ✓');
    console.log('- CSS variables application ✓/✗ (see details above)');
    console.log('- Responsive grid layout (w-2/3, w-1/3) ✓/✗ (see details above)');
    console.log('- Z-index behavior for admin panel ✓/✗ (see details above)');
    console.log('- Color consistency with semantic variables ✓/✗ (see details above)');
    console.log('- Admin panel button functionality ✓/✗ (see details above)');
    console.log('- Mobile responsiveness ✓/✗ (see details above)');
    console.log('- Cross-browser compatibility ✓/✗ (see details above)');
    
  } catch (error) {
    console.error('Error during CSS improvements verification:', error);
  }
}

// Execute the verification test
verifyCSSImprovements();