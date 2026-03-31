# Receipt Invoicing Feature - Implementation Plan

**Document Version:** 1.0  
**Created:** 2026-03-31  
**Status:** Draft  
**Estimated Total Duration:** 10-12 weeks

---

## Executive Summary

This document outlines a phased implementation plan for the receipt invoicing feature, addressing the following key gaps identified in the current system:

1. **No receipt number/invoice sequence** - Missing unique receipt numbering
2. **No customer data model** - Transactions have no customer reference
3. **No business metadata** - No company name, address, VAT number storage
4. **No PDF generation** - Missing PDF library integration
5. **No email system** - No SMTP configuration or email templates
6. **No print templates** - CSS print styles not implemented
7. **Items as JSON blob** - Structured extraction needed for line-item display
8. **No multi-currency support** - EUR-only system
9. **No tax breakdown by item** - Only total tax stored

---

## Phase 1: Database Schema & Business Metadata (Weeks 1-2)

### 1.1 Business Settings Extension

**Objective:** Extend the existing Settings model to include business metadata required for receipts.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 1.1.1 | Add business metadata fields to Settings table | High | 2 days |
| 1.1.2 | Create database migration | High | 1 day |
| 1.1.3 | Update settings API endpoints | High | 1 day |
| 1.1.4 | Create admin UI for business settings | Medium | 2 days |
| 1.1.5 | Add i18n translations for new fields | Medium | 1 day |

**New Settings Fields:**

| Field | Type | Description |
|-------|------|-------------|
| businessName | String | Company name for receipts |
| businessAddress | String | Full street address |
| businessCity | String | City |
| businessPostalCode | String | Postal/ZIP code |
| businessCountry | String | Country |
| businessPhone | String | Contact phone |
| businessEmail | String | Contact email |
| vatNumber | String | VAT/Tax identification number |
| receiptPrefix | String | Receipt number prefix (default: "R") |
| receiptNumberLength | Int | Number padding length (default: 6) |

**Responsible Parties:**
- Backend Developer: Schema design, migration, API endpoints
- Frontend Developer: Admin UI component
- QA: Testing migration rollback scenarios

**Success Metrics:**
- Migration runs successfully on all environments
- Settings API returns and persists all new fields
- Admin UI correctly validates and saves business settings
- All i18n keys present in English and Italian locales

**Potential Pitfalls:**
- **Data integrity:** Existing settings records need proper default values during migration
- **Validation:** VAT number format varies by country - implement country-specific validation

---

### 1.2 Customer Data Model

**Objective:** Create a Customer model for optional customer information on receipts.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 1.2.1 | Design Customer model schema | High | 1 day |
| 1.2.2 | Create database migration | High | 1 day |
| 1.2.3 | Create Customer CRUD API endpoints | High | 2 days |
| 1.2.4 | Add customer search endpoint | Medium | 1 day |
| 1.2.5 | Implement customer selection UI | Medium | 2 days |

**Customer Model Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | Int (auto-increment) | Primary key |
| name | String | Customer full name |
| email | String | Email address (unique, optional) |
| phone | String | Phone number (optional) |
| vatNumber | String | Customer VAT number (optional) |
| address | String | Street address (optional) |
| city | String | City (optional) |
| notes | String | Additional notes (optional) |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Responsible Parties:**
- Backend Developer: Schema design, migration, API endpoints
- Frontend Developer: Customer selection and management UI
- UX Designer: Customer form design

**Success Metrics:**
- Customer CRUD operations work correctly
- Email uniqueness constraint enforced
- Customer search returns paginated results
- Customer selection UI integrates with transaction flow

**Potential Pitfalls:**
- **GDPR Compliance:** Customer data must be deletable; implement soft-delete or anonymization
- **Duplicate detection:** Implement fuzzy matching for name/email to prevent duplicates

---

### 1.3 Receipt Model & Numbering Sequence

**Objective:** Create the Receipt model with unique receipt numbering.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 1.3.1 | Design Receipt model schema | High | 2 days |
| 1.3.2 | Implement receipt number sequence logic | High | 2 days |
| 1.3.3 | Create database migration with indexes | High | 1 day |
| 1.3.4 | Add receipt status enum constraint | Medium | 1 day |
| 1.3.5 | Implement optimistic locking for sequence | High | 1 day |

**Receipt Model Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | Int (auto-increment) | Primary key |
| receiptNumber | String | Unique receipt number (e.g., "R000001") |
| transactionId | Int | Foreign key to Transaction |
| customerId | Int (nullable) | Foreign key to Customer |
| status | Enum | draft, issued, voided, emailed |
| businessSnapshot | JSON | Business metadata at generation time |
| customerSnapshot | JSON | Customer data at generation time |
| subtotal | Decimal | Copied from transaction |
| tax | Decimal | Copied from transaction |
| taxBreakdown | JSON | Tax breakdown by rate |
| discount | Decimal | Copied from transaction |
| discountReason | String | Discount explanation |
| tip | Decimal | Copied from transaction |
| total | Decimal | Copied from transaction |
| paymentMethod | String | Copied from transaction |
| notes | String | Additional receipt notes |
| pdfPath | String | Path to stored PDF file |
| issuedAt | DateTime | When receipt was issued |
| emailedAt | DateTime | When receipt was emailed |
| emailRecipient | String | Email address for delivery |
| emailStatus | Enum | pending, sent, failed, bounced |
| createdBy | Int | User who created receipt |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| voidedAt | DateTime | When receipt was voided |
| voidReason | String | Reason for voiding |
| voidedBy | Int | User who voided receipt |

**Responsible Parties:**
- Backend Developer: Schema design, sequence logic, migration
- Database Administrator: Index optimization, sequence locking review

**Success Metrics:**
- Receipt numbers are sequential and gap-free within business year
- Concurrent receipt creation does not produce duplicate numbers
- All snapshots correctly capture data at generation time
- Indexes support efficient queries by transaction, customer, date range

**Potential Pitfalls:**
- **Sequence gaps:** Never delete receipts; use voiding to maintain audit trail
- **Year boundaries:** Decide if sequence resets annually (requires year in receipt number)
- **Concurrency:** Use database-level advisory locks for sequence generation

---

## Phase 2: PDF Generation Infrastructure (Weeks 3-4)

### 2.1 PDF Library Integration

**Objective:** Integrate a server-side PDF generation library.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 2.1.1 | Evaluate PDF libraries (PDFKit, Puppeteer, Handlebars-PDF) | High | 1 day |
| 2.1.2 | Install and configure selected library | High | 1 day |
| 2.1.3 | Create PDF service module | High | 2 days |
| 2.1.4 | Implement receipt template engine | High | 3 days |
| 2.1.5 | Add font and asset management | Medium | 1 day |

**Library Evaluation Criteria:**

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| PDFKit | Pure JS, no dependencies, fast | Manual layout, limited styling | Good for simple receipts |
| Puppeteer | Full CSS support, HTML templates | Heavy, requires Chrome, slower | Best for complex layouts |
| Handlebars-PDF | Template-based, moderate weight | Less flexible for dynamic content | Good balance |

**Recommended Approach:** Use **Puppeteer** with HTML templates for flexibility in layout and styling, with caching for generated PDFs to offset performance cost.

**Responsible Parties:**
- Backend Developer: Library integration, PDF service
- UX Designer: Receipt visual design
- DevOps: Font and asset deployment

**Success Metrics:**
- PDF generation completes within 5 seconds for standard receipts
- Generated PDFs render correctly on major PDF readers
- Font licensing compliant with commercial use
- Memory usage stays within 512MB per generation

**Potential Pitfalls:**
- **Performance:** Puppeteer has startup cost; implement worker pool or serverless function
- **Fonts:** Ensure fonts are embedded with proper licensing
- **Memory leaks:** Properly close Puppeteer instances after generation

---

### 2.2 Receipt Template Design

**Objective:** Create professional, customizable receipt templates.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 2.2.1 | Design receipt layout mockups | High | 2 days |
| 2.2.2 | Create HTML/CSS template | High | 3 days |
| 2.2.3 | Implement dynamic data binding | High | 2 days |
| 2.2.4 | Add multi-language template support | Medium | 2 days |
| 2.2.5 | Create print-optimized CSS | Medium | 1 day |

**Template Sections:**

| Section | Content | Dynamic Elements |
|---------|---------|------------------|
| Header | Logo, business name, address | Business settings snapshot |
| Receipt Info | Number, date, time | Receipt metadata |
| Customer | Name, VAT, address | Customer snapshot |
| Line Items | Product, quantity, unit price, total | Transaction items array |
| Totals | Subtotal, tax breakdown, discount, tip, total | Calculated values |
| Footer | Payment method, notes, legal text | Settings, user input |

**Responsible Parties:**
- UX Designer: Visual design, layout
- Frontend Developer: HTML/CSS template
- Backend Developer: Template engine integration

**Success Metrics:**
- Templates render correctly for receipts with 1-50 line items
- Multi-language templates switch based on system locale
- Print CSS produces clean output without navigation elements
- Template versioning allows regeneration with original format

**Potential Pitfalls:**
- **Long line items:** Truncate or wrap long product names
- **Page breaks:** Implement proper pagination with repeating headers
- **Currency formatting:** Ensure consistent decimal places and symbols

---

### 2.3 PDF Storage & Retrieval

**Objective:** Implement PDF file storage and retrieval system.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 2.3.1 | Design PDF storage structure | High | 1 day |
| 2.3.2 | Implement file storage service | High | 2 days |
| 2.3.3 | Create PDF retrieval API | High | 1 day |
| 2.3.4 | Add file cleanup/archival logic | Medium | 1 day |
| 2.3.5 | Implement PDF regeneration | Medium | 2 days |

**Storage Structure:**

```
/receipts/
  /2026/
    /03/
      /R000001.pdf
      /R000002.pdf
    /04/
      /R000003.pdf
```

**Responsible Parties:**
- Backend Developer: Storage service, retrieval API
- DevOps: Storage volume configuration, backup strategy

**Success Metrics:**
- PDFs stored with unique paths
- Retrieval API returns correct content-type headers
- File permissions restrict access to application user only
- Backup includes receipt PDFs

**Potential Pitfalls:**
- **Disk space:** Monitor storage growth; implement archival for old receipts
- **Path traversal:** Validate and sanitize all file path parameters
- **Orphaned files:** Clean up PDFs when receipt is voided (optional)

---

## Phase 3: Email System Infrastructure (Weeks 5-6)

### 3.1 SMTP Configuration

**Objective:** Configure email sending infrastructure.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 3.1.1 | Evaluate email providers (SMTP, SendGrid, Mailgun) | High | 1 day |
| 3.1.2 | Install and configure Nodemailer | High | 1 day |
| 3.1.3 | Create email configuration module | High | 2 days |
| 3.1.4 | Add SMTP settings to environment | High | 1 day |
| 3.1.5 | Implement connection testing | Medium | 1 day |

**Configuration Fields:**

| Field | Environment Variable | Description |
|-------|---------------------|-------------|
| Host | SMTP_HOST | SMTP server hostname |
| Port | SMTP_PORT | SMTP server port (587, 465, 25) |
| User | SMTP_USER | Authentication username |
| Password | SMTP_PASSWORD | Authentication password |
| From Address | SMTP_FROM | Default sender address |
| From Name | SMTP_FROM_NAME | Sender display name |
| Secure | SMTP_SECURE | Use TLS (true for port 465) |

**Responsible Parties:**
- Backend Developer: Configuration module, Nodemailer setup
- DevOps: Secret management, SMTP provider setup
- Security: Credential storage review

**Success Metrics:**
- SMTP connection tested at application startup
- Connection failures logged with actionable error messages
- Credentials stored securely (not in version control)
- Test email sent successfully from all environments

**Potential Pitfalls:**
- **Provider limits:** Check daily/hourly sending limits
- **IP reputation:** Use dedicated IP for high volume
- **Authentication:** Some providers require app-specific passwords

---

### 3.2 Email Templates

**Objective:** Create email templates for receipt delivery.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 3.2.1 | Design email layout mockups | High | 1 day |
| 3.2.2 | Create HTML email template | High | 2 days |
| 3.2.3 | Create plain text fallback | Medium | 1 day |
| 3.2.4 | Implement i18n for email content | High | 2 days |
| 3.2.5 | Add template preview functionality | Low | 2 days |

**Email Template Elements:**

| Element | Content | Localized |
|---------|---------|-----------|
| Subject | Receipt #R000001 from Business Name | Yes |
| Header | Business logo and name | No |
| Greeting | Dear Customer Name, | Yes |
| Body | Your receipt is attached... | Yes |
| Summary | Total: EUR XX.XX | No |
| Footer | Contact information, unsubscribe | Yes |

**Responsible Parties:**
- Backend Developer: Template engine integration
- UX Designer: Email visual design
- Marketing: Email copy review

**Success Metrics:**
- Email templates render correctly in major email clients
- Plain text fallback provides complete information
- All text content properly localized
- Spam score below 3.0 on email testing services

**Potential Pitfalls:**
- **CSS support:** Email clients have limited CSS support; use inline styles
- **Images:** Host images on CDN; use absolute URLs
- **Dark mode:** Test templates in dark mode email clients

---

### 3.3 Email Queue & Retry System

**Objective:** Implement reliable email delivery with retry logic.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 3.3.1 | Design email queue schema | High | 1 day |
| 3.3.2 | Implement job queue (BullMQ or similar) | High | 2 days |
| 3.3.3 | Create email worker process | High | 2 days |
| 3.3.4 | Implement exponential backoff retry | High | 2 days |
| 3.3.5 | Add delivery status tracking | Medium | 2 days |

**Email Job Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Job identifier |
| receiptId | Int | Associated receipt |
| recipientEmail | String | Destination email |
| subject | String | Email subject |
| htmlContent | String | HTML body |
| textContent | String | Plain text body |
| attachments | JSON | PDF attachment info |
| status | Enum | pending, processing, sent, failed |
| attempts | Int | Number of send attempts |
| maxAttempts | Int | Maximum retries (default: 5) |
| nextAttemptAt | DateTime | Next retry time |
| lastError | String | Last error message |
| sentAt | DateTime | Successful delivery time |

**Retry Schedule (Exponential Backoff):**

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 1 hour |
| 5 | 6 hours |

**Responsible Parties:**
- Backend Developer: Queue implementation, worker process
- DevOps: Worker deployment, monitoring

**Success Metrics:**
- 99% of emails delivered within retry window
- Failed emails logged with actionable error messages
- Worker processes recover gracefully from crashes
- Queue monitoring dashboard available

**Potential Pitfalls:**
- **Queue persistence:** Use Redis with persistence for queue storage
- **Duplicate sends:** Implement idempotency for email jobs
- **Rate limiting:** Respect SMTP provider rate limits

---

## Phase 4: Backend API Development (Weeks 7-8)

### 4.1 Receipt CRUD Endpoints

**Objective:** Implement RESTful API endpoints for receipt management.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 4.1.1 | Create receipts router module | High | 1 day |
| 4.1.2 | Implement POST /api/receipts (create) | High | 2 days |
| 4.1.3 | Implement GET /api/receipts (list) | High | 1 day |
| 4.1.4 | Implement GET /api/receipts/:id (single) | High | 1 day |
| 4.1.5 | Implement PUT /api/receipts/:id (update) | Medium | 1 day |
| 4.1.6 | Implement POST /api/receipts/:id/void | High | 1 day |
| 4.1.7 | Implement POST /api/receipts/:id/email | High | 2 days |
| 4.1.8 | Implement GET /api/receipts/:id/pdf | High | 1 day |

**API Endpoint Details:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/receipts | POST | Admin/Cashier | Create new receipt from transaction |
| /api/receipts | GET | Admin/Cashier | List receipts with filters |
| /api/receipts/:id | GET | Admin/Cashier | Get single receipt details |
| /api/receipts/:id | PUT | Admin | Update draft receipt |
| /api/receipts/:id/void | POST | Admin | Void an issued receipt |
| /api/receipts/:id/email | POST | Admin/Cashier | Send receipt via email |
| /api/receipts/:id/pdf | GET | Admin/Cashier | Download PDF file |
| /api/receipts/number/:number | GET | Admin/Cashier | Get receipt by number |

**Responsible Parties:**
- Backend Developer: API implementation
- Security: Authorization review

**Success Metrics:**
- All endpoints return correct HTTP status codes
- Authorization enforced on all endpoints
- Request validation catches malformed inputs
- API documentation generated (OpenAPI/Swagger)

**Potential Pitfalls:**
- **Large responses:** Implement pagination for list endpoint
- **N+1 queries:** Use Prisma includes for related data
- **Rate limiting:** Apply rate limiting to email endpoint

---

### 4.2 Tax Breakdown Calculation

**Objective:** Implement per-item tax breakdown for receipts.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 4.2.1 | Analyze existing tax calculation logic | High | 1 day |
| 4.2.2 | Design tax breakdown data structure | High | 1 day |
| 4.2.3 | Implement tax breakdown calculation | High | 2 days |
| 4.2.4 | Add tax breakdown to receipt data | High | 1 day |
| 4.2.5 | Update PDF template for tax display | Medium | 1 day |

**Tax Breakdown Structure:**

```json
{
  "taxBreakdown": [
    {
      "rateName": "Standard",
      "ratePercent": 22,
      "taxableAmount": 100.00,
      "taxAmount": 22.00
    },
    {
      "rateName": "Reduced",
      "ratePercent": 10,
      "taxableAmount": 50.00,
      "taxAmount": 5.00
    }
  ],
  "totalTax": 27.00
}
```

**Responsible Parties:**
- Backend Developer: Tax calculation logic
- Finance: Tax display requirements review

**Success Metrics:**
- Tax breakdown totals match transaction total tax
- Handles exclusive, inclusive, and no-tax modes
- Rounding errors are within 0.01 EUR
- PDF displays tax breakdown in compliant format

**Potential Pitfalls:**
- **Rounding:** Use precise decimal arithmetic (not floating point)
- **Mixed rates:** Handle items with different tax rates correctly
- **Display format:** Follow local tax authority requirements

---

### 4.3 Receipt Audit Logging

**Objective:** Implement comprehensive audit trail for receipt operations.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 4.3.1 | Create ReceiptAuditLog model | High | 1 day |
| 4.3.2 | Implement audit logging middleware | High | 1 day |
| 4.3.3 | Add audit log query endpoints | Medium | 1 day |
| 4.3.4 | Create audit log export functionality | Low | 1 day |

**Audit Log Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| receiptId | Int | Associated receipt |
| action | Enum | create, issue, email, void, regenerate |
| oldValues | JSON | Previous values (for updates) |
| newValues | JSON | New values |
| userId | Int | User who performed action |
| userName | String | User name at time of action |
| ipAddress | String | Client IP address |
| userAgent | String | Client user agent |
| createdAt | DateTime | Action timestamp |

**Responsible Parties:**
- Backend Developer: Audit implementation
- Compliance: Audit requirements review

**Success Metrics:**
- All receipt operations logged with complete context
- Audit logs immutable (append-only)
- Query performance acceptable for 1 year of data
- Export generates compliant report format

**Potential Pitfalls:**
- **Storage growth:** Implement log archival after 7 years
- **Sensitive data:** Mask email addresses in logs if required
- **Time zones:** Store all timestamps in UTC

---

## Phase 5: Frontend Development (Weeks 9-10)

### 5.1 Receipt Generation UI

**Objective:** Create user interface for generating receipts from transactions.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 5.1.1 | Add "Generate Receipt" button to TransactionHistory | High | 1 day |
| 5.1.2 | Create ReceiptForm component | High | 2 days |
| 5.1.3 | Implement customer selection modal | High | 2 days |
| 5.1.4 | Add receipt preview functionality | Medium | 2 days |
| 5.1.5 | Create receipt generation confirmation flow | High | 1 day |

**UI Components:**

| Component | Description |
|-----------|-------------|
| ReceiptGenerationButton | Trigger in transaction detail view |
| ReceiptForm | Form for customer info, notes, email |
| CustomerSearchModal | Search/select existing customer |
| CustomerForm | New customer creation form |
| ReceiptPreview | Preview PDF before issuing |
| ReceiptConfirmation | Success/error feedback |

**Responsible Parties:**
- Frontend Developer: Component implementation
- UX Designer: User flow design, wireframes
- QA: User flow testing

**Success Metrics:**
- Receipt generation completes within 3 clicks from transaction view
- Form validation provides clear error messages
- Preview displays accurate PDF representation
- Confirmation shows receipt number and download link

**Potential Pitfalls:**
- **Mobile responsiveness:** Ensure modal works on tablet/mobile devices
- **Keyboard navigation:** Support full keyboard workflow
- **Loading states:** Show progress during PDF generation

---

### 5.2 Receipt Management UI

**Objective:** Create interface for viewing, searching, and managing receipts.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 5.2.1 | Create ReceiptList component | High | 2 days |
| 5.2.2 | Implement filtering and search | High | 2 days |
| 5.2.3 | Create ReceiptDetail component | High | 2 days |
| 5.2.4 | Add receipt voiding flow | High | 1 day |
| 5.2.5 | Implement receipt resend functionality | Medium | 1 day |

**Receipt List Features:**

| Feature | Description |
|---------|-------------|
| Date range filter | Filter by issue date |
| Status filter | Filter by draft, issued, voided |
| Customer search | Search by customer name/email |
| Receipt number search | Direct lookup by number |
| Pagination | 20 receipts per page |
| Export | CSV/Excel export of filtered results |

**Responsible Parties:**
- Frontend Developer: Component implementation
- UX Designer: List view design
- QA: Filter and search testing

**Success Metrics:**
- List loads within 2 seconds with 1000+ receipts
- Filters apply correctly in combination
- Voiding requires confirmation with reason
- Resend shows previous delivery history

**Potential Pitfalls:**
- **Performance:** Implement virtual scrolling for large lists
- **State management:** Preserve filters when navigating to detail view
- **Accessibility:** Ensure screen reader compatibility

---

### 5.3 Print & Download Integration

**Objective:** Enable printing and downloading of receipts.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 5.3.1 | Implement PDF download button | High | 1 day |
| 5.3.2 | Add print-optimized view | High | 2 days |
| 5.3.3 | Configure print CSS styles | Medium | 1 day |
| 5.3.4 | Add batch download functionality | Low | 2 days |

**Print Features:**

| Feature | Description |
|---------|-------------|
| Print preview | Show print-optimized layout |
| Paper size | A4 and Letter support |
| Orientation | Portrait (default) |
| Margins | Standard receipt margins |
| Header/Footer | Optional page numbers |

**Responsible Parties:**
- Frontend Developer: Print implementation
- UX Designer: Print layout design
- QA: Cross-browser print testing

**Success Metrics:**
- PDF downloads with correct filename (receipt number)
- Print preview matches printed output
- Print works on Chrome, Firefox, Safari, Edge
- Batch download creates ZIP archive

**Potential Pitfalls:**
- **Browser differences:** Test print on all supported browsers
- **Mobile print:** Handle mobile print dialogs
- **Large receipts:** Ensure multi-page receipts print correctly

---

## Phase 6: Testing & Security Review (Weeks 11-12)

### 6.1 End-to-End Testing

**Objective:** Comprehensive testing of complete receipt workflow.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 6.1.1 | Create E2E test suite for receipt generation | High | 2 days |
| 6.1.2 | Test email delivery workflow | High | 2 days |
| 6.1.3 | Test receipt voiding and audit trail | High | 1 day |
| 6.1.4 | Test concurrent receipt creation | High | 1 day |
| 6.1.5 | Test PDF regeneration | Medium | 1 day |

**Test Scenarios:**

| Scenario | Description |
|----------|-------------|
| Happy path | Create, preview, issue, email receipt |
| Customer creation | New customer during receipt creation |
| Existing customer | Select from customer search |
| Receipt voiding | Void with reason, verify audit log |
| Email failure | Handle SMTP errors gracefully |
| Concurrent creation | Multiple users creating receipts simultaneously |
| Large transaction | Receipt with 50+ line items |
| Special characters | Product names with special characters |
| Multi-language | Receipt in different locale |

**Responsible Parties:**
- QA Lead: Test planning, execution
- Backend Developer: Test fixtures, mock services
- Frontend Developer: Test data setup

**Success Metrics:**
- 100% of critical paths tested
- All E2E tests pass in CI pipeline
- No regression in existing functionality
- Test coverage above 80% for new code

**Potential Pitfalls:**
- **Test data:** Create realistic test transactions
- **Email mocking:** Use mock SMTP server for tests
- **PDF comparison:** Implement visual regression testing

---

### 6.2 Security Review

**Objective:** Security audit of receipt functionality.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 6.2.1 | Review authentication and authorization | High | 1 day |
| 6.2.2 | Audit PDF generation for injection vulnerabilities | High | 1 day |
| 6.2.3 | Review email content sanitization | High | 1 day |
| 6.2.4 | Test file path traversal prevention | High | 1 day |
| 6.2.5 | Review audit log integrity | Medium | 1 day |
| 6.2.6 | Penetration testing on receipt endpoints | High | 2 days |

**Security Checklist:**

| Area | Check |
|------|-------|
| Authentication | JWT validation on all endpoints |
| Authorization | Role-based access control enforced |
| Input validation | All user inputs sanitized |
| PDF injection | No HTML injection in PDF content |
| Email injection | Header injection prevention |
| Path traversal | Validated file paths for PDFs |
| Rate limiting | Email endpoint rate limited |
| Data exposure | No sensitive data in error messages |

**Responsible Parties:**
- Security Lead: Security review
- Backend Developer: Vulnerability remediation
- External: Penetration testing (optional)

**Success Metrics:**
- No critical or high vulnerabilities found
- All medium vulnerabilities addressed or documented
- Security review signed off
- Penetration test report clean

**Potential Pitfalls:**
- **PDF metadata:** Ensure no sensitive data in PDF metadata
- **Email headers:** Sanitize all email header values
- **Error messages:** Generic error messages to users, detailed in logs

---

### 6.3 Performance Optimization

**Objective:** Optimize receipt system for production load.

**Actions:**

| Action ID | Description | Priority | Est. Time |
|-----------|-------------|----------|-----------|
| 6.3.1 | Load test receipt generation | High | 1 day |
| 6.3.2 | Optimize database queries | High | 2 days |
| 6.3.3 | Implement caching strategy | Medium | 1 day |
| 6.3.4 | Tune PDF generation performance | Medium | 1 day |
| 6.3.5 | Monitor and alerting setup | High | 1 day |

**Performance Targets:**

| Metric | Target |
|--------|--------|
| Receipt creation API response | < 500ms |
| PDF generation time | < 5 seconds |
| Email queue processing | < 30 seconds |
| List API response (1000 receipts) | < 2 seconds |
| Concurrent PDF generations | 10 simultaneous |

**Responsible Parties:**
- Backend Developer: Performance optimization
- DevOps: Load testing infrastructure, monitoring
- Database Administrator: Query optimization, indexing

**Success Metrics:**
- All performance targets met under expected load
- No memory leaks in PDF generation
- Database queries use proper indexes
- Monitoring dashboards show real-time metrics

**Potential Pitfalls:**
- **Memory usage:** Monitor memory during PDF generation
- **Database locks:** Check for lock contention during sequence generation
- **Queue backlog:** Set up alerts for queue depth

---

## Rollout Plan

### Staged Deployment

| Stage | Environment | Duration | Success Criteria |
|-------|-------------|----------|------------------|
| 1 | Development | Week 1-10 | All features implemented |
| 2 | Staging | Week 11 | E2E tests pass |
| 3 | Beta (limited users) | Week 12-13 | User feedback positive |
| 4 | Production | Week 14 | Full rollout |

### Rollback Strategy

1. **Feature flags:** Implement feature flags to disable receipt functionality
2. **Database migrations:** All migrations reversible
3. **Configuration rollback:** SMTP settings can be disabled
4. **PDF storage:** Receipts without PDFs still queryable

---

## Resource Allocation

### Team Requirements

| Role | Allocation | Duration |
|------|------------|----------|
| Backend Developer | 100% | 12 weeks |
| Frontend Developer | 100% | 8 weeks |
| UX Designer | 50% | 6 weeks |
| QA Engineer | 100% | 4 weeks |
| DevOps Engineer | 25% | 12 weeks |
| Security Lead | 25% | 4 weeks |
| Project Manager | 25% | 12 weeks |

### Infrastructure Requirements

| Resource | Purpose |
|----------|---------|
| SMTP Service | Email delivery (external provider) |
| Storage Volume | PDF file storage (50GB initial) |
| Redis | Email queue backend |
| Monitoring | APM for performance tracking |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SMTP provider limits exceeded | Medium | High | Monitor usage, implement sending quotas |
| PDF generation performance issues | Medium | Medium | Worker pool, caching, async processing |
| Receipt number conflicts | Low | High | Database-level locking, advisory locks |
| Email deliverability issues | Medium | Medium | SPF/DKIM setup, sender reputation monitoring |
| Storage growth exceeds capacity | Low | Medium | Archival policy, storage monitoring |
| Tax compliance requirements change | Low | High | Flexible template system, legal review |
| Third-party library vulnerabilities | Medium | High | Regular dependency audits, security patches |

---

## Success Metrics Summary

| Category | Metric | Target |
|----------|--------|--------|
| Functionality | All features implemented | 100% |
| Quality | E2E test pass rate | 100% |
| Performance | Receipt creation response time | < 500ms |
| Reliability | Email delivery success rate | > 99% |
| Security | Critical vulnerabilities | 0 |
| User satisfaction | Beta user feedback score | > 4/5 |
| Compliance | Tax authority requirements met | Yes |

---

## Appendix A: Database Schema Changes

All schema changes will be implemented as Prisma migrations with rollback support. Each migration will be reviewed by the database administrator before deployment.

---

### A.1 Complete Database Schema

#### A.1.1 Extended Settings Table

```sql
-- Settings table extensions for business metadata
-- Applied via migration: 20260401000000_add_business_metadata_to_settings

-- Table: settings (extensions)
-- Description: Extends existing settings table with business metadata for receipts

-- New columns added:
-- business_name          TEXT                           -- Company legal name
-- business_address       TEXT                           -- Street address
-- business_city          TEXT                           -- City
-- business_postal_code   TEXT                           -- Postal/ZIP code
-- business_country       TEXT                           -- Country code (ISO 3166-1 alpha-2)
-- business_phone         TEXT                           -- Contact phone number
-- business_email         TEXT                           -- Contact email address
-- vat_number             TEXT                           -- VAT/Tax identification number
-- receipt_prefix         TEXT        DEFAULT 'R'        -- Receipt number prefix
-- receipt_number_length  INTEGER     DEFAULT 6          -- Number padding length
-- receipt_start_number   INTEGER     DEFAULT 1          -- Starting receipt number
-- receipt_sequence_year  BOOLEAN     DEFAULT false      -- Reset sequence yearly
-- receipt_current_year   INTEGER                        -- Current year for sequence
-- receipt_current_number INTEGER     DEFAULT 0          -- Current sequence number
-- email_smtp_host        TEXT                           -- SMTP server hostname
-- email_smtp_port        INTEGER     DEFAULT 587        -- SMTP server port
-- email_smtp_user        TEXT                           -- SMTP authentication user
-- email_smtp_password    TEXT                           -- SMTP authentication password
-- email_from_address     TEXT                           -- Default sender address
-- email_from_name        TEXT                           -- Sender display name
-- email_smtp_secure      BOOLEAN     DEFAULT false      -- Use TLS
-- email_enabled          BOOLEAN     DEFAULT false      -- Email functionality enabled

-- Constraints:
-- receipt_number_length must be between 1 and 10
-- receipt_start_number must be >= 1
-- vat_number format validation via application logic
```

#### A.1.2 Customers Table

```sql
-- Table: customers
-- Description: Stores customer information for receipts

CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vat_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Indexes for customers table
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email") 
    WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "customers_phone_idx" ON "customers"("phone") 
    WHERE "phone" IS NOT NULL;
CREATE INDEX "customers_vat_number_idx" ON "customers"("vat_number") 
    WHERE "vat_number" IS NOT NULL;
CREATE INDEX "customers_active_idx" ON "customers"("is_active") 
    WHERE "deleted_at" IS NULL;
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- Foreign key constraint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "customers" IS 'Customer records for receipt generation';
COMMENT ON COLUMN "customers"."vat_number" IS 'Customer VAT/Tax identification number';
COMMENT ON COLUMN "customers"."deleted_at" IS 'Soft delete timestamp (GDPR compliance)';
```

#### A.1.3 Receipts Table

```sql
-- Table: receipts
-- Description: Stores receipt records linked to transactions

CREATE TYPE "receipt_status" AS ENUM ('draft', 'issued', 'voided', 'emailed');

CREATE TYPE "email_status" AS ENUM ('pending', 'sent', 'failed', 'bounced');

CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "status" "receipt_status" NOT NULL DEFAULT 'draft',
    
    -- Business snapshot (JSON)
    "business_snapshot" JSONB NOT NULL,
    
    -- Customer snapshot (JSON)
    "customer_snapshot" JSONB,
    
    -- Financial data copies
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "tax_breakdown" JSONB,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    
    -- Items snapshot
    "items_snapshot" JSONB NOT NULL,
    
    -- Additional information
    "notes" TEXT,
    "internal_notes" TEXT,
    
    -- PDF file reference
    "pdf_path" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    
    -- Issue tracking
    "issued_at" TIMESTAMP(3),
    "issued_by" INTEGER NOT NULL,
    
    -- Email tracking
    "emailed_at" TIMESTAMP(3),
    "email_recipient" TEXT,
    "email_status" "email_status",
    "email_error_message" TEXT,
    "email_attempts" INTEGER DEFAULT 0,
    
    -- Void tracking
    "voided_at" TIMESTAMP(3),
    "void_reason" TEXT,
    "voided_by" INTEGER,
    
    -- Audit fields
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    -- Version for optimistic locking
    "version" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- Indexes for receipts table
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");
CREATE INDEX "receipts_customer_id_idx" ON "receipts"("customer_id");
CREATE INDEX "receipts_status_idx" ON "receipts"("status");
CREATE INDEX "receipts_issued_at_idx" ON "receipts"("issued_at");
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");
CREATE INDEX "receipts_email_status_idx" ON "receipts"("email_status")
    WHERE "email_status" IS NOT NULL;
CREATE INDEX "receipts_email_recipient_idx" ON "receipts"("email_recipient")
    WHERE "email_recipient" IS NOT NULL;

-- Foreign key constraints
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_fkey"
    FOREIGN KEY ("issued_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_voided_by_fkey"
    FOREIGN KEY ("voided_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "receipts" IS 'Receipt records for transactions';
COMMENT ON COLUMN "receipts"."business_snapshot" IS 'Business metadata at generation time';
COMMENT ON COLUMN "receipts"."customer_snapshot" IS 'Customer data at generation time';
COMMENT ON COLUMN "receipts"."tax_breakdown" IS 'Tax breakdown by rate';
COMMENT ON COLUMN "receipts"."items_snapshot" IS 'Transaction items at generation time';
COMMENT ON COLUMN "receipts"."version" IS 'Optimistic locking version';
```

#### A.1.4 Receipt Audit Logs Table

```sql
-- Table: receipt_audit_logs
-- Description: Audit trail for all receipt operations

CREATE TYPE "receipt_audit_action" AS ENUM (
    'create', 
    'issue', 
    'email', 
    'email_retry',
    'void', 
    'regenerate_pdf',
    'update'
);

CREATE TABLE "receipt_audit_logs" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "action" "receipt_audit_action" NOT NULL,
    
    -- Data snapshots
    "old_values" JSONB,
    "new_values" JSONB,
    
    -- Actor information
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    
    -- Request context
    "ip_address" TEXT,
    "user_agent" TEXT,
    
    -- Timestamp
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "receipt_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for receipt_audit_logs table
CREATE INDEX "receipt_audit_logs_receipt_id_idx" ON "receipt_audit_logs"("receipt_id");
CREATE INDEX "receipt_audit_logs_action_idx" ON "receipt_audit_logs"("action");
CREATE INDEX "receipt_audit_logs_user_id_idx" ON "receipt_audit_logs"("user_id");
CREATE INDEX "receipt_audit_logs_created_at_idx" ON "receipt_audit_logs"("created_at");

-- Foreign key constraint
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_receipt_id_fkey"
    FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "receipt_audit_logs" IS 'Immutable audit log for receipt operations';
```

#### A.1.5 Email Queue Table

```sql
-- Table: email_queue
-- Description: Queue for asynchronous email delivery

CREATE TYPE "email_job_status" AS ENUM (
    'pending', 
    'processing', 
    'sent', 
    'failed', 
    'cancelled'
);

CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,  -- UUID
    "receipt_id" INTEGER NOT NULL,
    
    -- Email content
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    
    -- Attachment reference
    "attachment_path" TEXT,
    "attachment_filename" TEXT,
    
    -- Job status
    "status" "email_job_status" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    
    -- Retry configuration
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    
    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- Indexes for email_queue table
CREATE INDEX "email_queue_status_priority_idx" ON "email_queue"("status", "priority" DESC);
CREATE INDEX "email_queue_next_attempt_idx" ON "email_queue"("next_attempt_at")
    WHERE "status" = 'pending' OR "status" = 'processing';
CREATE INDEX "email_queue_receipt_id_idx" ON "email_queue"("receipt_id");
CREATE INDEX "email_queue_created_at_idx" ON "email_queue"("created_at");

-- Foreign key constraint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_receipt_id_fkey"
    FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "email_queue" IS 'Asynchronous email delivery queue';
COMMENT ON COLUMN "email_queue"."priority" IS 'Higher priority jobs processed first';
```

---

### A.2 Migration Scripts (Ordered)

#### Migration A.2.1: Add Business Metadata to Settings

**File:** `backend/prisma/migrations/20260401000000_add_business_metadata_to_settings/migration.sql`

```sql
-- Migration: Add Business Metadata to Settings
-- Version: 20260401000000
-- Description: Extends settings table with business metadata for receipt generation

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Add business information columns
ALTER TABLE "settings" ADD COLUMN "business_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_address" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_city" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_postal_code" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_country" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_phone" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_email" TEXT;
ALTER TABLE "settings" ADD COLUMN "vat_number" TEXT;

-- Add receipt configuration columns
ALTER TABLE "settings" ADD COLUMN "receipt_prefix" TEXT DEFAULT 'R';
ALTER TABLE "settings" ADD COLUMN "receipt_number_length" INTEGER DEFAULT 6;
ALTER TABLE "settings" ADD COLUMN "receipt_start_number" INTEGER DEFAULT 1;
ALTER TABLE "settings" ADD COLUMN "receipt_sequence_year" BOOLEAN DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "receipt_current_year" INTEGER;
ALTER TABLE "settings" ADD COLUMN "receipt_current_number" INTEGER DEFAULT 0;

-- Add email configuration columns
ALTER TABLE "settings" ADD COLUMN "email_smtp_host" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_port" INTEGER DEFAULT 587;
ALTER TABLE "settings" ADD COLUMN "email_smtp_user" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_password" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_from_address" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_from_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_secure" BOOLEAN DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "email_enabled" BOOLEAN DEFAULT false;

-- Set current year for existing records
UPDATE "settings" SET "receipt_current_year" = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::INTEGER
    WHERE "receipt_current_year" IS NULL;

-- Add check constraints
ALTER TABLE "settings" ADD CONSTRAINT "settings_receipt_number_length_check"
    CHECK ("receipt_number_length" >= 1 AND "receipt_number_length" <= 10);

ALTER TABLE "settings" ADD CONSTRAINT "settings_receipt_start_number_check"
    CHECK ("receipt_start_number" >= 1);

ALTER TABLE "settings" ADD CONSTRAINT "settings_receipt_current_number_check"
    CHECK ("receipt_current_number" >= 0);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS "settings_receipt_current_year_idx" ON "settings"("receipt_current_year");

-- Comments for documentation
COMMENT ON COLUMN "settings"."business_name" IS 'Company legal name for receipts';
COMMENT ON COLUMN "settings"."vat_number" IS 'VAT/Tax identification number';
COMMENT ON COLUMN "settings"."receipt_prefix" IS 'Receipt number prefix (e.g., R for R000001)';
COMMENT ON COLUMN "settings"."receipt_number_length" IS 'Zero-padding length for receipt numbers';
COMMENT ON COLUMN "settings"."receipt_sequence_year" IS 'Whether to reset sequence annually';
COMMENT ON COLUMN "settings"."email_smtp_secure" IS 'Use TLS for SMTP connection';
```

**Rollback Script:**

```sql
-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- Drop check constraints
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_receipt_number_length_check";
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_receipt_start_number_check";
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_receipt_current_number_check";

-- Drop index
DROP INDEX IF EXISTS "settings_receipt_current_year_idx";

-- Remove business information columns
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_name";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_address";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_city";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_postal_code";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_country";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_phone";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "business_email";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "vat_number";

-- Remove receipt configuration columns
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_prefix";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_number_length";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_start_number";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_sequence_year";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_current_year";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "receipt_current_number";

-- Remove email configuration columns
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_smtp_host";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_smtp_port";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_smtp_user";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_smtp_password";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_from_address";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_from_name";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_smtp_secure";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "email_enabled";
```

---

#### Migration A.2.2: Create Customers Table

**File:** `backend/prisma/migrations/20260401010000_create_customers_table/migration.sql`

```sql
-- Migration: Create Customers Table
-- Version: 20260401010000
-- Description: Creates customers table for receipt customer information

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create customers table
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vat_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Create unique partial index for email (nullable, soft-delete aware)
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email")
    WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;

-- Create indexes for search and filtering
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "customers_phone_idx" ON "customers"("phone")
    WHERE "phone" IS NOT NULL;
CREATE INDEX "customers_vat_number_idx" ON "customers"("vat_number")
    WHERE "vat_number" IS NOT NULL;
CREATE INDEX "customers_active_idx" ON "customers"("is_active")
    WHERE "deleted_at" IS NULL;
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- Add foreign key constraint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add check constraint for email format (basic validation)
ALTER TABLE "customers" ADD CONSTRAINT "customers_email_check"
    CHECK ("email" IS NULL OR "email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Table and column comments
COMMENT ON TABLE "customers" IS 'Customer records for receipt generation and tracking';
COMMENT ON COLUMN "customers"."vat_number" IS 'Customer VAT/Tax identification number for invoices';
COMMENT ON COLUMN "customers"."deleted_at" IS 'Soft delete timestamp for GDPR compliance';
COMMENT ON COLUMN "customers"."is_active" IS 'Whether customer is active and selectable';
```

**Rollback Script:**

```sql
-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- Drop foreign key constraint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_created_by_fkey";

-- Drop check constraint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_email_check";

-- Drop indexes
DROP INDEX IF EXISTS "customers_email_key";
DROP INDEX IF EXISTS "customers_name_idx";
DROP INDEX IF EXISTS "customers_phone_idx";
DROP INDEX IF EXISTS "customers_vat_number_idx";
DROP INDEX IF EXISTS "customers_active_idx";
DROP INDEX IF EXISTS "customers_created_at_idx";

-- Drop table
DROP TABLE IF EXISTS "customers";
```

---

#### Migration A.2.3: Create Receipts Table

**File:** `backend/prisma/migrations/20260401020000_create_receipts_table/migration.sql`

```sql
-- Migration: Create Receipts Table
-- Version: 20260401020000
-- Description: Creates receipts table with all required fields and relationships

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create enum types
CREATE TYPE "receipt_status" AS ENUM ('draft', 'issued', 'voided', 'emailed');
CREATE TYPE "email_status" AS ENUM ('pending', 'sent', 'failed', 'bounced');

-- Create receipts table
CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "status" "receipt_status" NOT NULL DEFAULT 'draft',
    
    -- Business snapshot (stored as JSONB for flexibility)
    "business_snapshot" JSONB NOT NULL,
    
    -- Customer snapshot (nullable, stored as JSONB)
    "customer_snapshot" JSONB,
    
    -- Financial data copies (immutable after issue)
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "tax_breakdown" JSONB,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    
    -- Items snapshot
    "items_snapshot" JSONB NOT NULL,
    
    -- Additional information
    "notes" TEXT,
    "internal_notes" TEXT,
    
    -- PDF file reference
    "pdf_path" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    
    -- Issue tracking
    "issued_at" TIMESTAMP(3),
    "issued_by" INTEGER NOT NULL,
    
    -- Email tracking
    "emailed_at" TIMESTAMP(3),
    "email_recipient" TEXT,
    "email_status" "email_status",
    "email_error_message" TEXT,
    "email_attempts" INTEGER DEFAULT 0,
    
    -- Void tracking
    "voided_at" TIMESTAMP(3),
    "void_reason" TEXT,
    "voided_by" INTEGER,
    
    -- Audit fields
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    -- Version for optimistic locking
    "version" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- Create unique index for receipt number
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- Create indexes for foreign keys and common queries
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");
CREATE INDEX "receipts_customer_id_idx" ON "receipts"("customer_id");
CREATE INDEX "receipts_status_idx" ON "receipts"("status");
CREATE INDEX "receipts_issued_at_idx" ON "receipts"("issued_at");
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");
CREATE INDEX "receipts_email_status_idx" ON "receipts"("email_status")
    WHERE "email_status" IS NOT NULL;
CREATE INDEX "receipts_email_recipient_idx" ON "receipts"("email_recipient")
    WHERE "email_recipient" IS NOT NULL;

-- Create composite index for date range queries with status filter
CREATE INDEX "receipts_created_at_status_idx" ON "receipts"("created_at", "status");

-- Add foreign key constraints
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_fkey"
    FOREIGN KEY ("issued_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_voided_by_fkey"
    FOREIGN KEY ("voided_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add check constraints
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_subtotal_check"
    CHECK ("subtotal" >= 0);

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_tax_check"
    CHECK ("tax" >= 0);

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_discount_check"
    CHECK ("discount" >= 0);

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_tip_check"
    CHECK ("tip" >= 0);

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_total_check"
    CHECK ("total" >= 0);

-- Table and column comments
COMMENT ON TABLE "receipts" IS 'Receipt records linked to transactions for invoicing';
COMMENT ON COLUMN "receipts"."business_snapshot" IS 'Snapshot of business metadata at receipt generation time';
COMMENT ON COLUMN "receipts"."customer_snapshot" IS 'Snapshot of customer data at receipt generation time';
COMMENT ON COLUMN "receipts"."tax_breakdown" IS 'Detailed tax breakdown by rate for fiscal compliance';
COMMENT ON COLUMN "receipts"."items_snapshot" IS 'Snapshot of transaction items at generation time';
COMMENT ON COLUMN "receipts"."version" IS 'Optimistic locking version for concurrent updates';
COMMENT ON COLUMN "receipts"."internal_notes" IS 'Staff-only notes not shown on receipt';
```

**Rollback Script:**

```sql
-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- Drop foreign key constraints
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_transaction_id_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_customer_id_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_issued_by_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_voided_by_fkey";

-- Drop check constraints
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_subtotal_check";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_tax_check";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_discount_check";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_tip_check";
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_total_check";

-- Drop indexes
DROP INDEX IF EXISTS "receipts_receipt_number_key";
DROP INDEX IF EXISTS "receipts_transaction_id_idx";
DROP INDEX IF EXISTS "receipts_customer_id_idx";
DROP INDEX IF EXISTS "receipts_status_idx";
DROP INDEX IF EXISTS "receipts_issued_at_idx";
DROP INDEX IF EXISTS "receipts_created_at_idx";
DROP INDEX IF EXISTS "receipts_email_status_idx";
DROP INDEX IF EXISTS "receipts_email_recipient_idx";
DROP INDEX IF EXISTS "receipts_created_at_status_idx";

-- Drop table
DROP TABLE IF EXISTS "receipts";

-- Drop enum types (must be after table drop)
DROP TYPE IF EXISTS "receipt_status";
DROP TYPE IF EXISTS "email_status";
```

---

#### Migration A.2.4: Create Receipt Audit Logs Table

**File:** `backend/prisma/migrations/20260401030000_create_receipt_audit_logs_table/migration.sql`

```sql
-- Migration: Create Receipt Audit Logs Table
-- Version: 20260401030000
-- Description: Creates audit log table for receipt operations tracking

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create enum type for audit actions
CREATE TYPE "receipt_audit_action" AS ENUM (
    'create', 
    'issue', 
    'email', 
    'email_retry',
    'void', 
    'regenerate_pdf',
    'update'
);

-- Create receipt_audit_logs table
CREATE TABLE "receipt_audit_logs" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "action" "receipt_audit_action" NOT NULL,
    
    -- Data snapshots (what changed)
    "old_values" JSONB,
    "new_values" JSONB,
    
    -- Actor information
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    
    -- Request context
    "ip_address" TEXT,
    "user_agent" TEXT,
    
    -- Timestamp
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "receipt_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for common queries
CREATE INDEX "receipt_audit_logs_receipt_id_idx" ON "receipt_audit_logs"("receipt_id");
CREATE INDEX "receipt_audit_logs_action_idx" ON "receipt_audit_logs"("action");
CREATE INDEX "receipt_audit_logs_user_id_idx" ON "receipt_audit_logs"("user_id");
CREATE INDEX "receipt_audit_logs_created_at_idx" ON "receipt_audit_logs"("created_at");

-- Create composite index for receipt history queries
CREATE INDEX "receipt_audit_logs_receipt_created_idx" 
    ON "receipt_audit_logs"("receipt_id", "created_at" DESC);

-- Add foreign key constraints
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_receipt_id_fkey"
    FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table and column comments
COMMENT ON TABLE "receipt_audit_logs" IS 'Immutable audit trail for all receipt operations';
COMMENT ON COLUMN "receipt_audit_logs"."old_values" IS 'Previous state before action (for updates)';
COMMENT ON COLUMN "receipt_audit_logs"."new_values" IS 'New state after action';
COMMENT ON COLUMN "receipt_audit_logs"."ip_address" IS 'Client IP address for security auditing';
```

**Rollback Script:**

```sql
-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- Drop foreign key constraints
ALTER TABLE "receipt_audit_logs" DROP CONSTRAINT IF EXISTS "receipt_audit_logs_receipt_id_fkey";
ALTER TABLE "receipt_audit_logs" DROP CONSTRAINT IF EXISTS "receipt_audit_logs_user_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "receipt_audit_logs_receipt_id_idx";
DROP INDEX IF EXISTS "receipt_audit_logs_action_idx";
DROP INDEX IF EXISTS "receipt_audit_logs_user_id_idx";
DROP INDEX IF EXISTS "receipt_audit_logs_created_at_idx";
DROP INDEX IF EXISTS "receipt_audit_logs_receipt_created_idx";

-- Drop table
DROP TABLE IF EXISTS "receipt_audit_logs";

-- Drop enum type
DROP TYPE IF EXISTS "receipt_audit_action";
```

---

#### Migration A.2.5: Create Email Queue Table

**File:** `backend/prisma/migrations/20260401040000_create_email_queue_table/migration.sql`

```sql
-- Migration: Create Email Queue Table
-- Version: 20260401040000
-- Description: Creates email queue for asynchronous email delivery

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create enum type for email job status
CREATE TYPE "email_job_status" AS ENUM (
    'pending', 
    'processing', 
    'sent', 
    'failed', 
    'cancelled'
);

-- Create email_queue table
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,  -- UUID stored as text
    "receipt_id" INTEGER NOT NULL,
    
    -- Email content
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    
    -- Attachment reference
    "attachment_path" TEXT,
    "attachment_filename" TEXT,
    
    -- Job status
    "status" "email_job_status" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    
    -- Retry configuration
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    
    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- Create indexes for queue processing
CREATE INDEX "email_queue_status_priority_idx" 
    ON "email_queue"("status", "priority" DESC);
CREATE INDEX "email_queue_next_attempt_idx" ON "email_queue"("next_attempt_at")
    WHERE "status" = 'pending' OR "status" = 'processing';
CREATE INDEX "email_queue_receipt_id_idx" ON "email_queue"("receipt_id");
CREATE INDEX "email_queue_created_at_idx" ON "email_queue"("created_at");

-- Create partial index for monitoring stuck jobs
CREATE INDEX "email_queue_stuck_idx" ON "email_queue"("id")
    WHERE "status" = 'processing' AND "processed_at" < CURRENT_TIMESTAMP - INTERVAL '10 minutes';

-- Add foreign key constraint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_receipt_id_fkey"
    FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraints
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_attempts_check"
    CHECK ("attempts" >= 0 AND "attempts" <= "max_attempts");

ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_priority_check"
    CHECK ("priority" >= 0 AND "priority" <= 100);

ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_max_attempts_check"
    CHECK ("max_attempts" >= 1 AND "max_attempts" <= 10);

-- Table and column comments
COMMENT ON TABLE "email_queue" IS 'Asynchronous email delivery queue with retry support';
COMMENT ON COLUMN "email_queue"."id" IS 'UUID job identifier';
COMMENT ON COLUMN "email_queue"."priority" IS 'Job priority (0-100, higher = more urgent)';
COMMENT ON COLUMN "email_queue"."next_attempt_at" IS 'Scheduled time for next retry attempt';
```

**Rollback Script:**

```sql
-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- Drop foreign key constraint
ALTER TABLE "email_queue" DROP CONSTRAINT IF EXISTS "email_queue_receipt_id_fkey";

-- Drop check constraints
ALTER TABLE "email_queue" DROP CONSTRAINT IF EXISTS "email_queue_attempts_check";
ALTER TABLE "email_queue" DROP CONSTRAINT IF EXISTS "email_queue_priority_check";
ALTER TABLE "email_queue" DROP CONSTRAINT IF EXISTS "email_queue_max_attempts_check";

-- Drop indexes
DROP INDEX IF EXISTS "email_queue_status_priority_idx";
DROP INDEX IF EXISTS "email_queue_next_attempt_idx";
DROP INDEX IF EXISTS "email_queue_receipt_id_idx";
DROP INDEX IF EXISTS "email_queue_created_at_idx";
DROP INDEX IF EXISTS "email_queue_stuck_idx";

-- Drop table
DROP TABLE IF EXISTS "email_queue";

-- Drop enum type
DROP TYPE IF EXISTS "email_job_status";
```

---

### A.3 Prisma Schema Additions

**Add to `backend/prisma/schema.prisma`:**

```prisma
// ============================================================================
// RECEIPT INVOICING MODELS
// ============================================================================

model Customer {
  id          Int       @id @default(autoincrement())
  name        String
  email       String?   @db.Text
  phone       String?   @db.Text
  vatNumber   String?   @map("vat_number") @db.Text
  address     String?   @db.Text
  city        String?   @db.Text
  postalCode  String?   @map("postal_code") @db.Text
  country     String?   @db.Text
  notes       String?   @db.Text
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  createdBy   Int       @map("created_by")
  
  user        User      @relation(fields: [createdBy], references: [id], onDelete: Restrict)
  receipts    Receipt[]
  
  @@unique(["email"], where: { deletedAt: null })
  @@index(["name"])
  @@index(["phone"])
  @@index(["vatNumber"])
  @@index(["isActive"])
  @@index(["createdAt"])
  @@map("customers")
}

model Receipt {
  id                Int           @id @default(autoincrement())
  receiptNumber     String        @unique @map("receipt_number") @db.Text
  transactionId     Int           @map("transaction_id")
  customerId        Int?          @map("customer_id")
  status            ReceiptStatus @default(draft)
  
  // Snapshots
  businessSnapshot  Json          @map("business_snapshot")
  customerSnapshot  Json?         @map("customer_snapshot")
  itemsSnapshot     Json          @map("items_snapshot")
  
  // Financial data
  subtotal          Decimal       @db.Decimal(10, 2)
  tax               Decimal       @db.Decimal(10, 2)
  taxBreakdown      Json?         @map("tax_breakdown")
  discount          Decimal       @default(0) @db.Decimal(10, 2)
  discountReason    String?       @map("discount_reason") @db.Text
  tip               Decimal       @default(0) @db.Decimal(10, 2)
  total             Decimal       @db.Decimal(10, 2)
  paymentMethod     String        @map("payment_method") @db.Text
  
  // Additional info
  notes             String?       @db.Text
  internalNotes     String?       @map("internal_notes") @db.Text
  
  // PDF
  pdfPath           String?       @map("pdf_path") @db.Text
  pdfGeneratedAt    DateTime?     @map("pdf_generated_at")
  
  // Issue tracking
  issuedAt          DateTime?     @map("issued_at")
  issuedBy          Int           @map("issued_by")
  
  // Email tracking
  emailedAt         DateTime?     @map("emailed_at")
  emailRecipient    String?       @map("email_recipient") @db.Text
  emailStatus       EmailStatus?  @map("email_status")
  emailErrorMessage String?       @map("email_error_message") @db.Text
  emailAttempts     Int           @default(0) @map("email_attempts")
  
  // Void tracking
  voidedAt          DateTime?     @map("voided_at")
  voidReason        String?       @map("void_reason") @db.Text
  voidedBy          Int?          @map("voided_by")
  
  // Audit
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")
  version           Int           @default(0)
  
  // Relations
  transaction       Transaction   @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  customer          Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  issuer            User          @relation("IssuedReceipts", fields: [issuedBy], references: [id])
  voider            User?         @relation("VoidedReceipts", fields: [voidedBy], references: [id])
  auditLogs         ReceiptAuditLog[]
  emailJobs         EmailQueue[]
  
  @@index(["transactionId"])
  @@index(["customerId"])
  @@index(["status"])
  @@index(["issuedAt"])
  @@index(["createdAt"])
  @@index(["emailStatus"])
  @@index(["emailRecipient"])
  @@index(["createdAt", "status"])
  @@map("receipts")
}

model ReceiptAuditLog {
  id          Int                 @id @default(autoincrement())
  receiptId   Int                 @map("receipt_id")
  action      ReceiptAuditAction
  
  oldValues   Json?               @map("old_values")
  newValues   Json?               @map("new_values")
  
  userId      Int                 @map("user_id")
  userName    String              @map("user_name") @db.Text
  ipAddress   String?             @map("ip_address") @db.Text
  userAgent   String?             @map("user_agent") @db.Text
  
  createdAt   DateTime            @default(now()) @map("created_at")
  
  receipt     Receipt             @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  user        User                @relation(fields: [userId], references: [id], onDelete: Restrict)
  
  @@index(["receiptId"])
  @@index(["action"])
  @@index(["userId"])
  @@index(["createdAt"])
  @@index(["receiptId", "createdAt"])
  @@map("receipt_audit_logs")
}

model EmailQueue {
  id                Text          @id @db.Text
  receiptId         Int           @map("receipt_id")
  
  recipientEmail    String        @map("recipient_email") @db.Text
  subject           String        @db.Text
  htmlContent       String        @map("html_content") @db.Text
  textContent       String        @map("text_content") @db.Text
  
  attachmentPath    String?       @map("attachment_path") @db.Text
  attachmentFilename String?      @map("attachment_filename") @db.Text
  
  status            EmailJobStatus @default(pending)
  priority          Int           @default(0)
  
  attempts          Int           @default(0)
  maxAttempts       Int           @default(5) @map("max_attempts")
  nextAttemptAt     DateTime?     @map("next_attempt_at")
  lastError         String?       @map("last_error") @db.Text
  
  createdAt         DateTime      @default(now()) @map("created_at")
  processedAt       DateTime?     @map("processed_at")
  sentAt            DateTime?     @map("sent_at")
  
  receipt           Receipt       @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  
  @@index(["status", "priority"])
  @@index(["nextAttemptAt"])
  @@index(["receiptId"])
  @@index(["createdAt"])
  @@map("email_queue")
}

// Update Settings model
model Settings {
  id                    Int       @id @default(autoincrement())
  taxMode               String    @map("tax_mode") @db.Text
  autoStartTime         String    @map("auto_start_time") @db.Text
  businessDayEndHour    String    @default("06:00") @map("business_day_end_hour") @db.Text
  autoCloseEnabled      Boolean   @default(false) @map("auto_close_enabled")
  lastManualClose       DateTime? @map("last_manual_close")
  defaultTaxRateId      Int?      @map("default_tax_rate_id")
  
  // Business metadata (new fields)
  businessName          String?   @map("business_name") @db.Text
  businessAddress       String?   @map("business_address") @db.Text
  businessCity          String?   @map("business_city") @db.Text
  businessPostalCode    String?   @map("business_postal_code") @db.Text
  businessCountry       String?   @map("business_country") @db.Text
  businessPhone         String?   @map("business_phone") @db.Text
  businessEmail         String?   @map("business_email") @db.Text
  vatNumber             String?   @map("vat_number") @db.Text
  
  // Receipt configuration (new fields)
  receiptPrefix         String?   @default("R") @map("receipt_prefix") @db.Text
  receiptNumberLength   Int?      @default(6) @map("receipt_number_length")
  receiptStartNumber    Int?      @default(1) @map("receipt_start_number")
  receiptSequenceYear   Boolean   @default(false) @map("receipt_sequence_year")
  receiptCurrentYear    Int?      @map("receipt_current_year")
  receiptCurrentNumber  Int       @default(0) @map("receipt_current_number")
  
  // Email configuration (new fields)
  emailSmtpHost         String?   @map("email_smtp_host") @db.Text
  emailSmtpPort         Int?      @default(587) @map("email_smtp_port")
  emailSmtpUser         String?   @map("email_smtp_user") @db.Text
  emailSmtpPassword     String?   @map("email_smtp_password") @db.Text
  emailFromAddress      String?   @map("email_from_address") @db.Text
  emailFromName         String?   @map("email_from_name") @db.Text
  emailSmtpSecure       Boolean   @default(false) @map("email_smtp_secure")
  emailEnabled          Boolean   @default(false) @map("email_enabled")
  
  defaultTaxRate        TaxRate?  @relation(fields: [defaultTaxRateId], references: [id], onDelete: SetNull)
  
  @@index([defaultTaxRateId])
  @@index([receiptCurrentYear])
  @@map("settings")
}

// Update User model to add relations
model User {
  id                Int           @id @default(autoincrement())
  name              String        @db.Text
  username          String        @unique @db.Text
  password          String        @db.Text
  role              String        @db.Text
  tokensRevokedAt   DateTime?     @map("tokens_revoked_at")
  
  // Existing relations
  dailyClosings     DailyClosing[]
  orderActivityLogs OrderActivityLog[]
  orderSessions     OrderSession[]
  stockAdjustments  StockAdjustment[]
  transactions      Transaction[]
  tables            Table[]
  variantLayouts    VariantLayout[]
  sharedLayouts     SharedLayout[]
  revokedTokens     RevokedToken[]
  
  // New relations for receipts
  createdCustomers  Customer[]    @relation("CreatedCustomers")
  issuedReceipts    Receipt[]     @relation("IssuedReceipts")
  voidedReceipts    Receipt[]     @relation("VoidedReceipts")
  receiptAuditLogs  ReceiptAuditLog[]
  
  @@map("users")
}

// Update Transaction model to add relation
model Transaction {
  id                    Int       @id @default(autoincrement())
  items                 Json
  subtotal              Decimal   @db.Decimal(10, 2)
  tax                   Decimal   @db.Decimal(10, 2)
  tip                   Decimal   @db.Decimal(10, 2)
  total                 Decimal   @db.Decimal(10, 2)
  discount              Decimal   @default(0) @db.Decimal(10, 2)
  discountReason        String?   @map("discount_reason") @db.Text
  status                String    @default("completed") @db.Text
  paymentMethod         String    @map("payment_method") @db.Text
  userId                Int       @map("user_id")
  userName              String    @map("user_name") @db.Text
  tillId                Int       @map("till_id")
  tillName              String    @map("till_name") @db.Text
  createdAt             DateTime  @default(now()) @map("created_at")
  version               Int       @default(0)
  idempotencyKey        String?   @unique @map("idempotency_key") @db.Text
  idempotencyCreatedAt  DateTime? @map("idempotency_created_at")
  
  user                  User      @relation(fields: [userId], references: [id])
  receipts              Receipt[]
  
  @@map("transactions")
}

// Enums
enum ReceiptStatus {
  draft
  issued
  voided
  emailed
}

enum EmailStatus {
  pending
  sent
  failed
  bounced
}

enum EmailJobStatus {
  pending
  processing
  sent
  failed
  cancelled
}

enum ReceiptAuditAction {
  create
  issue
  email
  email_retry
  void
  regenerate_pdf
  update
}
```

---

## Appendix B: API Specifications

Full API documentation for the receipt invoicing feature, following RESTful conventions and consistent with existing API patterns.

---

### B.1 Authentication & Authorization

All receipt endpoints require authentication via JWT Bearer token.

**Authentication Header:**
```
Authorization: Bearer <jwt_token>
```

**Authorization Levels:**

| Role | Permissions |
|------|-------------|
| Admin | Full access to all receipt operations, settings configuration, voiding |
| Cashier | Create receipts, issue receipts, send emails, view receipts |

**Role Mapping:**
- `Admin` role: Matches `ADMIN` in database
- `Cashier` role: Matches `Cashier` in database (case-insensitive)

---

### B.2 Common Response Formats

#### B.2.1 Success Response Envelope

```json
{
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456-ghi789"
  }
}
```

#### B.2.2 Error Response Envelope

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional context */ }
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456-ghi789"
  }
}
```

#### B.2.3 Paginated Response

```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456-ghi789"
  }
}
```

---

### B.3 Customer Endpoints

#### B.3.1 Create Customer

Creates a new customer record.

**Endpoint:** `POST /api/customers`

**Authentication:** Required (Admin, Cashier)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
Accept-Language: en | it
```

**Request Body Schema:**
```json
{
  "name": "string (required, 1-200 chars)",
  "email": "string (optional, valid email format)",
  "phone": "string (optional, max 50 chars)",
  "vatNumber": "string (optional, max 50 chars)",
  "address": "string (optional, max 500 chars)",
  "city": "string (optional, max 100 chars)",
  "postalCode": "string (optional, max 20 chars)",
  "country": "string (optional, ISO 3166-1 alpha-2)",
  "notes": "string (optional, max 1000 chars)"
}
```

**Request Example:**
```json
{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+39 02 1234567",
  "vatNumber": "IT12345678901",
  "address": "Via Roma 123",
  "city": "Milano",
  "postalCode": "20121",
  "country": "IT",
  "notes": "Preferred contact: Mario Rossi"
}
```

**Response Schema (201 Created):**
```json
{
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "+39 02 1234567",
    "vatNumber": "IT12345678901",
    "address": "Via Roma 123",
    "city": "Milano",
    "postalCode": "20121",
    "country": "IT",
    "notes": "Preferred contact: Mario Rossi",
    "isActive": true,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User"
    }
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 400 | DUPLICATE_EMAIL | Email already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

**Error Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "name": "Name is required"
      }
    }
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.3.2 List Customers

Retrieves a paginated list of customers.

**Endpoint:** `GET /api/customers`

**Authentication:** Required (Admin, Cashier)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| pageSize | integer | 20 | Items per page (max 100) |
| search | string | - | Search in name, email, phone |
| isActive | boolean | - | Filter by active status |
| sortBy | string | name | Sort field (name, createdAt) |
| sortOrder | string | asc | Sort order (asc, desc) |

**Request Example:**
```
GET /api/customers?page=1&pageSize=20&search=acme&isActive=true&sortBy=name&sortOrder=asc
```

**Response Schema (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "email": "billing@acme.com",
      "phone": "+39 02 1234567",
      "vatNumber": "IT12345678901",
      "city": "Milano",
      "country": "IT",
      "isActive": true,
      "createdAt": "2026-04-01T12:00:00.000Z",
      "updatedAt": "2026-04-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.3.3 Get Customer

Retrieves a single customer by ID.

**Endpoint:** `GET /api/customers/:id`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Customer ID |

**Request Example:**
```
GET /api/customers/1
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "+39 02 1234567",
    "vatNumber": "IT12345678901",
    "address": "Via Roma 123",
    "city": "Milano",
    "postalCode": "20121",
    "country": "IT",
    "notes": "Preferred contact: Mario Rossi",
    "isActive": true,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User"
    },
    "receiptCount": 5
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Customer not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

#### B.3.4 Update Customer

Updates an existing customer.

**Endpoint:** `PUT /api/customers/:id`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Customer ID |

**Request Body Schema:**
```json
{
  "name": "string (optional, 1-200 chars)",
  "email": "string (optional, valid email, nullable)",
  "phone": "string (optional, max 50 chars, nullable)",
  "vatNumber": "string (optional, max 50 chars, nullable)",
  "address": "string (optional, max 500 chars, nullable)",
  "city": "string (optional, max 100 chars, nullable)",
  "postalCode": "string (optional, max 20 chars, nullable)",
  "country": "string (optional, ISO 3166-1 alpha-2, nullable)",
  "notes": "string (optional, max 1000 chars, nullable)",
  "isActive": "boolean (optional)"
}
```

**Request Example:**
```json
{
  "phone": "+39 02 9876543",
  "notes": "Updated contact information"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "+39 02 9876543",
    "vatNumber": "IT12345678901",
    "address": "Via Roma 123",
    "city": "Milano",
    "postalCode": "20121",
    "country": "IT",
    "notes": "Updated contact information",
    "isActive": true,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:30:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User"
    }
  },
  "meta": {
    "timestamp": "2026-04-01T12:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.3.5 Delete Customer (Soft Delete)

Soft deletes a customer (GDPR compliance).

**Endpoint:** `DELETE /api/customers/:id`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Customer ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| reason | string | - | Reason for deletion (optional) |

**Request Example:**
```
DELETE /api/customers/1?reason=GDPR%20deletion%20request
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "deletedAt": "2026-04-01T13:00:00.000Z",
    "reason": "GDPR deletion request"
  },
  "meta": {
    "timestamp": "2026-04-01T13:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | CUSTOMER_HAS_RECEIPTS | Cannot delete customer with issued receipts |
| 404 | NOT_FOUND | Customer not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

### B.4 Receipt Endpoints

#### B.4.1 Create Receipt (Draft)

Creates a new draft receipt from a transaction.

**Endpoint:** `POST /api/receipts`

**Authentication:** Required (Admin, Cashier)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
Accept-Language: en | it
```

**Request Body Schema:**
```json
{
  "transactionId": "integer (required)",
  "customerId": "integer (optional)",
  "notes": "string (optional, max 500 chars)",
  "internalNotes": "string (optional, max 500 chars)"
}
```

**Request Example:**
```json
{
  "transactionId": 12345,
  "customerId": 1,
  "notes": "Thank you for your business!"
}
```

**Response Schema (201 Created):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "transactionId": 12345,
    "customerId": 1,
    "status": "draft",
    "subtotal": 100.00,
    "tax": 22.00,
    "taxBreakdown": [
      {
        "rateName": "Standard",
        "ratePercent": 22,
        "taxableAmount": 100.00,
        "taxAmount": 22.00
      }
    ],
    "discount": 0.00,
    "discountReason": null,
    "tip": 5.00,
    "total": 127.00,
    "paymentMethod": "card",
    "notes": "Thank you for your business!",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z",
    "issuedBy": {
      "id": 2,
      "name": "Marco Rossi"
    },
    "customer": {
      "id": 1,
      "name": "Acme Corporation",
      "email": "billing@acme.com",
      "vatNumber": "IT12345678901"
    },
    "transaction": {
      "id": 12345,
      "createdAt": "2026-04-01T11:30:00.000Z",
      "tillName": "Till 1"
    },
    "items": [
      {
        "name": "Espresso",
        "quantity": 5,
        "price": 1.50,
        "total": 7.50
      },
      {
        "name": "Cappuccino",
        "quantity": 10,
        "price": 2.00,
        "total": 20.00
      }
    ],
    "canIssue": true,
    "canVoid": false,
    "canEmail": false,
    "canEdit": true
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 400 | TRANSACTION_NOT_FOUND | Transaction does not exist |
| 400 | TRANSACTION_HAS_RECEIPT | Receipt already exists for transaction |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

**Error Example:**
```json
{
  "error": {
    "code": "TRANSACTION_HAS_RECEIPT",
    "message": "A receipt already exists for this transaction",
    "details": {
      "existingReceiptId": 42,
      "existingReceiptNumber": "R000042"
    }
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.4.2 List Receipts

Retrieves a paginated list of receipts with filtering.

**Endpoint:** `GET /api/receipts`

**Authentication:** Required (Admin, Cashier)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| pageSize | integer | 20 | Items per page (max 100) |
| status | string | - | Filter by status (draft, issued, voided, emailed) |
| customerId | integer | - | Filter by customer ID |
| startDate | date | - | Filter by issue date (from) |
| endDate | date | - | Filter by issue date (to) |
| receiptNumber | string | - | Search by receipt number |
| search | string | - | Search in customer name, email |
| sortBy | string | createdAt | Sort field (createdAt, issuedAt, receiptNumber, total) |
| sortOrder | string | desc | Sort order (asc, desc) |

**Request Example:**
```
GET /api/receipts?page=1&pageSize=20&status=issued&startDate=2026-04-01&endDate=2026-04-30&sortBy=createdAt&sortOrder=desc
```

**Response Schema (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "receiptNumber": "R000001",
      "status": "issued",
      "issuedAt": "2026-04-01T12:30:00.000Z",
      "total": 127.00,
      "paymentMethod": "card",
      "customer": {
        "id": 1,
        "name": "Acme Corporation",
        "email": "billing@acme.com"
      },
      "createdAt": "2026-04-01T12:00:00.000Z",
      "emailStatus": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "timestamp": "2026-04-01T14:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.4.3 Get Receipt

Retrieves a single receipt with full details.

**Endpoint:** `GET /api/receipts/:id`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Example:**
```
GET /api/receipts/1
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "transactionId": 12345,
    "customerId": 1,
    "status": "issued",
    "businessSnapshot": {
      "name": "Cafe Milano",
      "address": "Via Dante 10",
      "city": "Milano",
      "postalCode": "20121",
      "country": "IT",
      "phone": "+39 02 1234567",
      "email": "info@cafemilano.it",
      "vatNumber": "IT98765432101"
    },
    "customerSnapshot": {
      "name": "Acme Corporation",
      "email": "billing@acme.com",
      "vatNumber": "IT12345678901",
      "address": "Via Roma 123",
      "city": "Milano"
    },
    "subtotal": 100.00,
    "tax": 22.00,
    "taxBreakdown": [
      {
        "rateName": "Standard",
        "ratePercent": 22,
        "taxableAmount": 100.00,
        "taxAmount": 22.00
      }
    ],
    "discount": 0.00,
    "discountReason": null,
    "tip": 5.00,
    "total": 127.00,
    "paymentMethod": "card",
    "notes": "Thank you for your business!",
    "itemsSnapshot": [
      {
        "id": "item-1",
        "name": "Espresso",
        "quantity": 5,
        "price": 1.50,
        "effectiveTaxRate": 0.22
      },
      {
        "id": "item-2",
        "name": "Cappuccino",
        "quantity": 10,
        "price": 2.00,
        "effectiveTaxRate": 0.22
      }
    ],
    "pdfPath": "/receipts/2026/04/R000001.pdf",
    "issuedAt": "2026-04-01T12:30:00.000Z",
    "issuedBy": {
      "id": 2,
      "name": "Marco Rossi"
    },
    "emailedAt": null,
    "emailRecipient": null,
    "emailStatus": null,
    "voidedAt": null,
    "voidReason": null,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:30:00.000Z",
    "auditLog": [
      {
        "action": "create",
        "createdAt": "2026-04-01T12:00:00.000Z",
        "userName": "Marco Rossi"
      },
      {
        "action": "issue",
        "createdAt": "2026-04-01T12:30:00.000Z",
        "userName": "Marco Rossi"
      }
    ],
    "canIssue": false,
    "canVoid": true,
    "canEmail": true,
    "canEdit": false
  },
  "meta": {
    "timestamp": "2026-04-01T14:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.4.4 Update Receipt (Draft Only)

Updates a draft receipt before issuing.

**Endpoint:** `PUT /api/receipts/:id`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Body Schema:**
```json
{
  "customerId": "integer (optional, nullable)",
  "notes": "string (optional, max 500 chars, nullable)",
  "internalNotes": "string (optional, max 500 chars, nullable)"
}
```

**Request Example:**
```json
{
  "customerId": 2,
  "notes": "Updated receipt notes"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "status": "draft",
    "customerId": 2,
    "notes": "Updated receipt notes",
    "updatedAt": "2026-04-01T12:15:00.000Z"
  },
  "meta": {
    "timestamp": "2026-04-01T12:15:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | RECEIPT_NOT_DRAFT | Cannot update issued receipt |
| 404 | NOT_FOUND | Receipt not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

#### B.4.5 Issue Receipt

Issues a draft receipt, generates PDF, and assigns final receipt number.

**Endpoint:** `POST /api/receipts/:id/issue`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Body Schema:**
```json
{
  "generatePdf": "boolean (default: true)",
  "language": "string (optional, default: system locale)"
}
```

**Request Example:**
```json
{
  "generatePdf": true,
  "language": "it"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "status": "issued",
    "issuedAt": "2026-04-01T12:30:00.000Z",
    "pdfPath": "/receipts/2026/04/R000001.pdf",
    "pdfGeneratedAt": "2026-04-01T12:30:00.000Z",
    "version": 1
  },
  "meta": {
    "timestamp": "2026-04-01T12:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | RECEIPT_NOT_DRAFT | Receipt is not in draft status |
| 400 | RECEIPT_ALREADY_ISSUED | Receipt already issued |
| 409 | VERSION_CONFLICT | Concurrent modification detected |
| 404 | NOT_FOUND | Receipt not found |
| 500 | PDF_GENERATION_FAILED | Failed to generate PDF |

---

#### B.4.6 Void Receipt

Voids an issued receipt with a reason.

**Endpoint:** `POST /api/receipts/:id/void`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Body Schema:**
```json
{
  "reason": "string (required, 1-500 chars)"
}
```

**Request Example:**
```json
{
  "reason": "Customer requested cancellation - duplicate transaction"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "status": "voided",
    "voidedAt": "2026-04-01T15:00:00.000Z",
    "voidReason": "Customer requested cancellation - duplicate transaction",
    "voidedBy": {
      "id": 1,
      "name": "Admin User"
    },
    "version": 2
  },
  "meta": {
    "timestamp": "2026-04-01T15:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | RECEIPT_NOT_ISSUED | Cannot void non-issued receipt |
| 400 | RECEIPT_ALREADY_VOIDED | Receipt already voided |
| 400 | RECEIPT_EMAIL_SENT | Cannot void receipt after email sent |
| 404 | NOT_FOUND | Receipt not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions (Admin required) |

---

#### B.4.7 Send Receipt via Email

Sends a receipt to the specified email address.

**Endpoint:** `POST /api/receipts/:id/email`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Body Schema:**
```json
{
  "email": "string (required, valid email)",
  "includePdf": "boolean (default: true)",
  "message": "string (optional, max 1000 chars, custom message)"
}
```

**Request Example:**
```json
{
  "email": "billing@acme.com",
  "includePdf": true,
  "message": "Please find attached your receipt from Cafe Milano."
}
```

**Response Schema (202 Accepted):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "emailRecipient": "billing@acme.com",
    "emailStatus": "pending",
    "emailJobId": "550e8400-e29b-41d4-a716-446655440000",
    "queuedAt": "2026-04-01T15:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-04-01T15:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | RECEIPT_NOT_ISSUED | Cannot email draft receipt |
| 400 | RECEIPT_VOIDED | Cannot email voided receipt |
| 400 | EMAIL_SERVICE_DISABLED | Email service not configured |
| 400 | INVALID_EMAIL | Invalid email format |
| 404 | NOT_FOUND | Receipt not found |
| 429 | RATE_LIMIT_EXCEEDED | Too many email requests (see rate limiting) |

**Rate Limiting:**

| Limit | Value |
|-------|-------|
| Requests per minute | 10 |
| Requests per hour | 50 |
| Requests per day | 200 |

Rate limit headers included in response:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1711983600
```

---

#### B.4.8 Download Receipt PDF

Downloads the PDF file for a receipt.

**Endpoint:** `GET /api/receipts/:id/pdf`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| regenerate | boolean | false | Force PDF regeneration |
| language | string | system | Language for regeneration |

**Request Example:**
```
GET /api/receipts/1/pdf?regenerate=false
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="R000001.pdf"
Content-Length: 45678
Cache-Control: private, max-age=3600
```

**Response Body:** Binary PDF file

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Receipt not found |
| 404 | PDF_NOT_GENERATED | PDF file does not exist |
| 500 | PDF_GENERATION_FAILED | Failed to regenerate PDF |

---

#### B.4.9 Get Receipt by Number

Retrieves a receipt by its receipt number.

**Endpoint:** `GET /api/receipts/number/:receiptNumber`

**Authentication:** Required (Admin, Cashier)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| receiptNumber | string | Receipt number (e.g., R000001) |

**Request Example:**
```
GET /api/receipts/number/R000001
```

**Response:** Same as B.4.3 Get Receipt

---

#### B.4.10 Regenerate Receipt PDF

Regenerates the PDF for an issued receipt.

**Endpoint:** `POST /api/receipts/:id/regenerate-pdf`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Request Body Schema:**
```json
{
  "language": "string (optional, default: original language)"
}
```

**Request Example:**
```json
{
  "language": "en"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "id": 1,
    "receiptNumber": "R000001",
    "pdfPath": "/receipts/2026/04/R000001.pdf",
    "pdfGeneratedAt": "2026-04-01T16:00:00.000Z",
    "previousPdfPath": "/receipts/2026/04/R000001_v1.pdf"
  },
  "meta": {
    "timestamp": "2026-04-01T16:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | RECEIPT_VOIDED | Cannot regenerate PDF for voided receipt |
| 404 | NOT_FOUND | Receipt not found |
| 500 | PDF_GENERATION_FAILED | Failed to generate PDF |

---

### B.5 Settings Endpoints (Extensions)

#### B.5.1 Get Business Settings

Retrieves business metadata settings for receipts.

**Endpoint:** `GET /api/settings/business`

**Authentication:** Required (Admin)

**Response Schema (200 OK):**
```json
{
  "data": {
    "businessName": "Cafe Milano",
    "businessAddress": "Via Dante 10",
    "businessCity": "Milano",
    "businessPostalCode": "20121",
    "businessCountry": "IT",
    "businessPhone": "+39 02 1234567",
    "businessEmail": "info@cafemilano.it",
    "vatNumber": "IT98765432101",
    "receiptPrefix": "R",
    "receiptNumberLength": 6,
    "receiptStartNumber": 1,
    "receiptSequenceYear": false,
    "receiptCurrentYear": 2026,
    "receiptCurrentNumber": 150
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.5.2 Update Business Settings

Updates business metadata settings.

**Endpoint:** `PUT /api/settings/business`

**Authentication:** Required (Admin)

**Request Body Schema:**
```json
{
  "businessName": "string (required, 1-200 chars)",
  "businessAddress": "string (required, 1-500 chars)",
  "businessCity": "string (required, 1-100 chars)",
  "businessPostalCode": "string (required, 1-20 chars)",
  "businessCountry": "string (required, ISO 3166-1 alpha-2)",
  "businessPhone": "string (optional, max 50 chars)",
  "businessEmail": "string (optional, valid email)",
  "vatNumber": "string (optional, max 50 chars)",
  "receiptPrefix": "string (optional, 1-10 chars)",
  "receiptNumberLength": "integer (optional, 1-10)",
  "receiptSequenceYear": "boolean (optional)"
}
```

**Request Example:**
```json
{
  "businessName": "Cafe Milano",
  "businessAddress": "Via Dante 10",
  "businessCity": "Milano",
  "businessPostalCode": "20121",
  "businessCountry": "IT",
  "businessPhone": "+39 02 1234567",
  "businessEmail": "info@cafemilano.it",
  "vatNumber": "IT98765432101",
  "receiptPrefix": "R",
  "receiptNumberLength": 6,
  "receiptSequenceYear": false
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "businessName": "Cafe Milano",
    "businessAddress": "Via Dante 10",
    "businessCity": "Milano",
    "businessPostalCode": "20121",
    "businessCountry": "IT",
    "businessPhone": "+39 02 1234567",
    "businessEmail": "info@cafemilano.it",
    "vatNumber": "IT98765432101",
    "receiptPrefix": "R",
    "receiptNumberLength": 6,
    "receiptSequenceYear": false,
    "updatedAt": "2026-04-01T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.5.3 Get Email Settings

Retrieves email configuration settings.

**Endpoint:** `GET /api/settings/email`

**Authentication:** Required (Admin)

**Response Schema (200 OK):**
```json
{
  "data": {
    "enabled": false,
    "smtpHost": null,
    "smtpPort": 587,
    "smtpUser": null,
    "smtpSecure": false,
    "fromAddress": null,
    "fromName": null,
    "isConfigured": false
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Note:** Password is never returned in API responses.

---

#### B.5.4 Update Email Settings

Updates email configuration settings.

**Endpoint:** `PUT /api/settings/email`

**Authentication:** Required (Admin)

**Request Body Schema:**
```json
{
  "enabled": "boolean (required)",
  "smtpHost": "string (required if enabled, hostname)",
  "smtpPort": "integer (optional, default 587, 1-65535)",
  "smtpUser": "string (required if enabled)",
  "smtpPassword": "string (required if enabled)",
  "smtpSecure": "boolean (optional, default false)",
  "fromAddress": "string (required if enabled, valid email)",
  "fromName": "string (optional, max 100 chars)"
}
```

**Request Example:**
```json
{
  "enabled": true,
  "smtpHost": "smtp.example.com",
  "smtpPort": 587,
  "smtpUser": "noreply@example.com",
  "smtpPassword": "secret-password",
  "smtpSecure": true,
  "fromAddress": "noreply@cafemilano.it",
  "fromName": "Cafe Milano"
}
```

**Response Schema (200 OK):**
```json
{
  "data": {
    "enabled": true,
    "smtpHost": "smtp.example.com",
    "smtpPort": 587,
    "smtpUser": "noreply@example.com",
    "smtpSecure": true,
    "fromAddress": "noreply@cafemilano.it",
    "fromName": "Cafe Milano",
    "isConfigured": true,
    "connectionTest": "success"
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid settings values |
| 400 | SMTP_CONNECTION_FAILED | Could not connect to SMTP server |
| 400 | SMTP_AUTH_FAILED | SMTP authentication failed |

---

#### B.5.5 Test Email Configuration

Sends a test email to verify configuration.

**Endpoint:** `POST /api/settings/email/test`

**Authentication:** Required (Admin)

**Request Body Schema:**
```json
{
  "recipientEmail": "string (required, valid email)"
}
```

**Request Example:**
```json
{
  "recipientEmail": "admin@cafemilano.it"
}
```

**Response Schema (202 Accepted):**
```json
{
  "data": {
    "status": "queued",
    "recipientEmail": "admin@cafemilano.it",
    "message": "Test email queued for delivery"
  },
  "meta": {
    "timestamp": "2026-04-01T12:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

### B.6 Audit Log Endpoints

#### B.6.1 Get Receipt Audit Log

Retrieves the audit log for a specific receipt.

**Endpoint:** `GET /api/receipts/:id/audit`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Receipt ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| pageSize | integer | 50 | Items per page (max 100) |

**Request Example:**
```
GET /api/receipts/1/audit?page=1&pageSize=50
```

**Response Schema (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "action": "create",
      "oldValues": null,
      "newValues": {
        "status": "draft",
        "transactionId": 12345,
        "customerId": 1
      },
      "userId": 2,
      "userName": "Marco Rossi",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-04-01T12:00:00.000Z"
    },
    {
      "id": 2,
      "action": "issue",
      "oldValues": {
        "status": "draft"
      },
      "newValues": {
        "status": "issued",
        "issuedAt": "2026-04-01T12:30:00.000Z"
      },
      "userId": 2,
      "userName": "Marco Rossi",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-04-01T12:30:00.000Z"
    },
    {
      "id": 3,
      "action": "email",
      "oldValues": null,
      "newValues": {
        "emailRecipient": "billing@acme.com",
        "emailStatus": "pending"
      },
      "userId": 2,
      "userName": "Marco Rossi",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-04-01T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "meta": {
    "timestamp": "2026-04-01T16:00:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

#### B.6.2 Export Audit Log

Exports audit logs for compliance reporting.

**Endpoint:** `GET /api/receipts/audit/export`

**Authentication:** Required (Admin)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startDate | date | - | Start date (required) |
| endDate | date | - | End date (required) |
| format | string | csv | Export format (csv, json) |

**Request Example:**
```
GET /api/receipts/audit/export?startDate=2026-04-01&endDate=2026-04-30&format=csv
```

**Response Headers (CSV):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="receipt_audit_2026-04-01_2026-04-30.csv"
```

**Response Body (CSV):**
```csv
id,receipt_id,receipt_number,action,user_id,user_name,ip_address,created_at,old_values,new_values
1,1,R000001,create,2,Marco Rossi,192.168.1.100,2026-04-01T12:00:00.000Z,null,"{""status"":""draft""}"
2,1,R000001,issue,2,Marco Rossi,192.168.1.100,2026-04-01T12:30:00.000Z,"{""status"":""draft""}","{""status"":""issued""}"
```

---

### B.7 Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request body validation failed |
| INVALID_JSON | 400 | Malformed JSON in request body |
| DUPLICATE_EMAIL | 400 | Email already exists for another customer |
| TRANSACTION_NOT_FOUND | 400 | Specified transaction does not exist |
| TRANSACTION_HAS_RECEIPT | 400 | Receipt already exists for transaction |
| RECEIPT_NOT_DRAFT | 400 | Operation only valid for draft receipts |
| RECEIPT_NOT_ISSUED | 400 | Operation only valid for issued receipts |
| RECEIPT_ALREADY_ISSUED | 400 | Receipt has already been issued |
| RECEIPT_ALREADY_VOIDED | 400 | Receipt has already been voided |
| RECEIPT_VOIDED | 400 | Cannot perform operation on voided receipt |
| RECEIPT_EMAIL_SENT | 400 | Cannot void receipt after email sent |
| CUSTOMER_HAS_RECEIPTS | 400 | Cannot delete customer with issued receipts |
| PDF_NOT_GENERATED | 404 | PDF file does not exist |
| PDF_GENERATION_FAILED | 500 | Failed to generate PDF |
| EMAIL_SERVICE_DISABLED | 400 | Email service not configured |
| SMTP_CONNECTION_FAILED | 400 | Could not connect to SMTP server |
| SMTP_AUTH_FAILED | 400 | SMTP authentication failed |
| UNAUTHORIZED | 401 | Missing or invalid authentication token |
| TOKEN_EXPIRED | 401 | JWT token has expired |
| TOKEN_REVOKED | 401 | JWT token has been revoked |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VERSION_CONFLICT | 409 | Concurrent modification detected |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

### B.8 Webhook Events (Future)

The following webhook events are planned for future implementation:

| Event | Description |
|-------|-------------|
| receipt.issued | Receipt has been issued |
| receipt.emailed | Receipt email has been sent |
| receipt.voided | Receipt has been voided |
| email.bounced | Receipt email bounced |
| email.delivered | Receipt email delivered |

---

## Appendix C: i18n Keys

All new user-facing text will be added to both `en` and `it` locale files with proper namespacing.

---

### C.1 English Locale Additions

**File:** `backend/locales/en/receipts.json`

```json
{
  "receipts": {
    "title": "Receipts",
    "create": "Create Receipt",
    "issue": "Issue Receipt",
    "void": "Void Receipt",
    "email": "Send via Email",
    "download": "Download PDF",
    "regenerate": "Regenerate PDF",
    "status": {
      "draft": "Draft",
      "issued": "Issued",
      "voided": "Voided",
      "emailed": "Emailed"
    },
    "fields": {
      "receiptNumber": "Receipt Number",
      "transactionId": "Transaction ID",
      "customer": "Customer",
      "subtotal": "Subtotal",
      "tax": "Tax",
      "discount": "Discount",
      "tip": "Tip",
      "total": "Total",
      "paymentMethod": "Payment Method",
      "issuedAt": "Issued At",
      "issuedBy": "Issued By",
      "notes": "Notes"
    },
    "messages": {
      "createSuccess": "Receipt created successfully",
      "issueSuccess": "Receipt issued successfully",
      "voidSuccess": "Receipt voided successfully",
      "emailQueued": "Email queued for delivery",
      "pdfReady": "PDF generated successfully"
    },
    "errors": {
      "notFound": "Receipt not found",
      "alreadyIssued": "Receipt has already been issued",
      "cannotVoid": "Cannot void this receipt",
      "emailFailed": "Failed to send email"
    }
  },
  "customers": {
    "title": "Customers",
    "create": "New Customer",
    "edit": "Edit Customer",
    "delete": "Delete Customer",
    "fields": {
      "name": "Name",
      "email": "Email",
      "phone": "Phone",
      "vatNumber": "VAT Number",
      "address": "Address",
      "city": "City",
      "postalCode": "Postal Code",
      "country": "Country",
      "notes": "Notes"
    },
    "messages": {
      "createSuccess": "Customer created successfully",
      "updateSuccess": "Customer updated successfully",
      "deleteSuccess": "Customer deleted successfully"
    },
    "errors": {
      "notFound": "Customer not found",
      "duplicateEmail": "Email already exists"
    }
  },
  "settings": {
    "business": {
      "title": "Business Settings",
      "section": "Business Information",
      "fields": {
        "businessName": "Business Name",
        "address": "Address",
        "city": "City",
        "postalCode": "Postal Code",
        "country": "Country",
        "phone": "Phone",
        "email": "Email",
        "vatNumber": "VAT Number"
      }
    },
    "receipt": {
      "title": "Receipt Settings",
      "section": "Receipt Configuration",
      "fields": {
        "prefix": "Receipt Prefix",
        "numberLength": "Number Length",
        "sequenceYear": "Reset Yearly"
      }
    },
    "email": {
      "title": "Email Settings",
      "section": "Email Configuration",
      "fields": {
        "enabled": "Enable Email",
        "smtpHost": "SMTP Host",
        "smtpPort": "SMTP Port",
        "smtpUser": "SMTP Username",
        "smtpPassword": "SMTP Password",
        "smtpSecure": "Use TLS",
        "fromAddress": "From Address",
        "fromName": "From Name"
      },
      "messages": {
        "testSent": "Test email sent successfully",
        "connectionOk": "SMTP connection successful"
      }
    }
  }
}
```

---

### C.2 Italian Locale Additions

**File:** `backend/locales/it/receipts.json`

```json
{
  "receipts": {
    "title": "Ricevute",
    "create": "Crea Ricevuta",
    "issue": "Emetti Ricevuta",
    "void": "Annulla Ricevuta",
    "email": "Invia via Email",
    "download": "Scarica PDF",
    "regenerate": "Rigenera PDF",
    "status": {
      "draft": "Bozza",
      "issued": "Emessa",
      "voided": "Annullata",
      "emailed": "Inviata"
    },
    "fields": {
      "receiptNumber": "Numero Ricevuta",
      "transactionId": "ID Transazione",
      "customer": "Cliente",
      "subtotal": "Imponibile",
      "tax": "IVA",
      "discount": "Sconto",
      "tip": "Mancia",
      "total": "Totale",
      "paymentMethod": "Metodo di Pagamento",
      "issuedAt": "Emessa il",
      "issuedBy": "Emessa da",
      "notes": "Note"
    },
    "messages": {
      "createSuccess": "Ricevuta creata con successo",
      "issueSuccess": "Ricevuta emessa con successo",
      "voidSuccess": "Ricevuta annullata con successo",
      "emailQueued": "Email in coda per l'invio",
      "pdfReady": "PDF generato con successo"
    },
    "errors": {
      "notFound": "Ricevuta non trovata",
      "alreadyIssued": "La ricevuta e gia stata emessa",
      "cannotVoid": "Impossibile annullare questa ricevuta",
      "emailFailed": "Invio email fallito"
    }
  },
  "customers": {
    "title": "Clienti",
    "create": "Nuovo Cliente",
    "edit": "Modifica Cliente",
    "delete": "Elimina Cliente",
    "fields": {
      "name": "Nome",
      "email": "Email",
      "phone": "Telefono",
      "vatNumber": "Partita IVA",
      "address": "Indirizzo",
      "city": "Citta",
      "postalCode": "CAP",
      "country": "Paese",
      "notes": "Note"
    },
    "messages": {
      "createSuccess": "Cliente creato con successo",
      "updateSuccess": "Cliente aggiornato con successo",
      "deleteSuccess": "Cliente eliminato con successo"
    },
    "errors": {
      "notFound": "Cliente non trovato",
      "duplicateEmail": "Email gia esistente"
    }
  },
  "settings": {
    "business": {
      "title": "Impostazioni Azienda",
      "section": "Informazioni Aziendali",
      "fields": {
        "businessName": "Ragione Sociale",
        "address": "Indirizzo",
        "city": "Citta",
        "postalCode": "CAP",
        "country": "Paese",
        "phone": "Telefono",
        "email": "Email",
        "vatNumber": "Partita IVA"
      }
    },
    "receipt": {
      "title": "Impostazioni Ricevute",
      "section": "Configurazione Ricevute",
      "fields": {
        "prefix": "Prefisso Ricevuta",
        "numberLength": "Lunghezza Numero",
        "sequenceYear": "Reset Annuale"
      }
    },
    "email": {
      "title": "Impostazioni Email",
      "section": "Configurazione Email",
      "fields": {
        "enabled": "Abilita Email",
        "smtpHost": "Server SMTP",
        "smtpPort": "Porta SMTP",
        "smtpUser": "Utente SMTP",
        "smtpPassword": "Password SMTP",
        "smtpSecure": "Usa TLS",
        "fromAddress": "Indirizzo Mittente",
        "fromName": "Nome Mittente"
      },
      "messages": {
        "testSent": "Email di test inviata con successo",
        "connectionOk": "Connessione SMTP riuscita"
      }
    }
  }
}
```

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| Security Lead | | | |
| Product Owner | | | |
