# Products Integration Plan

## Objective

Enable tax rate assignment to product variants, allowing administrators to specify which tax rate applies to each product variant. Products without an explicit tax rate will use the default tax rate.

**Phase:** 4 of 8  
**Dependencies:** Phase 1 (Database Schema), Phase 2 (Tax Rates API), Phase 3 (Settings Integration)  
**Estimated Subtasks:** 9

---

## Current State

### Prerequisites

Before starting this phase, verify:
- [ ] Phase 1 (Database Schema) is complete - `taxRateId` field exists in ProductVariant model
- [ ] Phase 2 (Tax Rates API) is complete - Tax rates CRUD endpoints work
- [ ] Phase 3 (Settings Integration) is complete - Default tax rate can be configured

### Products Handler ([`backend/src/handlers/products.ts`](backend/src/handlers/products.ts))

**Current variant fields:**
- `name`
- `price`
- `isFavourite`
- `backgroundColor`
- `textColor`
- `stockConsumption`

**Missing:** `taxRateId` field

### ProductVariant Type ([`backend/src/types.ts`](backend/src/types.ts))

```typescript
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isFavourite?: boolean;
  stockConsumption: { stockItemId: string; quantity: number; }[];
  backgroundColor: string;
  textColor: string;
  // Missing: taxRateId, taxRate
}
```

---

## Changes Required

### 1. Update ProductVariant Type

Add `taxRateId` and `taxRate` to the type definition.

### 2. Update Products Handler

- Include `taxRate` in Prisma queries
- Accept `taxRateId` in create/update operations
- Validate `taxRateId` references an active tax rate
- Format tax rate in responses

---

## Implementation Details

### File: [`backend/src/types.ts`](backend/src/types.ts)

```typescript
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isFavourite?: boolean;
  stockConsumption: { stockItemId: string; quantity: number; }[];
  backgroundColor: string;
  textColor: string;
  taxRateId: number | null;  // Added
  taxRate: TaxRate | null;   // Added - included in responses
}
```

> **Note:** The `TaxRate` interface is defined in Phase 2 (Types and DTOs) of the implementation plan. Import it from the types file:
> ```typescript
> import { TaxRate } from '../types';
> ```

### File: [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts)

#### Helper Function: Format Product Variant

```typescript
// Helper: Format product variant for API response
function formatProductVariant(variant: any) {
  return {
    id: variant.id,
    productId: variant.productId,
    name: variant.name,
    price: variant.price,
    isFavourite: variant.isFavourite,
    backgroundColor: variant.backgroundColor,
    textColor: variant.textColor,
    stockConsumption: variant.stockConsumption || [],
    taxRateId: variant.taxRateId,
    taxRate: variant.taxRate ? {
      id: variant.taxRate.id,
      name: variant.taxRate.name,
      rate: variant.taxRate.rate.toString(),
      ratePercent: (Number(variant.taxRate.rate) * 100).toFixed(2) + '%',
      description: variant.taxRate.description,
      isDefault: variant.taxRate.isDefault,
      isActive: variant.taxRate.isActive,
      createdAt: variant.taxRate.createdAt.toISOString(),
      updatedAt: variant.taxRate.updatedAt.toISOString()
    } : null
  };
}
```

> **Note:** The `taxRate` object in the response includes a computed `ratePercent` field. Use `TaxRateResponseDTO` from the implementation plan for the response type, which includes this field.

#### GET /api/products - Updated

```typescript
// GET /api/products - Get all products
productsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true  // Added
          }
        }
      }
    });
    
    // Format products with tax rate info
    const formattedProducts = products.map(product => ({
      ...product,
      variants: product.variants.map(formatProductVariant)
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching products', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:products.fetchFailed') });
  }
});
```

#### GET /api/products/:id - Updated

```typescript
// GET /api/products/:id - Get a specific product
productsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true  // Added
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: i18n.t('errors:products.notFound') });
    }
    
    // Format product with tax rate info
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.json(formattedProduct);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:products.fetchOneFailed') });
  }
});
```

#### POST /api/products - Updated

```typescript
// POST /api/products - Create a new product
productsRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, categoryId, variants } = req.body as Omit<Product, 'id'> & { variants: Omit<ProductVariant, 'id' | 'productId'>[] };
    
    // Validate product data
    const validation = validateProduct({ name, categoryId, variants });
    if (!validation.isValid) {
      return res.status(400).json({ error: i18n.t('errors:products.validationFailed'), details: validation.errors });
    }
    
    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json({ error: i18n.t('errors:products.invalidCategoryId', { categoryId }) });
    }
    
    // Validate tax rate IDs if provided
    if (variants && variants.length > 0) {
      const taxRateIds = variants
        .map(v => v.taxRateId)
        .filter((id): id is number => id !== undefined && id !== null);
      
      if (taxRateIds.length > 0) {
        const taxRates = await prisma.taxRate.findMany({
          where: { id: { in: taxRateIds } }
        });
        
        const invalidIds = taxRateIds.filter(id => !taxRates.find(tr => tr.id === id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.invalidTaxRateReferences', { ids: invalidIds.join(', ') })
          });
        }
        
        // Check if any tax rates are inactive
        const inactiveRates = taxRates.filter(tr => !tr.isActive);
        if (inactiveRates.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.cannotUseInactiveTaxRate'),
            details: inactiveRates.map(tr => tr.name)
          });
        }
      }
    }
    
    // Validate stock items (existing logic)
    if (variants && variants.length > 0) {
      const allStockItemIds: string[] = [];
      variants.forEach(v => {
        if (v.stockConsumption && Array.isArray(v.stockConsumption)) {
          v.stockConsumption.forEach(sc => {
            if (sc.stockItemId) {
              allStockItemIds.push(sc.stockItemId);
            }
          });
        }
      });
      
      if (allStockItemIds.length > 0) {
        const existingStockItems = await prisma.stockItem.findMany({
          where: { id: { in: allStockItemIds } },
          select: { id: true }
        });
        
        const existingStockItemIds = existingStockItems.map(item => item.id);
        const invalidStockItemIds = allStockItemIds.filter(id => !existingStockItemIds.includes(id));
        
        if (invalidStockItemIds.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.invalidStockItemReferences', { ids: invalidStockItemIds.join(', ') })
          });
        }
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        variants: {
          create: variants.map(v => ({
            name: v.name,
            price: v.price,
            isFavourite: v.isFavourite || false,
            backgroundColor: v.backgroundColor,
            textColor: v.textColor,
            taxRateId: v.taxRateId || null,  // Added
            stockConsumption: {
              create: v.stockConsumption.map((sc: { stockItemId: string; quantity: number }) => ({
                stockItemId: sc.stockItemId,
                quantity: sc.quantity
              }))
            }
          }))
        }
      },
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true  // Added
          }
        }
      }
    });
    
    // Format response
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.status(201).json(formattedProduct);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:products.createFailed') });
  }
});
```

#### PUT /api/products/:id - Updated

```typescript
// PUT /api/products/:id - Update a product
productsRouter.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId, variants } = req.body as Omit<Product, 'id'> & { variants?: Omit<ProductVariant, 'id' | 'productId'>[] };
    
    // Validate product data if provided (existing validation logic)
    if (name !== undefined || categoryId !== undefined || variants !== undefined) {
      const productToValidate = {
        name: name !== undefined ? name : '',
        categoryId: categoryId !== undefined ? categoryId : 0,
        variants: variants !== undefined ? variants : []
      };
      
      const validationErrors = [];
      
      if (name !== undefined) {
        const nameError = validateProductName(name);
        if (nameError) validationErrors.push(nameError);
      }
      
      if (categoryId !== undefined) {
        const categoryIdError = validateCategoryId(categoryId);
        if (categoryIdError) validationErrors.push(categoryIdError);
      }
      
      if (variants !== undefined && Array.isArray(variants)) {
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i];
          const variantError = validateProductVariant(variant);
          if (variantError) {
            validationErrors.push(i18n.t('errors:products.variantError', { index: i + 1, error: variantError }));
          }
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: i18n.t('errors:products.validationFailed'), details: validationErrors });
      }
    }
    
    // Validate category if provided
    if (categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        return res.status(400).json({ error: i18n.t('errors:products.invalidCategoryId', { categoryId }) });
      }
    }
    
    // Validate tax rate IDs if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const taxRateIds = variants
        .map(v => v.taxRateId)
        .filter((id): id is number => id !== undefined && id !== null);
      
      if (taxRateIds.length > 0) {
        const taxRates = await prisma.taxRate.findMany({
          where: { id: { in: taxRateIds } }
        });
        
        const invalidIds = taxRateIds.filter(id => !taxRates.find(tr => tr.id === id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.invalidTaxRateReferences', { ids: invalidIds.join(', ') })
          });
        }
        
        // Check if any tax rates are inactive
        const inactiveRates = taxRates.filter(tr => !tr.isActive);
        if (inactiveRates.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.cannotUseInactiveTaxRate'),
            details: inactiveRates.map(tr => tr.name)
          });
        }
      }
    }
    
    // Validate stock items (existing logic)
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const allStockItemIds: string[] = [];
      variants.forEach(v => {
        if (v.stockConsumption && Array.isArray(v.stockConsumption)) {
          v.stockConsumption.forEach(sc => {
            if (sc.stockItemId) {
              allStockItemIds.push(sc.stockItemId);
            }
          });
        }
      });
      
      if (allStockItemIds.length > 0) {
        const existingStockItems = await prisma.stockItem.findMany({
          where: { id: { in: allStockItemIds } },
          select: { id: true }
        });
        
        const existingStockItemIds = existingStockItems.map(item => item.id);
        const invalidStockItemIds = allStockItemIds.filter(id => !existingStockItemIds.includes(id));
        
        if (invalidStockItemIds.length > 0) {
          return res.status(400).json({
            error: i18n.t('errors:products.invalidStockItemReferences', { ids: invalidStockItemIds.join(', ') })
          });
        }
      }
    }
    
    // Start a transaction to ensure data consistency
    const product = await prisma.$transaction(async (tx) => {
      // Update the product fields
      const updatedProduct = await tx.product.update({
        where: { id: Number(id) },
        data: {
          name: name !== undefined ? name : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
        },
        include: {
          variants: {
            include: {
              stockConsumption: true,
              taxRate: true  // Added
            }
          }
        }
      });
      
      // If variants are provided, update them as well
      if (variants && Array.isArray(variants) && variants.length > 0) {
        // First, delete existing stock consumption records
        await tx.stockConsumption.deleteMany({
          where: {
            variant: {
              productId: Number(id)
            }
          }
        });
        
        // Then delete existing variants
        await tx.productVariant.deleteMany({
          where: { productId: Number(id) }
        });
        
        // Create new variants
        const updatedProductWithVariants = await tx.product.update({
          where: { id: Number(id) },
          data: {
            variants: {
              create: variants.map(v => ({
                name: v.name,
                price: v.price,
                isFavourite: v.isFavourite || false,
                backgroundColor: v.backgroundColor,
                textColor: v.textColor,
                taxRateId: v.taxRateId || null,  // Added
                stockConsumption: {
                  create: v.stockConsumption.map((sc) => ({
                    stockItemId: sc.stockItemId,
                    quantity: sc.quantity
                  }))
                }
              }))
            }
          },
          include: {
            variants: {
              include: {
                stockConsumption: true,
                taxRate: true  // Added
              }
            }
          }
        });
        
        return updatedProductWithVariants;
      }
      
      return updatedProduct;
    });
    
    // Format response
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.json(formattedProduct);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:products.updateFailed') });
  }
});
```

> **Note:** The DELETE endpoint (`DELETE /api/products/:id`) is unaffected by tax rate changes and requires no modifications.

---

## i18n Translations

### File: [`backend/locales/en/errors.json`](backend/locales/en/errors.json)

Add product tax rate error messages:

```json
{
  "products": {
    "invalidTaxRateReferences": "Invalid tax rate IDs: {{ids}}",
    "cannotUseInactiveTaxRate": "Cannot use inactive tax rates"
  }
}
```

### File: [`backend/locales/it/errors.json`](backend/locales/it/errors.json)

Add Italian translations:

```json
{
  "products": {
    "invalidTaxRateReferences": "ID aliquote IVA non validi: {{ids}}",
    "cannotUseInactiveTaxRate": "Impossibile utilizzare aliquote IVA inattive"
  }
}
```

> **Note:** Ensure `cannotUseInactiveTaxRate` is added to the products i18n keys in the implementation plan.

---

## Implementation Subtasks

### Subtask 4.1: Update Types
- [ ] Add `taxRateId` and `taxRate` to `ProductVariant` interface in [`backend/src/types.ts`](backend/src/types.ts)

### Subtask 4.2: Add Helper Function
- [ ] Add `formatProductVariant` helper function to [`products.ts`](backend/src/handlers/products.ts)

### Subtask 4.3: Update GET All Products
- [ ] Include `taxRate` in Prisma query
- [ ] Format variants with tax rate info

### Subtask 4.4: Update GET Single Product
- [ ] Include `taxRate` in Prisma query
- [ ] Format variant with tax rate info

### Subtask 4.5: Update POST Create Product
- [ ] Accept `taxRateId` in variant input
- [ ] Validate tax rate exists and is active
- [ ] Include `taxRateId` in variant creation

### Subtask 4.6: Update PUT Update Product
- [ ] Accept `taxRateId` in variant input
- [ ] Validate tax rate exists and is active
- [ ] Include `taxRateId` in variant update

### Subtask 4.7: Update Validation Function

Update the `validateProductVariant` function in [`backend/src/utils/validation.ts`](backend/src/utils/validation.ts) to validate the `taxRateId` field:

```typescript
// Add to validateProductVariant function
if (variant.taxRateId !== undefined && variant.taxRateId !== null) {
  if (typeof variant.taxRateId !== 'number' || !Number.isInteger(variant.taxRateId)) {
    errors.push('taxRateId must be a valid integer');
  }
}
```

### Subtask 4.8: Add i18n Translations
- [ ] Add English error messages
- [ ] Add Italian error messages

### Subtask 4.9: Test Endpoints
- [ ] Test GET returns tax rate info
- [ ] Test POST creates variant with tax rate
- [ ] Test PUT updates variant tax rate
- [ ] Test validation for invalid tax rate IDs
- [ ] Test validation for inactive tax rates

---

## API Response Examples

### GET /api/products

```json
[
  {
    "id": 1,
    "name": "Espresso",
    "categoryId": 1,
    "variants": [
      {
        "id": 1,
        "productId": 1,
        "name": "Single",
        "price": 1.50,
        "isFavourite": false,
        "backgroundColor": "#4CAF50",
        "textColor": "#FFFFFF",
        "stockConsumption": [],
        "taxRateId": 1,
        "taxRate": {
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
      }
    ]
  }
]
```

### POST /api/products

Request:
```json
{
  "name": "Cappuccino",
  "categoryId": 1,
  "variants": [
    {
      "name": "Regular",
      "price": 2.50,
      "backgroundColor": "#8B4513",
      "textColor": "#FFFFFF",
      "stockConsumption": [],
      "taxRateId": 1
    }
  ]
}
```

Response (201):
```json
{
  "id": 2,
  "name": "Cappuccino",
  "categoryId": 1,
  "variants": [
    {
      "id": 2,
      "productId": 2,
      "name": "Regular",
      "price": 2.50,
      "isFavourite": false,
      "backgroundColor": "#8B4513",
      "textColor": "#FFFFFF",
      "stockConsumption": [],
      "taxRateId": 1,
      "taxRate": {
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
    }
  ]
}
```

### Variant with No Tax Rate (Uses Default)

```json
{
  "id": 3,
  "productId": 2,
  "name": "Large",
  "price": 3.00,
  "isFavourite": false,
  "backgroundColor": "#8B4513",
  "textColor": "#FFFFFF",
  "stockConsumption": [],
  "taxRateId": null,
  "taxRate": null
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| [`backend/src/types.ts`](backend/src/types.ts) | Add `taxRateId` and `taxRate` to ProductVariant |
| [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts) | Update all endpoints for tax rate support |
| [`backend/locales/en/errors.json`](backend/locales/en/errors.json) | Add product tax rate error messages |
| [`backend/locales/it/errors.json`](backend/locales/it/errors.json) | Add Italian translations |

---

## Rollback Strategy

1. Revert changes to [`products.ts`](backend/src/handlers/products.ts)
2. Revert type changes in [`types.ts`](backend/src/types.ts)
3. Remove i18n translations
4. No database impact (handled in Phase 1)

---

## Testing Considerations

### Unit Tests
- Test variant formatting with tax rate
- Test variant formatting without tax rate
- Test tax rate validation

### Integration Tests
- Test GET products includes tax rate
- Test POST creates variant with tax rate
- Test PUT updates variant tax rate
- Test validation errors for invalid tax rates

### Manual Testing
- Create product with tax rate
- Update product variant tax rate
- Verify tax rate is included in responses
- Test with null tax rate (should use default)
