# Frontend Implementation Plan: Variable Tax Rates - Product Form Integration

## Overview

This plan covers integrating tax rate selection into the product management form, allowing individual products/variants to override the default tax rate.

---

## Changes to `frontend/components/ProductManagement.tsx`

### 1. Update VariantForm Props

Add `taxRates` prop to [`VariantForm`](../../frontend/components/ProductManagement.tsx:14):

```typescript
interface VariantFormProps {
    variant: Partial<ProductVariant>;
    onUpdate: (variant: Partial<ProductVariant>) => void;
    onRemove: () => void;
    stockItems: StockItem[];
    taxRates: TaxRate[];  // Add this
}
```

### 2. Update ProductModal Props

Add `taxRates` prop to [`ProductModal`](../../frontend/components/ProductManagement.tsx:108):

```typescript
interface ProductModalProps {
  product?: Product;
  categories: Category[];
  stockItems: StockItem[];
  taxRates: TaxRate[];  // Add this
  onClose: () => void;
  onSave: () => void;
}
```

### 3. Update ProductManagement Props

Add `taxRates` prop to [`ProductManagement`](../../frontend/components/ProductManagement.tsx:318):

```typescript
interface ProductManagementProps {
    products: Product[];
    categories: Category[];
    stockItems: StockItem[];
    taxRates: TaxRate[];  // Add this
    onDataUpdate: () => void;
}
```

---

## Form Field Specifications

### Tax Rate Dropdown in VariantForm

**Location:** After the price field in [`VariantForm`](../../frontend/components/ProductManagement.tsx:55-58)

**Field Details:**

| Property | Value |
|----------|-------|
| Field name | `taxRateId` |
| Input type | Select dropdown |
| Position | After price field, before "Mark as Favourite" checkbox |
| Required | No (optional field) |

**Display Format:**
- Options show: `Name (XX%)` e.g., "Reduced Rate (7%)", "Standard Rate (19%)"
- First option: "Use Default" with value `""` (empty string, will be sent as null)

**Implementation:**

```tsx
// In VariantForm, after the price field div (around line 58)
<div>
    <label className="block text-sm font-medium text-slate-400 mb-1">
        {t('products.taxRate')}
    </label>
    <select
        value={variant.taxRateId ?? ''}
        onChange={e => onUpdate({ 
            ...variant, 
            taxRateId: e.target.value ? Number(e.target.value) : null 
        })}
        className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md"
    >
        <option value="">{t('products.useDefaultTaxRate')}</option>
        {taxRates.map(tr => (
            <option key={tr.id} value={tr.id}>
                {tr.name} ({formatTaxRate(tr.rate)})
            </option>
        ))}
    </select>
    <p className="text-xs text-slate-500 mt-1">
        {t('products.taxRateHint')}
    </p>
</div>
```

### Helper Function for Rate Display

```typescript
// Format decimal rate to percentage display
const formatTaxRate = (rate: string): string => {
    const num = parseFloat(rate);
    return `${(num * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
};
// Examples: "0.19" → "19%", "0.07" → "7%", "0.055" → "5.5%"
```

---

## State Management

### Variant State Initialization

When creating a new variant, `taxRateId` should default to `null`:

```typescript
// In handleAddVariant (around line 134)
const handleAddVariant = () => {
    setVariants([...variants, { 
        id: Date.now() * -1, 
        name: '', 
        price: 0, 
        isFavourite: false, 
        stockConsumption: [], 
        backgroundColor: 'bg-slate-700', 
        textColor: getContrastingTextColor('bg-slate-700'),
        taxRateId: null  // Add this
    }]);
};
```

### Initial State in ProductModal

Update the initial variants state (around line 120):

```typescript
const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    product?.variants || [{ 
        id: Date.now() * -1, 
        name: 'Standard', 
        price: 0, 
        isFavourite: false, 
        stockConsumption: [], 
        backgroundColor: 'bg-slate-700', 
        textColor: getContrastingTextColor('bg-slate-700'),
        taxRateId: null  // Add this
    }]
);
```

---

## API Integration

### Sending taxRateId to Backend

The [`saveProduct`](../../frontend/services/productService.ts) function already sends the variants array. The `taxRateId` will be included automatically:

```typescript
// In handleSubmit (around line 221)
await productApi.saveProduct({ 
    id: product?.id, 
    name, 
    categoryId: Number(categoryId), 
    variants: variants as any  // taxRateId is now part of each variant
});
```

### Backend Payload Example

```json
{
    "name": "Product Name",
    "categoryId": 1,
    "variants": [
        {
            "name": "Standard",
            "price": 10.00,
            "taxRateId": 2,
            "backgroundColor": "bg-slate-700",
            "textColor": "text-white",
            "stockConsumption": []
        }
    ]
}
```

### Displaying Tax Rate When Editing

When editing an existing product, the variant's `taxRateId` will be pre-populated from the loaded product data. The dropdown will show the correct selected option.

---

## Validation

**No validation needed** - the field is optional:
- Empty/`""` → converted to `null` → "use default tax rate"
- Number → specific tax rate ID

---

## Prop Drilling Path

```
AdminPage.tsx
    └── ProductManagement (add taxRates prop)
            └── ProductModal (add taxRates prop)
                    └── VariantForm (add taxRates prop)
```

### Changes to AdminPage.tsx

Import `TaxRate` type and pass `taxRates` from DataContext:

```typescript
// In AdminPage.tsx
const { taxRates } = useData();  // Assuming taxRates is added to DataContext

// In JSX
<ProductManagement
    products={products}
    categories={categories}
    stockItems={stockItems}
    taxRates={taxRates}  // Add this
    onDataUpdate={refreshData}
/>
```

---

## i18n Keys to Add

Add to `frontend/src/i18n/locales/en/translation.json`:

```json
{
  "products": {
    "taxRate": "Tax Rate",
    "useDefaultTaxRate": "Use Default",
    "taxRateHint": "Leave as 'Use Default' to apply the default tax rate"
  }
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| [`ProductManagement.tsx`](../../frontend/components/ProductManagement.tsx) | Add `taxRates` prop to all 3 components, add dropdown in VariantForm |
| [`AdminPage.tsx`](../../frontend/pages/AdminPage.tsx) | Pass `taxRates` to ProductManagement |
| [`types.ts`](../../shared/types.ts) | Ensure `ProductVariant` includes `taxRateId?: number \| null` |
| `translation.json` | Add 3 new i18n keys |

---

## Next Steps

1. **Part 5**: Tax calculation updates in DataContext
2. **Part 6**: Transaction and reporting updates
