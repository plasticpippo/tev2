# Implementation Plan: Business Settings for Receipt/Invoice Header

**Document Version:** 1.0
**Created:** 2026-04-05
**Last Updated:** 2026-04-05
**Status:** Pending Approval
**Related Document:** `docs/implementation-plan-receipt-from-payment-modal.md`

---

## 1. Executive Summary

This plan addresses the gaps identified in the existing receipt issuance implementation regarding missing business settings for displaying proper receipt/invoice headers. The current system has database fields for basic business information but lacks:

1. **No UI for editing business information** - Business settings exist in the database but cannot be configured through the application
2. **Missing logo functionality** - Logo path field exists in template but no upload/storage mechanism
3. **No legal/custom text configuration** - No way to add mandatory legal disclaimers or custom footer text
4. **Incomplete business snapshot** - Logo path not captured in business snapshot at receipt creation

### Difficulty Assessment: Medium

| Complexity Level | Description |
|------------------|-------------|
| **Low** | Database schema extensions, type updates, settings handler modifications |
| **Medium** | Logo upload service, file storage, frontend settings form |
| **Medium** | Business snapshot synchronization, migration of existing data |

---

## 2. Gap Analysis

### 2.1 Current State vs Required State

| Component | Current State | Required State | Gap |
|-----------|--------------|----------------|-----|
| **Database Schema** | Basic business fields exist (name, address, city, postalCode, country, phone, email, vatNumber) | All fields exist + logo path + legal text | Missing: `businessLogoPath`, `businessLegalText` fields |
| **BusinessSnapshot Type** | Contains all basic fields, has `logoPath` as optional | Should include `logoPath` and `legalText` | Logo not populated in snapshot creation |
| **Receipt Template** | Header renders logo if `receipt.business.logoPath` exists | Works as expected | Missing backend data flow |
| **Settings UI** | No Business Info tab in Settings Modal | Full business settings form | Complete UI section missing |
| **Logo Storage** | No upload mechanism or storage | File upload with proper storage | Entire feature missing |
| **API Exposure** | Business fields returned in GET settings | Works but incomplete | Need logo URL generation |

### 2.2 Missing Business Settings Identified

| Setting | Purpose | Priority |
|---------|---------|----------|
| Business Logo | Branding on receipts/invoices | High |
| Legal/Custom Text | Mandatory disclaimers, custom footer | Medium |
| Business Settings UI | User configuration interface | High |

### 2.3 Edge Cases Requiring Handling

| Edge Case | Current Behavior | Required Behavior |
|-----------|------------------|-------------------|
| Missing business name | Empty header | Graceful fallback with placeholder or warning |
| Missing all business info | Empty header section | Display "Business information not configured" message |
| Logo file deleted externally | Broken image | Fallback to text-only header, log warning |
| Invalid logo format | Upload accepted | Validation with error message |
| Large logo file | Performance impact | Size limits, automatic resizing |
| Incomplete business profile | Partial header | Clear visual indication of missing fields |

---

## 3. Architectural Decisions

### 3.1 Logo Storage Strategy

**Decision: Local file system storage with database reference**

**Rationale:**
- Consistent with existing backup storage pattern
- No external dependencies required
- Easy migration path if cloud storage needed later
- Docker volume persistence ensures logos survive container restarts

**Storage Location:** `./uploads/logos/` (mounted volume in Docker)

**File Naming Convention:** `logo-{timestamp}.{extension}` to prevent caching issues

**Alternative Considered:** Base64 encoding in database
- Rejected: Bloats database, no caching benefits, larger PDF generation

### 3.2 Logo Upload Flow

```
[Frontend: Settings UI]
         |
         v
[POST /api/settings/logo] (multipart/form-data)
         |
         v
[LogoUploadService]
  - Validate file type (PNG, JPG, SVG)
  - Validate file size (max 2MB)
  - Generate unique filename
  - Store in uploads/logos/
  - Return URL path
         |
         v
[Settings Handler]
  - Update Settings.businessLogoPath
  - Return updated settings
```

### 3.3 Business Snapshot Strategy

**Decision: Capture complete business info including logo at receipt creation**

**Rationale:**
- Ensures receipt reflects business info at time of issuance
- Historical accuracy for reprints
- Consistent with existing customer snapshot pattern

**Update Required:** `getBusinessSnapshot()` must include logo path and legal text

### 3.4 Legal Text Configuration

**Decision: Store legal text in Settings, apply to receipt template**

**Fields:**
- `businessLegalText` - Custom legal disclaimers, registration numbers, etc.
- Displayed below totals section on receipts

**Template Handling:** Conditional rendering if legal text exists

---

## 4. Data Flow Architecture

### 4.1 Settings Retrieval Flow

```
[Database: Settings]
         |
         v
[Settings Handler: GET /api/settings]
  - Transform businessLogoPath to full URL
  - Include all business fields in response
         |
         v
[Frontend: GlobalDataContext]
  - Store in appData.settings
         |
         v
[Components]
  - SettingsModal displays current values
  - Receipt generation uses settings
```

### 4.2 Logo Upload Flow

```
[Frontend: File Input]
         |
         v
[Logo Preview Display]
         |
         v
[Save Button Click]
         |
         v
[POST /api/settings/logo]
  - multipart/form-data
  - File validation middleware
         |
         v
[LogoUploadService.processLogo()]
  - Validate MIME type
  - Check file size (max 2MB)
  - Generate filename: logo-{timestamp}-{random}.{ext}
  - Create directory if needed
  - Write file to uploads/logos/
  - Delete old logo if exists
         |
         v
[Settings Handler]
  - Update businessLogoPath field
  - Return updated settings with new logo URL
         |
         v
[Frontend: Update UI]
  - Show success message
  - Update preview
```

### 4.3 Receipt Generation Flow (Updated)

```
[Payment Process]
         |
         v
[paymentModalReceiptService.createReceiptFromPayment()]
         |
         v
[receiptService.getBusinessSnapshot()]
  - Read all business fields from Settings
  - Include businessLogoPath (converted to URL)
  - Include businessLegalText
         |
         v
[Receipt Creation]
  - businessSnapshot JSON field populated
         |
         v
[PDF Generation]
  - prepareReceiptTemplateData() uses businessSnapshot
  - Header template renders logo, name, address, legal text
```

---

## 5. Implementation Tickets

### Ticket #BIZ-1: Database Schema Extension

**Title:** Add businessLogoPath and businessLegalText fields to Settings

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** None

**Description:**
Extend the Settings model to include logo path and legal text fields.

**Acceptance Criteria:**
- [ ] `Settings` model has `businessLogoPath` field (String?, optional)
- [ ] `Settings` model has `businessLegalText` field (String?, optional)
- [ ] Migration script runs successfully
- [ ] Prisma client regenerated
- [ ] Existing data preserved

**Files to Modify:**
- `backend/prisma/schema.prisma`

**Schema Changes:**
```prisma
model Settings {
  // ... existing fields ...
  
  // Business Logo
  businessLogoPath String? // Relative path to logo file
  
  // Legal Text
  businessLegalText String? // Custom legal text for receipts
}
```

**Commands:**
```bash
cd backend
npx prisma migrate dev --name add_business_logo_and_legal_text
npx prisma generate
```

---

### Ticket #BIZ-2: Backend Types Extension

**Title:** Update TypeScript types for business settings

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** Ticket #BIZ-1

**Description:**
Update all relevant TypeScript interfaces to include new business settings fields.

**Acceptance Criteria:**
- [ ] `BusinessSettings` interface includes `logoPath` and `legalText`
- [ ] `BusinessSnapshot` interface includes `logoPath` and `legalText`
- [ ] `ReceiptTemplateBusiness` interface updated
- [ ] All types exported correctly

**Files to Modify:**
- `backend/src/types.ts` - Update `BusinessSettings`
- `backend/src/types/receipt.ts` - Update `BusinessSnapshot`
- `backend/src/types/receipt-template.ts` - Update `ReceiptTemplateBusiness`

---

### Ticket #BIZ-3: Logo Upload Service

**Title:** Create logo upload and storage service

**Complexity:** Medium
**Estimated Time:** 3 hours
**Dependencies:** Ticket #BIZ-1

**Description:**
Create a dedicated service for handling logo file uploads, validation, and storage.

**Acceptance Criteria:**
- [ ] `processLogo(file: Express.Multer.File)` method validates and stores file
- [ ] Supported formats: PNG, JPEG, SVG
- [ ] Maximum file size: 2MB
- [ ] Automatic deletion of previous logo on upload
- [ ] Returns relative URL path for storage
- [ ] Proper error handling with specific error codes
- [ ] Unit tests for validation logic

**Files to Create:**
- `backend/src/services/logoUploadService.ts`

**Service Interface:**
```typescript
interface LogoUploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

interface LogoUploadService {
  processLogo(file: Express.Multer.File): Promise<LogoUploadResult>;
  deleteLogo(path: string): Promise<boolean>;
  getLogoUrl(path: string): string;
}
```

---

### Ticket #BIZ-4: Settings Handler Extension

**Title:** Extend settings handler for logo upload and business settings

**Complexity:** Medium
**Estimated Time:** 2 hours
**Dependencies:** Ticket #BIZ-3

**Description:**
Add new endpoints for logo upload and ensure business settings are properly handled.

**Acceptance Criteria:**
- [ ] `POST /api/settings/logo` endpoint accepts multipart/form-data
- [ ] Logo file validated and stored via logoUploadService
- [ ] Business settings returned with full logo URL
- [ ] `PUT /api/settings` accepts businessLegalText field
- [ ] Logo URL transformation: relative path -> full URL
- [ ] Existing tests pass

**Files to Modify:**
- `backend/src/handlers/settings.ts`

**New Endpoints:**
```
POST /api/settings/logo
  Content-Type: multipart/form-data
  Body: { logo: File }
  Response: { success: true, settings: Settings }

DELETE /api/settings/logo
  Response: { success: true, settings: Settings }
```

---

### Ticket #BIZ-5: Business Snapshot Service Update

**Title:** Update getBusinessSnapshot to include logo and legal text

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** Ticket #BIZ-1, Ticket #BIZ-2

**Description:**
Modify the business snapshot retrieval to include the new fields.

**Acceptance Criteria:**
- [ ] `getBusinessSnapshot()` returns `logoPath` field
- [ ] `getBusinessSnapshot()` returns `legalText` field
- [ ] Logo path converted to full URL for template rendering
- [ ] Null handling for missing logo/legal text

**Files to Modify:**
- `backend/src/services/receiptService.ts`

---

### Ticket #BIZ-6: Receipt Template Update

**Title:** Update receipt template to render logo and legal text

**Complexity:** Low
**Estimated Time:** 2 hours
**Dependencies:** Ticket #BIZ-5

**Description:**
Update the receipt header partial and main template to properly render business logo and legal text.

**Acceptance Criteria:**
- [ ] Logo rendered with proper sizing (max 50px height)
- [ ] Logo centered or left-aligned based on layout
- [ ] Legal text rendered below totals section
- [ ] Graceful handling of missing logo
- [ ] CSS updated for logo styling
- [ ] PDF generation tested with and without logo

**Files to Modify:**
- `backend/templates/receipts/partials/header.html.hbs`
- `backend/templates/receipts/receipt-standard.html.hbs`

**Template Changes:**
```html
<!-- header.html.hbs - Logo sizing -->
{{#if receipt.business.logoPath}}
<img src="{{receipt.business.logoPath}}" 
     alt="{{receipt.business.name}}" 
     class="business-logo"
     style="max-height: 50px; max-width: 200px;">
{{/if}}

<!-- receipt-standard.html.hbs - Legal text -->
{{#if receipt.legalText}}
<div class="legal-text">
  {{receipt.legalText}}
</div>
{{/if}}
```

---

### Ticket #BIZ-7: Frontend Types Extension

**Title:** Update frontend TypeScript types for business settings

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** None (parallel with backend)

**Description:**
Update frontend TypeScript interfaces to include new business settings fields.

**Acceptance Criteria:**
- [ ] `Settings.business` interface includes `logoPath` and `legalText`
- [ ] Types match backend response structure
- [ ] Exported from appropriate barrel file

**Files to Modify:**
- `shared/types.ts` (or equivalent)

---

### Ticket #BIZ-8: Logo Upload Component

**Title:** Create logo upload UI component

**Complexity:** Medium
**Estimated Time:** 3 hours
**Dependencies:** Ticket #BIZ-7, Ticket #BIZ-4

**Description:**
Create a reusable component for uploading and previewing business logo.

**Acceptance Criteria:**
- [ ] File input with drag-and-drop support
- [ ] Image preview before upload
- [ ] File type validation (PNG, JPG, SVG only)
- [ ] File size validation (max 2MB)
- [ ] Upload progress indicator
- [ ] Delete/remove logo button
- [ ] Error state display
- [ ] Loading state during upload

**Files to Create:**
- `frontend/components/LogoUploader.tsx`

---

### Ticket #BIZ-9: Business Info Settings Tab

**Title:** Add Business Info tab to Settings Modal

**Complexity:** Medium
**Estimated Time:** 4 hours
**Dependencies:** Ticket #BIZ-8

**Description:**
Create a dedicated tab in the Settings Modal for configuring all business information.

**Acceptance Criteria:**
- [ ] New "Business Info" tab added to Settings Modal
- [ ] Tab order: Language, Tax, Business Day, **Business Info**, Backup, Email, Receipt from Payment
- [ ] Form fields for all business settings:
  - Business name (required)
  - Address
  - City
  - Postal Code
  - Country
  - Phone
  - Email
  - VAT Number
  - Logo (using LogoUploader component)
  - Legal Text (textarea)
- [ ] Save button with loading state
- [ ] Proper validation
- [ ] Success/error notifications
- [ ] Responsive layout

**Files to Modify:**
- `frontend/components/SettingsModal.tsx`

**Files to Create:**
- `frontend/components/BusinessInfoSettings.tsx`

**UI Layout:**
```
+------------------------------------------+
| Business Information                     |
+------------------------------------------+
| Logo                                     |
| [┌────────────────┐]                     |
| │   [Logo Uploader Component]   │        |
| └────────────────┘]                     |
|                                          |
| Business Name *                          |
| [________________________]               |
|                                          |
| Address                                  |
| [________________________]               |
|                                          |
| City          Postal Code                |
| [__________]  [__________]               |
|                                          |
| Country                                  |
| [________________________]               |
|                                          |
| Phone                Email               |
| [__________]         [__________]        |
|                                          |
| VAT Number                               |
| [________________________]               |
|                                          |
| Legal Text (for receipts)                |
| [______________________________________] |
| [______________________________________] |
| [______________________________________] |
|                                          |
| [Save] [Cancel]                          |
+------------------------------------------+
```

---

### Ticket #BIZ-10: Invoice Header Consistency

**Title:** Ensure business header consistency across receipts and invoices

**Complexity:** Low
**Estimated Time:** 2 hours
**Dependencies:** Ticket #BIZ-6

**Description:**
Verify and ensure that invoice templates use the same header structure as receipts.

**Acceptance Criteria:**
- [ ] Invoice template uses same header partial
- [ ] Logo renders consistently
- [ ] Legal text appears on invoices
- [ ] Layout matches receipt header
- [ ] Test PDF generation for both formats

**Files to Check/Modify:**
- `backend/templates/invoices/` (if exists)
- Ensure header.html.hbs partial is reused

---

### Ticket #BIZ-11: prepareReceiptTemplateData Update

**Title:** Update template data preparation to include logo and legal text

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** Ticket #BIZ-2, Ticket #BIZ-5

**Description:**
Update the `prepareReceiptTemplateData` function to include new business fields.

**Acceptance Criteria:**
- [ ] `prepareReceiptTemplateData` populates `logoPath`
- [ ] `prepareReceiptTemplateData` populates `legalText`
- [ ] Business snapshot properly transformed
- [ ] Template receives all required data

**Files to Modify:**
- `backend/src/types/receipt-template.ts`

---

### Ticket #BIZ-12: Static File Serving Configuration

**Title:** Configure static file serving for uploaded logos

**Complexity:** Low
**Estimated Time:** 1 hour
**Dependencies:** None

**Description:**
Configure the backend to serve uploaded logo files statically.

**Acceptance Criteria:**
- [ ] `/uploads/logos/*` endpoint serves logo files
- [ ] Proper caching headers set
- [ ] CORS headers for cross-origin access
- [ ] Docker volume mounted correctly
- [ ] PDF generation can access logos

**Files to Modify:**
- `backend/src/index.ts` (or app.ts)
- `docker-compose.yml` (volume mount)

---

### Ticket #BIZ-13: Integration Tests

**Title:** Add integration tests for business settings flow

**Complexity:** Medium
**Estimated Time:** 3 hours
**Dependencies:** All backend tickets

**Description:**
Write integration tests for the complete business settings flow including logo upload.

**Acceptance Criteria:**
- [ ] Test: GET settings returns business fields
- [ ] Test: PUT settings updates business fields
- [ ] Test: POST logo uploads and stores file
- [ ] Test: DELETE logo removes file and clears path
- [ ] Test: Business snapshot includes all fields
- [ ] Test: Receipt PDF includes logo when set
- [ ] Test: Receipt PDF handles missing logo gracefully

**Files to Create:**
- `backend/src/__tests__/integration/business-settings.test.ts`

---

### Ticket #BIZ-14: E2E Tests

**Title:** Add E2E tests for business settings UI

**Complexity:** Medium
**Estimated Time:** 3 hours
**Dependencies:** All tickets

**Description:**
Write E2E tests using Playwright MCP for the business settings configuration flow.

**Acceptance Criteria:**
- [ ] E2E-BIZ-01: Navigate to Business Info tab
- [ ] E2E-BIZ-02: Update all text fields and save
- [ ] E2E-BIZ-03: Upload logo successfully
- [ ] E2E-BIZ-04: Delete logo
- [ ] E2E-BIZ-05: Validation errors display correctly
- [ ] E2E-BIZ-06: Logo appears on generated receipt
- [ ] E2E-BIZ-07: Legal text appears on generated receipt
- [ ] E2E-BIZ-08: Missing business name shows warning

**Files to Create:**
- `test-files/e2e/business-settings.spec.ts`

---

### Ticket #BIZ-15: Documentation

**Title:** Update documentation for business settings feature

**Complexity:** Low
**Estimated Time:** 2 hours
**Dependencies:** All tickets

**Description:**
Update API documentation and user guide for business settings.

**Acceptance Criteria:**
- [ ] API docs updated with logo endpoints
- [ ] Settings documentation includes business info section
- [ ] User guide for configuring business information
- [ ] Troubleshooting for logo upload issues
- [ ] Update `docs/implementation-plan-receipt-from-payment-modal.md` reference

**Files to Create/Modify:**
- `docs/api/business-settings.md`
- `docs/user-guide/business-settings.md`

---

## 6. Ticket Dependency Graph

```
Ticket #BIZ-1 (DB Schema)
│
├──► Ticket #BIZ-2 (Types)
│    │
│    └──► Ticket #BIZ-5 (Snapshot Service)
│         │
│         └──► Ticket #BIZ-11 (Template Data)
│              │
│              └──► Ticket #BIZ-6 (Template Update)
│                   │
│                   └──► Ticket #BIZ-10 (Invoice Consistency)
│
├──► Ticket #BIZ-3 (Logo Upload Service)
│    │
│    └──► Ticket #BIZ-4 (Settings Handler)
│         │
│         └──► Ticket #BIZ-8 (Logo Upload Component)
│              │
│              └──► Ticket #BIZ-9 (Business Info Tab)
│
├──► Ticket #BIZ-12 (Static Files) [parallel]
│
└──► Ticket #BIZ-7 (Frontend Types) [parallel]
     │
     └──► Ticket #BIZ-8 (Logo Upload Component)

Testing Track:
All Backend Tickets ──► Ticket #BIZ-13 (Integration Tests)
All Tickets ──► Ticket #BIZ-14 (E2E Tests)
All Tickets ──► Ticket #BIZ-15 (Documentation)
```

---

## 7. Edge Case Handling Strategy

### 7.1 Missing or Incomplete Business Profile

| Scenario | Detection | Handling |
|----------|-----------|----------|
| No business name | Null check in handler | Display warning banner in Settings UI, show placeholder "Business Name Not Set" on receipts |
| Missing all fields | All null check | Show "Configure Business Information" prompt in Settings, minimal header on receipt |
| Partial address | Individual null checks | Display available fields, hide missing ones |
| Invalid logo file | File validation | Reject upload with error message, keep existing logo |

### 7.2 Logo File Issues

| Scenario | Detection | Handling |
|----------|-----------|----------|
| File too large | Size check (>2MB) | Reject with clear error message |
| Invalid format | MIME type check | Reject with list of supported formats |
| File deleted externally | Existence check before PDF generation | Log warning, render text-only header |
| Corrupted file | Image processing error | Catch exception, fallback to no logo |

### 7.3 PDF Generation Edge Cases

| Scenario | Detection | Handling |
|----------|-----------|----------|
| Logo URL unreachable | Fetch error | Use placeholder image or skip logo |
| Relative URL in snapshot | URL format check | Convert to absolute URL for PDF |
| Missing legal text | Null check | Skip legal text section entirely |

---

## 8. Data Migration Strategy

### 8.1 Migration Steps

1. **Schema Migration** (Ticket #BIZ-1)
   - Add `businessLogoPath` and `businessLegalText` columns
   - Default values: NULL for both

2. **Data Verification**
   - No existing data to migrate for new fields
   - Verify existing business fields are populated (if applicable)

3. **Rollback Plan**
   ```sql
   ALTER TABLE "Settings" DROP COLUMN "businessLogoPath";
   ALTER TABLE "Settings" DROP COLUMN "businessLegalText";
   ```

### 8.2 Existing Receipt Compatibility

- Existing receipts with businessSnapshot will continue to render correctly
- New fields (logoPath, legalText) will be null in old snapshots
- Template handles null values gracefully

---

## 9. API Specification Additions

### 9.1 Logo Upload Endpoint

```
POST /api/settings/logo
Content-Type: multipart/form-data

Request Body:
  logo: File (PNG, JPG, or SVG, max 2MB)

Response (200 OK):
{
  "success": true,
  "settings": {
    "business": {
      "name": "Business Name",
      "logoPath": "http://192.168.1.70/uploads/logos/logo-1234567890.png",
      ...
    }
  }
}

Response (400 Bad Request):
{
  "error": "INVALID_FILE_TYPE",
  "message": "File type not supported. Please use PNG, JPG, or SVG."
}

Response (400 Bad Request):
{
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds 2MB limit."
}
```

### 9.2 Logo Delete Endpoint

```
DELETE /api/settings/logo

Response (200 OK):
{
  "success": true,
  "settings": {
    "business": {
      "name": "Business Name",
      "logoPath": null,
      ...
    }
  }
}
```

### 9.3 Updated Settings Response

```
GET /api/settings

Response:
{
  "business": {
    "name": "Business Name",
    "address": "123 Main St",
    "city": "City",
    "postalCode": "12345",
    "country": "Country",
    "phone": "+1234567890",
    "email": "info@business.com",
    "vatNumber": "VAT123456",
    "logoPath": "http://192.168.1.70/uploads/logos/logo-1234567890.png",
    "legalText": "Custom legal text for receipts..."
  },
  // ... other settings
}
```

---

## 10. Sprint Planning Recommendation

### Sprint 1: Foundation (4 hours)
- Ticket #BIZ-1: Database Schema Extension (1h)
- Ticket #BIZ-2: Backend Types Extension (1h)
- Ticket #BIZ-7: Frontend Types Extension (1h)
- Ticket #BIZ-12: Static File Serving Configuration (1h)

### Sprint 2: Backend Services (5 hours)
- Ticket #BIZ-3: Logo Upload Service (3h)
- Ticket #BIZ-4: Settings Handler Extension (2h)

### Sprint 3: Snapshot & Templates (4 hours)
- Ticket #BIZ-5: Business Snapshot Service Update (1h)
- Ticket #BIZ-11: prepareReceiptTemplateData Update (1h)
- Ticket #BIZ-6: Receipt Template Update (2h)

### Sprint 4: Frontend UI (7 hours)
- Ticket #BIZ-8: Logo Upload Component (3h)
- Ticket #BIZ-9: Business Info Settings Tab (4h)

### Sprint 5: Consistency & Testing (8 hours)
- Ticket #BIZ-10: Invoice Header Consistency (2h)
- Ticket #BIZ-13: Integration Tests (3h)
- Ticket #BIZ-14: E2E Tests (3h)

### Sprint 6: Documentation (2 hours)
- Ticket #BIZ-15: Documentation (2h)

**Total Estimated Time: 30 hours**

---

## 11. Risk Mitigation Summary

| Risk | Impact | Mitigation |
|------|--------|------------|
| Logo file storage fills up | Medium | Implement file size limits, automatic cleanup of old logos |
| PDF generation performance with large logos | Medium | Enforce 2MB limit, suggest optimal dimensions |
| Logo URL changes between environments | Low | Use relative paths in database, generate full URLs dynamically |
| Browser caching of old logo | Low | Include timestamp in filename, set proper cache headers |
| Existing receipts lose logo if deleted | High | Logo is snapshotted - old receipts unaffected |

---

## 12. Consistency with Receipt-From-Payment-Modal Plan

This implementation plan is designed to integrate seamlessly with the existing `docs/implementation-plan-receipt-from-payment-modal.md`:

| Aspect | Integration Point |
|--------|-------------------|
| Settings infrastructure | Uses same Settings model, extends existing fields |
| Business snapshot | Already referenced in payment modal receipt creation |
| Template system | Same templates used for all receipt generation |
| API patterns | Follows existing settings handler patterns |
| UI consistency | Uses same Settings Modal tabs structure |

### Update to Receipt-From-Payment-Modal Plan

After this implementation, the receipt-from-payment-modal feature will automatically benefit from:
- Complete business information in receipt headers
- Logo rendering on receipts issued from payment modal
- Legal text on all generated receipts
- Proper handling of missing business info

---

## 13. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Security Review | | | |

---

**Document Status:** Pending Approval - No code implementation until approved.
