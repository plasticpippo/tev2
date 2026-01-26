# Architectural Issues Report

## 1. Dropped Functionality vs. Frontend References
- **Issue**: The `product_grid_layouts` table was dropped in migration `20260120140000_drop_product_grid_layouts/migration.sql`, but:
  - Frontend still references `/api/layouts` endpoint (see `frontend/shared/constants.ts`, `frontend/utils/errorMessages.ts`)
  - Admin panel still shows "Product Grid Layouts" menu option (see `frontend/components/AdminPanel.tsx`)
  - Constants still define layout-related API endpoints
- **Risk Level**: MEDIUM
- **Impact**: Broken functionality and confusing UI elements
- **Recommendation**: Complete removal of all layout-related code or restoration of the functionality

### Fix Proposal:
1. **Option A - Complete Removal**:
   - Remove "Product Grid Layouts" menu option from AdminPanel.tsx
   - Remove all layout-related entries from API_ENDPOINTS in constants.ts
   - Remove layout-related error messages from errorMessages.ts
   - Remove any layout-related components and services
   - Update any related tests

2. **Option B - Restore Functionality**:
   - Reverse the migration to recreate the `product_grid_layouts` table
   - Implement proper backend API endpoints for layout management
   - Create proper authentication and authorization for layout endpoints
   - Ensure frontend and backend are consistent

## 2. Incomplete Feature Implementation
- **Documentation**: Plans/Fix-products-layout/non_working_functionalities.md lists numerous non-working features:
  - Layout creation/saving fails with 500 errors
  - Drag-and-drop functionality broken
  - Missing individual item removal
  - No resizing functionality
- **Risk Level**: MEDIUM
- **Impact**: User frustration and poor UX
- **Recommendation**: Either complete the implementation or remove the feature entirely

### Fix Proposal:
1. If keeping the feature:
   - Fix the backend API endpoints to handle layout creation/saving properly
   - Implement proper error handling and validation
   - Fix the drag-and-drop functionality in the frontend
   - Add individual item removal capability
   - Implement resizing functionality

2. If removing the feature:
   - Follow Option A from the previous fix proposal
   - Ensure all references are removed from the codebase
   - Update documentation to reflect the removal

## 3. Missing Backend-Frontend Consistency
- **Issue**: Frontend expects certain API endpoints and data structures that may not exist or have changed
- **Risk Level**: MEDIUM
- **Impact**: Runtime errors and broken user flows
- **Recommendation**: Audit all API contracts and ensure consistency

### Fix Proposal:
1. Create API contract documentation using OpenAPI/Swagger
2. Implement API versioning to maintain consistency
3. Add API response validation on the frontend
4. Create integration tests to verify API contracts
5. Establish a process for coordinated frontend-backend changes

## 4. Monolithic Architecture Pattern
- **Issue**: The application follows a monolithic pattern without clear separation of concerns
- **Risk Level**: LOW-MEDIUM
- **Impact**: Difficulty in scaling and maintaining components separately
- **Recommendation**: Consider microservice architecture for future scalability

### Fix Proposal:
1. Identify clear service boundaries based on business domains
2. Gradually refactor the monolith into smaller, cohesive services
3. Implement API gateways for service communication
4. Use asynchronous messaging for loose coupling
5. Containerize services for easier deployment and scaling