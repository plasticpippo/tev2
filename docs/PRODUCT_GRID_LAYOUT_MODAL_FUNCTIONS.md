# Product Grid Layout Modal Functions Documentation

This document details all functions available in the Customize Product Grid Layout modal for testing purposes.

## Component Overview

The Customize Product Grid Layout modal is implemented through the `ProductGridLayoutCustomizer` component which uses the `useProductGridLayoutCustomizer` hook for its business logic. The modal allows users to customize the product grid layout, including arranging products, saving layouts, loading existing layouts, and managing layout configurations.

## UI Components and Their Functions

### 1. LayoutConfigurationSection
This section handles layout settings and basic configuration.

#### Interactive Elements:
- **Layout Name Input**: Text input field for entering the layout name
- **Select Till Dropdown**: Allows selection of a till for the layout
- **Set as Default Checkbox**: Sets the layout as default for the selected till
- **Save Layout Button**: Saves the current layout (updates if existing, creates new if not)
- **Save As New Button**: Creates a new layout with current configuration
- **Cancel Button**: Closes the modal without saving
- **Clear Grid Button**: Removes all items from the current grid

#### Functions:
- `setLayoutName(name: string)`: Updates the layout name state
- `setSelectedTill(tillId: number | null)`: Updates the selected till state
- `setIsDefault(isDefault: boolean)`: Updates the default status state
- `handleSaveLayout()`: Saves the current layout to the database
- `handleSaveAsNewLayout()`: Saves the current configuration as a new layout
- `handleClearGrid()`: Clears all items from the grid

### 2. AvailableLayoutsSection
This section displays available layouts and provides management functions.

#### Interactive Elements:
- **Filter Type Dropdown**: Filters layouts by type ('all', 'favorites', 'category')
- **Search Input**: Searches layouts by name
- **Layout Cards**: Each card displays layout info with action buttons
- **Set Default Buttons**: Sets a layout as default (when not already default)
- **Load Buttons**: Loads a layout into the editor
- **Delete Buttons**: Opens confirmation modal for deletion
- **Create New Layout Button**: Resets the form to create a new layout

#### Functions:
- `setFilterType(filterType: 'all' | 'favorites' | 'category')`: Updates filter type
- `setSearchQuery(query: string)`: Updates search query
- `handleSetAsDefault(layoutId: string | number)`: Sets a layout as default
- `handleLoadLayout(layoutId: string | number)`: Loads a layout by ID
- `handleDeleteLayout(layoutId: string | number)`: Deletes a layout by ID
- `handleCreateNewLayout()`: Resets the form for a new layout
- `setShowConfirmationModal(modalState: {show: boolean, layoutId?: string | number, layoutName?: string})`: Controls the confirmation modal

### 3. AvailableProductsPanel
This section shows available products and allows adding them to the grid.

#### Interactive Elements:
- **Favorites Toggle Button**: Toggles favorites filter
- **All Products Button**: Shows all products
- **Category Buttons**: Filters by specific category
- **Product Variant Buttons**: Adds specific product variants to the grid

#### Functions:
- `setShowFavoritesOnly(show: boolean)`: Toggles favorites filter
- `setSelectedCategory(category: number | 'all')`: Sets selected category
- `setActiveFilterType(filterType: 'all' | 'favorites' | 'category')`: Updates active filter type
- `setActiveCategoryId(categoryId: number | null)`: Updates active category ID
- `handleAddItemToGrid(product: Product, variant: ProductVariant)`: Adds a product variant to the grid

### 4. GridLayoutSection
This section displays the actual grid layout where items can be arranged.

#### Interactive Elements:
- **Draggable Grid Items**: Items that can be moved around the grid
- **Drop Zones**: Areas where items can be dropped

#### Functions:
- `handleMoveItem(id: string, newX: number, newY: number)`: Moves an item to a new position

### 5. ConfirmationModal
A modal that appears when deleting layouts to confirm the action.

#### Functions:
- `setShowConfirmationModal(show: boolean)`: Shows/hides the confirmation modal
- `handleDeleteLayout(layoutId: string | number)`: Confirms and executes layout deletion

## Core Business Logic Functions

### State Management Functions
- `setGridItems(items: GridItem[])`: Updates the grid items array
- `resetLayout()`: Resets the layout to default state
- `parseGridItems(gridItems: any[])`: Parses raw grid items into GridItem objects
- `loadLayoutsForTill(tillId: number)`: Loads layouts for a specific till

### API Service Functions
These functions interact with the backend API:

#### saveGridLayout(layoutData: ProductGridLayoutData)
- **Purpose**: Saves a grid layout to the database
- **API Endpoint**: POST `/api/grid-layouts/tills/{tillId}/grid-layouts`
- **Parameters**: Layout data object with name, layout, isDefault, filterType, categoryId
- **Returns**: Saved layout data object
- **Test Scenarios**:
  - Valid layout data
  - Missing required fields
  - Invalid till ID
  - Duplicate layout names

#### getGridLayoutsForTill(tillId: number)
- **Purpose**: Retrieves all layouts for a specific till
- **API Endpoint**: GET `/api/grid-layouts/tills/{tillId}/grid-layouts`
- **Parameters**: Till ID
- **Returns**: Array of layout data objects
- **Test Scenarios**:
  - Valid till ID with layouts
  - Valid till ID with no layouts
  - Invalid till ID
  - Network errors

#### getCurrentLayoutForTill(tillId: number)
- **Purpose**: Gets the current/default layout for a till
- **API Endpoint**: GET `/api/grid-layouts/tills/{tillId}/current-layout`
- **Parameters**: Till ID
- **Returns**: Layout data object
- **Test Scenarios**:
  - Till with default layout
  - Till with no default layout
  - Invalid till ID

#### getCurrentLayoutForTillWithFilter(tillId: number, filterType: string, categoryId?: number | null)
- **Purpose**: Gets the current layout for a till with specific filter
- **API Endpoint**: GET `/api/grid-layouts/tills/{tillId}/current-layout?filterType={filterType}&categoryId={categoryId}`
- **Parameters**: Till ID, filter type, optional category ID
- **Returns**: Layout data object
- **Test Scenarios**:
  - Different filter types
  - With and without category ID
  - Invalid combinations

#### getSharedLayouts()
- **Purpose**: Retrieves all shared layouts
- **API Endpoint**: GET `/api/grid-layouts/shared`
- **Parameters**: None
- **Returns**: Array of layout data objects
- **Test Scenarios**:
  - Multiple shared layouts
  - No shared layouts
  - Permission restrictions

#### deleteGridLayout(layoutId: string)
- **Purpose**: Deletes a layout by ID
- **API Endpoint**: DELETE `/api/grid-layouts/{layoutId}`
- **Parameters**: Layout ID
- **Returns**: Void
- **Test Scenarios**:
  - Valid layout ID
  - Non-existent layout ID
  - Layout in use
  - Default layout deletion

#### setLayoutAsDefault(layoutId: string)
- **Purpose**: Sets a layout as default
- **API Endpoint**: PUT `/api/grid-layouts/{layoutId}/set-default`
- **Parameters**: Layout ID
- **Returns**: Updated layout data object
- **Test Scenarios**:
  - Valid layout ID
  - Non-existent layout ID
  - Already default layout
  - Multiple defaults conflict

#### getLayoutsByFilterType(tillId: number, filterType: 'all' | 'favorites' | 'category', categoryId?: number | null)
- **Purpose**: Gets layouts filtered by type and category
- **API Endpoint**: GET `/api/grid-layouts/tills/{tillId}/layouts-by-filter/{filterType}?categoryId={categoryId}`
- **Parameters**: Till ID, filter type, optional category ID
- **Returns**: Array of layout data objects
- **Test Scenarios**:
  - Different filter types
  - With and without category ID
  - No matching layouts

#### getLayoutById(layoutId: string)
- **Purpose**: Retrieves a specific layout by ID
- **API Endpoint**: GET `/api/grid-layouts/{layoutId}`
- **Parameters**: Layout ID
- **Returns**: Layout data object
- **Test Scenarios**:
  - Valid layout ID
  - Non-existent layout ID
  - Invalid layout ID format

## Data Structures

### ProductGridLayoutData Interface
```typescript
interface ProductGridLayoutData {
  id?: string | number;          // Layout ID (optional for new layouts)
  name: string;                  // Layout name
  tillId: number;                // Associated till ID
  layout: ProductGridLayout;     // The actual grid layout
  isDefault: boolean;            // Whether this is the default layout
  filterType?: 'all' | 'favorites' | 'category';  // Filter type
  categoryId?: number | null;    // Associated category ID
}
```

### ProductGridLayout Interface
```typescript
interface ProductGridLayout {
  columns: number;              // Number of columns in grid
  gridItems: GridItem[];        // Array of positioned items
  version: string;              // Layout schema version
}
```

### GridItem Interface
```typescript
interface GridItem {
  id: string;                   // Unique item ID
  variantId: number;            // Product variant ID
  productId: number;            // Product ID
  name: string;                 // Product name
  price: number;                // Product price
  backgroundColor: string;      // Background color
  textColor: string;            // Text color
  x: number;                    // X position on grid
  y: number;                    // Y position on grid
  width: number;                // Width in grid units
  height: number;               // Height in grid units
}
```

## Event Flow Analysis

### Loading the Modal
1. Component mounts and initializes state
2. Effect runs to load layouts for the selected till
3. Available layouts are displayed in the sidebar

### Creating a New Layout
1. User enters layout name and selects till
2. User arranges products on the grid
3. User clicks "Save Layout" button
4. `handleSaveLayout()` validates inputs and calls `saveGridLayout()`
5. Layout is saved to database and reflected in UI

### Loading an Existing Layout
1. User clicks "Load" button on a layout card
2. `handleLoadLayout()` retrieves layout data by ID
3. Component state is updated with loaded layout
4. Grid is repopulated with stored items

### Updating an Existing Layout
1. User modifies the currently loaded layout
2. User clicks "Update Layout" button (or "Save Layout" when layout has ID)
3. `handleSaveLayout()` updates the existing layout in database

### Deleting a Layout
1. User clicks "Del" button on a layout card
2. Confirmation modal appears
3. User confirms deletion
4. `handleDeleteLayout()` removes layout from database
5. UI is updated to reflect deletion

## Error Handling Scenarios

### API Errors
- Network failures during API calls
- Server errors (5xx responses)
- Validation errors (4xx responses)
- Unauthorized access attempts

### Client-side Validation
- Empty layout name
- No selected till
- Invalid grid positions
- Duplicate layout names (warning, not blocking)

### State Synchronization
- Handling optimistic updates vs. server responses
- Managing loading states during API calls
- Error recovery and fallback states

## Testing Considerations

### Positive Test Cases
- Successfully saving a new layout
- Loading an existing layout
- Updating an existing layout
- Setting a layout as default
- Deleting a non-default layout
- Filtering layouts by type
- Adding products to grid
- Moving items on grid
- Clearing grid

### Negative Test Cases
- Saving layout without selecting till
- Saving layout without name
- Attempting to delete default layout
- Network failures during operations
- Invalid data inputs
- Concurrency issues (multiple users modifying same layout)

### Edge Cases
- Maximum number of items in grid
- Large layout names
- Very tall/wide grids
- Rapid successive operations
- Multiple modals open simultaneously
- Browser refresh during operations

## Detailed Edge Cases and Error Handling Scenarios

### API Error Handling
1. **Network Timeout Scenarios**
   - Long-running save operations
   - Server unavailability during layout loading
   - Intermittent connection loss during operations

2. **Server Error Responses**
   - 500 Internal Server Errors during CRUD operations
   - 503 Service Unavailable during high load
   - Database connectivity issues

3. **Validation Errors**
   - Layout name exceeds character limits
   - Invalid JSON format in layout data
   - Missing required fields in API requests
   - Invalid foreign key references (non-existent till, product, etc.)

4. **Authentication/Authorization Failures**
   - Session timeout during operations
   - Insufficient permissions to modify layouts
   - Unauthorized access to other tills' layouts

### State Management Edge Cases
1. **Race Conditions**
   - Simultaneous API calls modifying the same layout
   - State updates occurring while API calls are in flight
   - User interactions during loading states

2. **Memory Management**
   - Large grid layouts consuming excessive memory
   - Cleanup of event listeners when component unmounts
   - Memory leaks from unclosed modals

3. **Data Consistency**
   - Optimistic updates conflicting with server responses
   - Stale data being displayed after failed operations
   - Concurrent modifications by different users

### UI/UX Edge Cases
1. **Large Dataset Handling**
   - Performance degradation with hundreds of products
   - Slow rendering of complex grid layouts
   - Browser freezing during intensive operations

2. **Grid Manipulation Limits**
   - Placing items outside grid boundaries
   - Overlapping items on the grid
   - Extremely large item dimensions (width/height)

3. **User Interaction Patterns**
   - Accidental closing of modal during unsaved changes
   - Multiple rapid clicks on save buttons
   - Interrupting operations mid-process

### Browser Compatibility Issues
1. **Storage Limitations**
   - Local storage quota exceeded
   - Session storage limitations
   - Cookie size restrictions affecting auth

2. **Feature Availability**
   - Drag-and-drop support in older browsers
   - Modern JavaScript features in legacy environments
   - CSS Grid/Flexbox compatibility

### Backend Integration Issues
1. **Database Constraints**
   - Unique constraint violations
   - Foreign key constraint failures
   - Transaction rollback scenarios

2. **Migration Compatibility**
   - Schema changes affecting existing layouts
   - Version compatibility between client and server
   - Backward compatibility for older layout formats

### Recovery and Fallback Strategies
1. **Graceful Degradation**
   - Fallback UI when JavaScript fails
   - Offline operation capabilities
   - Progressive enhancement strategies

2. **Error Recovery**
   - Automatic retry mechanisms for transient failures
   - Rollback procedures for partial operations
   - Data restoration from backups

## Key Testing Points Summary for QA Team

### Critical Test Scenarios
1. **Layout Creation Workflow**
   - End-to-end creation of new layouts
   - Proper validation of required fields
   - Correct assignment to selected till

2. **Layout Persistence**
   - Data integrity during save/load cycles
   - Consistent behavior across browser sessions
   - Proper handling of layout relationships

3. **Multi-user Scenarios**
   - Concurrent access to same layouts
   - Conflict resolution mechanisms
   - Proper user isolation

4. **Performance Under Load**
   - Response times with large datasets
   - Memory consumption during operations
   - Stability during intensive usage

### Recommended Test Automation Coverage
1. **Unit Tests**
   - Individual function validation
   - API service methods
   - State management logic

2. **Integration Tests**
   - Component interaction flows
   - API integration points
   - Data flow validation

3. **End-to-End Tests**
   - Complete user workflows
   - Cross-component functionality
   - Real-world usage patterns

### Monitoring and Observability
1. **Key Metrics to Track**
   - Operation success/failure rates
   - Response times for different operations
   - Error frequency by type

2. **Logging Requirements**
   - Detailed operation logs
   - Error context information
   - Performance metrics collection