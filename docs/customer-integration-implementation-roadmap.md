# Customer Feature Integration - Comprehensive Implementation Roadmap

**Document Version:** 1.0
**Created:** 2026-04-07
**Based on:** Code Audit Analysis
**Reference Documents:**
- `docs/receipt-invoicing-implementation-plan.md`
- `docs/receipt-generation-ui-security-assessment.md`

---

## Executive Summary

This roadmap addresses the integration of the Customer feature based on a thorough code audit. The audit reveals that the core infrastructure for Receipts and Customers is **substantially implemented**, with the following status:

| Category | Status |
|----------|--------|
| Database Schema | **COMPLETE** - Customer, Receipt, AuditLog, EmailQueue models implemented |
| Backend APIs | **COMPLETE** - All CRUD endpoints functional for receipts and customers |
| Receipt Generation UI | **COMPLETE** - Full 4-step modal with customer selection |
| Receipt Management Page | **COMPLETE** - Dedicated admin page with filtering |
| Customer Management Page | **MISSING** - No standalone admin CRUD interface |
| Backend Validation | **PARTIAL** - Missing notes field length validation |

---

## Part 1: Current Implementation Status

### 1.1 Database Schema (IMPLEMENTED)

The Prisma schema contains all planned models:

#### Customer Model - `backend/prisma/schema.prisma`
```prisma
model Customer {
  id          Int       @id @default(autoincrement())
  name        String
  email       String?   @unique
  phone       String?
  vatNumber   String?
  address     String?
  city        String?
  postalCode  String?
  country     String?
  notes       String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  createdBy   Int
  user        User      @relation(fields: [createdBy], references: [id])
  receipts    Receipt[]
}
```

**Status:** Fully implemented with soft-delete support (GDPR compliance).

#### Receipt Model - Customer Relation
```prisma
model Receipt {
  customerId      Int?
  customer        Customer?  @relation(fields: [customerId], references: [id])
  customerSnapshot Json?     // Customer data snapshot at generation time
  // ... other fields
}
```

**Status:** Optional customer linking implemented.

### 1.2 Backend Implementation (IMPLEMENTED)

#### Customer Handler - `backend/src/handlers/customerHandler.ts`

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/customers` | GET | List customers with pagination | IMPLEMENTED |
| `/api/customers/:id` | GET | Get single customer | IMPLEMENTED |
| `/api/customers` | POST | Create customer | IMPLEMENTED |
| `/api/customers/:id` | PUT | Update customer | IMPLEMENTED |
| `/api/customers/:id` | DELETE | Soft delete customer | IMPLEMENTED |
| `/api/customers/search` | GET | Search customers by name/email | IMPLEMENTED |
| `/api/customers/check-duplicate` | GET | Check for duplicates | IMPLEMENTED |

#### Receipt Handler - Customer Integration

| Feature | Status |
|---------|--------|
| Create receipt with customer | IMPLEMENTED |
| Customer snapshot on issue | IMPLEMENTED |
| Filter receipts by customer | IMPLEMENTED |
| Receipt detail includes customer | IMPLEMENTED |

### 1.3 Frontend Implementation (PARTIALLY IMPLEMENTED)

#### Implemented Components

| Component | File | Description |
|-----------|------|-------------|
| ReceiptGenerationModal | `frontend/components/ReceiptGenerationModal.tsx` | 4-step flow with optional customer assignment |
| CustomerSelectionModal | `frontend/components/CustomerSelectionModal.tsx` | Search/select existing customers |
| CustomerForm | `frontend/components/CustomerForm.tsx` | Create new customer during receipt flow |
| TransactionHistory | `frontend/components/TransactionHistory.tsx` | Shows receipt status badge per transaction |

#### Missing Components

| Component | Description | Priority |
|-----------|-------------|----------|
| CustomerManagement | Standalone admin page for customer CRUD | HIGH |
| Admin Navigation | "Customers" menu item in sidebar | HIGH |

---

## Part 2: Development Roadmap

### Phase A: Fix Security Findings (Priority: HIGH)

#### A.1 Backend Notes Validation

**Issue:** Finding #4 from security assessment - missing input validation on notes field.

**File:** `backend/src/handlers/receiptHandler.ts`

**Current Code:**
```typescript
notes: z.string().optional(),
```

**Required Fix:**
```typescript
notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
```

**Implementation Steps:**
1. Update validation schema in `createReceiptSchema` and `updateReceiptSchema`
2. Add validation error message to i18n files
3. Test with 1001+ character input

**Estimated Time:** 30 minutes

---

### Phase B: Customer Management Admin UI (Priority: HIGH)

This is the main missing feature. While customer CRUD APIs exist, there's no admin interface.

#### B.1 Database Schema - No Changes Required

The Customer model is complete. No schema modifications needed.

#### B.2 Backend API - No Changes Required

All required endpoints exist in `customerHandler.ts`. The frontend just needs to consume them.

#### B.3 Frontend Implementation

##### B.3.1 Create CustomerManagement Component

**File:** `frontend/components/CustomerManagement.tsx`

**Required Features:**

| Feature | Description |
|---------|-------------|
| Customer List | Paginated table with name, email, phone, VAT, status |
| Search | Debounced search by name, email, phone |
| Filters | Active/Inactive status filter |
| Actions | View, Edit, Deactivate buttons per row |
| Create Button | Opens CustomerForm modal |
| Bulk Actions | Export to CSV |

**UI Layout:**
```
+------------------------------------------------------------------+
| Customers                                    [+ New Customer]     |
+------------------------------------------------------------------+
| Search: [____________]  Status: [All v]                           |
+------------------------------------------------------------------+
| Name          | Email         | Phone    | VAT      | Actions    |
+---------------+---------------+----------+----------+------------+
| John Doe      | john@...      | +39...   | IT...    | View Edit  |
| Jane Smith    | jane@...      | +39...   | -        | View Edit  |
+------------------------------------------------------------------+
| < 1 2 3 ... 10 >                              Showing 1-20 of 200|
+------------------------------------------------------------------+
```

**Component Structure:**
```typescript
// frontend/components/CustomerManagement.tsx

interface CustomerManagementProps {
  // Optional props for embedding in other views
}

export function CustomerManagement({}: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Debounced search effect
  // Pagination effect
  // Fetch customers function

  return (
    <div className="customer-management">
      {/* Header with title and new button */}
      {/* Search and filters */}
      {/* Customer table */}
      {/* Pagination */}
      {/* CustomerForm modal */}
      {/* CustomerDetail modal */}
    </div>
  );
}
```

##### B.3.2 Create CustomerDetail Component

**File:** `frontend/components/CustomerDetail.tsx`

**Required Features:**
- Display all customer fields
- Show associated receipts (summary)
- Edit button
- Deactivate/Activate button
- Close button

**UI Layout:**
```
+------------------------------------------+
| Customer Details                   [X]   |
+------------------------------------------+
| Name:     John Doe                       |
| Email:    john.doe@example.com           |
| Phone:    +39 012 3456789                |
| VAT:      IT12345678901                  |
| Address:  Via Roma 123                   |
| City:     Milano                         |
| Postal:   20100                          |
| Country:  Italy                          |
| Status:   Active                         |
| Created:  2026-03-15 by Admin            |
+------------------------------------------+
| Receipts (5)                             |
| - R000123 issued 2026-03-20  EUR 150.00 |
| - R000089 issued 2026-03-18  EUR 75.00  |
| ...                                      |
+------------------------------------------+
|        [Edit]  [Deactivate]  [Close]     |
+------------------------------------------+
```

##### B.3.3 Update CustomerForm for Standalone Use

**File:** `frontend/components/CustomerForm.tsx`

**Current State:** Used within ReceiptGenerationModal for quick customer creation.

**Enhancements:**
- Add all fields (currently some may be abbreviated)
- Add form mode prop: 'create' | 'edit'
- Add onCancel callback
- Improve validation feedback

##### B.3.4 Add Admin Route

**File:** `frontend/app/admin/customers/page.tsx` (or equivalent route)

```typescript
import { CustomerManagement } from '@/components/CustomerManagement';

export default function CustomersPage() {
  return (
    <div className="container mx-auto p-4">
      <CustomerManagement />
    </div>
  );
}
```

##### B.3.5 Update Admin Navigation

**File:** `frontend/components/AdminPanel.tsx`

**Add to Sidebar Navigation:**
```typescript
// Add after Receipts menu item (around line 308)
<button
  onClick={() => setActiveTab('customers')}
  className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
    activeTab === 'customers'
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-50'
  }`}
>
  <Users className="h-5 w-5" />
  <span>{t('nav.customers')}</span>
</button>
```

**Add i18n Keys:**
```json
// frontend/locales/en.json
{
  "nav": {
    "customers": "Customers"
  },
  "customers": {
    "title": "Customer Management",
    "newCustomer": "New Customer",
    "searchPlaceholder": "Search by name, email, or phone...",
    "noResults": "No customers found",
    "status": {
      "active": "Active",
      "inactive": "Inactive"
    },
    "actions": {
      "view": "View",
      "edit": "Edit",
      "deactivate": "Deactivate",
      "activate": "Activate"
    },
    "detail": {
      "title": "Customer Details",
      "receipts": "Receipts",
      "noReceipts": "No receipts for this customer"
    },
    "form": {
      "createTitle": "Create New Customer",
      "editTitle": "Edit Customer",
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "vatNumber": "VAT Number",
      "address": "Street Address",
      "city": "City",
      "postalCode": "Postal Code",
      "country": "Country",
      "notes": "Notes"
    },
    "validation": {
      "nameRequired": "Customer name is required",
      "emailInvalid": "Please enter a valid email address",
      "emailExists": "A customer with this email already exists"
    },
    "confirm": {
      "deactivate": "Are you sure you want to deactivate this customer?",
      "activate": "Are you sure you want to activate this customer?"
    },
    "success": {
      "created": "Customer created successfully",
      "updated": "Customer updated successfully",
      "deactivated": "Customer deactivated successfully",
      "activated": "Customer activated successfully"
    },
    "error": {
      "createFailed": "Failed to create customer",
      "updateFailed": "Failed to update customer",
      "loadFailed": "Failed to load customers"
    }
  }
}
```

---

### Phase C: Frontend Receipt Integration Enhancement (Priority: MEDIUM)

The receipt generation UI already handles optional customer assignment. Minor enhancements:

#### C.1 Improve Customer Selection UX

**File:** `frontend/components/CustomerSelectionModal.tsx`

**Enhancements:**
1. Add "View All Customers" link that opens CustomerManagement
2. Show customer receipt count in search results
3. Add recent customers section (last 5 used)

#### C.2 Add Customer Info Display in ReceiptManagement

**File:** `frontend/components/ReceiptManagement.tsx`

**Enhancements:**
1. Show customer name in receipt list
2. Add customer filter dropdown
3. Add link to customer detail when viewing receipt

---

### Phase D: Security & Validation Improvements (Priority: MEDIUM)

#### D.1 Backend Input Validation

**Files to Update:**

| File | Validation to Add |
|------|-------------------|
| `backend/src/handlers/receiptHandler.ts` | Notes max length (1000 chars) |
| `backend/src/handlers/customerHandler.ts` | Email format, VAT format, phone format |

**Example Implementation:**
```typescript
// backend/src/handlers/customerHandler.ts

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format").max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  vatNumber: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// Add VAT validation helper for Italian format
const validateVATNumber = (vat: string | undefined): boolean => {
  if (!vat) return true; // Optional field
  // Italian VAT format: IT + 11 digits
  const itVatRegex = /^IT[0-9]{11}$/;
  // Or generic EU format
  const euVatRegex = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
  return itVatRegex.test(vat) || euVatRegex.test(vat);
};
```

#### D.2 Rate Limiting

**Add rate limiting to customer endpoints:**

```typescript
// backend/src/middleware/rateLimiter.ts

export const customerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

// Apply to routes
app.use('/api/customers', customerRateLimiter);
```

#### D.3 Audit Logging for Customers

**File:** `backend/src/services/customerAuditService.ts` (new)

```typescript
// Create audit log for customer operations
export async function logCustomerAction(
  prisma: PrismaClient,
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
  customerId: number,
  userId: number,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): Promise<void> {
  await prisma.customerAuditLog.create({
    data: {
      customerId,
      action,
      oldValues: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValues: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      userId,
      timestamp: new Date(),
    }
  });
}
```

**Add to Prisma Schema:**
```prisma
model CustomerAuditLog {
  id          Int       @id @default(autoincrement())
  customerId  Int
  action      String    // 'create', 'update', 'delete', 'activate', 'deactivate'
  oldValues   Json?
  newValues   Json?
  userId      Int
  user        User      @relation(fields: [userId], references: [id])
  timestamp   DateTime  @default(now())

  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

---

### Phase E: Admin Panel UI Enhancements (Priority: MEDIUM)

#### E.1 Customer Management Section Design

**Layout Specification:**

```
+============================================================================+
| BAR POS Admin Panel                                              [Logout]  |
+============================================================================+
| Dashboard | Transactions | Receipts | Customers | Products | Settings     |
|                                            ^^^^                            |
+----------------------------------------------------------------------------+
|                                                                            |
|  Customers                                           [+ New Customer]     |
|  ---------------------------------------------------------------           |
|                                                                            |
|  [Search customers...] [Status: All v] [Export CSV]                        |
|                                                                            |
|  +--------------------------------------------------------------------+   |
|  | Name          | Email           | Phone      | Receipts | Actions  |   |
|  +--------------------------------------------------------------------+   |
|  | Mario Rossi   | mario@...       | +39 333... | 12       | View Edit |   |
|  | Anna Bianchi  | anna@...        | +39 334... | 8        | View Edit |   |
|  | Luigi Verdi   | -               | +39 335... | 3        | View Edit |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  Showing 1-20 of 45 customers                      [< 1 2 3 >]            |
|                                                                            |
+----------------------------------------------------------------------------+
```

#### E.2 Customer Detail View Design

```
+============================================================================+
| Customer Details                                                    [X]    |
+============================================================================+
|                                                                            |
|  Name:        Mario Rossi                                                  |
|  Email:       mario.rossi@example.com                                      |
|  Phone:       +39 333 1234567                                              |
|  VAT Number:  IT12345678901                                                |
|                                                                            |
|  Address:     Via Roma 123                                                 |
|  City:        Milano                                                       |
|  Postal Code: 20100                                                        |
|  Country:     Italy                                                        |
|                                                                            |
|  Status:      Active                                                       |
|  Created:     2026-02-15 10:30 by Admin                                    |
|  Last Update: 2026-03-20 14:22                                             |
|                                                                            |
|  Notes:                                                                     |
|  Regular customer, prefers email delivery.                                 |
|                                                                            |
+----------------------------------------------------------------------------+
|  Recent Receipts (12 total)                                                |
|  ---------------------------------------------------------------           |
|  Receipt #  | Date       | Amount    | Status | Actions                    |
|  R000156    | 2026-04-05 | EUR 125.00| Issued | View PDF                    |
|  R000142    | 2026-04-01 | EUR 89.50 | Issued | View PDF                    |
|  R000098    | 2026-03-25 | EUR 210.00| Issued | View PDF                    |
|                                                                            |
|  [View All Receipts]                                                       |
+----------------------------------------------------------------------------+
|                                                                            |
|  [Edit Customer]  [Deactivate]  [Close]                                    |
|                                                                            |
+============================================================================+
```

#### E.3 Customer Form Design

```
+============================================================================+
| Edit Customer                                                       [X]    |
+============================================================================+
|                                                                            |
|  Full Name *        [Mario Rossi                                    ]      |
|                                                                            |
|  Email              [mario.rossi@example.com                        ]      |
|                     (Used for receipt delivery)                            |
|                                                                            |
|  Phone              [+39 333 1234567                                 ]      |
|                                                                            |
|  VAT Number         [IT12345678901                                   ]      |
|                     (Required for business receipts)                       |
|                                                                            |
|  Address            [Via Roma 123                                    ]      |
|  City               [Milano                                          ]      |
|  Postal Code        [20100                                           ]      |
|  Country            [Italy                                     v   ]      |
|                                                                            |
|  Notes              [                                                ]      |
|                      [Regular customer, prefers email delivery.   ]      |
|                      [                                                ]      |
|                      (500 characters remaining)                            |
|                                                                            |
+----------------------------------------------------------------------------+
|                                                                            |
|  [* Required fields]                                                       |
|                                                                            |
|  [Cancel]                                            [Save Customer]       |
|                                                                            |
+============================================================================+
```

---

## Part 3: Implementation Timeline

### Week 1: Security Fixes & Backend Enhancements

| Day | Task | Priority |
|-----|------|----------|
| 1 | Add notes field validation in receiptHandler | HIGH |
| 1 | Add input validation in customerHandler | HIGH |
| 2 | Create CustomerAuditLog model and migration | MEDIUM |
| 2 | Implement customer audit logging service | MEDIUM |
| 3 | Add rate limiting to customer endpoints | MEDIUM |
| 3 | Write unit tests for validation | MEDIUM |

### Week 2: Customer Management UI

| Day | Task | Priority |
|-----|------|----------|
| 1 | Create CustomerManagement component | HIGH |
| 2 | Create CustomerDetail component | HIGH |
| 3 | Enhance CustomerForm for standalone use | HIGH |
| 4 | Add admin route and navigation | HIGH |
| 5 | Add i18n translations (EN/IT) | HIGH |

### Week 3: Integration & Testing

| Day | Task | Priority |
|-----|------|----------|
| 1 | Integrate customer link in ReceiptManagement | MEDIUM |
| 2 | Add "View All Customers" link in CustomerSelectionModal | MEDIUM |
| 3 | E2E testing with Playwright MCP | HIGH |
| 4 | Fix bugs and edge cases | HIGH |
| 5 | Documentation update | LOW |

---

## Part 4: Security Checklist

Based on the security assessment, ensure:

| Item | Status | Action Required |
|------|--------|-----------------|
| Draft receipt unique constraint | FIXED | No action needed |
| Receipt status indicator | IMPLEMENTED | No action needed |
| Receipts management page | IMPLEMENTED | No action needed |
| Notes field validation | PARTIAL | Add backend max length |
| PDF error handling | PARTIAL | Improve error messages |
| Customer data access control | IMPLEMENTED | Verify role-based access |
| Customer PII protection | IMPLEMENTED | Soft-delete implemented |
| Audit logging | IMPLEMENTED | Extend to customers |

---

## Part 5: Testing Requirements

### Unit Tests

| Test Suite | Coverage |
|------------|----------|
| CustomerService | create, update, delete, search, duplicate check |
| CustomerHandler | request validation, response formatting |
| ReceiptService (customer) | customer linking, snapshot creation |

### Integration Tests

| Test Case | Description |
|-----------|-------------|
| Customer CRUD flow | Create, read, update, delete via API |
| Customer-Receipt link | Create receipt with customer, verify snapshot |
| Customer search | Debounced search with pagination |
| Duplicate prevention | Try to create customer with existing email |

### E2E Tests (Playwright MCP)

| Test Case | Steps |
|-----------|-------|
| Create customer from admin | Login > Admin > Customers > New > Fill form > Save |
| Search customers | Login > Admin > Customers > Search > Verify results |
| Edit customer | Login > Admin > Customers > Select > Edit > Update |
| Deactivate customer | Login > Admin > Customers > Select > Deactivate > Confirm |
| Create receipt with customer | Login > Admin > Transactions > Generate Receipt > Select Customer > Issue |
| View customer receipts | Login > Admin > Customers > Select > View receipt list |

---

## Part 6: Deployment Checklist

### Pre-Deployment

- [ ] All migrations tested on staging
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security review completed
- [ ] i18n translations complete (EN/IT)

### Database Migration

```bash
# Generate migration
cd backend
npx prisma migrate dev --name add_customer_audit_log

# For production
npx prisma migrate deploy
```

### Environment Variables

No new environment variables required. Existing SMTP configuration supports email delivery.

### Rollback Plan

1. Feature flag to disable customer management UI
2. Database migration rollback script
3. Frontend can function without customer module

---

## Appendix A: API Endpoint Reference

### Customer Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/customers` | GET | Admin | List all customers (paginated) |
| `/api/customers/:id` | GET | Admin | Get customer by ID |
| `/api/customers` | POST | Admin | Create new customer |
| `/api/customers/:id` | PUT | Admin | Update customer |
| `/api/customers/:id` | DELETE | Admin | Soft delete customer |
| `/api/customers/search` | GET | Admin/Cashier | Search customers |
| `/api/customers/check-duplicate` | GET | Admin/Cashier | Check for duplicates |
| `/api/customers/:id/receipts` | GET | Admin | Get customer's receipts |

### Receipt-Customer Integration

| Endpoint | Parameter | Description |
|----------|-----------|-------------|
| `POST /api/receipts` | `customerId` | Optional customer assignment |
| `GET /api/receipts` | `customerId` | Filter by customer |
| `GET /api/receipts/:id` | includes `customer` | Returns linked customer |

---

## Appendix B: File Modification Summary

### New Files to Create

| File | Description |
|------|-------------|
| `frontend/components/CustomerManagement.tsx` | Main customer list component |
| `frontend/components/CustomerDetail.tsx` | Customer detail view component |
| `frontend/app/admin/customers/page.tsx` | Customer management page route |
| `backend/src/services/customerAuditService.ts` | Audit logging for customers |
| `backend/prisma/migrations/.../migration.sql` | CustomerAuditLog table migration |

### Files to Modify

| File | Changes |
|------|---------|
| `backend/src/handlers/customerHandler.ts` | Add input validation |
| `backend/src/handlers/receiptHandler.ts` | Add notes max length validation |
| `backend/prisma/schema.prisma` | Add CustomerAuditLog model |
| `frontend/components/AdminPanel.tsx` | Add Customers navigation |
| `frontend/components/CustomerForm.tsx` | Enhance for standalone use |
| `frontend/components/CustomerSelectionModal.tsx` | Add "View All" link |
| `frontend/components/ReceiptManagement.tsx` | Add customer display |
| `frontend/locales/en.json` | Add customer i18n keys |
| `frontend/locales/it.json` | Add customer i18n keys |

---

## Conclusion

This roadmap provides a comprehensive plan to fully integrate the Customer feature into the Bar POS system. The primary focus is on:

1. **Security hardening** - Fixing validation gaps identified in the security assessment
2. **Admin UI completion** - Creating the missing Customer Management interface
3. **Enhanced integration** - Improving the receipt-customer workflow

The implementation should proceed in phases, starting with security fixes, followed by the customer management UI, and concluding with integration enhancements and comprehensive testing.

**Estimated Total Effort:** 3 weeks
**Risk Level:** LOW (Core infrastructure exists, only UI and validation needed)
