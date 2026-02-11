# Translation Files Structure

**Project:** Bar POS Pro  
**Date:** February 2026  
**Purpose:** Define translation file organization, namespace structure, and complete translation files

---

## Directory Structure

```
frontend/
├── src/
│   └── i18n/
│       ├── index.ts           # Main i18n configuration
│       ├── types.ts           # TypeScript declarations
│       └── resources.ts       # Type-safe resource definitions
└── public/
    └── locales/
        ├── en/
        │   ├── common.json        # Shared UI elements
        │   ├── pos.json           # POS-specific terms
        │   ├── errors.json        # Error messages
        │   ├── validation.json    # Form validation
        │   ├── navigation.json    # Menu items
        │   └── settings.json      # Settings labels
        └── it/
            ├── common.json
            ├── pos.json
            ├── errors.json
            ├── validation.json
            ├── navigation.json
            └── settings.json

backend/
├── src/
│   └── i18n/
│       └── index.ts           # Backend i18n configuration
└── locales/
    ├── en/
    │   ├── api.json           # API response messages
    │   └── errors.json        # Backend error messages
    └── it/
        ├── api.json
        └── errors.json
```

---

## Namespace Definitions

### Frontend Namespaces

| Namespace | Purpose | Key Prefix | Example Keys |
|-----------|---------|------------|--------------|
| `common` | Shared UI elements | `buttons.`, `labels.`, `status.` | `buttons.save`, `labels.loading` |
| `pos` | POS-specific features | `cart.`, `payment.`, `products.`, `orders.`, `tables.` | `cart.title`, `payment.methods.cash` |
| `errors` | Error messages | `network.`, `unauthorized.`, `codes.` | `network.message`, `codes.NOT_FOUND` |
| `validation` | Form validation | Direct keys or `fields.` | `required`, `fields.name` |
| `navigation` | Menu/navigation | `menu.`, `admin.`, `user.` | `menu.dashboard`, `admin.title` |
| `settings` | Settings labels | `language.`, `currency.`, `receipt.`, `display.` | `language.title`, `currency.symbol` |

### Backend Namespaces

| Namespace | Purpose | Key Prefix | Example Keys |
|-----------|---------|------------|--------------|
| `api` | API response messages | `products.`, `users.`, `orders.` | `products.created`, `users.notFound` |
| `errors` | Error messages | `unauthorized`, `validation.`, `server.` | `validation.failed`, `server.internal` |

---

## Key Naming Conventions

### General Rules

1. **Use dot notation for hierarchy**: `category.subcategory.key`
2. **Use camelCase for keys**: `addToCart`, `orderNumber`
3. **Be descriptive but concise**: `buttons.submitOrder` not `buttons.so`
4. **Group related keys**: All button labels under `buttons.*`
5. **Use consistent suffixes**: `_one`, `_other` for plurals

### Naming Patterns

```typescript
// ✅ Good: Hierarchical, descriptive
"pos.cart.items.count"
"pos.payment.methods.cash"
"errors.validation.required"

// ❌ Bad: Flat, cryptic
"cartItemsCount"
"pm_cash"
"err_val_req"

// ✅ Good: Consistent separator
"navigation.menu.dashboard"
"navigation.menu.settings"

// ❌ Bad: Mixed separators
"navigation.menu-dashboard"
"navigation.menu_settings"
```

### Pluralization Keys

Use i18next plural suffixes:

```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items",
  "orders_one": "{{count}} order",
  "orders_other": "{{count}} orders"
}
```

---

## Complete Translation Files

### 1. Common Namespace

#### English: [`frontend/public/locales/en/common.json`](frontend/public/locales/en/common.json)

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "confirm": "Confirm",
    "close": "Close",
    "clear": "Clear",
    "submit": "Submit",
    "back": "Back",
    "next": "Next",
    "finish": "Finish",
    "loading": "Loading...",
    "saving": "Saving...",
    "deleting": "Deleting...",
    "processing": "Processing...",
    "refresh": "Refresh",
    "reset": "Reset",
    "search": "Search",
    "filter": "Filter",
    "apply": "Apply",
    "select": "Select",
    "selectAll": "Select All",
    "deselectAll": "Deselect All",
    "import": "Import",
    "export": "Export",
    "print": "Print",
    "download": "Download",
    "upload": "Upload",
    "view": "View",
    "viewAll": "View All",
    "showMore": "Show More",
    "showLess": "Show Less",
    "expand": "Expand",
    "collapse": "Collapse",
    "enable": "Enable",
    "disable": "Disable",
    "activate": "Activate",
    "deactivate": "Deactivate",
    "approve": "Approve",
    "reject": "Reject",
    "accept": "Accept",
    "decline": "Decline",
    "retry": "Retry",
    "continue": "Continue",
    "skip": "Skip",
    "done": "Done",
    "ok": "OK",
    "yes": "Yes",
    "no": "No"
  },
  "labels": {
    "name": "Name",
    "description": "Description",
    "price": "Price",
    "quantity": "Quantity",
    "total": "Total",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "tip": "Tip",
    "date": "Date",
    "time": "Time",
    "startDate": "Start Date",
    "endDate": "End Date",
    "status": "Status",
    "actions": "Actions",
    "options": "Options",
    "notes": "Notes",
    "comments": "Comments",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "info": "Information",
    "noData": "No data available",
    "noResults": "No results found",
    "required": "Required",
    "optional": "Optional",
    "active": "Active",
    "inactive": "Inactive",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "all": "All",
    "none": "None",
    "other": "Other",
    "general": "General",
    "details": "Details",
    "summary": "Summary",
    "history": "History",
    "settings": "Settings",
    "preferences": "Preferences",
    "account": "Account",
    "profile": "Profile",
    "id": "ID",
    "type": "Type",
    "value": "Value",
    "amount": "Amount",
    "balance": "Balance",
    "count": "Count",
    "number": "Number",
    "code": "Code",
    "reference": "Reference",
    "category": "Category",
    "subcategory": "Subcategory",
    "tag": "Tag",
    "filter": "Filter",
    "sort": "Sort",
    "order": "Order",
    "priority": "Priority",
    "created": "Created",
    "updated": "Updated",
    "deleted": "Deleted",
    "createdBy": "Created By",
    "updatedBy": "Updated By",
    "createdAt": "Created At",
    "updatedAt": "Updated At"
  },
  "confirmation": {
    "delete": "Are you sure you want to delete this item?",
    "deleteMultiple": "Are you sure you want to delete {{count}} items?",
    "deletePermanent": "This action cannot be undone. Are you sure?",
    "unsavedChanges": "You have unsaved changes. Are you sure you want to leave?",
    "cancelOrder": "Are you sure you want to cancel this order?",
    "voidTransaction": "Are you sure you want to void this transaction?",
    "closeDay": "Are you sure you want to close the day? This action cannot be undone.",
    "logout": "Are you sure you want to logout?",
    "generic": "Are you sure?"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "available": "Available",
    "occupied": "Occupied",
    "reserved": "Reserved",
    "open": "Open",
    "closed": "Closed",
    "pending": "Pending",
    "inProgress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "approved": "Approved",
    "rejected": "Rejected",
    "paid": "Paid",
    "unpaid": "Unpaid",
    "partial": "Partial",
    "refunded": "Refunded",
    "voided": "Voided",
    "draft": "Draft",
    "published": "Published",
    "archived": "Archived"
  },
  "time": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This Week",
    "lastWeek": "Last Week",
    "thisMonth": "This Month",
    "lastMonth": "Last Month",
    "thisYear": "This Year",
    "lastYear": "Last Year",
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening",
    "night": "Night"
  },
  "placeholders": {
    "search": "Search...",
    "searchProducts": "Search products...",
    "searchUsers": "Search users...",
    "searchCategories": "Search categories...",
    "enterName": "Enter name",
    "enterDescription": "Enter description",
    "enterPrice": "Enter price",
    "enterQuantity": "Enter quantity",
    "selectOption": "Select an option",
    "selectCategory": "Select a category",
    "selectDate": "Select a date",
    "selectRange": "Select range",
    "addNote": "Add a note..."
  }
}
```

#### Italian: [`frontend/public/locales/it/common.json`](frontend/public/locales/it/common.json)

```json
{
  "buttons": {
    "save": "Salva",
    "cancel": "Annulla",
    "delete": "Elimina",
    "edit": "Modifica",
    "add": "Aggiungi",
    "confirm": "Conferma",
    "close": "Chiudi",
    "clear": "Cancella",
    "submit": "Invia",
    "back": "Indietro",
    "next": "Avanti",
    "finish": "Fine",
    "loading": "Caricamento...",
    "saving": "Salvataggio...",
    "deleting": "Eliminazione...",
    "processing": "Elaborazione...",
    "refresh": "Aggiorna",
    "reset": "Ripristina",
    "search": "Cerca",
    "filter": "Filtra",
    "apply": "Applica",
    "select": "Seleziona",
    "selectAll": "Seleziona tutto",
    "deselectAll": "Deseleziona tutto",
    "import": "Importa",
    "export": "Esporta",
    "print": "Stampa",
    "download": "Scarica",
    "upload": "Carica",
    "view": "Visualizza",
    "viewAll": "Vedi tutto",
    "showMore": "Mostra altro",
    "showLess": "Mostra meno",
    "expand": "Espandi",
    "collapse": "Comprimi",
    "enable": "Abilita",
    "disable": "Disabilita",
    "activate": "Attiva",
    "deactivate": "Disattiva",
    "approve": "Approva",
    "reject": "Rifiuta",
    "accept": "Accetta",
    "decline": "Declina",
    "retry": "Riprova",
    "continue": "Continua",
    "skip": "Salta",
    "done": "Fatto",
    "ok": "OK",
    "yes": "Sì",
    "no": "No"
  },
  "labels": {
    "name": "Nome",
    "description": "Descrizione",
    "price": "Prezzo",
    "quantity": "Quantità",
    "total": "Totale",
    "subtotal": "Subtotale",
    "tax": "Tassa",
    "tip": "Mancia",
    "date": "Data",
    "time": "Ora",
    "startDate": "Data inizio",
    "endDate": "Data fine",
    "status": "Stato",
    "actions": "Azioni",
    "options": "Opzioni",
    "notes": "Note",
    "comments": "Commenti",
    "loading": "Caricamento...",
    "error": "Errore",
    "success": "Successo",
    "warning": "Avviso",
    "info": "Informazioni",
    "noData": "Nessun dato disponibile",
    "noResults": "Nessun risultato trovato",
    "required": "Obbligatorio",
    "optional": "Opzionale",
    "active": "Attivo",
    "inactive": "Inattivo",
    "enabled": "Abilitato",
    "disabled": "Disabilitato",
    "all": "Tutto",
    "none": "Nessuno",
    "other": "Altro",
    "general": "Generale",
    "details": "Dettagli",
    "summary": "Riepilogo",
    "history": "Cronologia",
    "settings": "Impostazioni",
    "preferences": "Preferenze",
    "account": "Account",
    "profile": "Profilo",
    "id": "ID",
    "type": "Tipo",
    "value": "Valore",
    "amount": "Importo",
    "balance": "Saldo",
    "count": "Conteggio",
    "number": "Numero",
    "code": "Codice",
    "reference": "Riferimento",
    "category": "Categoria",
    "subcategory": "Sottocategoria",
    "tag": "Tag",
    "filter": "Filtro",
    "sort": "Ordina",
    "order": "Ordine",
    "priority": "Priorità",
    "created": "Creato",
    "updated": "Aggiornato",
    "deleted": "Eliminato",
    "createdBy": "Creato da",
    "updatedBy": "Aggiornato da",
    "createdAt": "Creato il",
    "updatedAt": "Aggiornato il"
  },
  "confirmation": {
    "delete": "Sei sicuro di voler eliminare questo elemento?",
    "deleteMultiple": "Sei sicuro di voler eliminare {{count}} elementi?",
    "deletePermanent": "Questa azione non può essere annullata. Sei sicuro?",
    "unsavedChanges": "Hai modifiche non salvate. Sei sicuro di voler uscire?",
    "cancelOrder": "Sei sicuro di voler annullare questo ordine?",
    "voidTransaction": "Sei sicuro di voler annullare questa transazione?",
    "closeDay": "Sei sicuro di voler chiudere la giornata? Questa azione non può essere annullata.",
    "logout": "Sei sicuro di voler uscire?",
    "generic": "Sei sicuro?"
  },
  "status": {
    "active": "Attivo",
    "inactive": "Inattivo",
    "enabled": "Abilitato",
    "disabled": "Disabilitato",
    "available": "Disponibile",
    "occupied": "Occupato",
    "reserved": "Prenotato",
    "open": "Aperto",
    "closed": "Chiuso",
    "pending": "In attesa",
    "inProgress": "In corso",
    "completed": "Completato",
    "cancelled": "Annullato",
    "approved": "Approvato",
    "rejected": "Rifiutato",
    "paid": "Pagato",
    "unpaid": "Non pagato",
    "partial": "Parziale",
    "refunded": "Rimborsato",
    "voided": "Annullato",
    "draft": "Bozza",
    "published": "Pubblicato",
    "archived": "Archiviato"
  },
  "time": {
    "today": "Oggi",
    "yesterday": "Ieri",
    "tomorrow": "Domani",
    "thisWeek": "Questa settimana",
    "lastWeek": "Settimana scorsa",
    "thisMonth": "Questo mese",
    "lastMonth": "Mese scorso",
    "thisYear": "Quest'anno",
    "lastYear": "Anno scorso",
    "morning": "Mattina",
    "afternoon": "Pomeriggio",
    "evening": "Sera",
    "night": "Notte"
  },
  "placeholders": {
    "search": "Cerca...",
    "searchProducts": "Cerca prodotti...",
    "searchUsers": "Cerca utenti...",
    "searchCategories": "Cerca categorie...",
    "enterName": "Inserisci nome",
    "enterDescription": "Inserisci descrizione",
    "enterPrice": "Inserisci prezzo",
    "enterQuantity": "Inserisci quantità",
    "selectOption": "Seleziona un'opzione",
    "selectCategory": "Seleziona una categoria",
    "selectDate": "Seleziona una data",
    "selectRange": "Seleziona intervallo",
    "addNote": "Aggiungi una nota..."
  }
}
```

---

### 2. POS Namespace

#### English: [`frontend/public/locales/en/pos.json`](frontend/public/locales/en/pos.json)

```json
{
  "title": "Point of Sale",
  "cart": {
    "title": "Current Order",
    "empty": "Cart is empty",
    "items_one": "{{count}} item",
    "items_other": "{{count}} items",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "total": "Total",
    "addItem": "Add Item",
    "removeItem": "Remove Item",
    "clearCart": "Clear Cart",
    "quantity": "Qty",
    "updateQuantity": "Update Quantity",
    "specialRequests": "Special Requests",
    "discount": "Discount",
    "applyDiscount": "Apply Discount"
  },
  "payment": {
    "title": "Payment",
    "methods": {
      "cash": "Cash",
      "card": "Card",
      "voucher": "Voucher",
      "mixed": "Mixed Payment"
    },
    "amountReceived": "Amount Received",
    "change": "Change",
    "process": "Process Payment",
    "success": "Payment successful!",
    "failed": "Payment failed. Please try again.",
    "insufficientFunds": "Insufficient funds received",
    "exactAmount": "Exact amount",
    "quickCash": "Quick Cash",
    "splitPayment": "Split Payment",
    "partialPayment": "Partial Payment",
    "remaining": "Remaining",
    "tip": "Add Tip",
    "noTip": "No Tip",
    "customTip": "Custom Tip",
    "tipPercentage": "{{percent}}% Tip"
  },
  "products": {
    "search": "Search products...",
    "noResults": "No products found",
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock",
    "lowStock": "Low Stock",
    "category": "Category",
    "allCategories": "All Categories",
    "price": "Price",
    "variants": "Variants",
    "selectVariant": "Select variant",
    "popular": "Popular",
    "recent": "Recent"
  },
  "orders": {
    "new": "New Order",
    "inProgress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "orderNumber": "Order #{{number}}",
    "noOrders": "No orders",
    "viewOrder": "View Order",
    "printReceipt": "Print Receipt",
    "sendToKitchen": "Send to Kitchen",
    "recallOrder": "Recall Order",
    "holdOrder": "Hold Order",
    "resumeOrder": "Resume Order",
    "voidOrder": "Void Order",
    "refundOrder": "Refund Order",
    "orderType": "Order Type",
    "dineIn": "Dine In",
    "takeaway": "Takeaway",
    "delivery": "Delivery"
  },
  "tables": {
    "title": "Tables",
    "selectTable": "Select Table",
    "noTable": "No Table",
    "capacity": "Capacity: {{count}}",
    "currentOrder": "Current Order",
    "startNewOrder": "Start New Order",
    "transferTable": "Transfer Table",
    "mergeTables": "Merge Tables",
    "splitTable": "Split Table",
    "status": {
      "available": "Available",
      "occupied": "Occupied",
      "reserved": "Reserved"
    }
  },
  "tabs": {
    "title": "Open Tabs",
    "openTab": "Open Tab",
    "closeTab": "Close Tab",
    "addToTab": "Add to Tab",
    "tabName": "Tab Name",
    "noTabs": "No open tabs",
    "tabTotal": "Tab Total"
  },
  "till": {
    "title": "Till Management",
    "openTill": "Open Till",
    "closeTill": "Close Till",
    "cashIn": "Cash In",
    "cashOut": "Cash Out",
    "declareTips": "Declare Tips",
    "expectedCash": "Expected Cash",
    "actualCash": "Actual Cash",
    "difference": "Difference",
    "variance": "Variance",
    "openingBalance": "Opening Balance",
    "closingBalance": "Closing Balance",
    "cashSales": "Cash Sales",
    "cardSales": "Card Sales",
    "totalSales": "Total Sales"
  },
  "receipt": {
    "title": "Receipt",
    "header": "Thank you for your visit!",
    "footer": "We hope to see you again!",
    "orderNumber": "Order #",
    "date": "Date",
    "server": "Server",
    "table": "Table",
    "items": "Items",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "total": "Total",
    "paid": "Paid",
    "change": "Change",
    "paymentMethod": "Payment Method"
  }
}
```

#### Italian: [`frontend/public/locales/it/pos.json`](frontend/public/locales/it/pos.json)

```json
{
  "title": "Punto Vendita",
  "cart": {
    "title": "Ordine Corrente",
    "empty": "Il carrello è vuoto",
    "items_one": "{{count}} articolo",
    "items_other": "{{count}} articoli",
    "subtotal": "Subtotale",
    "tax": "Tassa",
    "total": "Totale",
    "addItem": "Aggiungi Articolo",
    "removeItem": "Rimuovi Articolo",
    "clearCart": "Svuota Carrello",
    "quantity": "Qtà",
    "updateQuantity": "Aggiorna Quantità",
    "specialRequests": "Richieste Speciali",
    "discount": "Sconto",
    "applyDiscount": "Applica Sconto"
  },
  "payment": {
    "title": "Pagamento",
    "methods": {
      "cash": "Contanti",
      "card": "Carta",
      "voucher": "Voucher",
      "mixed": "Pagamento Misto"
    },
    "amountReceived": "Importo Ricevuto",
    "change": "Resto",
    "process": "Elabora Pagamento",
    "success": "Pagamento effettuato con successo!",
    "failed": "Pagamento fallito. Riprova.",
    "insufficientFunds": "Importo insufficiente ricevuto",
    "exactAmount": "Importo esatto",
    "quickCash": "Contanti Rapidi",
    "splitPayment": "Dividi Pagamento",
    "partialPayment": "Pagamento Parziale",
    "remaining": "Rimanente",
    "tip": "Aggiungi Mancia",
    "noTip": "Nessuna Mancia",
    "customTip": "Mancia Personalizzata",
    "tipPercentage": "Mancia {{percent}}%"
  },
  "products": {
    "search": "Cerca prodotti...",
    "noResults": "Nessun prodotto trovato",
    "addToCart": "Aggiungi al Carrello",
    "outOfStock": "Esaurito",
    "lowStock": "Scorta Bassa",
    "category": "Categoria",
    "allCategories": "Tutte le Categorie",
    "price": "Prezzo",
    "variants": "Varianti",
    "selectVariant": "Seleziona variante",
    "popular": "Popolari",
    "recent": "Recenti"
  },
  "orders": {
    "new": "Nuovo Ordine",
    "inProgress": "In Corso",
    "completed": "Completato",
    "cancelled": "Annullato",
    "orderNumber": "Ordine #{{number}}",
    "noOrders": "Nessun ordine",
    "viewOrder": "Visualizza Ordine",
    "printReceipt": "Stampa Scontrino",
    "sendToKitchen": "Invia in Cucina",
    "recallOrder": "Richiama Ordine",
    "holdOrder": "Metti in Attesa",
    "resumeOrder": "Riprendi Ordine",
    "voidOrder": "Annulla Ordine",
    "refundOrder": "Rimborsa Ordine",
    "orderType": "Tipo Ordine",
    "dineIn": "Al Tavolo",
    "takeaway": "Asporto",
    "delivery": "Consegna"
  },
  "tables": {
    "title": "Tavoli",
    "selectTable": "Seleziona Tavolo",
    "noTable": "Nessun Tavolo",
    "capacity": "Capacità: {{count}}",
    "currentOrder": "Ordine Corrente",
    "startNewOrder": "Nuovo Ordine",
    "transferTable": "Trasferisci Tavolo",
    "mergeTables": "Unisci Tavoli",
    "splitTable": "Dividi Tavolo",
    "status": {
      "available": "Disponibile",
      "occupied": "Occupato",
      "reserved": "Prenotato"
    }
  },
  "tabs": {
    "title": "Conti Aperti",
    "openTab": "Apri Conto",
    "closeTab": "Chiudi Conto",
    "addToTab": "Aggiungi al Conto",
    "tabName": "Nome Conto",
    "noTabs": "Nessun conto aperto",
    "tabTotal": "Totale Conto"
  },
  "till": {
    "title": "Gestione Cassa",
    "openTill": "Apri Cassa",
    "closeTill": "Chiudi Cassa",
    "cashIn": "Entrata Cassa",
    "cashOut": "Uscita Cassa",
    "declareTips": "Dichiara Mance",
    "expectedCash": "Cassa Attesa",
    "actualCash": "Cassa Effettiva",
    "difference": "Differenza",
    "variance": "Scostamento",
    "openingBalance": "Saldo Iniziale",
    "closingBalance": "Saldo Finale",
    "cashSales": "Vendite Contanti",
    "cardSales": "Vendite Carta",
    "totalSales": "Vendite Totali"
  },
  "receipt": {
    "title": "Scontrino",
    "header": "Grazie per la tua visita!",
    "footer": "Speriamo di rivederti presto!",
    "orderNumber": "Ordine #",
    "date": "Data",
    "server": "Cameriere",
    "table": "Tavolo",
    "items": "Articoli",
    "subtotal": "Subtotale",
    "tax": "Tassa",
    "total": "Totale",
    "paid": "Pagato",
    "change": "Resto",
    "paymentMethod": "Metodo di Pagamento"
  }
}
```

---

### 3. Errors Namespace

#### English: [`frontend/public/locales/en/errors.json`](frontend/public/locales/en/errors.json)

```json
{
  "network": {
    "title": "Network Error",
    "message": "Unable to connect to the server. Please check your connection.",
    "retry": "Retry",
    "timeout": "Request timed out. Please try again.",
    "offline": "You appear to be offline. Please check your connection."
  },
  "unauthorized": {
    "title": "Unauthorized",
    "message": "You are not authorized to perform this action.",
    "login": "Please log in again."
  },
  "forbidden": {
    "title": "Access Denied",
    "message": "You do not have permission to access this resource."
  },
  "notFound": {
    "title": "Not Found",
    "message": "The requested resource was not found.",
    "page": "The page you are looking for does not exist."
  },
  "server": {
    "title": "Server Error",
    "message": "An internal server error occurred. Please try again later.",
    "maintenance": "The server is currently under maintenance. Please try again later."
  },
  "validation": {
    "title": "Validation Error",
    "message": "Please check your input and try again."
  },
  "generic": {
    "title": "Error",
    "message": "An unexpected error occurred.",
    "tryAgain": "Please try again."
  },
  "codes": {
    "INVALID_CREDENTIALS": "Invalid username or password",
    "USER_NOT_FOUND": "User not found",
    "USER_DISABLED": "User account is disabled",
    "USER_EXISTS": "User already exists",
    "PRODUCT_NOT_FOUND": "Product not found",
    "PRODUCT_EXISTS": "Product already exists",
    "CATEGORY_NOT_FOUND": "Category not found",
    "CATEGORY_EXISTS": "Category already exists",
    "TABLE_NOT_FOUND": "Table not found",
    "TABLE_OCCUPIED": "Table is already occupied",
    "ORDER_NOT_FOUND": "Order not found",
    "ORDER_COMPLETED": "Order already completed",
    "ORDER_CANCELLED": "Order already cancelled",
    "VALIDATION_FAILED": "Validation failed",
    "ACCESS_DENIED": "Access denied",
    "RATE_LIMITED": "Too many requests. Please wait and try again.",
    "TOKEN_EXPIRED": "Your session has expired. Please log in again.",
    "TOKEN_INVALID": "Invalid session. Please log in again.",
    "INSUFFICIENT_STOCK": "Insufficient stock for {{product}}",
    "PAYMENT_FAILED": "Payment processing failed",
    "TRANSACTION_NOT_FOUND": "Transaction not found",
    "TILL_NOT_FOUND": "Till not found",
    "TILL_CLOSED": "Till is closed",
    "DAILY_CLOSING_EXISTS": "Daily closing already exists for this date",
    "IMPORT_FAILED": "Import failed. Please check the file format.",
    "EXPORT_FAILED": "Export failed. Please try again."
  }
}
```

#### Italian: [`frontend/public/locales/it/errors.json`](frontend/public/locales/it/errors.json)

```json
{
  "network": {
    "title": "Errore di Rete",
    "message": "Impossibile connettersi al server. Controlla la tua connessione.",
    "retry": "Riprova",
    "timeout": "Richiesta scaduta. Riprova.",
    "offline": "Sembra che tu sia offline. Controlla la tua connessione."
  },
  "unauthorized": {
    "title": "Non Autorizzato",
    "message": "Non sei autorizzato a eseguire questa azione.",
    "login": "Accedi nuovamente."
  },
  "forbidden": {
    "title": "Accesso Negato",
    "message": "Non hai i permessi per accedere a questa risorsa."
  },
  "notFound": {
    "title": "Non Trovato",
    "message": "La risorsa richiesta non è stata trovata.",
    "page": "La pagina che stai cercando non esiste."
  },
  "server": {
    "title": "Errore del Server",
    "message": "Si è verificato un errore interno del server. Riprova più tardi.",
    "maintenance": "Il server è in manutenzione. Riprova più tardi."
  },
  "validation": {
    "title": "Errore di Validazione",
    "message": "Controlla i dati inseriti e riprova."
  },
  "generic": {
    "title": "Errore",
    "message": "Si è verificato un errore imprevisto.",
    "tryAgain": "Riprova."
  },
  "codes": {
    "INVALID_CREDENTIALS": "Nome utente o password non validi",
    "USER_NOT_FOUND": "Utente non trovato",
    "USER_DISABLED": "Account utente disabilitato",
    "USER_EXISTS": "Utente già esistente",
    "PRODUCT_NOT_FOUND": "Prodotto non trovato",
    "PRODUCT_EXISTS": "Prodotto già esistente",
    "CATEGORY_NOT_FOUND": "Categoria non trovata",
    "CATEGORY_EXISTS": "Categoria già esistente",
    "TABLE_NOT_FOUND": "Tavolo non trovato",
    "TABLE_OCCUPIED": "Il tavolo è già occupato",
    "ORDER_NOT_FOUND": "Ordine non trovato",
    "ORDER_COMPLETED": "Ordine già completato",
    "ORDER_CANCELLED": "Ordine già annullato",
    "VALIDATION_FAILED": "Validazione fallita",
    "ACCESS_DENIED": "Accesso negato",
    "RATE_LIMITED": "Troppe richieste. Attendi e riprova.",
    "TOKEN_EXPIRED": "La sessione è scaduta. Accedi nuovamente.",
    "TOKEN_INVALID": "Sessione non valida. Accedi nuovamente.",
    "INSUFFICIENT_STOCK": "Scorta insufficiente per {{product}}",
    "PAYMENT_FAILED": "Elaborazione pagamento fallita",
    "TRANSACTION_NOT_FOUND": "Transazione non trovata",
    "TILL_NOT_FOUND": "Cassa non trovata",
    "TILL_CLOSED": "La cassa è chiusa",
    "DAILY_CLOSING_EXISTS": "Chiusura giornaliera già esistente per questa data",
    "IMPORT_FAILED": "Importazione fallita. Controlla il formato del file.",
    "EXPORT_FAILED": "Esportazione fallita. Riprova."
  }
}
```

---

### 4. Validation Namespace

#### English: [`frontend/public/locales/en/validation.json`](frontend/public/locales/en/validation.json)

```json
{
  "required": "This field is required",
  "email": "Please enter a valid email address",
  "minLength": "Minimum {{min}} characters required",
  "maxLength": "Maximum {{max}} characters allowed",
  "min": "Minimum value is {{min}}",
  "max": "Maximum value is {{max}}",
  "pattern": "Invalid format",
  "number": "Please enter a valid number",
  "integer": "Please enter a whole number",
  "positiveNumber": "Please enter a positive number",
  "nonNegativeNumber": "Please enter a non-negative number",
  "price": "Please enter a valid price",
  "url": "Please enter a valid URL",
  "date": "Please enter a valid date",
  "dateRange": "Start date must be before end date",
  "passwordMatch": "Passwords do not match",
  "passwordStrength": "Password must be at least 8 characters with uppercase, lowercase, and numbers",
  "username": "Username must be 3-20 characters, letters, numbers, and underscores only",
  "unique": "This value already exists",
  "fields": {
    "name": "Name is required",
    "nameMinLength": "Name must be at least {{min}} characters",
    "nameMaxLength": "Name must be at most {{max}} characters",
    "price": "Price is required and must be non-negative",
    "priceInvalid": "Please enter a valid price",
    "quantity": "Quantity is required and must be non-negative",
    "quantityInvalid": "Please enter a valid quantity",
    "category": "Category is required",
    "username": "Username is required",
    "usernameInvalid": "Username must be 3-20 characters",
    "usernameExists": "Username already exists",
    "password": "Password is required",
    "passwordMinLength": "Password must be at least {{min}} characters",
    "passwordConfirm": "Please confirm your password",
    "passwordMismatch": "Passwords do not match",
    "email": "Email is required",
    "emailInvalid": "Please enter a valid email address",
    "phone": "Please enter a valid phone number",
    "tableNumber": "Table number is required",
    "capacity": "Capacity must be a positive number",
    "tillName": "Till name is required"
  }
}
```

#### Italian: [`frontend/public/locales/it/validation.json`](frontend/public/locales/it/validation.json)

```json
{
  "required": "Questo campo è obbligatorio",
  "email": "Inserisci un indirizzo email valido",
  "minLength": "Minimo {{min}} caratteri richiesti",
  "maxLength": "Massimo {{max}} caratteri consentiti",
  "min": "Il valore minimo è {{min}}",
  "max": "Il valore massimo è {{max}}",
  "pattern": "Formato non valido",
  "number": "Inserisci un numero valido",
  "integer": "Inserisci un numero intero",
  "positiveNumber": "Inserisci un numero positivo",
  "nonNegativeNumber": "Inserisci un numero non negativo",
  "price": "Inserisci un prezzo valido",
  "url": "Inserisci un URL valido",
  "date": "Inserisci una data valida",
  "dateRange": "La data di inizio deve essere precedente alla data di fine",
  "passwordMatch": "Le password non coincidono",
  "passwordStrength": "La password deve avere almeno 8 caratteri con maiuscole, minuscole e numeri",
  "username": "Il nome utente deve avere 3-20 caratteri, solo lettere, numeri e underscore",
  "unique": "Questo valore esiste già",
  "fields": {
    "name": "Il nome è obbligatorio",
    "nameMinLength": "Il nome deve avere almeno {{min}} caratteri",
    "nameMaxLength": "Il nome deve avere al massimo {{max}} caratteri",
    "price": "Il prezzo è obbligatorio e deve essere non negativo",
    "priceInvalid": "Inserisci un prezzo valido",
    "quantity": "La quantità è obbligatoria e deve essere non negativa",
    "quantityInvalid": "Inserisci una quantità valida",
    "category": "La categoria è obbligatoria",
    "username": "Il nome utente è obbligatorio",
    "usernameInvalid": "Il nome utente deve avere 3-20 caratteri",
    "usernameExists": "Nome utente già esistente",
    "password": "La password è obbligatoria",
    "passwordMinLength": "La password deve avere almeno {{min}} caratteri",
    "passwordConfirm": "Conferma la password",
    "passwordMismatch": "Le password non coincidono",
    "email": "L'email è obbligatoria",
    "emailInvalid": "Inserisci un indirizzo email valido",
    "phone": "Inserisci un numero di telefono valido",
    "tableNumber": "Il numero del tavolo è obbligatorio",
    "capacity": "La capacità deve essere un numero positivo",
    "tillName": "Il nome della cassa è obbligatorio"
  }
}
```

---

### 5. Navigation Namespace

#### English: [`frontend/public/locales/en/navigation.json`](frontend/public/locales/en/navigation.json)

```json
{
  "menu": {
    "dashboard": "Dashboard",
    "pos": "Point of Sale",
    "analytics": "Analytics",
    "products": "Products",
    "categories": "Categories",
    "stockItems": "Stock Items",
    "inventory": "Inventory",
    "users": "Users",
    "tills": "Tills",
    "tables": "Tables & Layout",
    "transactions": "Transactions",
    "activityLog": "Activity Log",
    "dailyClosing": "Daily Closing Summary",
    "consumption": "Itemised Consumption",
    "settings": "Settings"
  },
  "admin": {
    "title": "Admin Panel",
    "productManagement": "Product Management",
    "categoryManagement": "Category Management",
    "userManagement": "User Management",
    "tableManagement": "Table Management",
    "tillManagement": "Till Management",
    "stockManagement": "Stock Management",
    "layoutManagement": "Layout Management",
    "roomManagement": "Room Management"
  },
  "user": {
    "profile": "Profile",
    "logout": "Logout",
    "login": "Login",
    "welcome": "Welcome, {{name}}",
    "lastLogin": "Last login: {{date}}"
  },
  "breadcrumbs": {
    "home": "Home",
    "admin": "Admin",
    "products": "Products",
    "categories": "Categories",
    "users": "Users",
    "tables": "Tables",
    "tills": "Tills",
    "settings": "Settings"
  }
}
```

#### Italian: [`frontend/public/locales/it/navigation.json`](frontend/public/locales/it/navigation.json)

```json
{
  "menu": {
    "dashboard": "Dashboard",
    "pos": "Punto Vendita",
    "analytics": "Analisi",
    "products": "Prodotti",
    "categories": "Categorie",
    "stockItems": "Articoli Magazzino",
    "inventory": "Inventario",
    "users": "Utenti",
    "tills": "Casse",
    "tables": "Tavoli e Layout",
    "transactions": "Transazioni",
    "activityLog": "Registro Attività",
    "dailyClosing": "Chiusura Giornaliera",
    "consumption": "Consumo Dettagliato",
    "settings": "Impostazioni"
  },
  "admin": {
    "title": "Pannello Amministrazione",
    "productManagement": "Gestione Prodotti",
    "categoryManagement": "Gestione Categorie",
    "userManagement": "Gestione Utenti",
    "tableManagement": "Gestione Tavoli",
    "tillManagement": "Gestione Casse",
    "stockManagement": "Gestione Magazzino",
    "layoutManagement": "Gestione Layout",
    "roomManagement": "Gestione Sale"
  },
  "user": {
    "profile": "Profilo",
    "logout": "Esci",
    "login": "Accedi",
    "welcome": "Benvenuto, {{name}}",
    "lastLogin": "Ultimo accesso: {{date}}"
  },
  "breadcrumbs": {
    "home": "Home",
    "admin": "Amministrazione",
    "products": "Prodotti",
    "categories": "Categorie",
    "users": "Utenti",
    "tables": "Tavoli",
    "tills": "Casse",
    "settings": "Impostazioni"
  }
}
```

---

### 6. Settings Namespace

#### English: [`frontend/public/locales/en/settings.json`](frontend/public/locales/en/settings.json)

```json
{
  "title": "Settings",
  "language": {
    "title": "Language",
    "description": "Select your preferred language",
    "en": "English",
    "it": "Italiano"
  },
  "currency": {
    "title": "Currency",
    "symbol": "Symbol",
    "position": "Position",
    "beforeAmount": "Before amount",
    "afterAmount": "After amount"
  },
  "receipt": {
    "title": "Receipt Settings",
    "showTax": "Show tax breakdown",
    "showTip": "Show tip line",
    "header": "Header Text",
    "footer": "Footer Text",
    "autoPrint": "Auto-print receipts",
    "printCopies": "Number of copies"
  },
  "display": {
    "title": "Display Settings",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "auto": "Auto",
    "fontSize": "Font Size",
    "compact": "Compact Mode"
  },
  "notifications": {
    "title": "Notifications",
    "sound": "Sound Effects",
    "orderAlerts": "Order Alerts",
    "lowStockAlerts": "Low Stock Alerts"
  },
  "pos": {
    "title": "POS Settings",
    "defaultView": "Default View",
    "gridSize": "Grid Size",
    "showImages": "Show Product Images",
    "quickCashButtons": "Quick Cash Buttons",
    "defaultTaxRate": "Default Tax Rate"
  }
}
```

#### Italian: [`frontend/public/locales/it/settings.json`](frontend/public/locales/it/settings.json)

```json
{
  "title": "Impostazioni",
  "language": {
    "title": "Lingua",
    "description": "Seleziona la lingua preferita",
    "en": "English",
    "it": "Italiano"
  },
  "currency": {
    "title": "Valuta",
    "symbol": "Simbolo",
    "position": "Posizione",
    "beforeAmount": "Prima dell'importo",
    "afterAmount": "Dopo l'importo"
  },
  "receipt": {
    "title": "Impostazioni Scontrino",
    "showTax": "Mostra dettagli tasse",
    "showTip": "Mostra riga mancia",
    "header": "Testo Intestazione",
    "footer": "Testo Piè di Pagina",
    "autoPrint": "Stampa automatica scontrini",
    "printCopies": "Numero di copie"
  },
  "display": {
    "title": "Impostazioni Display",
    "theme": "Tema",
    "light": "Chiaro",
    "dark": "Scuro",
    "auto": "Automatico",
    "fontSize": "Dimensione Carattere",
    "compact": "Modalità Compatta"
  },
  "notifications": {
    "title": "Notifiche",
    "sound": "Effetti Sonori",
    "orderAlerts": "Avvisi Ordini",
    "lowStockAlerts": "Avvisi Scorta Bassa"
  },
  "pos": {
    "title": "Impostazioni POS",
    "defaultView": "Vista Predefinita",
    "gridSize": "Dimensione Griglia",
    "showImages": "Mostra Immagini Prodotti",
    "quickCashButtons": "Pulsanti Contanti Rapidi",
    "defaultTaxRate": "Aliquota Predefinita"
  }
}
```

---

### 7. Auth Namespace (Login Screen)

#### English: [`frontend/public/locales/en/auth.json`](frontend/public/locales/en/auth.json)

```json
{
  "login": {
    "title": "Login",
    "subtitle": "Sign in to your account",
    "username": "Username",
    "password": "Password",
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot password?",
    "submit": "Sign In",
    "loggingIn": "Signing in...",
    "success": "Login successful!",
    "failed": "Login failed. Please try again.",
    "errors": {
      "usernameRequired": "Username is required",
      "passwordRequired": "Password is required",
      "invalidCredentials": "Invalid username or password",
      "accountDisabled": "Your account has been disabled",
      "sessionExpired": "Your session has expired. Please log in again."
    }
  },
  "logout": {
    "title": "Logout",
    "message": "You have been logged out successfully.",
    "autoLogout": "You have been logged out due to inactivity."
  }
}
```

#### Italian: [`frontend/public/locales/it/auth.json`](frontend/public/locales/it/auth.json)

```json
{
  "login": {
    "title": "Accesso",
    "subtitle": "Accedi al tuo account",
    "username": "Nome Utente",
    "password": "Password",
    "rememberMe": "Ricordami",
    "forgotPassword": "Password dimenticata?",
    "submit": "Accedi",
    "loggingIn": "Accesso in corso...",
    "success": "Accesso effettuato!",
    "failed": "Accesso fallito. Riprova.",
    "errors": {
      "usernameRequired": "Il nome utente è obbligatorio",
      "passwordRequired": "La password è obbligatoria",
      "invalidCredentials": "Nome utente o password non validi",
      "accountDisabled": "Il tuo account è stato disabilitato",
      "sessionExpired": "La sessione è scaduta. Accedi nuovamente."
    }
  },
  "logout": {
    "title": "Disconnessione",
    "message": "Disconnessione effettuata con successo.",
    "autoLogout": "Sei stato disconnesso per inattività."
  }
}
```

---

## Backend Translation Files

### API Namespace

#### English: [`backend/locales/en/api.json`](backend/locales/en/api.json)

```json
{
  "products": {
    "fetched": "Successfully fetched {{count}} products",
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully",
    "notFound": "Product not found",
    "importSuccess": "Successfully imported {{count}} products",
    "exportSuccess": "Successfully exported {{count}} products"
  },
  "categories": {
    "fetched": "Successfully fetched {{count}} categories",
    "created": "Category created successfully",
    "updated": "Category updated successfully",
    "deleted": "Category deleted successfully",
    "notFound": "Category not found",
    "hasProducts": "Cannot delete category with associated products"
  },
  "users": {
    "created": "User created successfully",
    "updated": "User updated successfully",
    "deleted": "User deleted successfully",
    "notFound": "User not found",
    "usernameExists": "Username already exists",
    "passwordChanged": "Password changed successfully"
  },
  "orders": {
    "created": "Order created successfully",
    "updated": "Order updated successfully",
    "cancelled": "Order cancelled successfully",
    "notFound": "Order not found",
    "cannotModify": "Cannot modify completed or cancelled order"
  },
  "tables": {
    "fetched": "Successfully fetched {{count}} tables",
    "created": "Table created successfully",
    "updated": "Table updated successfully",
    "deleted": "Table deleted successfully",
    "notFound": "Table not found",
    "occupied": "Table is already occupied"
  },
  "rooms": {
    "fetched": "Successfully fetched {{count}} rooms",
    "created": "Room created successfully",
    "updated": "Room updated successfully",
    "deleted": "Room deleted successfully",
    "notFound": "Room not found",
    "hasTables": "Cannot delete room with associated tables"
  },
  "tills": {
    "fetched": "Successfully fetched {{count}} tills",
    "created": "Till created successfully",
    "updated": "Till updated successfully",
    "notFound": "Till not found",
    "opened": "Till opened successfully",
    "closed": "Till closed successfully"
  },
  "transactions": {
    "created": "Transaction recorded successfully",
    "notFound": "Transaction not found",
    "voided": "Transaction voided successfully",
    "refunded": "Transaction refunded successfully"
  },
  "dailyClosings": {
    "created": "Daily closing created successfully",
    "notFound": "Daily closing not found",
    "alreadyExists": "Daily closing already exists for this date"
  },
  "stock": {
    "adjusted": "Stock adjusted successfully",
    "insufficient": "Insufficient stock for {{product}}",
    "notFound": "Stock item not found"
  }
}
```

#### Italian: [`backend/locales/it/api.json`](backend/locales/it/api.json)

```json
{
  "products": {
    "fetched": "Recuperati {{count}} prodotti con successo",
    "created": "Prodotto creato con successo",
    "updated": "Prodotto aggiornato con successo",
    "deleted": "Prodotto eliminato con successo",
    "notFound": "Prodotto non trovato",
    "importSuccess": "Importati {{count}} prodotti con successo",
    "exportSuccess": "Esportati {{count}} prodotti con successo"
  },
  "categories": {
    "fetched": "Recuperate {{count}} categorie con successo",
    "created": "Categoria creata con successo",
    "updated": "Categoria aggiornata con successo",
    "deleted": "Categoria eliminata con successo",
    "notFound": "Categoria non trovata",
    "hasProducts": "Impossibile eliminare categoria con prodotti associati"
  },
  "users": {
    "created": "Utente creato con successo",
    "updated": "Utente aggiornato con successo",
    "deleted": "Utente eliminato con successo",
    "notFound": "Utente non trovato",
    "usernameExists": "Nome utente già esistente",
    "passwordChanged": "Password modificata con successo"
  },
  "orders": {
    "created": "Ordine creato con successo",
    "updated": "Ordine aggiornato con successo",
    "cancelled": "Ordine annullato con successo",
    "notFound": "Ordine non trovato",
    "cannotModify": "Impossibile modificare ordine completato o annullato"
  },
  "tables": {
    "fetched": "Recuperati {{count}} tavoli con successo",
    "created": "Tavolo creato con successo",
    "updated": "Tavolo aggiornato con successo",
    "deleted": "Tavolo eliminato con successo",
    "notFound": "Tavolo non trovato",
    "occupied": "Il tavolo è già occupato"
  },
  "rooms": {
    "fetched": "Recuperate {{count}} sale con successo",
    "created": "Sala creata con successo",
    "updated": "Sala aggiornata con successo",
    "deleted": "Sala eliminata con successo",
    "notFound": "Sala non trovata",
    "hasTables": "Impossibile eliminare sala con tavoli associati"
  },
  "tills": {
    "fetched": "Recuperate {{count}} casse con successo",
    "created": "Cassa creata con successo",
    "updated": "Cassa aggiornata con successo",
    "notFound": "Cassa non trovata",
    "opened": "Cassa aperta con successo",
    "closed": "Cassa chiusa con successo"
  },
  "transactions": {
    "created": "Transazione registrata con successo",
    "notFound": "Transazione non trovata",
    "voided": "Transazione annullata con successo",
    "refunded": "Transazione rimborsata con successo"
  },
  "dailyClosings": {
    "created": "Chiusura giornaliera creata con successo",
    "notFound": "Chiusura giornaliera non trovata",
    "alreadyExists": "Chiusura giornaliera già esistente per questa data"
  },
  "stock": {
    "adjusted": "Giacenza aggiornata con successo",
    "insufficient": "Giacenza insufficiente per {{product}}",
    "notFound": "Articolo magazzino non trovato"
  }
}
```

### Errors Namespace

#### English: [`backend/locales/en/errors.json`](backend/locales/en/errors.json)

```json
{
  "unauthorized": "You are not authorized to perform this action",
  "forbidden": "Access denied",
  "notFound": "The requested resource was not found",
  "validation": {
    "failed": "Validation failed",
    "required": "This field is required",
    "invalidFormat": "Invalid format",
    "outOfRange": "Value is out of range"
  },
  "server": {
    "internal": "An internal server error occurred",
    "database": "A database error occurred",
    "network": "A network error occurred"
  },
  "auth": {
    "invalidCredentials": "Invalid username or password",
    "tokenExpired": "Your session has expired",
    "tokenInvalid": "Invalid session token",
    "userNotFound": "User not found",
    "userDisabled": "User account is disabled"
  },
  "rateLimit": {
    "tooManyRequests": "Too many requests. Please wait and try again.",
    "retryAfter": "Please retry after {{seconds}} seconds"
  }
}
```

#### Italian: [`backend/locales/it/errors.json`](backend/locales/it/errors.json)

```json
{
  "unauthorized": "Non sei autorizzato a eseguire questa azione",
  "forbidden": "Accesso negato",
  "notFound": "La risorsa richiesta non è stata trovata",
  "validation": {
    "failed": "Validazione fallita",
    "required": "Questo campo è obbligatorio",
    "invalidFormat": "Formato non valido",
    "outOfRange": "Valore fuori intervallo"
  },
  "server": {
    "internal": "Si è verificato un errore interno del server",
    "database": "Si è verificato un errore del database",
    "network": "Si è verificato un errore di rete"
  },
  "auth": {
    "invalidCredentials": "Nome utente o password non validi",
    "tokenExpired": "La sessione è scaduta",
    "tokenInvalid": "Token di sessione non valido",
    "userNotFound": "Utente non trovato",
    "userDisabled": "Account utente disabilitato"
  },
  "rateLimit": {
    "tooManyRequests": "Troppe richieste. Attendi e riprova.",
    "retryAfter": "Riprova tra {{seconds}} secondi"
  }
}
```

---

## Usage Examples

### In React Components

```typescript
import { useTranslation } from 'react-i18next';

function ProductCard({ product }) {
  const { t } = useTranslation(['pos', 'common']);
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{t('pos:products.price')}: {formatCurrency(product.price)}</p>
      <button>{t('common:buttons.addToCart')}</button>
    </div>
  );
}
```

### With Interpolation

```typescript
const { t } = useTranslation('pos');

// Simple interpolation
<p>{t('orders.orderNumber', { number: order.id })}</p>

// Pluralization
<span>{t('cart.items', { count: items.length })}</span>
```

### In Backend Handlers

```typescript
import { Request, Response } from 'express';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    
    res.json({
      message: req.t('products.fetched', { count: products.length }),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      error: req.t('errors:server.internal'),
    });
  }
};
```

---

## Translation Key Count Summary

| Namespace | English Keys | Italian Keys |
|-----------|--------------|--------------|
| common | ~120 | ~120 |
| pos | ~100 | ~100 |
| errors | ~40 | ~40 |
| validation | ~35 | ~35 |
| navigation | ~30 | ~30 |
| settings | ~25 | ~25 |
| auth | ~20 | ~20 |
| **Frontend Total** | **~370** | **~370** |
| api (backend) | ~50 | ~50 |
| errors (backend) | ~20 | ~20 |
| **Backend Total** | **~70** | **~70** |
| **Grand Total** | **~440** | **~440** |

---

*Document created as part of multilanguage implementation planning.*
