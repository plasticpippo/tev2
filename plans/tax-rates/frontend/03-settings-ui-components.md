# Frontend Implementation Plan: Variable Tax Rates - Settings UI Components

## Overview

This plan covers the admin UI components for managing tax rates, following patterns from [`TaxSettings.tsx`](../../frontend/components/TaxSettings.tsx) and [`ProductManagement.tsx`](../../frontend/components/ProductManagement.tsx).

---

## New Component: `frontend/components/TaxRateManagement.tsx`

### Purpose

Admin UI to manage tax rates with full CRUD operations. Only accessible to admin users.

### Props Interface

```typescript
interface TaxRateManagementProps {
  taxRates: TaxRate[];
  onDataUpdate: () => void;
}
```

### State Management

```typescript
// Modal state
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | undefined>();

// Delete confirmation state
const [deletingTaxRate, setDeletingTaxRate] = useState<TaxRate | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);

// Form state (in modal)
const [name, setName] = useState<string>('');
const [rate, setRate] = useState<string>('');      // User enters percentage e.g., "19"
const [description, setDescription] = useState<string>('');
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSaving, setIsSaving] = useState(false);
const [apiError, setApiError] = useState<string | null>(null);
```

### UI Elements

#### 1. Header Section

- Title: "Tax Rates" (i18n key: `admin.taxRates.title`)
- Add button: "Add Tax Rate" (i18n key: `admin.taxRates.addTaxRate`)

#### 2. Tax Rates Table/List

Display each tax rate as a card (following [`ProductManagement.tsx`](../../frontend/components/ProductManagement.tsx:379) pattern):

| Column | Content | Styling |
|--------|---------|---------|
| Name | `taxRate.name` | Font-semibold |
| Rate | `taxRate.rate` formatted as percentage | Text-slate-400 |
| Description | `taxRate.description` or "-" | Text-sm text-slate-500 |
| Default | Star icon if `taxRate.isDefault` | Text-amber-400 |
| Actions | Edit / Delete buttons | Btn-sm |

#### 3. Add/Edit Modal

Following [`ProductModal`](../../frontend/components/ProductManagement.tsx:116) pattern:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | VKeyboardInput (full) | Yes | Non-empty, max 100 chars |
| Rate | VKeyboardInput (numeric) | Yes | 0-100, decimal allowed |
| Description | VKeyboardInput (full) | No | Max 255 chars |

#### 4. Delete Confirmation

Using [`ConfirmationModal`](../../frontend/components/ConfirmationModal.tsx) component:

- Title: "Confirm Delete"
- Message: "Are you sure you want to delete the tax rate '{name}'?"
- Confirm button: Danger style
- Cancel button: Secondary style

### Component Structure

```tsx
export const TaxRateManagement: React.FC<TaxRateManagementProps> = ({ 
  taxRates, 
  onDataUpdate 
}) => {
  // State declarations
  
  // Handlers
  const handleSave = async () => { /* ... */ };
  const handleDelete = async () => { /* ... */ };
  const handleSetDefault = async (id: number) => { /* ... */ };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with Add button */}
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">
          {t('taxRates.title')}
        </h3>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          {t('taxRates.addTaxRate')}
        </button>
      </div>
      
      {/* Tax rates list */}
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {taxRates.map(taxRate => (
          <TaxRateCard 
            key={taxRate.id}
            taxRate={taxRate}
            onEdit={() => { setEditingTaxRate(taxRate); setIsModalOpen(true); }}
            onDelete={() => setDeletingTaxRate(taxRate)}
            onSetDefault={() => handleSetDefault(taxRate.id)}
          />
        ))}
      </div>
      
      {/* Modals */}
      {isModalOpen && (
        <TaxRateModal
          taxRate={editingTaxRate}
          onClose={() => { setIsModalOpen(false); setEditingTaxRate(undefined); }}
          onSave={handleSave}
        />
      )}
      
      <ConfirmationModal
        show={!!deletingTaxRate}
        title={t('confirmation.confirmDelete', { ns: 'common' })}
        message={t('taxRates.confirmDelete', { name: deletingTaxRate?.name })}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTaxRate(null)}
        confirmText={t('buttons.delete', { ns: 'common' })}
        confirmButtonType="danger"
      />
    </div>
  );
};
```

---

## Changes to Existing `frontend/components/TaxSettings.tsx`

### Current Structure

The existing [`TaxSettings.tsx`](../../frontend/components/TaxSettings.tsx) provides:
- Tax mode selection (exclusive/inclusive/none)
- Radio button UI for mode selection

### Integration Approach

Add the `TaxRateManagement` component as a collapsible section below the tax mode selection:

```tsx
import { TaxRateManagement } from './TaxRateManagement';

interface TaxSettingsProps {
  settings: Settings['tax'];
  onUpdate: (taxSettings: Settings['tax']) => void;
  taxRates: TaxRate[];           // Add prop
  onDataUpdate: () => void;      // Add prop
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ 
  settings, 
  onUpdate,
  taxRates,
  onDataUpdate 
}) => {
  const { t } = useTranslation('admin');
  const [showRateManagement, setShowRateManagement] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Existing tax mode selection */}
      <div>
        <h3 className="text-xl font-bold text-slate-300 mb-4">
          {t('settings.tax')}
        </h3>
        {/* ... existing radio buttons ... */}
      </div>
      
      {/* New: Tax Rate Management section */}
      {settings.mode !== 'none' && (
        <div className="border-t border-slate-700 pt-6">
          <button
            onClick={() => setShowRateManagement(!showRateManagement)}
            className="flex items-center gap-2 text-lg font-semibold text-slate-300 hover:text-amber-400"
          >
            {showRateManagement ? '▼' : '▶'}
            {t('settings.manageTaxRates')}
          </button>
          
          {showRateManagement && (
            <div className="mt-4">
              <TaxRateManagement 
                taxRates={taxRates}
                onDataUpdate={onDataUpdate}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Key Integration Points

1. **Conditional Display**: Only show tax rate management when tax mode is not 'none'
2. **Collapsible Section**: Use accordion pattern to avoid overwhelming the settings page
3. **Data Flow**: Pass `taxRates` and `onDataUpdate` from parent component

---

## UI Design Specifications

### Tax Rate Card Component

```tsx
interface TaxRateCardProps {
  taxRate: TaxRate;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

const TaxRateCard: React.FC<TaxRateCardProps> = ({ 
  taxRate, 
  onEdit, 
  onDelete, 
  onSetDefault 
}) => {
  const formatRate = (rate: string) => {
    const num = parseFloat(rate);
    return `${(num * 100).toFixed(2)}%`;
  };
  
  return (
    <div className="bg-slate-800 p-4 rounded-md">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{taxRate.name}</p>
            {taxRate.isDefault && (
              <span className="text-amber-400 text-sm">
                ★ {t('taxRates.default')}
              </span>
            )}
          </div>
          <p className="text-lg text-slate-400">{formatRate(taxRate.rate)}</p>
          {taxRate.description && (
            <p className="text-sm text-slate-500 mt-1">{taxRate.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!taxRate.isDefault && (
            <button
              onClick={onSetDefault}
              className="btn btn-secondary btn-sm"
              title={t('taxRates.setAsDefault')}
            >
              ★
            </button>
          )}
          <button onClick={onEdit} className="btn btn-secondary btn-sm">
            {t('buttons.edit', { ns: 'common' })}
          </button>
          <button onClick={onDelete} className="btn btn-danger btn-sm">
            {t('buttons.delete', { ns: 'common' })}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Add/Edit Modal Fields

| Field | Component | Props |
|-------|-----------|-------|
| Name | VKeyboardInput | k-type="full", required, max 100 chars |
| Rate (%) | VKeyboardInput | k-type="numeric", required, placeholder="e.g., 19 or 7.5" |
| Description | VKeyboardInput | k-type="full", optional, max 255 chars |

### Set as Default Behavior

1. Click "★" button on non-default tax rate
2. Call `setDefaultTaxRate(id)` API
3. On success: Refresh tax rates list (previous default is automatically unset by backend)
4. Show success toast notification

### Delete Confirmation Flow

1. Click delete button on tax rate card
2. Show `ConfirmationModal` with tax rate name
3. On confirm: Call `deleteTaxRate(id)` API
4. On success: Close modal, refresh list
5. On error: Show error message in modal

### Validation Rules

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  // Name validation
  if (!name.trim()) {
    newErrors.name = t('taxRates.validation.nameRequired');
  } else if (name.trim().length > 100) {
    newErrors.name = t('taxRates.validation.nameMaxLength');
  }
  
  // Rate validation
  const rateNum = parseFloat(rate);
  if (isNaN(rateNum)) {
    newErrors.rate = t('taxRates.validation.rateRequired');
  } else if (rateNum < 0 || rateNum > 100) {
    newErrors.rate = t('taxRates.validation.rateRange');
  }
  
  // Description validation (optional)
  if (description && description.length > 255) {
    newErrors.description = t('taxRates.validation.descriptionMaxLength');
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## i18n Keys to Add

Add to `frontend/src/i18n/locales/en/translation.json`:

```json
{
  "taxRates": {
    "title": "Tax Rates",
    "addTaxRate": "Add Tax Rate",
    "editTaxRate": "Edit Tax Rate",
    "default": "Default",
    "setAsDefault": "Set as Default",
    "confirmDelete": "Are you sure you want to delete the tax rate \"{name}\"?",
    "validation": {
      "nameRequired": "Name is required",
      "nameMaxLength": "Name must be 100 characters or less",
      "rateRequired": "Rate is required",
      "rateRange": "Rate must be between 0 and 100",
      "descriptionMaxLength": "Description must be 255 characters or less"
    },
    "errors": {
      "failedToSave": "Failed to save tax rate",
      "failedToDelete": "Failed to delete tax rate",
      "failedToSetDefault": "Failed to set as default"
    }
  },
  "settings": {
    "manageTaxRates": "Manage Tax Rates"
  }
}
```

---

## Next Steps

1. **Part 4**: Product management integration (assigning tax rates to products)
2. **Part 5**: Tax calculation updates in DataContext
3. **Part 6**: Transaction and reporting updates
