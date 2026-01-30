# BUG-012: No Ownership Verification on Layout Operations

## Severity Level
**MEDIUM**

## File Location
- `backend/src/handlers/layouts.ts` (lines 80-120)
- `backend/src/handlers/tables.ts` (lines 45-90)

## Description

The API endpoints for updating and deleting layouts and tables do not verify that the requesting user owns the resource. Any authenticated user can modify or delete any layout or table by simply knowing its ID, leading to potential data tampering and unauthorized access.

## Current Vulnerable Code

```typescript
// backend/src/handlers/layouts.ts - Line 80-120
router.put('/layouts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // BUG: No verification that req.user.id owns this layout
  const layout = await prisma.layout.update({
    where: { id },
    data: updates,
  });
  
  res.json(layout);
});

router.delete('/layouts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  // BUG: Anyone can delete any layout
  await prisma.layout.delete({
    where: { id },
  });
  
  res.json({ message: 'Layout deleted' });
});
```

```typescript
// backend/src/handlers/tables.ts - Line 45-90
router.put('/tables/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  // BUG: No ownership check
  const table = await prisma.table.update({
    where: { id },
    data: req.body,
  });
  
  res.json(table);
});

router.delete('/tables/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  // BUG: No verification of ownership
  await prisma.table.delete({
    where: { id },
  });
  
  res.json({ message: 'Table deleted' });
});
```

## Attack Example

```javascript
// Attacker with valid credentials can modify any layout
const attackLayout = async (victimLayoutId) => {
  // Change someone else's layout without permission
  await fetch(`/api/layouts/${victimLayoutId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + attackerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'HACKED BY ATTACKER',
      config: { /* malicious configuration */ },
    }),
  });
  
  // Or delete it entirely
  await fetch(`/api/layouts/${victimLayoutId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + attackerToken,
    },
  });
};

// Attacker can enumerate IDs to find valid layouts
for (let i = 1; i < 1000; i++) {
  attackLayout(i.toString());
}
```

## Root Cause Analysis

1. **Missing Authorization Layer**: Authentication only validates the token, not permissions
2. **No Resource Ownership Model**: Database schema lacks explicit ownership tracking
3. **Implicit Trust Model**: Assumes users only interact with their own resources
4. **Missing Middleware**: No reusable authorization middleware for resource access

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Data Tampering | HIGH | Unauthorized modification of layouts |
| Data Loss | HIGH | Malicious deletion of user data |
| Privilege Escalation | MEDIUM | Potential to modify admin layouts |
| Business Disruption | MEDIUM | Corrupted table configurations |

## Suggested Fix

### Option 1: Add Owner ID to Schema (Recommended)

```typescript
// prisma/schema.prisma
model Layout {
  id          String   @id @default(uuid())
  name        String
  description String?
  config      Json
  ownerId     String   // Add ownership tracking
  owner       User     @relation(fields: [ownerId], references: [id])
  isPublic    Boolean  @default(false) // Allow shared layouts
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Table {
  id          String   @id @default(uuid())
  name        String
  layoutId    String?
  ownerId     String   // Add ownership
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

```typescript
// backend/src/middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const verifyLayoutOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Admin bypass
  if (userRole === 'admin') {
    return next();
  }
  
  try {
    const layout = await prisma.layout.findUnique({
      where: { id },
      select: { ownerId: true, isPublic: true },
    });
    
    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }
    
    // Check ownership or public access for read operations
    if (layout.ownerId !== userId && !layout.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied. You do not own this layout.' 
      });
    }
    
    // For write operations, owner or admin only
    if (req.method !== 'GET' && layout.ownerId !== userId) {
      return res.status(403).json({ 
        error: 'Permission denied. Only the owner can modify this layout.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

export const verifyTableOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const table = await prisma.table.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }
  
  if (table.ownerId !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. You do not own this table.' 
    });
  }
  
  next();
};
```

```typescript
// backend/src/handlers/layouts.ts - Fixed
import { verifyLayoutOwnership } from '../middleware/authorization';

router.put('/layouts/:id', authenticateToken, verifyLayoutOwnership, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Now safe - middleware verified ownership
  const layout = await prisma.layout.update({
    where: { id },
    data: updates,
  });
  
  res.json(layout);
});

router.delete('/layouts/:id', authenticateToken, verifyLayoutOwnership, async (req, res) => {
  const { id } = req.params;
  
  await prisma.layout.delete({
    where: { id },
  });
  
  res.json({ message: 'Layout deleted' });
});
```

### Option 2: Database-Level Security with RLS (PostgreSQL)

```sql
-- Enable Row Level Security
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own layouts
CREATE POLICY layout_owner_policy ON layouts
  FOR ALL
  TO application_user
  USING (owner_id = current_setting('app.current_user_id')::UUID);

-- Set user context before queries
SET app.current_user_id = 'user-uuid-here';
```

```typescript
// backend/src/db.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Set user context for RLS
export const setUserContext = async (userId: string) => {
  await prisma.$executeRaw`SET app.current_user_id = ${userId}`;
};
```

### Option 3: Service Layer with Built-in Authorization

```typescript
// backend/src/services/layoutService.ts
import { prisma } from '../db';

export class LayoutService {
  async updateLayout(
    layoutId: string, 
    userId: string, 
    updates: Partial<Layout>
  ) {
    // Verify ownership within the service
    const layout = await prisma.layout.findUnique({
      where: { id: layoutId },
      select: { ownerId: true },
    });
    
    if (!layout) {
      throw new NotFoundError('Layout not found');
    }
    
    if (layout.ownerId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this layout');
    }
    
    return prisma.layout.update({
      where: { id: layoutId },
      data: updates,
    });
  }
  
  async deleteLayout(layoutId: string, userId: string) {
    const layout = await prisma.layout.findUnique({
      where: { id: layoutId },
      select: { ownerId: true },
    });
    
    if (!layout) {
      throw new NotFoundError('Layout not found');
    }
    
    if (layout.ownerId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this layout');
    }
    
    return prisma.layout.delete({
      where: { id: layoutId },
    });
  }
}
```

## Testing Strategy

```typescript
// authorization.test.ts
describe('Layout Ownership Verification', () => {
  let ownerToken: string;
  let attackerToken: string;
  let ownerLayoutId: string;
  let adminToken: string;
  
  beforeEach(async () => {
    // Setup test users and tokens
    ownerToken = await createTestUser('owner@example.com');
    attackerToken = await createTestUser('attacker@example.com');
    adminToken = await createTestUser('admin@example.com', 'admin');
    
    // Create layout as owner
    const layout = await createLayout(ownerToken, { name: 'Test Layout' });
    ownerLayoutId = layout.id;
  });
  
  it('should allow owner to update their layout', async () => {
    const response = await request(app)
      .put(`/api/layouts/${ownerLayoutId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Updated Name' })
      .expect(200);
    
    expect(response.body.name).toBe('Updated Name');
  });
  
  it('should reject non-owner from updating layout', async () => {
    await request(app)
      .put(`/api/layouts/${ownerLayoutId}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ name: 'Hacked' })
      .expect(403);
  });
  
  it('should reject non-owner from deleting layout', async () => {
    await request(app)
      .delete(`/api/layouts/${ownerLayoutId}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(403);
  });
  
  it('should allow admin to modify any layout', async () => {
    await request(app)
      .put(`/api/layouts/${ownerLayoutId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Updated' })
      .expect(200);
  });
  
  it('should return 404 for non-existent layout', async () => {
    await request(app)
      .put('/api/layouts/non-existent-id')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test' })
      .expect(404);
  });
  
  it('should allow public layout viewing by non-owners', async () => {
    // Make layout public
    await prisma.layout.update({
      where: { id: ownerLayoutId },
      data: { isPublic: true },
    });
    
    await request(app)
      .get(`/api/layouts/${ownerLayoutId}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(200);
  });
});
```

## Database Migration

```sql
-- migrations/20260129100000_add_ownership.sql
-- Add ownerId column
ALTER TABLE layouts ADD COLUMN owner_id UUID REFERENCES users(id);
ALTER TABLE tables ADD COLUMN owner_id UUID REFERENCES users(id);

-- Set default owners for existing data (requires manual mapping)
UPDATE layouts SET owner_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);
UPDATE tables SET owner_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Make owner_id required
ALTER TABLE layouts ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE tables ALTER COLUMN owner_id SET NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_layouts_owner_id ON layouts(owner_id);
CREATE INDEX idx_tables_owner_id ON tables(owner_id);

-- Add isPublic for shared layouts
ALTER TABLE layouts ADD COLUMN is_public BOOLEAN DEFAULT false;
CREATE INDEX idx_layouts_is_public ON layouts(is_public);
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Database schema updates | 30 min |
| Create authorization middleware | 1 hour |
| Apply middleware to all endpoints | 1 hour |
| Update frontend for permission handling | 1 hour |
| Testing | 1.5 hours |
| **Total** | **5 hours** |

## Related Issues

- [BUG-011: Missing Input Sanitization](./BUG-011-missing-sanitization.md)
- [BUG-010: No Rate Limiting](./BUG-010-no-rate-limiting.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
