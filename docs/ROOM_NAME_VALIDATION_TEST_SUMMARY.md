# Room Name Validation Test Summary

## Overview
This document summarizes the comprehensive test suite created for room name validation functionality. The test suite ensures proper handling of edge cases and security considerations for room name validation.

## Test Coverage

### Empty Names Validation
- Empty string (`""`) - Should reject with "Name is required"
- Whitespace-only names (`"   "`) - Should reject with "Room name cannot be empty"
- Tab and space combinations (`"\t\t  \t"`) - Should reject with "Room name cannot be empty"
- Special whitespace characters (`"\u0020\u00A0\u2000"`) - Should reject with "Room name cannot be empty"
- Null names - Should reject with "Name is required"
- Undefined names - Should reject with "Name is required"

### Length Limits Validation
- Exactly 100 characters - Should accept (valid limit)
- 101 characters - Should reject with "Room name must be 100 characters or less"
- 200 characters - Should reject with "Room name must be 100 characters or less"
- 1000 characters - Should reject with "Room name must be 100 characters or less"

### Special Characters Validation
#### Rejected Characters (Security Risk)
- HTML tags (`<script>alert("xss")</script>`) - Reject with "Room name contains invalid characters"
- SQL injection attempts (`'; DROP TABLE rooms; --`) - Reject with "Room name contains invalid characters"
- Various special characters (`!@#$%^&*()+=[]{}|;:"<>?/`) - Reject with "Room name contains invalid characters"
- Backslashes and quotes (`\"'\`) - Reject with "Room name contains invalid characters"
- Unicode control characters (`\u0000\u0001\u0002`) - Reject with "Room name contains invalid characters"
- Unicode symbols (`€£¥©®™`) - Reject with "Room name contains invalid characters"

#### Accepted Characters (Safe)
- Alphanumeric characters
- Spaces
- Hyphens and underscores (`Dining-Room_Section-A`)
- Parentheses, dots, commas, ampersands (`Main Hall & Bar (VIP Section)`)
- Apostrophes (`John's Dining Room`)

### Security Edge Cases
- JavaScript code injection (`javascript:alert("xss")`) - Reject with "Room name contains invalid characters"
- URL encoding (`%20with%20encoded`) - Reject with "Room name contains invalid characters"
- Path traversal attempts (`../../../etc/passwd`) - Reject with "Room name contains invalid characters"
- OS command injection (`; rm -rf /`) - Reject with "Room name contains invalid characters"

### Update Operations
- Updating with empty name - Should reject appropriately
- Updating with name exceeding length limits - Should reject with "Room name must be 100 characters or less"
- Updating with invalid characters - Should reject with "Room name contains invalid characters"
- Valid updates - Should accept and update successfully

## Validation Rules Implemented

The validation follows these rules defined in `backend/src/utils/validation.ts`:

1. **Required Field**: Room name must be provided
2. **Length Limit**: Maximum 100 characters
3. **Character Restrictions**: Only alphanumeric characters, spaces, hyphens, underscores, parentheses, dots, commas, and ampersands are allowed
4. **Whitespace Handling**: Names that are only whitespace are rejected
5. **Duplicate Prevention**: Names must be unique (case-insensitive)

## Regex Pattern
The validation uses the following regex pattern: `/^[a-zA-Z0-9\s\-_(),.'&]+$/`
- `a-zA-Z0-9`: Alphanumeric characters
- `\s`: Space characters
- `\-_(): Dashes, underscores, parentheses, dots, commas
- `.&`: Ampersands and periods
- `+`: One or more of the allowed characters

## Security Considerations
The validation prevents:
- XSS attacks through HTML/script injection
- SQL injection through special SQL characters
- Command injection through shell metacharacters
- Path traversal vulnerabilities
- Encoding-based attacks

## Test Implementation
- Test file: `backend/src/__tests__/room-name-validation.test.ts`
- Total tests: 27 individual test cases
- Framework: Jest with Supertest for API testing
- Mocking: Prisma database operations are mocked appropriately
- Coverage: All validation edge cases covered for both creation and update operations