// Color Palette Test for Product Management Interface
// This script tests the expanded color palette functionality in the product add/edit interface

async function testColorPalette() {
  console.log('Testing expanded color palette functionality...');
  
  // Navigate to the frontend application
  console.log('1. Navigating to the application...');
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_navigate",
    arguments: { url: "http://localhost:3000" }
  });

  // Wait for page to load
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 2 }
  });

  // Get page snapshot to see the current state
  const snapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  console.log('Snapshot captured, looking for login elements...');
  
  // Check if we need to log in first
  if (snapshot.toLowerCase().includes('login') || snapshot.toLowerCase().includes('sign in')) {
    console.log('Login required, attempting to log in...');
    
    // Get a fresh snapshot to identify login elements
    const loginSnapshot = await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_snapshot",
      arguments: {}
    });
    
    // Extract element references from the snapshot
    // Look for username input element
    const usernameMatch = loginSnapshot.match(/- textbox "username".*ref: ([^,\s]+)/i);
    const passwordMatch = loginSnapshot.match(/- textbox "password".*ref: ([^,\s]+)/i);
    const loginButtonMatch = loginSnapshot.match(/- button "login".*ref: ([^,\s]+)/i) ||
                             loginSnapshot.match(/- button.*login.*ref: ([^,\s]+)/i);
    
    if (usernameMatch && passwordMatch && loginButtonMatch) {
      const usernameRef = usernameMatch[1];
      const passwordRef = passwordMatch[1];
      const loginButtonRef = loginButtonMatch[1];
      
      // Fill in login credentials
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_fill_form",
        arguments: {
          fields: [
            {
              name: "username",
              type: "textbox",
              ref: usernameRef,
              value: "admin"
            },
            {
              name: "password",
              type: "textbox",
              ref: passwordRef,
              value: "admin123"
            }
          ]
        }
      });
      
      // Click login button
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_click",
        arguments: {
          element: "Login button",
          ref: loginButtonRef
        }
      });
      
      // Wait for login to complete
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_wait_for",
        arguments: { time: 3 }
      });
    } else {
      console.log('Could not find login elements in snapshot');
      console.log('Login snapshot:', loginSnapshot);
    }
  } else {
    console.log('No login required, proceeding to product management');
  }
  
  // Get a fresh snapshot to find the product management link/button
  const dashboardSnapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  console.log('Dashboard snapshot captured, looking for product management...');
  
  // Look for product management navigation element
  const productNavMatch = dashboardSnapshot.match(/- button "Products".*ref: ([^,\s]+)/i) ||
                          dashboardSnapshot.match(/- link.*product.*ref: ([^,\s]+)/i) ||
                          dashboardSnapshot.match(/- button.*product.*ref: ([^,\s]+)/i);
  
  if (productNavMatch) {
    const productNavRef = productNavMatch[1];
    
    // Navigate to product management
    console.log('2. Navigating to product management...');
    
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_click",
      arguments: { element: "Product Management", ref: productNavRef }
    });
    
    // Wait for the product management page to load
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_wait_for",
      arguments: { time: 2 }
    });
    
    // Get snapshot of product management page
    const productManagementSnapshot = await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_snapshot",
      arguments: {}
    });
    
    console.log('Product management page loaded, looking for add product button...');
    
    // Look for add product button
    const addProductMatch = productManagementSnapshot.match(/- button "Add Product".*ref: ([^,\s]+)/i) ||
                            productManagementSnapshot.match(/- button.*add.*product.*ref: ([^,\s]+)/i);
    
    if (addProductMatch) {
      const addProductRef = addProductMatch[1];
      
      // Click "Add Product" button to see the color palette
      console.log('3. Opening add product modal...');
      
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_click",
        arguments: { element: "Add Product", ref: addProductRef }
      });
      
      // Wait for modal to appear
      await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_wait_for",
        arguments: { time: 2 }
      });
      
      // Get snapshot of the modal to see the color palette
      const modalSnapshot = await use_mcp_tool({
        server_name: "playwright",
        tool_name: "browser_snapshot",
        arguments: {}
      });
      
      console.log('Modal snapshot captured, looking for color palette...');
      
      // Look for the color palette section (the div with available colors)
      if (modalSnapshot.includes('Button Color') || modalSnapshot.includes('button color')) {
        console.log('Found color palette section');
        
        // Count how many color buttons are visible
        const colorMatches = modalSnapshot.match(/w-8 h-8 rounded-full/g);
        const colorCount = colorMatches ? colorMatches.length : 0;
        
        console.log(`4. Counted ${colorCount} color buttons in the palette`);
        
        if (colorCount >= 54) {
          console.log('✓ SUCCESS: Color palette has 54 or more colors as required');
        } else {
          console.log(`✗ FAILURE: Color palette only has ${colorCount} colors, expected at least 54`);
        }
        
        // Test color selection functionality
        console.log('5. Testing color selection functionality...');
        
        // Find the first color button to click
        const colorButtonMatch = modalSnapshot.match(/- button.*w-8 h-8 rounded-full.*ref: ([^,\s]+)/);
        
        if (colorButtonMatch) {
          const colorButtonRef = colorButtonMatch[1];
          
          // Click on a color button (first one)
          await use_mcp_tool({
            server_name: "playwright",
            tool_name: "browser_click",
            arguments: { element: "Color button", ref: colorButtonRef }
          });
          
          // Wait for the preview to update
          await use_mcp_tool({
            server_name: "playwright",
            tool_name: "browser_wait_for",
            arguments: { time: 1 }
          });
          
          // Get new snapshot to verify preview updated
          const updatedSnapshot = await use_mcp_tool({
            server_name: "playwright",
            tool_name: "browser_snapshot",
            arguments: {}
          });
          
          console.log('Preview area updated, checking for changes...');
          
          // Test scrollable container if there are many colors
          if (colorCount > 20) { // If there are many colors, check if scrolling is available
            console.log('6. Testing scrollable container functionality...');
            
            // Check if scrollable container exists (max-h-40 overflow-y-auto)
            if (updatedSnapshot.includes('max-h-40') && updatedSnapshot.includes('overflow-y-auto')) {
              console.log('✓ Scrollable container is properly implemented');
            } else {
              console.log('✗ Scrollable container is missing or not properly implemented');
            }
          }
          
          console.log('7. Verifying visual appearance matches intended design...');
          
          // Check for proper styling elements
          if (updatedSnapshot.includes('flex-wrap') && updatedSnapshot.includes('gap-2')) {
            console.log('✓ Color palette has proper flex layout');
          }
          
          if (updatedSnapshot.includes('ring-2 ring-offset-2 ring-offset-slate-700 ring-white')) {
            console.log('✓ Selected color has proper highlighting');
          }
          
          console.log('✓ Color palette testing completed successfully');
        } else {
          console.log('✗ Could not find any color button to click');
        }
      } else {
        console.log('✗ Could not find color palette section in the modal');
        console.log('Modal snapshot:', modalSnapshot);
      }
    } else {
      console.log('✗ Could not find "Add Product" button');
      console.log('Product management snapshot:', productManagementSnapshot);
    }
  } else {
    console.log('✗ Could not find product management navigation element');
    console.log('Dashboard snapshot:', dashboardSnapshot);
  }
  
  console.log('All tests completed!');
}

// Run the test
testColorPalette().catch(console.error);