# Frontend Implementation Plan: i18n Translations for Variable Tax Rates

## Overview

This document outlines the translation keys needed for the variable tax rates feature. Translations are stored in `frontend/public/locales/{en,it}/*.json` and loaded via i18next.

## Translation Structure

The translations are organized into the following namespaces:
- `admin.json` - Settings UI and tax rate management
- `common.json` - Common actions and labels
- `errors.json` - Error messages

---

## 1. English Translations

### 1.1 Admin Namespace (`frontend/public/locales/en/admin.json`)

Add the following keys under the `settings` object:

```json
{
  "settings": {
    "taxRates": {
      "title": "Tax Rate Management",
      "add": "Add Tax Rate",
      "edit": "Edit Tax Rate",
      "delete": "Delete Tax Rate",
      "setDefault": "Set as Default",
      "name": "Name",
      "namePlaceholder": "e.g., Standard Rate, Reduced Rate",
      "rate": "Rate (%)",
      "ratePlaceholder": "e.g., 22",
      "description": "Description",
      "descriptionPlaceholder": "Optional description for this tax rate",
      "default": "Default",
      "defaultBadge": "Default",
      "isDefault": "This is the default tax rate",
      "active": "Active",
      "inactive": "Inactive",
      "noTaxRates": "No tax rates configured",
      "confirmDelete": "Are you sure you want to delete the tax rate \"{{name}}\"?",
      "confirmDeleteDefault": "Cannot delete the default tax rate. Set another rate as default first.",
      "confirmSetDefault": "Set \"{{name}}\" as the default tax rate?",
      "validation": {
        "nameRequired": "Tax rate name is required",
        "nameMaxLength": "Name must be 255 characters or less",
        "rateRequired": "Tax rate is required",
        "rateMin": "Rate must be 0 or greater",
        "rateMax": "Rate must be 100 or less",
        "rateInvalid": "Please enter a valid number",
        "_note": "UI accepts percentage (0-100), but API expects decimal (0-1). Conversion: percentage / 100"
      }
    }
  }
}
```

Add under `products` object for product form:

```json
{
  "products": {
    "taxRate": "Tax Rate",
    "taxRatePlaceholder": "Select a tax rate",
    "useDefaultTaxRate": "Use default tax rate",
    "taxRateHint": "Select a specific tax rate or use the default rate configured in settings",
    "noTaxRatesAvailable": "No tax rates available. Please configure tax rates in Settings."
  }
}
```

### 1.2 Common Namespace (`frontend/public/locales/en/common.json`)

Add success messages:

```json
{
  "messages": {
    "taxRateCreated": "Tax rate created successfully",
    "taxRateUpdated": "Tax rate updated successfully",
    "taxRateDeleted": "Tax rate deleted successfully",
    "taxRateSetAsDefault": "Tax rate set as default successfully"
  }
}
```

### 1.3 Errors Namespace (`frontend/public/locales/en/errors.json`)

Add under `api` object:

```json
{
  "api": {
    "taxRates": {
      "createFailed": "Failed to create tax rate. Please try again.",
      "updateFailed": "Failed to update tax rate. Please try again.",
      "deleteFailed": "Failed to delete tax rate. The rate may be in use.",
      "notFound": "Tax rate not found.",
      "cannotDeleteDefault": "Cannot delete the default tax rate.",
      "duplicateName": "A tax rate with this name already exists.",
      "invalidRate": "Invalid tax rate value."
    }
  }
}
```

---

## 2. Italian Translations

### 2.1 Admin Namespace (`frontend/public/locales/it/admin.json`)

Add the following keys under the `settings` object:

```json
{
  "settings": {
    "taxRates": {
      "title": "Gestione Aliquote Fiscali",
      "add": "Aggiungi Aliquota",
      "edit": "Modifica Aliquota",
      "delete": "Elimina Aliquota",
      "setDefault": "Imposta come Predefinita",
      "name": "Nome",
      "namePlaceholder": "es., Aliquota Standard, Aliquota Ridotta",
      "rate": "Aliquota (%)",
      "ratePlaceholder": "es., 22",
      "description": "Descrizione",
      "descriptionPlaceholder": "Descrizione opzionale per questa aliquota",
      "default": "Predefinita",
      "defaultBadge": "Predefinita",
      "isDefault": "Questa e l'aliquota predefinita",
      "active": "Attiva",
      "inactive": "Inattiva",
      "noTaxRates": "Nessuna aliquota configurata",
      "confirmDelete": "Sei sicuro di voler eliminare l'aliquota \"{{name}}\"?",
      "confirmDeleteDefault": "Impossibile eliminare l'aliquota predefinita. Imposta prima un'altra aliquota come predefinita.",
      "confirmSetDefault": "Impostare \"{{name}}\" come aliquota predefinita?",
      "validation": {
        "nameRequired": "Il nome dell'aliquota e obbligatorio",
        "nameMaxLength": "Il nome deve essere di massimo 255 caratteri",
        "rateRequired": "L'aliquota e obbligatoria",
        "rateMin": "L'aliquota deve essere 0 o superiore",
        "rateMax": "L'aliquota deve essere 100 o inferiore",
        "rateInvalid": "Inserisci un numero valido",
        "_note": "L'interfaccia accetta percentuali (0-100), ma l'API richiede decimali (0-1). Conversione: percentuale / 100"
      }
    }
  }
}
```

Add under `products` object for product form:

```json
{
  "products": {
    "taxRate": "Aliquota Fiscale",
    "taxRatePlaceholder": "Seleziona un'aliquota",
    "useDefaultTaxRate": "Usa aliquota predefinita",
    "taxRateHint": "Seleziona un'aliquota specifica o usa quella predefinita configurata nelle impostazioni",
    "noTaxRatesAvailable": "Nessuna aliquota disponibile. Configura le aliquote nelle Impostazioni."
  }
}
```

### 2.2 Common Namespace (`frontend/public/locales/it/common.json`)

Add success messages:

```json
{
  "messages": {
    "taxRateCreated": "Aliquota creata con successo",
    "taxRateUpdated": "Aliquota aggiornata con successo",
    "taxRateDeleted": "Aliquota eliminata con successo",
    "taxRateSetAsDefault": "Aliquota impostata come predefinita"
  }
}
```

### 2.3 Errors Namespace (`frontend/public/locales/it/errors.json`)

Add under `api` object:

```json
{
  "api": {
    "taxRates": {
      "createFailed": "Impossibile creare l'aliquota. Riprova.",
      "updateFailed": "Impossibile aggiornare l'aliquota. Riprova.",
      "deleteFailed": "Impossibile eliminare l'aliquota. L'aliquota potrebbe essere in uso.",
      "notFound": "Aliquota non trovata.",
      "cannotDeleteDefault": "Impossibile eliminare l'aliquota predefinita.",
      "duplicateName": "Esiste gia un'aliquota con questo nome.",
      "invalidRate": "Valore aliquota non valido."
    }
  }
}
```

---

## 3. Translation Key Summary

### 3.1 Settings UI Keys (`settings.taxRates.*`)

| Key | English | Italian |
|-----|---------|---------|
| `title` | Tax Rate Management | Gestione Aliquote Fiscali |
| `add` | Add Tax Rate | Aggiungi Aliquota |
| `edit` | Edit Tax Rate | Modifica Aliquota |
| `delete` | Delete Tax Rate | Elimina Aliquota |
| `setDefault` | Set as Default | Imposta come Predefinita |
| `name` | Name | Nome |
| `namePlaceholder` | e.g., Standard Rate | es., Aliquota Standard |
| `rate` | Rate (%) | Aliquota (%) |
| `ratePlaceholder` | e.g., 22 | es., 22 |
| `description` | Description | Descrizione |
| `descriptionPlaceholder` | Optional description... | Descrizione opzionale... |
| `default` | Default | Predefinita |
| `defaultBadge` | Default | Predefinita |
| `isDefault` | This is the default tax rate | Questa e l'aliquota predefinita |
| `active` | Active | Attiva |
| `inactive` | Inactive | Inattiva |
| `noTaxRates` | No tax rates configured | Nessuna aliquota configurata |
| `confirmDelete` | Are you sure... | Sei sicuro... |
| `confirmDeleteDefault` | Cannot delete the default... | Impossibile eliminare... |
| `confirmSetDefault` | Set as default... | Impostare come predefinita... |

### 3.2 Product Form Keys (`products.*`)

| Key | English | Italian |
|-----|---------|---------|
| `taxRate` | Tax Rate | Aliquota Fiscale |
| `taxRatePlaceholder` | Select a tax rate | Seleziona un'aliquota |
| `useDefaultTaxRate` | Use default tax rate | Usa aliquota predefinita |
| `taxRateHint` | Select a specific tax rate... | Seleziona un'aliquota specifica... |
| `noTaxRatesAvailable` | No tax rates available... | Nessuna aliquota disponibile... |

### 3.3 Error Keys (`api.taxRates.*`)

| Key | English | Italian |
|-----|---------|---------|
| `createFailed` | Failed to create tax rate... | Impossibile creare l'aliquota... |
| `updateFailed` | Failed to update tax rate... | Impossibile aggiornare l'aliquota... |
| `deleteFailed` | Failed to delete tax rate... | Impossibile eliminare l'aliquota... |
| `notFound` | Tax rate not found | Aliquota non trovata |
| `cannotDeleteDefault` | Cannot delete the default... | Impossibile eliminare la predefinita... |
| `duplicateName` | A tax rate with this name... | Esiste gia un'aliquota... |
| `invalidRate` | Invalid tax rate value | Valore aliquota non valido |

### 3.4 Success Keys (`messages.*`)

| Key | English | Italian |
|-----|---------|---------|
| `taxRateCreated` | Tax rate created successfully | Aliquota creata con successo |
| `taxRateUpdated` | Tax rate updated successfully | Aliquota aggiornata con successo |
| `taxRateDeleted` | Tax rate deleted successfully | Aliquota eliminata con successo |
| `taxRateSetAsDefault` | Tax rate set as default... | Aliquota impostata come predefinita |

---

## 4. Usage Examples

### 4.1 In React Components

```tsx
import { useTranslation } from 'react-i18next';

function TaxRateManagement() {
  const { t } = useTranslation(['admin', 'common', 'errors']);
  
  return (
    <div>
      <h1>{t('admin:settings.taxRates.title')}</h1>
      <button>{t('admin:settings.taxRates.add')}</button>
      
      {/* Form fields */}
      <label>{t('admin:settings.taxRates.name')}</label>
      <input placeholder={t('admin:settings.taxRates.namePlaceholder')} />
      
      {/* Error handling */}
      {error && <p>{t('errors:api.taxRates.createFailed')}</p>}
      
      {/* Success message */}
      {success && <p>{t('common:messages.taxRateCreated')}</p>}
    </div>
  );
}
```

### 4.2 In Product Form

```tsx
function ProductForm() {
  const { t } = useTranslation(['admin']);
  
  return (
    <div>
      <label>{t('admin:products.taxRate')}</label>
      <select>
        <option value="">{t('admin:products.useDefaultTaxRate')}</option>
        {taxRates.map(rate => (
          <option key={rate.id} value={rate.id}>
            {rate.name} ({rate.rate}%)
          </option>
        ))}
      </select>
      <p className="hint">{t('admin:products.taxRateHint')}</p>
    </div>
  );
}
```

---

## 5. Implementation Checklist

- [ ] Add English translations to `frontend/public/locales/en/admin.json`
- [ ] Add English translations to `frontend/public/locales/en/common.json`
- [ ] Add English translations to `frontend/public/locales/en/errors.json`
- [ ] Add Italian translations to `frontend/public/locales/it/admin.json`
- [ ] Add Italian translations to `frontend/public/locales/it/common.json`
- [ ] Add Italian translations to `frontend/public/locales/it/errors.json`
- [ ] Verify translation keys are used correctly in components
- [ ] Test language switching for all new keys
