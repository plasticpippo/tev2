# UOM System - Backend API Changes

## Overview

This document details the backend API changes required to support the UOM system, including new endpoints for managing purchasing units with costs.

## Current API (For Reference)

### Stock Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-items` | List all stock items |
| GET | `/api/stock-items/:id` | Get single stock item |
| POST | `/api/stock-items` | Create stock item |
| PUT | `/api/stock-items/:id` | Update stock item |
| DELETE | `/api/stock-items/:id` | Delete stock item |

### Existing Request/Response Formats

**GET /api/stock-items Response:**
```json
{
  "stockItems": [
    {
      "id": "uuid",
      "name": "Jameson Whiskey",
      "quantity": 50,
      "type": "Ingredient",
      "baseUnit": "ml",
      "purchasingUnits": [
        { "id": "1", "name": "Bottle", "multiplier": 750 }
      ],
      "costPerUnit": 0.02667,
      "taxRateId": 1
    }
  ]
}
```

## Required Changes

### 1. Update Stock Item Response

The `purchasingUnits` field will now include cost information:

**GET /api/stock-items Response:**
```json
{
  "stockItems": [
    {
      "id": "uuid",
      "name": "Jameson Whiskey",
      "quantity": 50,
      "type": "Ingredient",
      "baseUnit": "ml",
      "purchasingUnits": [
        {
          "id": "1",
          "name": "Bottle",
          "multiplier": 750,
          "costPerUnit": 20.00,
          "isDefault": false
        },
        {
          "id": "2", 
          "name": "Case",
          "multiplier": 9000,
          "costPerUnit": 216.00,
          "isDefault": true
        },
        {
          "id": "3",
          "name": "Pallet", 
          "multiplier": 90000,
          "costPerUnit": 1800.00,
          "isDefault": false
        }
      ],
      "costPerUnit": 0.02667,
      "taxRateId": 1,
      "activePurchasingUnitId": "2"
    }
  ]
}
```

### 2. Update Stock Item POST/PUT

The request body will accept the enhanced purchasing units:

**POST /api/stock-items Request:**
```json
{
  "name": "Jameson Whiskey",
  "quantity": 50,
  "type": "Ingredient",
  "baseUnit": "ml",
  "purchasingUnits": [
    {
      "id": "1",
      "name": "Bottle",
      "multiplier": 750,
      "costPerUnit": 20.00,
      "isDefault": false
    },
    {
      "id": "2",
      "name": "Case", 
      "multiplier": 9000,
      "costPerUnit": 216.00,
      "isDefault": true
    }
  ],
  "taxRateId": 1,
  "activePurchasingUnitId": "2"
}
```

### 3. New Endpoint: Set Active Purchasing Unit

A dedicated endpoint to change the active purchasing unit:

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/stock-items/:id/active-unit` | Set active purchasing unit |

**Request:**
```json
{
  "activePurchasingUnitId": "3"
}
```

**Response:**
```json
{
  "stockItem": {
    "id": "uuid",
    "name": "Jameson Whiskey",
    "activePurchasingUnitId": "3",
    "purchasingUnits": [...]
  }
}
```

### 4. New Endpoint: Get Cost Breakdown with UOM Details

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:id/cost-breakdown` | Already exists, will include UOM details |

**Response Enhancement:**
```json
{
  "productId": 1,
  "productName": "Whiskey 40ml",
  "variants": [
    {
      "variantId": 1,
      "variantName": "40ml",
      "costBreakdown": [
        {
          "stockItemName": "Jameson Whiskey",
          "recipeQuantity": 40,
          "recipeUnit": "ml",
          "purchasingUnitName": "Case",
          "costPerBaseUnit": 0.024,
          "baseUnit": "ml",
          "taxRate": 0.10,
          "subtotal": 1.06
        }
      ],
      "calculatedCost": 1.06,
      "sellingPrice": 8.00,
      "grossProfit": 5.44,
      "profitMargin": 79.4
    }
  ]
}
```

### 5. New Endpoint: Calculate Cost for Different Purchasing Units

This endpoint allows users to see what the cost would be with different purchasing units:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-items/:id/cost-scenarios` | Get cost for each purchasing unit |

**Response:**
```json
{
  "stockItemId": "uuid",
  "stockItemName": "Jameson Whiskey",
  "baseUnit": "ml",
  "scenarios": [
    {
      "purchasingUnitId": "1",
      "purchasingUnitName": "Bottle",
      "multiplier": 750,
      "costPerUnit": 20.00,
      "costPerMl": 0.02667,
      "totalStock": 50,
      "totalCost": 1000.00
    },
    {
      "purchasingUnitId": "2",
      "purchasingUnitName": "Case",
      "multiplier": 9000,
      "costPerUnit": 216.00,
      "costPerMl": 0.02400,
      "totalStock": 50,
      "totalCost": 1080.00
    },
    {
      "purchasingUnitId": "3",
      "purchasingUnitName": "Pallet",
      "multiplier": 90000,
      "costPerUnit": 1800.00,
      "costPerMl": 0.02000,
      "totalStock": 50,
      "totalCost": 900.00
    }
  ],
  "recommendation": {
    "purchasingUnitId": "3",
    "reason": "Lowest cost per ml"
  }
}
```

## Validation Rules

### Purchasing Unit Validation

```typescript
interface PurchasingUnitValidation {
  id: string;           // Required, non-empty
  name: string;          // Required, 1-50 chars
  multiplier: number;    // Required, > 0
  costPerUnit: number;   // Required, >= 0
  isDefault: boolean;   // Optional, default false
}

function validatePurchasingUnit(unit: PurchasingUnitValidation): ValidationResult {
  const errors: string[] = [];
  
  if (!unit.id || unit.id.trim() === '') {
    errors.push('purchasingUnit.id is required');
  }
  
  if (!unit.name || unit.name.length < 1 || unit.name.length > 50) {
    errors.push('purchasingUnit.name must be 1-50 characters');
  }
  
  if (typeof unit.multiplier !== 'number' || unit.multiplier <= 0) {
    errors.push('purchasingUnit.multiplier must be greater than 0');
  }
  
  if (typeof unit.costPerUnit !== 'number' || unit.costPerUnit < 0) {
    errors.push('purchasingUnit.costPerUnit must be >= 0');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Active Purchasing Unit Validation

```typescript
function validateActivePurchasingUnit(
  activeId: string | null,
  purchasingUnits: PurchasingUnit[]
): ValidationResult {
  if (!activeId) {
    return { isValid: true, errors: [] }; // Allow null to reset
  }
  
  if (!purchasingUnits || purchasingUnits.length === 0) {
    return { 
      isValid: false, 
      errors: ['Cannot set active purchasing unit when no units exist'] 
    };
  }
  
  const exists = purchasingUnits.some(u => u.id === activeId);
  if (!exists) {
    return { 
      isValid: false, 
      errors: ['Active purchasing unit ID does not exist'] 
    };
  }
  
  return { isValid: true, errors: [] };
}
```

## Handler Updates

### stockItems.ts Updates

1. **GET handler**: Parse enhanced purchasingUnits JSON
2. **POST handler**: Accept and validate enhanced purchasingUnits
3. **PUT handler**: Update enhanced purchasingUnits
4. **New PATCH handler**: Update activePurchasingUnitId

### products.ts Updates

1. **GET /:id/cost-breakdown**: Include UOM details in response

## Error Handling

| Error Code | Message | Description |
|------------|---------|-------------|
| 400 | invalid_purchasing_unit | Purchasing unit validation failed |
| 400 | invalid_active_unit | Active purchasing unit ID not found |
| 404 | stock_item_not_found | Stock item not found |

## Related Documents

- [Overview](./10-uom-overview.md)
- [Database Schema](./11-uom-database-schema.md)
- [Cost Calculation Logic](./12-uom-cost-calculation.md)
- [Frontend Changes](./14-uom-frontend-changes.md)
