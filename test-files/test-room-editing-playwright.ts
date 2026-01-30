/**
 * Playwright test for room editing functionality in the POS system
 * This test uses the Playwright MCP server to verify the ability to edit existing room names
 */

async function testRoomEditingFunctionality() {
  console.log('Starting room editing functionality test...');
  
  // Navigate to the POS system
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_navigate",
    arguments: { url: "http://192.168.1.241:3000" }
  });
  
  // Log in with admin credentials
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_fill_form",
    arguments: {
      fields: [
        {
          name: "username",
          type: "textbox",
          ref: "e11",
          value: "admin"
        },
        {
          name: "password", 
          type: "textbox",
          ref: "e14",
          value: "admin123"
        }
      ]
    }
  });
  
  // Click the login button
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_click",
    arguments: { element: "Login button", ref: "e15" }
  });
  
  // Wait for login to complete
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 2 }
  });
  
  // Navigate to Admin Panel and Table Management
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_click",
    arguments: { element: "Admin Panel link", ref: "admin-panel-link" }
  });
  
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_click",
    arguments: { element: "Table Management", ref: "table-management" }
  });
  
  // Switch to the rooms tab
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_click",
    arguments: { element: "Rooms tab", ref: "rooms-tab" }
  });
  
  // Wait for the rooms tab to load
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 1 }
  });
  
  // Take a snapshot to identify elements
  const snapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  console.log('Snapshot captured, looking for rooms and edit buttons...');
  
  // Look for existing rooms or create one if none exist
  const hasRooms = snapshot.includes("No rooms added yet");
  if (hasRooms) {
    console.log('Creating a test room first...');
    // Click "Add Room" button
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_click",
      arguments: { element: "Add Room button", ref: "add-room-btn" }
    });
    
    // Fill in room details
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_fill_form",
      arguments: {
        fields: [
          {
            name: "Room Name",
            type: "textbox",
            ref: "room-name-input",
            value: "Test Room for Editing"
          },
          {
            name: "Description", 
            type: "textbox",
            ref: "room-desc-input",
            value: "Original description"
          }
        ]
      }
    });
    
    // Save the room
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_click",
      arguments: { element: "Save button", ref: "save-room-btn" }
    });
    
    // Wait for room to be created
    await use_mcp_tool({
      server_name: "playwright",
      tool_name: "browser_wait_for",
      arguments: { time: 2 }
    });
  }
  
  // Now find an existing room and click its edit button
  console.log('Attempting to edit an existing room...');
  
  // Take another snapshot to identify the edit button
  const snapshot2 = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  // Find the edit button (we'll use JavaScript to click the first edit button)
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_evaluate",
    arguments: {
      function: "() => { document.querySelector('button[title=\"Edit room details\"]').click(); }"
    }
  });
  
  // Wait for the edit modal to appear
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 1 }
  });
  
  // Update the room name
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_fill_form",
    arguments: {
      fields: [
        {
          name: "Room Name",
          type: "textbox",
          ref: "room-name-input-edit",
          value: "Updated Room Name"
        },
        {
          name: "Description", 
          type: "textbox",
          ref: "room-desc-input-edit",
          value: "Updated description"
        }
      ]
    }
  });
  
  // Save the updated room
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_click",
    arguments: { element: "Save button", ref: "save-updated-room-btn" }
  });
  
  // Wait for update to complete
  await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_wait_for",
    arguments: { time: 2 }
  });
  
  // Verify the room name was updated by taking another snapshot
  const finalSnapshot = await use_mcp_tool({
    server_name: "playwright",
    tool_name: "browser_snapshot",
    arguments: {}
  });
  
  // Check if the updated room name appears in the snapshot
  if (finalSnapshot.includes("Updated Room Name")) {
    console.log('SUCCESS: Room name was successfully updated!');
  } else {
    console.log('FAILURE: Room name was not updated as expected.');
  }
  
  console.log('Room editing functionality test completed.');
}

// Run the test
await testRoomEditingFunctionality();