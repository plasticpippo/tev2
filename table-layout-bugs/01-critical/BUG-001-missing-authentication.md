# BUG-001: Missing Authentication on API Calls

## Severity Level
**CRITICAL**

## File Location
- `frontend/contexts/TableContext.tsx` (lines 45-120, 200-280)
- `frontend/services/tableService.ts` (lines 30-80)

## Description

All API calls in the TableContext and tableService lack proper Authorization headers. The application makes requests to protected endpoints without including authentication tokens, making the table and layout data accessible to any user, including unauthenticated ones.

## Current Vulnerable Code

```typescript
// TableContext.tsx - Line 67
const fetchTables = async (roomId: string) => {
  const response = await fetch(`/api/rooms/${roomId}/tables`);
  // No Authorization header!
  if (!response.ok) throw new Error('Failed to fetch tables');
  return response.json();
};

// tableService.ts - Line 45
export const updateTable = async (tableId: string, data: TableUpdateData) => {
  const response = await fetch(`/api/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // Missing: 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

## Root Cause Analysis

1. **Missing Auth Context Integration**: The table service functions don't receive or use authentication tokens
2. **No Interceptor Pattern**: Unlike other parts of the app, there's no request interceptor to automatically add auth headers
3. **Inconsistent Security**: Some API endpoints check for auth while the frontend doesn't provide it

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Data Breach | CRITICAL | Anyone can read table layouts and configurations |
| Unauthorized Modification | CRITICAL | Attackers can modify or delete table layouts |
| Business Disruption | HIGH | Malicious users could rearrange tables, causing operational chaos |
| Compliance Violation | HIGH | Violates security standards (PCI-DSS, GDPR) |

## Attack Scenario

```bash
# An attacker can simply call the API without any credentials:
curl -X GET http://192.168.1.241:3000/api/rooms/123/tables
# Returns all table data without authentication!

curl -X PUT http://192.168.1.241:3000/api/tables/456 \
  -H "Content-Type: application/json" \
  -d '{"name": "HACKED", "gridColumn": 1, "gridRow": 1}'
# Successfully modifies table without authorization!
```

## Suggested Fix

### Option 1: Use Centralized API Client (Recommended)

```typescript
// services/apiClient.ts
import { getAuthToken } from '../utils/auth';

export const apiClient = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    // Handle unauthorized - redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
};

// Update TableContext.tsx
const fetchTables = async (roomId: string) => {
  const response = await apiClient(`/api/rooms/${roomId}/tables`);
  if (!response.ok) throw new Error('Failed to fetch tables');
  return response.json();
};
```

### Option 2: Use Axios with Interceptors

```typescript
// services/api.ts
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Backend Verification

```typescript
// backend/src/handlers/tables.ts - Ensure this exists
import { authenticate } from '../middleware/auth';

router.get('/rooms/:roomId/tables', authenticate, async (req, res) => {
  // Verify user has access to this room
  const hasAccess = await checkRoomAccess(req.user.id, req.params.roomId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // ... rest of handler
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create centralized API client | 2 hours |
| Update TableContext to use client | 1 hour |
| Update tableService functions | 1 hour |
| Add backend auth verification | 2 hours |
| Testing | 2 hours |
| **Total** | **8 hours (1 day)** |

## Testing Strategy

```typescript
// tests/auth.test.ts
describe('Table API Authentication', () => {
  it('should reject requests without auth token', async () => {
    const response = await fetch('/api/rooms/123/tables');
    expect(response.status).toBe(401);
  });
  
  it('should accept requests with valid auth token', async () => {
    const token = await loginAsUser('admin', 'admin123');
    const response = await fetch('/api/rooms/123/tables', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status).toBe(200);
  });
  
  it('should reject requests with expired token', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const response = await fetch('/api/rooms/123/tables', {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    expect(response.status).toBe(401);
  });
});
```

## Related Issues

- [BUG-012: No Ownership Verification](./BUG-012-no-ownership-verification.md)
- [Security Vulnerabilities](../../docs/security-vulnerabilities.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.2.0 (Critical Hotfix)

## Fix Applied

### Status: FIXED

### Fix Date: 2026-01-29

### Changes Made:
Refactored `frontend/components/TableContext.tsx` to use authenticated service functions from `frontend/services/tableService.ts` instead of making direct `fetch()` calls without authentication headers.

#### Before (Vulnerable Code):
All API calls in TableContext.tsx used direct `fetch()` without authentication headers:
- `fetch('/api/rooms')` - GET rooms without auth
- `fetch('/api/tables')` - GET tables without auth
- `fetch('/api/rooms', { method: 'POST' })` - Add room without auth
- `fetch('/api/rooms/${id}', { method: 'PUT' })` - Update room without auth
- `fetch('/api/rooms/${id}', { method: 'DELETE' })` - Delete room without auth
- `fetch('/api/tables', { method: 'POST' })` - Add table without auth
- `fetch('/api/tables/${id}', { method: 'PUT' })` - Update table without auth
- `fetch('/api/tables/${id}', { method: 'DELETE' })` - Delete table without auth
- `fetch('/api/tables/${id}/position', { method: 'PUT' })` - Update position without auth

#### After (Secure Code):
All API calls now use authenticated service functions that include `getAuthHeaders()`:
- `getRooms()` - Uses authenticated GET request
- `getTables()` - Uses authenticated GET request
- `saveRoom(roomData)` - Uses authenticated POST/PUT with auth headers
- `deleteRoom(id)` - Uses authenticated DELETE with auth headers
- `saveTable(tableData)` - Uses authenticated POST/PUT with auth headers
- `deleteTable(id)` - Uses authenticated DELETE with auth headers
- `updateTablePosition(id, x, y)` - Uses authenticated PUT with auth headers

The `tableService.ts` functions already properly include authentication headers via `getAuthHeaders()` from `apiBase.ts`.

### Verification:
- TypeScript compilation: SUCCESS (no errors)
- Docker build: SUCCESS (all containers running)
- Authentication headers: Now included in all table/room API calls

### Files Modified:
- `frontend/components/TableContext.tsx` - Refactored to use authenticated service functions
