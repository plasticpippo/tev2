# Discount Feature Documentation

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Guide](#user-guide)
3. [Technical Documentation](#technical-documentation)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)

---

## Feature Overview

### Purpose

The discount feature allows administrators to apply arbitrary discounts to customer bills during the payment process. This is useful for:

- **Customer satisfaction**: Resolving complaints or issues by offering discounts
- **Promotional pricing**: Applying special offers or loyalty rewards
- **Staff meals**: Providing complimentary items for employees
- **Special occasions**: Offering discounts for events, birthdays, or VIP customers

### Use Cases

| Scenario | Description |
|----------|-------------|
| Partial Discount | Apply a fixed amount discount (e.g., 5 EUR off a 25 EUR bill) |
| Complimentary Bill | Discount the entire bill to make it free (status: "complimentary") |
| Documented Discount | Apply discount with a justification reason for audit purposes |

### Access Control

- **Role Required**: `ADMIN` (or `Admin`)
- **Non-admin users** cannot see or access the discount functionality
- The discount section is completely hidden from non-admin users in the payment modal

---

## User Guide

### How to Apply a Discount

1. **Add items to the order** - Select products as usual in the POS system
2. **Open the payment modal** - Click the "Payment" button in the cart
3. **Locate the discount section** - Found at the top of the payment modal (visible only for admins)
4. **Adjust the discount amount**:
   - Click the **`-`** button to decrease the discount by 1 EUR
   - Click the **`+`** button to increase the discount by 1 EUR
   - The discount cannot exceed the total bill amount
5. **Enter a reason (optional)** - Type a justification in the "Reason (optional)" text field
6. **Review the final total** - The discount is subtracted from the subtotal + tax
7. **Complete payment** - Click "Pay with CASH" or "Pay with CARD"

### Making a Bill Complimentary

A "complimentary" bill is one where the final total is 0 EUR after applying the discount.

**Steps:**

1. Open the payment modal with items in the order
2. Increase the discount until the "Final Total" shows 0.00 EUR
3. A purple "Complimentary" badge will appear next to the discount label
4. Complete the payment - the transaction will be recorded with status "complimentary"

**Example:**

| Item | Amount |
|------|--------|
| Subtotal | 15.00 EUR |
| Tax | 1.50 EUR |
| **Total before discount** | **16.50 EUR** |
| Discount | 16.50 EUR |
| **Final Total** | **0.00 EUR** |
| Status | Complimentary |

### Stock Consumption

**Important**: Stock is consumed regardless of whether a discount is applied or the bill is complimentary.

- Products in discounted orders still reduce inventory
- This ensures accurate stock tracking for all items served
- Complimentary items are still recorded as consumed

---

## Technical Documentation

### Database Schema Changes

#### Migration

**File**: [`20260215120000_add_discount_fields_to_transactions`](../backend/prisma/migrations/20260215120000_add_discount_fields_to_transactions/migration.sql)

```sql
-- Add discount fields to transactions table
BEGIN;

ALTER TABLE "transactions" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "discountReason" TEXT;
ALTER TABLE "transactions" ADD COLUMN "status" VARCHAR(255) NOT NULL DEFAULT 'completed';

COMMIT;
```

#### Transaction Model

**File**: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

```prisma
model Transaction {
  id             Int      @id @default(autoincrement())
  items          Json
  subtotal       Float
  tax            Float
  tip            Float
  total          Float
  discount       Float    @default(0)        // NEW: Discount amount
  discountReason String?                     // NEW: Optional justification
  status         String   @default("completed") // NEW: "completed" or "complimentary"
  paymentMethod  String
  userId         Int
  userName       String
  tillId         Int
  tillName       String
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id])

  @@map("transactions")
}
```

#### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `discount` | Float | 0 | The discount amount applied in the transaction currency |
| `discountReason` | String? | null | Optional text explaining why the discount was applied |
| `status` | String | "completed" | Transaction status: "completed" or "complimentary" |

### API Changes

#### Endpoint

```
POST /api/transactions
```

#### Request Body

```typescript
interface TransactionRequest {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  paymentMethod: 'CASH' | 'CARD';
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  discount?: number;           // NEW: Optional discount amount
  discountReason?: string;     // NEW: Optional discount justification
}
```

#### Response

```typescript
interface TransactionResponse {
  id: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;              // Final total after discount
  discount: number;           // Applied discount amount
  discountReason: string | null;
  status: 'completed' | 'complimentary';
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  createdAt: string;
}
```

#### Validation Rules

**File**: [`backend/src/handlers/transactions.ts`](../backend/src/handlers/transactions.ts)

| Rule | Error Code | HTTP Status |
|------|------------|-------------|
| Discount must be non-negative | `transactions.discountNegative` | 400 |
| Discount cannot exceed total (subtotal + tax + tip) | `transactions.discountExceedsTotal` | 400 |
| Discount > 0 requires ADMIN role | `transactions.discountRequiresAdmin` | 403 |

#### Server-Side Logic

```typescript
// From backend/src/handlers/transactions.ts

// 1. Validate discount is non-negative
if (discountAmount < 0) {
  return res.status(400).json({ error: i18n.t('transactions.discountNegative') });
}

// 2. Calculate pre-discount total
const preDiscountTotal = subtotal + tax + tip;

// 3. Validate discount does not exceed total
if (discountAmount > preDiscountTotal) {
  return res.status(400).json({ error: i18n.t('transactions.discountExceedsTotal') });
}

// 4. Check admin role when discount > 0
if (discountAmount > 0) {
  const userRole = req.user?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
  if (!isAdmin) {
    return res.status(403).json({ error: i18n.t('transactions.discountRequiresAdmin') });
  }
}

// 5. Calculate final total
const finalTotal = preDiscountTotal - discountAmount;

// 6. Determine status
const status = finalTotal <= 0 ? 'complimentary' : 'completed';
```

### Frontend Component Changes

#### PaymentModal Component

**File**: [`frontend/components/PaymentModal.tsx`](../frontend/components/PaymentModal.tsx)

##### Props Interface

```typescript
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  taxSettings: TaxSettings;
  onConfirmPayment: (paymentMethod: string, tip: number, discount: number, discountReason: string) => void;
  assignedTable?: { name: string } | null;
}
```

##### State Management

```typescript
const [tip, setTip] = useState(0);
const [discount, setDiscount] = useState(0);
const [discountReason, setDiscountReason] = useState('');
```

##### Admin Role Check

```typescript
const { currentUser } = useSessionContext();
const isAdmin = currentUser?.role === 'Admin';
```

##### Discount Validation

```typescript
const handleDiscountChange = (value: number) => {
  // Validate: discount cannot exceed totalBeforeTip
  const maxDiscount = totalBeforeTip;
  setDiscount(Math.min(Math.max(0, value), maxDiscount));
};
```

##### Complimentary Detection

```typescript
const isComplimentary = finalTotal === 0 && discount > 0;
```

##### UI Elements

The discount section is conditionally rendered:

```tsx
{isAdmin && (
  <div className="mb-4 p-3 bg-purple-900/30 border border-purple-700/50 rounded-md">
    {/* Discount controls */}
  </div>
)}
```

### Authorization Logic

#### Role-Based Access Control

| Action | Required Role | Implementation |
|--------|---------------|----------------|
| View discount section | ADMIN | Frontend: `isAdmin` check hides UI |
| Apply discount > 0 | ADMIN | Backend: `req.user.role` validation |
| Create complimentary bill | ADMIN | Backend: Same as discount > 0 |

#### Security Considerations

1. **Frontend-only hiding is not security**: The UI hides the discount section, but the real security is enforced server-side
2. **Server-side validation**: All discount requests are validated on the backend
3. **Audit trail**: The `discountReason` field provides justification tracking
4. **Token validation**: All transaction endpoints require authentication via `authenticateToken` middleware

---

## Configuration

### Environment Variables

No new environment variables are required for this feature. The discount feature uses existing configuration:

| Variable | Purpose | Used By |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | Prisma migrations |
| `JWT_SECRET` | Token signing | Authentication middleware |

### Feature Flags

The discount feature is always enabled for admin users. There is no configuration to disable it.

### Database Migration

To apply the discount feature migration on a new environment:

```bash
cd backend
npx prisma migrate deploy
```

### Rollback

To rollback the discount fields (not recommended for production):

```sql
BEGIN;
ALTER TABLE "transactions" DROP COLUMN "discount";
ALTER TABLE "transactions" DROP COLUMN "discountReason";
ALTER TABLE "transactions" DROP COLUMN "status";
COMMIT;
```

---

## Troubleshooting

### Common Issues

#### Issue: Discount section not visible

**Symptoms**: The discount controls do not appear in the payment modal.

**Possible Causes**:
1. User is not logged in as an admin
2. Session context is not properly set
3. Frontend build does not include the latest changes

**Solutions**:
1. Verify user role in the database:
   ```sql
   SELECT role FROM users WHERE username = 'your_username';
   ```
2. Ensure the role is exactly `Admin` or `ADMIN`
3. Rebuild the frontend: `docker compose up -d --build`

#### Issue: "Discount requires admin privileges" error

**Symptoms**: 403 Forbidden response when trying to apply a discount.

**Possible Causes**:
1. User's JWT token does not have admin role
2. Token is valid but user role was changed after token was issued

**Solutions**:
1. Log out and log back in to get a fresh token
2. Verify the user's current role in the database
3. Check the JWT payload contains the correct role

#### Issue: "Discount cannot exceed the total amount" error

**Symptoms**: 400 Bad Request when applying a discount.

**Possible Causes**:
1. Discount amount is greater than subtotal + tax + tip
2. Frontend validation was bypassed

**Solutions**:
1. Reduce the discount amount
2. The maximum allowed discount is shown in the UI as "Max: X.XX EUR"

#### Issue: "Discount cannot be negative" error

**Symptoms**: 400 Bad Request with negative discount.

**Possible Causes**:
1. Client-side manipulation of the request
2. Bug in the frontend code

**Solutions**:
1. This is a validation error - negative discounts are not allowed
2. Check the frontend is correctly handling the discount state

### Error Messages Reference

| Error Key | Message (EN) | HTTP Status |
|-----------|--------------|-------------|
| `transactions.discountNegative` | Discount cannot be negative | 400 |
| `transactions.discountExceedsTotal` | Discount cannot exceed the total amount (subtotal + tax + tip) | 400 |
| `transactions.discountRequiresAdmin` | Applying a discount requires admin privileges | 403 |

### Debugging Tips

1. **Check the network tab**: Inspect the POST `/api/transactions` request to see the discount value being sent
2. **Verify token contents**: Decode the JWT token at jwt.io to check the role claim
3. **Check server logs**: Look for payment processing logs with correlation IDs
4. **Database inspection**: Query transactions table to verify discount fields are populated

```sql
SELECT id, total, discount, "discountReason", status 
FROM transactions 
WHERE discount > 0 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-15 | Initial implementation of discount feature |

## Related Documentation

- [Transaction Handler Source](../backend/src/handlers/transactions.ts)
- [PaymentModal Component](../frontend/components/PaymentModal.tsx)
- [Database Schema](../backend/prisma/schema.prisma)
- [Error Messages (EN)](../backend/locales/en/errors.json)
- [Error Messages (IT)](../backend/locales/it/errors.json)