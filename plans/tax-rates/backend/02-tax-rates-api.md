# Tax Rates API Plan

## Objective

Create CRUD endpoints for tax rate management with proper validation, error handling, and API response formatting.

**Phase:** 2 of 8  
**Dependencies:** Phase 1 (Database Schema)  
**Estimated Subtasks:** 10

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tax-rates` | List all tax rates | Authenticated |
| GET | `/api/tax-rates/:id` | Get single tax rate | Authenticated |
| POST | `/api/tax-rates` | Create tax rate | Admin only |
| PUT | `/api/tax-rates/:id` | Update tax rate | Admin only |
| DELETE | `/api/tax-rates/:id` | Deactivate tax rate | Admin only |
| PUT | `/api/tax-rates/:id/default` | Set as default | Admin only |

---

## Best Practices Applied

| Practice | Implementation |
|----------|---------------|
| Return rates as strings | Preserve decimal precision in JSON |
| Computed `ratePercent` | Include convenience field (e.g., "19.00%") |
| Soft delete | Deactivate rather than delete |
| Transaction for default | Atomic update when setting default |
| Validation | Validate name, rate range, and uniqueness |

---

## Types Definition

### Backend Types

Add to [`backend/src/types.ts`](backend/src/types.ts):

```typescript
// Tax Rate types
export interface TaxRate {
  id: number;
  name: string;
  rate: string;  // String to preserve decimal precision
  ratePercent: string;  // Computed field for display (e.g., "19.00%")
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRateInput {
  name: string;
  rate: number | string;  // Accept both for flexibility
  description?: string;
  isDefault?: boolean;
}

export interface UpdateTaxRateInput {
  name?: string;
  rate?: number | string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}
```

> **Note:** DTO transformation functions (`toTaxRateDTO`, `toTaxRateDTOArray`) are defined in [`backend/src/types/dto.ts`](backend/src/types/dto.ts) as shown in the implementation plan Part 2.5.

---

## Handler Implementation

### File: [`backend/src/handlers/taxRates.ts`](backend/src/handlers/taxRates.ts)

```typescript
import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { logError, logInfo } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import i18n from '../i18n';

export const taxRatesRouter = express.Router();

// Helper: Format tax rate for API response
function formatTaxRate(taxRate: any) {
  const rateDecimal = new Prisma.Decimal(taxRate.rate);
  const rateNumber = rateDecimal.toNumber();
  const ratePercent = (rateNumber * 100).toFixed(2) + '%';
  
  return {
    id: taxRate.id,
    name: taxRate.name,
    rate: rateDecimal.toString(),  // Return as string to preserve precision
    ratePercent,  // Convenience field
    description: taxRate.description,
    isDefault: taxRate.isDefault,
    isActive: taxRate.isActive,
    createdAt: taxRate.createdAt.toISOString(),
    updatedAt: taxRate.updatedAt.toISOString(),
  };
}

// Helper: Validate tax rate input
type TranslateFunction = (key: string) => string;

export const validateTaxRateInput = (data: any, isUpdate: boolean = false, t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  const errors: string[] = [];
  
  // Name validation
  if (!isUpdate || data.name !== undefined) {
    if (!isUpdate && !data.name) {
      errors.push(translate('errors:taxRates.nameRequired'));
    } else if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push(translate('errors:taxRates.nameInvalid'));
      } else if (data.name.length > 100) {
        errors.push(translate('errors:taxRates.nameTooLong'));
      }
    }
  }
  
  // Rate validation
  if (!isUpdate || data.rate !== undefined) {
    if (!isUpdate && data.rate === undefined) {
      errors.push(translate('errors:taxRates.rateRequired'));
    } else if (data.rate !== undefined) {
      const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate;
      if (isNaN(rate)) {
        errors.push(translate('errors:taxRates.rateInvalid'));
      } else if (rate < 0 || rate > 1) {  // 0% to 100% (rate stored as decimal)
        errors.push(translate('errors:taxRates.rateOutOfRange'));
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// GET /api/tax-rates - List all tax rates
taxRatesRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const taxRates = await prisma.taxRate.findMany({
      orderBy: [
        { isDefault: 'desc' },  // Default first
        { name: 'asc' }
      ]
    });
    
    res.json(taxRates.map(formatTaxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching tax rates', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.fetchFailed') });
  }
});

// GET /api/tax-rates/:id - Get single tax rate
taxRatesRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: Number(id) }
    });
    
    if (!taxRate) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }
    
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.fetchOneFailed') });
  }
});

// POST /api/tax-rates - Create tax rate
taxRatesRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, rate, description, isDefault } = req.body;
    
    // Validate input
    const validation = validateTaxRateInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: i18n.t('errors:taxRates.validationFailed'), 
        details: validation.errors 
      });
    }
    
    // Check for duplicate name
    const existing = await prisma.taxRate.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });
    
    if (existing) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.nameExists') });
    }
    
    // Parse rate to Decimal
    const rateDecimal = typeof rate === 'string' ? parseFloat(rate) : rate;
    
    // Create tax rate (handle default in transaction)
    const taxRate = await prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }
      
      return tx.taxRate.create({
        data: {
          name: name.trim(),
          rate: rateDecimal,
          description: description?.trim() || null,
          isDefault: isDefault ?? false,
          isActive: true
        }
      });
    });
    
    logInfo('Tax rate created', { taxRateId: taxRate.id, name: taxRate.name });
    res.status(201).json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.createFailed') });
  }
});

// PUT /api/tax-rates/:id - Update tax rate
taxRatesRouter.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, rate, description, isDefault, isActive } = req.body;
    
    // Validate input
    const validation = validateTaxRateInput(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: i18n.t('errors:taxRates.validationFailed'), 
        details: validation.errors 
      });
    }
    
    // Check if tax rate exists
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }
    
    // Check for duplicate name (if name is being changed)
    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.taxRate.findFirst({
        where: { 
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: Number(id) }
        }
      });
      
      if (duplicate) {
        return res.status(400).json({ error: i18n.t('errors:taxRates.nameExists') });
      }
    }
    
    // Update tax rate (handle default in transaction)
    const taxRate = await prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true, id: { not: Number(id) } },
          data: { isDefault: false }
        });
      }
      
      return tx.taxRate.update({
        where: { id: Number(id) },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          rate: rate !== undefined ? (typeof rate === 'string' ? parseFloat(rate) : rate) : undefined,
          description: description === null ? null : (description !== undefined ? description.trim() : undefined),
          isDefault: isDefault !== undefined ? isDefault : undefined,
          isActive: isActive !== undefined ? isActive : undefined
        }
      });
    });
    
    logInfo('Tax rate updated', { taxRateId: taxRate.id, name: taxRate.name });
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.updateFailed') });
  }
});

// DELETE /api/tax-rates/:id - Deactivate tax rate (soft delete)
taxRatesRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if tax rate exists
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }
    
    // Check if this is the default tax rate
    if (existing.isDefault) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.cannotDeleteDefault') });
    }
    
    // Soft delete (deactivate)
    const taxRate = await prisma.taxRate.update({
      where: { id: Number(id) },
      data: { isActive: false, isDefault: false }
    });
    
    logInfo('Tax rate deactivated', { taxRateId: taxRate.id, name: taxRate.name });
    // Note: Returns 200 with the deactivated object (soft delete) rather than 204 No Content (hard delete pattern)
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deactivating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.deleteFailed') });
  }
});

// PUT /api/tax-rates/:id/default - Set as default tax rate
taxRatesRouter.put('/:id/default', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if tax rate exists and is active
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }
    
    if (!existing.isActive) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.cannotSetInactiveAsDefault') });
    }
    
    // Set as default in transaction
    const taxRate = await prisma.$transaction(async (tx) => {
      // Unset all defaults
      await tx.taxRate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
      
      // Set new default
      return tx.taxRate.update({
        where: { id: Number(id) },
        data: { isDefault: true }
      });
    });
    
    // Update settings to point to new default
    await prisma.settings.updateMany({
      data: { defaultTaxRateId: taxRate.id }
    });
    
    logInfo('Tax rate set as default', { taxRateId: taxRate.id, name: taxRate.name });
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error setting default tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.setDefaultFailed') });
  }
});

export default taxRatesRouter;
```

---

## Router Integration

### File: [`backend/src/router.ts`](backend/src/router.ts)

Add the tax rates router:

```typescript
import { taxRatesRouter } from './handlers/taxRates';

// Add to router
app.use('/api/tax-rates', taxRatesRouter);
```

---

## i18n Translations

### File: [`backend/locales/en/errors.json`](backend/locales/en/errors.json)

Add tax rate error messages:

```json
{
  "taxRates": {
    "fetchFailed": "Failed to fetch tax rates",
    "fetchOneFailed": "Failed to fetch tax rate",
    "notFound": "Tax rate not found",
    "validationFailed": "Tax rate validation failed",
    "nameRequired": "Tax rate name is required",
    "nameInvalid": "Tax rate name must be a non-empty string",
    "nameTooLong": "Tax rate name must be 100 characters or less",
    "nameExists": "A tax rate with this name already exists",
    "rateRequired": "Tax rate is required",
    "rateInvalid": "Tax rate must be a valid number",
    "rateOutOfRange": "Tax rate must be between 0% and 100%",
    "createFailed": "Failed to create tax rate",
    "updateFailed": "Failed to update tax rate",
    "deleteFailed": "Failed to deactivate tax rate",
    "cannotDeleteDefault": "Cannot deactivate the default tax rate",
    "cannotSetInactiveAsDefault": "Cannot set an inactive tax rate as default",
    "setDefaultFailed": "Failed to set default tax rate"
  }
}
```

### File: [`backend/locales/it/errors.json`](backend/locales/it/errors.json)

Add Italian translations:

```json
{
  "taxRates": {
    "fetchFailed": "Impossibile recuperare le aliquote IVA",
    "fetchOneFailed": "Impossibile recuperare l'aliquota IVA",
    "notFound": "Aliquota IVA non trovata",
    "validationFailed": "Validazione aliquota IVA fallita",
    "nameRequired": "Il nome dell'aliquota IVA è obbligatorio",
    "nameInvalid": "Il nome dell'aliquota IVA deve essere una stringa non vuota",
    "nameTooLong": "Il nome dell'aliquota IVA deve essere di massimo 100 caratteri",
    "nameExists": "Esiste già un'aliquota IVA con questo nome",
    "rateRequired": "L'aliquota IVA è obbligatoria",
    "rateInvalid": "L'aliquota IVA deve essere un numero valido",
    "rateOutOfRange": "L'aliquota IVA deve essere compresa tra 0% e 100%",
    "createFailed": "Impossibile creare l'aliquota IVA",
    "updateFailed": "Impossibile aggiornare l'aliquota IVA",
    "deleteFailed": "Impossibile disattivare l'aliquota IVA",
    "cannotDeleteDefault": "Impossibile disattivare l'aliquota IVA predefinita",
    "cannotSetInactiveAsDefault": "Impossibile impostare un'aliquota IVA inattiva come predefinita",
    "setDefaultFailed": "Impossibile impostare l'aliquota IVA predefinita"
  }
}
```

---

## Implementation Subtasks

### Subtask 2.1: Create Handler File
- [ ] Create [`backend/src/handlers/taxRates.ts`](backend/src/handlers/taxRates.ts)
- [ ] Add imports and router setup

### Subtask 2.2: Implement Helper Functions
- [ ] Add `formatTaxRate` helper for API response formatting
- [ ] Add `validateTaxRateInput` helper for validation

### Subtask 2.3: Implement GET Endpoints
- [ ] Implement `GET /api/tax-rates` - List all tax rates
- [ ] Implement `GET /api/tax-rates/:id` - Get single tax rate

### Subtask 2.4: Implement POST Endpoint
- [ ] Implement `POST /api/tax-rates` - Create tax rate
- [ ] Add validation and duplicate name check
- [ ] Handle default tax rate in transaction

### Subtask 2.5: Implement PUT Endpoint
- [ ] Implement `PUT /api/tax-rates/:id` - Update tax rate
- [ ] Add validation and duplicate name check
- [ ] Handle default tax rate in transaction

### Subtask 2.6: Implement DELETE Endpoint
- [ ] Implement `DELETE /api/tax-rates/:id` - Soft delete (deactivate)
- [ ] Add check for default tax rate

### Subtask 2.7: Implement Set Default Endpoint
- [ ] Implement `PUT /api/tax-rates/:id/default`
- [ ] Update settings with new default

### Subtask 2.8: Add Router to Main Router
- [ ] Update [`backend/src/router.ts`](backend/src/router.ts)
- [ ] Add tax rates router

### Subtask 2.9: Add i18n Translations
- [ ] Add English error messages
- [ ] Add Italian error messages

### Subtask 2.10: Test Endpoints
- [ ] Test GET endpoints return correct data
- [ ] Test POST creates tax rate correctly
- [ ] Test PUT updates tax rate correctly
- [ ] Test DELETE deactivates tax rate
- [ ] Test set default works correctly
- [ ] Test validation errors

---

## API Response Examples

### GET /api/tax-rates

```json
[
  {
    "id": 1,
    "name": "Standard Rate",
    "rate": "0.1900",
    "ratePercent": "19.00%",
    "description": "Standard VAT rate (19%)",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Reduced Rate",
    "rate": "0.1000",
    "ratePercent": "10.00%",
    "description": "Reduced VAT rate (10%)",
    "isDefault": false,
    "isActive": true,
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z"
  }
]
```

### POST /api/tax-rates

Request:
```json
{
  "name": "Super Reduced",
  "rate": "0.04",
  "description": "Super reduced VAT rate (4%)",
  "isDefault": false
}
```

Response (201):
```json
{
  "id": 5,
  "name": "Super Reduced",
  "rate": "0.0400",
  "ratePercent": "4.00%",
  "description": "Super reduced VAT rate (4%)",
  "isDefault": false,
  "isActive": true,
  "createdAt": "2026-02-20T12:00:00.000Z",
  "updatedAt": "2026-02-20T12:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "Tax rate validation failed",
  "details": [
    "Tax rate name must be a non-empty string",
    "Tax rate must be between 0% and 100%"
  ]
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| [`backend/src/handlers/taxRates.ts`](backend/src/handlers/taxRates.ts) | Create |
| [`backend/src/router.ts`](backend/src/router.ts) | Modify |
| [`backend/src/types.ts`](backend/src/types.ts) | Modify |
| [`backend/locales/en/errors.json`](backend/locales/en/errors.json) | Modify |
| [`backend/locales/it/errors.json`](backend/locales/it/errors.json) | Modify |

---

## Rollback Strategy

1. Remove tax rates router from [`router.ts`](backend/src/router.ts)
2. Delete [`handlers/taxRates.ts`](backend/src/handlers/taxRates.ts)
3. Remove i18n translations
4. No database impact (handled in Phase 1)

---

## Testing Considerations

### Unit Tests
- Test `formatTaxRate` helper
- Test `validateTaxRateInput` helper
- Test all CRUD operations

### Integration Tests
- Test full request/response cycle
- Test authentication requirements
- Test admin-only restrictions
- Test transaction rollback on error

### Manual Testing
- Use Postman/curl to test endpoints
- Verify error messages are localized
- Verify default tax rate constraint works
