# Security Report: TEV2 POS - LAN+VLAN Deployment

## Executive Summary

This security assessment analyzes the TEV2 Point of Sale application specifically for deployment in a LAN environment with VLAN isolation. While VLANs provide protection against external network attacks, **8 security concerns remain critical or high-priority** for LAN+VLAN deployment.

The two critical vulnerabilities (plain text passwords and no token revocation) must be addressed immediately as they enable complete system compromise from within the trusted network.

---

## Critical Issues (Must Fix Immediately)

### 1. Weak Password Storage

| Attribute | Details |
|-----------|---------|
| **Severity** | CRITICAL |
| **Location** | `backend/src/handlers/users.ts:58` |
| **Risk Level** | HIGH |

#### The Problem

Passwords are stored directly in the database as `password_HACK`, indicating plain text storage without hashing.

#### Why This Matters in LAN+VLAN

- **Insider Threat**: Employees with database access can read all passwords
- **Password Reuse**: Users may reuse passwords across systems, leading to external compromises
- **Database Compromise**: Any vulnerability that exposes the database reveals all credentials
- **Compliance**: Plain text storage violates data protection regulations (GDPR, PCI-DSS)

#### Attack Scenarios

1. Disgruntled employee with database access exports all user passwords
2. SQL injection vulnerability exposes password field
3. Misconfigured database permissions allow unauthorized read access
4. Database backup files contain plain text passwords

#### Recommendation

```typescript
// Install bcrypt
npm install bcrypt @types/bcrypt

// Update user creation in backend/src/handlers/users.ts
import bcrypt from 'bcrypt';

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Update user authentication
const isPasswordValid = await bcrypt.compare(inputPassword, user.password);
```

#### Implementation Steps

1. Install bcrypt package
2. Update user creation handler to hash passwords before storage
3. Update authentication handler to verify hashed passwords
4. Create migration to hash existing plain text passwords
5. Remove any plain text password fields from API responses

**Priority**: IMMEDIATE - This is a critical vulnerability that enables complete system compromise

---

### 2. No Token Revocation Mechanism

| Attribute | Details |
|-----------|---------|
| **Severity** | CRITICAL |
| **Location** | `backend/src/handlers/users.ts:138` |
| **Risk Level** | HIGH |

#### The Problem

JWT tokens have 24-hour expiration with no mechanism to revoke tokens for logged-out or compromised accounts.

#### Why This Matters in LAN+VLAN

- **Stolen Devices**: Compromised POS terminals retain access for 24 hours
- **Employee Termination**: Cannot immediately revoke access for departing employees
- **Session Hijacking**: Compromised sessions remain valid until expiration
- **Physical Theft**: Stolen tablets continue to have admin access

#### Attack Scenarios

1. POS tablet stolen from bar; thief has 24 hours of admin access
2. Employee leaves on bad terms; their session remains active for 24 hours
3. Malware on POS device captures JWT token; attacker uses it for 24 hours
4. Unattended terminal accessed by unauthorized person

#### Recommendation

```typescript
// Implement token blacklist using Redis or database
interface TokenBlacklist {
  token: string;
  revokedAt: Date;
  expiresAt: Date;
}

// Add logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await addToBlacklist(token, new Date(Date.now() + 24 * 60 * 60 * 1000));
  res.json({ success: true });
});

// Update auth middleware to check blacklist
async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (await isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token revoked' });
  }
  
  // ... existing JWT verification
}
```

#### Implementation Steps

1. Create token blacklist storage (Redis recommended for performance)
2. Add `/api/auth/logout` endpoint to revoke tokens
3. Update authentication middleware to check blacklist
4. Implement automatic cleanup of expired blacklist entries
5. Add UI logout button that calls logout endpoint
6. Reduce token lifetime to 1-2 hours with refresh token mechanism

**Priority**: IMMEDIATE - Essential for managing compromised sessions and device theft

---

## High-Priority Issues (Should Fix)

### 3. Missing JWT Secret Configuration

| Attribute | Details |
|-----------|---------|
| **Severity** | HIGH |
| **Location** | `backend/src/middleware/auth.ts:5`, `backend/src/handlers/users.ts:6` |
| **Risk Level** | MEDIUM |

#### The Problem

JWT secret defaults to a known development value, which is insecure for production use.

#### Why This Matters in LAN+VLAN

- **Token Forgery**: Anyone on LAN who discovers default secret can forge admin tokens
- **Insider Attack**: Disgruntled employee can impersonate any user
- **Default Credentials**: Development secrets often remain in production

#### Attack Scenarios

1. Employee finds default JWT secret in code or environment
2. Attacker forges admin token to gain full system access
3. Default secret used across multiple deployments increases exposure

#### Recommendation

```typescript
// backend/src/middleware/auth.ts
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key') {
  throw new Error('JWT_SECRET must be set in environment variables');
}

// Generate secure secret for .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Implementation Steps

1. Add validation to ensure JWT_SECRET is set and not default value
2. Generate secure random secret (64 bytes hex encoded)
3. Add JWT_SECRET to production environment variables
4. Update `.env.example` with instructions for generating secure secret
5. Add startup validation to fail if secret is not properly configured

**Priority**: HIGH - Prevents token forgery attacks

---

### 4. Excessive Logging of Sensitive Data

| Attribute | Details |
|-----------|---------|
| **Severity** | HIGH |
| **Location** | `backend/src/handlers/tables.ts:10-17` |
| **Risk Level** | MEDIUM |

#### The Problem

Request bodies containing sensitive data are logged to console, potentially exposing passwords, payment information, and other sensitive data.

#### Why This Matters in LAN+VLAN

- **Log Access**: Anyone with server access can read sensitive data in logs
- **Compliance**: Logging sensitive data may violate data protection regulations
- **Log Storage**: Logs may be backed up or retained indefinitely
- **Insider Threat**: Employees with log access can extract sensitive information

#### Attack Scenarios

1. System administrator reviews logs and sees customer payment data
2. Log files backed up to insecure location
3. Logs shared with third-party support contain sensitive data
4. Insider with log access extracts passwords from request bodies

#### Recommendation

```typescript
// Remove or sanitize request body logging
// backend/src/handlers/tables.ts

// BAD - Current implementation
app.use((req, res, next) => {
  console.log('Request body:', req.body); // Exposes sensitive data
  next();
});

// GOOD - Sanitized logging
app.use((req, res, next) => {
  const sanitizedBody = sanitizeForLogging(req.body);
  console.log(`${req.method} ${req.path}`, sanitizedBody);
  next();
});

function sanitizeForLogging(body: any): any {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'creditCard', 'cvv', 'token'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

#### Implementation Steps

1. Remove all request body logging from production code
2. If logging is needed, implement sanitization function
3. Add environment variable to enable/disable debug logging
4. Review all console.log statements for sensitive data
5. Implement structured logging with log levels (info, warn, error)
6. Add log rotation and retention policies

**Priority**: HIGH - Prevents sensitive data exposure through logs

---

### 5. Information Disclosure in Error Messages

| Attribute | Details |
|-----------|---------|
| **Severity** | MEDIUM |
| **Location** | Multiple handlers return generic error messages |
| **Risk Level** | MEDIUM |

#### The Problem

Error messages may leak system information that helps attackers understand the application structure.

#### Why This Matters in LAN+VLAN

- **Reconnaissance**: Error messages help internal attackers map the system
- **Insider Threat**: Employees can use error messages to find vulnerabilities
- **Debug Information**: Stack traces reveal implementation details

#### Attack Scenarios

1. Error messages reveal database schema information
2. Stack traces expose file paths and internal structure
3. Validation errors reveal field names and constraints
4. Insider uses error messages to identify weak points

#### Recommendation

```typescript
// Create error handler for production
// backend/src/middleware/errorHandler.ts

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log full error for debugging
  console.error('Error:', err);
  
  // Return generic error to client
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'An error occurred. Please try again.' 
    });
  } else {
    // Development: return full error details
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
}

// Use in routes
app.get('/api/endpoint', async (req, res) => {
  try {
    // ... route logic
  } catch (error) {
    // Don't return detailed error to client
    res.status(400).json({ error: 'Invalid request' });
  }
});
```

#### Implementation Steps

1. Create centralized error handler middleware
2. Return generic errors in production mode
3. Log detailed errors server-side only
4. Review all error responses for information disclosure
5. Add NODE_ENV environment variable
6. Test error handling in both development and production modes

**Priority**: MEDIUM - Reduces reconnaissance for insider threats

---

### 6. Exposed Backend Port

| Attribute | Details |
|-----------|---------|
| **Severity** | MEDIUM |
| **Location** | `docker-compose.yml:43` |
| **Risk Level** | MEDIUM |

#### The Problem

Backend service exposes its port to the host network instead of remaining internal to container network.

#### Why This Matters in LAN+VLAN

- **Attack Surface**: Exposing backend increases potential attack vectors
- **Misconfiguration**: Firewall rules could accidentally expose backend beyond VLAN
- **Direct Access**: Backend API could be accessed directly, bypassing frontend

#### Attack Scenarios

1. Misconfigured firewall exposes backend to entire LAN
2. Attacker discovers backend API and probes for vulnerabilities
3. Direct API access bypasses frontend security controls
4. Backend port conflicts with other services

#### Recommendation

```yaml
# docker-compose.yml

services:
  backend:
    # Remove ports mapping to keep backend internal
    # ports:
    #   - "3001:3001"  # REMOVE THIS
    
    # Keep backend on internal network only
    networks:
      - internal-network
      
  frontend:
    ports:
      - "3000:3000"
    networks:
      - internal-network
      
  nginx:
    ports:
      - "80:80"
    networks:
      - internal-network
      - external-network

networks:
  internal-network:
    driver: bridge
    internal: true  # No external access
  external-network:
    driver: bridge
```

#### Implementation Steps

1. Remove backend port mapping from docker-compose.yml
2. Create internal Docker network for backend-frontend communication
3. Use nginx reverse proxy to expose only necessary endpoints
4. Configure nginx to handle CORS and security headers
5. Test that frontend can still communicate with backend
6. Verify backend is not accessible from host network

**Priority**: MEDIUM - Reduces attack surface and enforces proper network segmentation

---

### 7. Sensitive Data in API Responses

| Attribute | Details |
|-----------|---------|
| **Severity** | MEDIUM |
| **Location** | `backend/src/handlers/users.ts` |
| **Risk Level** | MEDIUM |

#### The Problem

API responses include full user objects, potentially exposing password fields and other sensitive information.

#### Why This Matters in LAN+VLAN

- **Data Leakage**: Any API response could expose sensitive data
- **Insider Threat**: Employees with API access can extract passwords
- **Client Exposure**: Frontend code receives sensitive data unnecessarily

#### Attack Scenarios

1. API response includes password field in user object
2. Browser console logs expose sensitive data
3. API proxy or logging captures sensitive responses
4. Insider with API access extracts user credentials

#### Recommendation

```typescript
// Create DTOs for API responses
// backend/src/types/dto.ts

export interface UserResponseDTO {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
  // Password field intentionally excluded
}

// Transform user objects before returning
function toUserDTO(user: any): UserResponseDTO {
  const { password, ...userDTO } = user;
  return userDTO;
}

// Use in handlers
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  const userDTOs = users.map(toUserDTO);
  res.json(userDTOs);
});
```

#### Implementation Steps

1. Create DTO interfaces for all API responses
2. Implement transformation functions to exclude sensitive fields
3. Update all handlers to use DTOs instead of raw database objects
4. Add automated tests to verify sensitive fields are not exposed
5. Review all API endpoints for data exposure
6. Implement response sanitization middleware

**Priority**: MEDIUM - Prevents sensitive data leakage through API responses

---

### 8. Excessive Token Lifetime

| Attribute | Details |
|-----------|---------|
| **Severity** | MEDIUM |
| **Location** | `backend/src/handlers/users.ts:138` |
| **Risk Level** | MEDIUM |

#### The Problem

JWT tokens have 24-hour expiration, which is excessive for POS systems and extends the window for abuse if tokens are compromised.

#### Why This Matters in LAN+VLAN

- **Extended Exposure**: Compromised tokens give 24 hours of unauthorized access
- **POS Context**: High-turnover environments need shorter sessions
- **Device Sharing**: Multiple employees may share POS terminals

#### Attack Scenarios

1. Unattended terminal accessed; attacker has 24 hours of access
2. Token captured via malware; valid for 24 hours
3. Employee forgets to log out; session remains active
4. Stolen device provides 24 hours of access before token expires

#### Recommendation

```typescript
// Reduce token lifetime and implement refresh tokens
// backend/src/handlers/users.ts

const ACCESS_TOKEN_LIFETIME = '2h'; // 2 hours
const REFRESH_TOKEN_LIFETIME = '7d'; // 7 days

function generateTokens(user: any) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_LIFETIME }
  );
  
  return { accessToken, refreshToken };
}

// Add refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

#### Implementation Steps

1. Reduce access token lifetime to 1-2 hours
2. Implement refresh token mechanism with longer lifetime
3. Add `/api/auth/refresh` endpoint
4. Update frontend to automatically refresh tokens
5. Implement refresh token rotation
6. Add refresh token blacklist for logout

**Priority**: MEDIUM - Reduces exposure window for compromised tokens

---

## Lower Priority Issues (Nice to Have)

### 9. Missing CSRF Protection

| Attribute | Details |
|-----------|---------|
| **Severity** | LOW |
| **Location** | Not implemented |
| **Risk Level** | LOW (in LAN context) |

#### The Problem

No explicit CSRF tokens or protection mechanisms identified in the application.

#### Why This Matters Less in LAN+VLAN

- CSRF requires external websites to trick users
- Less likely in controlled LAN environment
- Still relevant if POS devices have internet access

#### Recommendation

Implement CSRF tokens if POS devices have internet access or if internal web applications exist.

**Priority**: LOW - Only necessary if POS devices access external websites

---

### 10. Overly Permissive CORS

| Attribute | Details |
|-----------|---------|
| **Severity** | LOW |
| **Location** | `backend/src/index.ts:13-26` |
| **Risk Level** | LOW (in LAN context) |

#### The Problem

CORS configuration allows multiple origins, including LAN IP addresses.

#### Why This Matters Less in LAN+VLAN

- CORS primarily protects against browser-based attacks from external origins
- Less critical in isolated VLAN
- Still relevant if internal web applications exist

#### Recommendation

Restrict CORS to only required origins if internal web applications exist.

**Priority**: LOW - Only necessary if multiple internal web applications exist

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

- [ ] Implement password hashing with bcrypt
- [ ] Create migration to hash existing passwords
- [ ] Implement token blacklist mechanism
- [ ] Add logout endpoint
- [ ] Update authentication middleware

### Phase 2: High-Priority Fixes (Week 2)

- [ ] Enforce secure JWT secret configuration
- [ ] Remove sensitive data from logging
- [ ] Implement sanitized logging
- [ ] Create centralized error handler
- [ ] Update error responses for production

### Phase 3: Medium-Priority Fixes (Week 3)

- [ ] Hide backend behind internal Docker network
- [ ] Implement nginx reverse proxy
- [ ] Create DTOs for API responses
- [ ] Update all handlers to use DTOs
- [ ] Reduce token lifetime to 2 hours
- [ ] Implement refresh token mechanism

### Phase 4: Testing & Validation (Week 4)

- [ ] Security testing of authentication flow
- [ ] Penetration testing for insider threats
- [ ] Log review for sensitive data exposure
- [ ] API response validation
- [ ] Token revocation testing
- [ ] Performance testing of new security measures

---

## Additional Recommendations

### Security Monitoring

- Implement audit logging for security-sensitive operations
- Monitor for failed authentication attempts
- Alert on suspicious API activity patterns
- Log all token revocations

### Access Control

- Implement principle of least privilege for database access
- Regularly review and audit user permissions
- Implement role-based access control at database level
- Use separate database users for different application components

### Data Protection

- Encrypt sensitive data at rest (database encryption)
- Implement secure backup procedures
- Regular security audits of codebase
- Dependency vulnerability scanning

### Operational Security

- Implement secure key management for secrets
- Regular security training for staff
- Incident response plan for security breaches
- Regular penetration testing

---

## Compliance Considerations

### GDPR

- Plain text password storage violates Article 32 (security of processing)
- Excessive logging may violate data minimization principle
- Data breach notification requirements

### PCI-DSS (if handling card payments)

- Requirement 2: Do not use vendor-supplied defaults for system passwords
- Requirement 3: Protect stored cardholder data
- Requirement 8: Identify and authenticate access to system components

### Industry Best Practices

- OWASP Top 10 compliance
- NIST Cybersecurity Framework
- ISO 27001 security controls

---

## Conclusion

While VLAN isolation provides protection against external network attacks, **8 security concerns remain critical or high-priority** for LAN+VLAN deployment. The two critical vulnerabilities (plain text passwords and no token revocation) must be addressed immediately as they enable complete system compromise from within the trusted network.

### Key Takeaway

Network isolation is not a substitute for application security. Insider threats, compromised devices, and misconfigured permissions remain significant risks that must be addressed through proper security controls.

### Recommended Action

Begin with Phase 1 critical fixes immediately, as these vulnerabilities pose the highest risk to the system regardless of network topology.
