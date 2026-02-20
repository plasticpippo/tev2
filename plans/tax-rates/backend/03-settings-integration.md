# Settings Integration Plan

## Objective

Integrate default tax rate with the settings system, allowing administrators to configure the default tax rate used for products without an explicit tax rate assignment.

**Phase:** 3 of 8  
**Dependencies:** Phase 1 (Database Schema), Phase 2 (Tax Rates API)  
**Estimated Subtasks:** 6

### Prerequisites Verification

Before starting this phase, verify:
- [ ] Phase 1 (Database Schema) is complete - `tax_rates` table exists
- [ ] Phase 2 (Tax Rates API) is complete - Tax rates CRUD endpoints work
- [ ] `defaultTaxRateId` field exists in Settings model
- [ ] At least one active tax rate exists in the database

---

## Current State

### Settings Handler ([`backend/src/handlers/settings.ts`](backend/src/handlers/settings.ts))

Currently returns:
```typescript
{
  tax: { mode: 'inclusive' | 'exclusive' | 'none' },
  businessDay: {
    autoStartTime: string,
    businessDayEndHour: string,
    lastManualClose: string | null,
    autoCloseEnabled: boolean
  }
}
```

### Settings Type ([`backend/src/types.ts`](backend/src/types.ts))

```typescript
export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
}
```

---

## Changes Required

### 1. Update Settings Type

Add `defaultTaxRate` to the settings response:

```typescript
export interface Settings {
  tax: TaxSettings & {
    defaultTaxRateId: number | null;
    defaultTaxRate: TaxRate | null;
  };
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
}
```

> **Note:** Both type definition approaches are valid. The intersection type approach (shown above) is useful for extending existing types, while the direct definition approach (shown in the Type Updates section) is clearer for new type definitions.

### 2. Update Settings Handler

Modify the GET and PUT endpoints to include default tax rate.

---

## Implementation Details

### File: [`backend/src/handlers/settings.ts`](backend/src/handlers/settings.ts)

#### GET /api/settings - Updated

```typescript
// GET /api/settings - Get current settings
settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Get the first (and should be only) settings record with default tax rate
    const settings = await prisma.settings.findFirst({
      include: {
        defaultTaxRate: true
      }
    });
    
    if (!settings) {
      // If no settings exist, return default values
      res.json({
        tax: { 
          mode: 'none',
          defaultTaxRateId: null,
          defaultTaxRate: null
        },
        businessDay: {
          autoStartTime: '06:00',
          businessDayEndHour: '06:00',
          lastManualClose: null,
          autoCloseEnabled: false
        }
      });
      return;
    }
    
    // Format the default tax rate if present
    const defaultTaxRate = settings.defaultTaxRate ? {
      id: settings.defaultTaxRate.id,
      name: settings.defaultTaxRate.name,
      rate: settings.defaultTaxRate.rate.toString(),
      ratePercent: (Number(settings.defaultTaxRate.rate) * 100).toFixed(2) + '%',
      description: settings.defaultTaxRate.description,
      isDefault: settings.defaultTaxRate.isDefault,
      isActive: settings.defaultTaxRate.isActive,
      createdAt: settings.defaultTaxRate.createdAt.toISOString(),
      updatedAt: settings.defaultTaxRate.updatedAt.toISOString()
    } : null;
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none',
        defaultTaxRateId: settings.defaultTaxRateId,
        defaultTaxRate: defaultTaxRate
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        businessDayEndHour: settings.businessDayEndHour,
        lastManualClose: settings.lastManualClose?.toISOString() || null,
        autoCloseEnabled: settings.autoCloseEnabled ?? false
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.fetchFailed') });
  }
});
```

#### PUT /api/settings - Updated

```typescript
// PUT /api/settings - Update settings
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const { tax, businessDay } = req.body as Settings;
    
    // Validate defaultTaxRateId if provided
    if (tax.defaultTaxRateId !== undefined && tax.defaultTaxRateId !== null) {
      const taxRate = await prisma.taxRate.findUnique({
        where: { id: tax.defaultTaxRateId }
      });
      
      if (!taxRate) {
        return res.status(400).json({ 
          error: i18n.t('errors:settings.invalidDefaultTaxRate') 
        });
      }
      
      if (!taxRate.isActive) {
        return res.status(400).json({ 
          error: i18n.t('errors:settings.cannotSetInactiveAsDefault') 
        });
      }
    }
    
    // Note: This validation uses two separate error messages for better user experience.
    // Ensure the implementation plan's validation logic is updated to match this approach.
    
    // Get the first settings record or create one if it doesn't exist
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          taxMode: tax.mode,
          defaultTaxRateId: tax.defaultTaxRateId !== undefined 
            ? tax.defaultTaxRateId 
            : settings.defaultTaxRateId,
          autoStartTime: businessDay.autoStartTime,
          businessDayEndHour: businessDay.businessDayEndHour,
          autoCloseEnabled: businessDay.autoCloseEnabled ?? false,
          lastManualClose: businessDay.lastManualClose 
            ? new Date(businessDay.lastManualClose) 
            : null
        },
        include: {
          defaultTaxRate: true
        }
      });
      
      // Note: This approach preserves the existing defaultTaxRateId value when not 
      // explicitly provided in the request, which is the recommended behavior.
    } else {
      // Create new settings record
      settings = await prisma.settings.create({
        data: {
          taxMode: tax.mode,
          defaultTaxRateId: tax.defaultTaxRateId ?? null,
          autoStartTime: businessDay.autoStartTime,
          businessDayEndHour: businessDay.businessDayEndHour ?? '06:00',
          autoCloseEnabled: businessDay.autoCloseEnabled ?? false,
          lastManualClose: businessDay.lastManualClose 
            ? new Date(businessDay.lastManualClose) 
            : null
        },
        include: {
          defaultTaxRate: true
        }
      });
    }
    
    // Clear the scheduler's settings cache so it picks up the new settings
    clearSettingsCache();
    logInfo('Settings updated, scheduler cache cleared');
    
    // Format the default tax rate if present
    const defaultTaxRate = settings.defaultTaxRate ? {
      id: settings.defaultTaxRate.id,
      name: settings.defaultTaxRate.name,
      rate: settings.defaultTaxRate.rate.toString(),
      ratePercent: (Number(settings.defaultTaxRate.rate) * 100).toFixed(2) + '%',
      description: settings.defaultTaxRate.description,
      isDefault: settings.defaultTaxRate.isDefault,
      isActive: settings.defaultTaxRate.isActive,
      createdAt: settings.defaultTaxRate.createdAt.toISOString(),
      updatedAt: settings.defaultTaxRate.updatedAt.toISOString()
    } : null;
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none',
        defaultTaxRateId: settings.defaultTaxRateId,
        defaultTaxRate: defaultTaxRate
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        businessDayEndHour: settings.businessDayEndHour,
        lastManualClose: settings.lastManualClose?.toISOString() || null,
        autoCloseEnabled: settings.autoCloseEnabled ?? false
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.updateFailed') });
  }
});
```

---

## Type Updates

### File: [`backend/src/types.ts`](backend/src/types.ts)

```typescript
// Update TaxSettings interface
export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
  defaultTaxRateId: number | null;
  defaultTaxRate: TaxRate | null;
}

// TaxRate interface for settings response
export interface TaxRate {
  id: number;
  name: string;
  rate: string;
  ratePercent: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Update Settings interface
export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
}
```

---

## i18n Translations

### File: [`backend/locales/en/errors.json`](backend/locales/en/errors.json)

Add settings error messages:

```json
{
  "settings": {
    "fetchFailed": "Failed to fetch settings",
    "updateFailed": "Failed to update settings",
    "invalidDefaultTaxRate": "Invalid default tax rate ID",
    "cannotSetInactiveAsDefault": "Cannot set an inactive tax rate as default"
  }
}
```

### File: [`backend/locales/it/errors.json`](backend/locales/it/errors.json)

Add Italian translations:

```json
{
  "settings": {
    "fetchFailed": "Impossibile recuperare le impostazioni",
    "updateFailed": "Impossibile aggiornare le impostazioni",
    "invalidDefaultTaxRate": "ID aliquota IVA predefinita non valido",
    "cannotSetInactiveAsDefault": "Impossibile impostare un'aliquota IVA inattiva come predefinita"
  }
}
```

---

## Implementation Subtasks

### Subtask 3.1: Update Types
- [ ] Update `TaxSettings` interface in [`backend/src/types.ts`](backend/src/types.ts)
- [ ] Add `defaultTaxRateId` and `defaultTaxRate` fields

### Subtask 3.2: Update GET Endpoint
- [ ] Modify `GET /api/settings` to include `defaultTaxRate`
- [ ] Add Prisma include for `defaultTaxRate` relation
- [ ] Format tax rate in response

### Subtask 3.3: Update PUT Endpoint
- [ ] Modify `PUT /api/settings` to accept `defaultTaxRateId`
- [ ] Add validation for tax rate existence
- [ ] Add validation for tax rate being active

### Subtask 3.4: Add i18n Translations
- [ ] Add English error messages
- [ ] Add Italian error messages

### Subtask 3.5: Test GET Endpoint
- [ ] Verify settings includes default tax rate
- [ ] Verify null handling when no default set

### Subtask 3.6: Test PUT Endpoint
- [ ] Verify default tax rate can be updated
- [ ] Verify validation errors work correctly

---

## API Response Examples

### GET /api/settings

```json
{
  "tax": {
    "mode": "inclusive",
    "defaultTaxRateId": 1,
    "defaultTaxRate": {
      "id": 1,
      "name": "Standard Rate",
      "rate": "0.1900",
      "ratePercent": "19.00%",
      "description": "Standard VAT rate (19%)",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z"
    }
  },
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "06:00",
    "lastManualClose": null,
    "autoCloseEnabled": false
  }
}
```

### PUT /api/settings

Request:
```json
{
  "tax": {
    "mode": "exclusive",
    "defaultTaxRateId": 2
  },
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "06:00",
    "autoCloseEnabled": false
  }
}
```

Response:
```json
{
  "tax": {
    "mode": "exclusive",
    "defaultTaxRateId": 2,
    "defaultTaxRate": {
      "id": 2,
      "name": "Reduced Rate",
      "rate": "0.1000",
      "ratePercent": "10.00%",
      "description": "Reduced VAT rate (10%)",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T12:00:00.000Z"
    }
  },
  "businessDay": {
    "autoStartTime": "06:00",
    "businessDayEndHour": "06:00",
    "lastManualClose": null,
    "autoCloseEnabled": false
  }
}
```

> **Note:** Setting `defaultTaxRateId` in Settings does NOT automatically update the `isDefault` flag on TaxRate records. The `isDefault` flag on TaxRate is managed separately through the tax rates API.

---

## Files to Modify

| File | Changes |
|------|---------|
| [`backend/src/types.ts`](backend/src/types.ts) | Update TaxSettings and Settings interfaces |
| [`backend/src/handlers/settings.ts`](backend/src/handlers/settings.ts) | Update GET and PUT endpoints |
| [`backend/locales/en/errors.json`](backend/locales/en/errors.json) | Add settings error messages |
| [`backend/locales/it/errors.json`](backend/locales/it/errors.json) | Add Italian translations |

---

## Rollback Strategy

1. Revert changes to [`settings.ts`](backend/src/handlers/settings.ts)
2. Revert type changes in [`types.ts`](backend/src/types.ts)
3. Remove i18n translations
4. No database impact

---

## Testing Considerations

### Unit Tests
- Test settings GET includes default tax rate
- Test settings PUT updates default tax rate
- Test validation for invalid tax rate ID
- Test validation for inactive tax rate

### Integration Tests
- Test full request/response cycle
- Test with null default tax rate
- Test with valid default tax rate

### Manual Testing
- Use API client to test endpoints
- Verify error messages are correct
- Verify tax rate is properly formatted
