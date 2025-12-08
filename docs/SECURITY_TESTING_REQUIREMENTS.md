# Security Testing Requirements

**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

---

## Overview

This document establishes comprehensive security testing requirements for the amei.beauty application. All security tests must be performed before production deployment and should be integrated into the CI/CD pipeline.

---

## 1. AUTHENTICATION & AUTHORIZATION TESTING

### 1.1 Authentication Testing

**Test Cases**:

1. **TC-AUTH-001**: Verify authentication is required for all state-changing operations
   - **Test**: Attempt to publish/update/delete without authentication
   - **Expected**: 401 Unauthorized response
   - **Priority**: CRITICAL

2. **TC-AUTH-002**: Verify authentication tokens expire appropriately
   - **Test**: Use expired token for API request
   - **Expected**: 401 Unauthorized with token expiration message
   - **Priority**: HIGH

3. **TC-AUTH-003**: Verify invalid authentication tokens are rejected
   - **Test**: Send malformed/invalid token
   - **Expected**: 401 Unauthorized response
   - **Priority**: HIGH

4. **TC-AUTH-004**: Verify token refresh mechanism (if implemented)
   - **Test**: Refresh token before expiration
   - **Expected**: New token issued, old token invalidated
   - **Priority**: MEDIUM

### 1.2 Authorization Testing

**Test Cases**:

1. **TC-AUTHZ-001**: Verify users can only update their own cards
   - **Test**: Attempt to update card with different user's ID
   - **Expected**: 403 Forbidden response
   - **Priority**: CRITICAL

2. **TC-AUTHZ-002**: Verify users can only delete their own cards
   - **Test**: Attempt to delete card with different user's ID
   - **Expected**: 403 Forbidden response
   - **Priority**: CRITICAL

3. **TC-AUTHZ-003**: Verify read operations are properly scoped
   - **Test**: Attempt to access private/unpublished cards
   - **Expected**: 404 Not Found (don't reveal existence)
   - **Priority**: MEDIUM

### 1.3 Session Management Testing

**Test Cases**:

1. **TC-SESSION-001**: Verify session timeout works correctly
   - **Test**: Wait for session timeout, attempt operation
   - **Expected**: Session expired, re-authentication required
   - **Priority**: HIGH

2. **TC-SESSION-002**: Verify concurrent session handling
   - **Test**: Login from multiple devices/locations
   - **Expected**: All sessions valid, or old sessions invalidated
   - **Priority**: MEDIUM

---

## 2. INPUT VALIDATION TESTING

### 2.1 SQL Injection Testing

**Test Cases**:

1. **TC-SQL-001**: Test SQL injection in search query
   - **Test**: `q=test' OR '1'='1`
   - **Expected**: Query sanitized, no SQL injection possible
   - **Priority**: CRITICAL

2. **TC-SQL-002**: Test SQL injection in username field
   - **Test**: `username=admin'--`
   - **Expected**: Validation error, query not executed
   - **Priority**: CRITICAL

3. **TC-SQL-003**: Test SQL injection in all text input fields
   - **Test**: Various SQL injection patterns in all fields
   - **Expected**: All inputs validated/sanitized
   - **Priority**: CRITICAL

**Test Vectors**:
```sql
' OR '1'='1
'; DROP TABLE cards; --
' UNION SELECT * FROM cards --
1' OR '1'='1
admin'--
```

### 2.2 XSS (Cross-Site Scripting) Testing

**Test Cases**:

1. **TC-XSS-001**: Test stored XSS in profile fields
   - **Test**: `<script>alert('XSS')</script>` in full_name
   - **Expected**: Content escaped, script not executed
   - **Priority**: CRITICAL

2. **TC-XSS-002**: Test reflected XSS in search results
   - **Test**: `<img src=x onerror=alert('XSS')>` in search query
   - **Expected**: Content escaped in results
   - **Priority**: CRITICAL

3. **TC-XSS-003**: Test DOM-based XSS
   - **Test**: `#<script>alert('XSS')</script>` in URL fragment
   - **Expected**: No script execution
   - **Priority**: HIGH

**Test Vectors**:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
javascript:alert('XSS')
<iframe src="javascript:alert('XSS')">
```

### 2.3 Command Injection Testing

**Test Cases**:

1. **TC-CMD-001**: Test command injection in file upload
   - **Test**: Filename with `; rm -rf /`
   - **Expected**: Filename sanitized, command not executed
   - **Priority**: HIGH

2. **TC-CMD-002**: Test command injection in URL parameters
   - **Test**: `?file=test; ls`
   - **Expected**: Parameter validated, command not executed
   - **Priority**: HIGH

### 2.4 Input Length & Format Testing

**Test Cases**:

1. **TC-LEN-001**: Test maximum length limits
   - **Test**: Send 10MB JSON payload
   - **Expected**: Request rejected with 413 Payload Too Large
   - **Priority**: HIGH

2. **TC-LEN-002**: Test extremely long strings
   - **Test**: 10,000 character username
   - **Expected**: Validation error, max length enforced
   - **Priority**: MEDIUM

3. **TC-FMT-001**: Test invalid data formats
   - **Test**: Send invalid JSON, invalid email, invalid phone
   - **Expected**: Validation errors returned
   - **Priority**: MEDIUM

---

## 3. API SECURITY TESTING

### 3.1 Rate Limiting Testing

**Test Cases**:

1. **TC-RATE-001**: Verify rate limiting on search endpoint
   - **Test**: Send 100 requests in 1 minute
   - **Expected**: Rate limit enforced, 429 Too Many Requests after threshold
   - **Priority**: HIGH

2. **TC-RATE-002**: Verify rate limiting on publish endpoint
   - **Test**: Attempt to publish 20 cards rapidly
   - **Expected**: Rate limit enforced
   - **Priority**: HIGH

3. **TC-RATE-003**: Verify rate limit reset
   - **Test**: Wait for rate limit window, retry
   - **Expected**: Requests allowed again
   - **Priority**: MEDIUM

### 3.2 CORS Testing

**Test Cases**:

1. **TC-CORS-001**: Verify CORS allows only whitelisted origins
   - **Test**: Request from unauthorized origin
   - **Expected**: CORS error, request blocked
   - **Priority**: HIGH

2. **TC-CORS-002**: Verify CORS preflight requests
   - **Test**: OPTIONS request with custom headers
   - **Expected**: Proper CORS headers returned
   - **Priority**: MEDIUM

3. **TC-CORS-003**: Verify credentials handling
   - **Test**: Request with credentials from allowed origin
   - **Expected**: Credentials handled correctly
   - **Priority**: MEDIUM

### 3.3 CSRF Testing

**Test Cases**:

1. **TC-CSRF-001**: Verify CSRF protection on state-changing operations
   - **Test**: POST request without CSRF token
   - **Expected**: 403 Forbidden response
   - **Priority**: HIGH

2. **TC-CSRF-002**: Verify CSRF token validation
   - **Test**: POST with invalid CSRF token
   - **Expected**: 403 Forbidden response
   - **Priority**: HIGH

3. **TC-CSRF-003**: Test CSRF via cross-origin form submission
   - **Test**: Submit form from malicious site
   - **Expected**: Request blocked
   - **Priority**: HIGH

---

## 4. DATA PROTECTION TESTING

### 4.1 Sensitive Data Exposure

**Test Cases**:

1. **TC-DATA-001**: Verify no sensitive data in error messages
   - **Test**: Trigger various errors
   - **Expected**: Generic error messages, no stack traces
   - **Priority**: HIGH

2. **TC-DATA-002**: Verify no sensitive data in logs
   - **Test**: Check application logs
   - **Expected**: No passwords, tokens, or PII in logs
   - **Priority**: HIGH

3. **TC-DATA-003**: Verify HTTPS enforcement
   - **Test**: Attempt HTTP connection
   - **Expected**: Redirect to HTTPS or connection refused
   - **Priority**: HIGH

### 4.2 Data Validation

**Test Cases**:

1. **TC-VAL-001**: Verify data type validation
   - **Test**: Send string where number expected
   - **Expected**: Validation error
   - **Priority**: MEDIUM

2. **TC-VAL-002**: Verify data range validation
   - **Test**: Send negative numbers where positive expected
   - **Expected**: Validation error
   - **Priority**: MEDIUM

---

## 5. FILE UPLOAD SECURITY TESTING

### 5.1 File Type Validation

**Test Cases**:

1. **TC-FILE-001**: Test upload of executable files
   - **Test**: Upload .exe, .sh, .php files
   - **Expected**: Rejected with validation error
   - **Priority**: CRITICAL

2. **TC-FILE-002**: Test MIME type spoofing
   - **Test**: Rename .exe to .jpg, upload
   - **Expected**: Magic bytes check fails, file rejected
   - **Priority**: CRITICAL

3. **TC-FILE-003**: Test double extension
   - **Test**: Upload file.jpg.exe
   - **Expected**: Rejected or extension sanitized
   - **Priority**: HIGH

### 5.2 File Content Validation

**Test Cases**:

1. **TC-FILE-004**: Verify magic bytes validation
   - **Test**: Upload file with correct extension but wrong content
   - **Expected**: Magic bytes check fails, file rejected
   - **Priority**: HIGH

2. **TC-FILE-005**: Test file size limits
   - **Test**: Upload 10MB file
   - **Expected**: Rejected with size limit error
   - **Priority**: MEDIUM

3. **TC-FILE-006**: Test image dimension limits
   - **Test**: Upload 10000x10000px image
   - **Expected**: Dimension validation, rejection or resize
   - **Priority**: MEDIUM

### 5.3 Filename Security

**Test Cases**:

1. **TC-FILE-007**: Test path traversal in filename
   - **Test**: Upload `../../../etc/passwd`
   - **Expected**: Filename sanitized, path traversal prevented
   - **Priority**: CRITICAL

2. **TC-FILE-008**: Test special characters in filename
   - **Test**: Upload file with `<>:"/\|?*`
   - **Expected**: Filename sanitized
   - **Priority**: MEDIUM

---

## 6. PAYMENT SECURITY TESTING

### 6.1 Stripe Webhook Testing

**Test Cases**:

1. **TC-PAY-001**: Verify webhook signature validation
   - **Test**: Send webhook without signature
   - **Expected**: Request rejected
   - **Priority**: CRITICAL

2. **TC-PAY-002**: Verify webhook signature validation with invalid signature
   - **Test**: Send webhook with tampered signature
   - **Expected**: Request rejected
   - **Priority**: CRITICAL

3. **TC-PAY-003**: Test webhook idempotency
   - **Test**: Send same webhook event twice
   - **Expected**: Second event ignored (idempotent)
   - **Priority**: HIGH

4. **TC-PAY-004**: Test payment amount validation
   - **Test**: Attempt to modify payment amount in webhook
   - **Expected**: Amount verified against Stripe, tampering detected
   - **Priority**: CRITICAL

### 6.2 Payment Flow Testing

**Test Cases**:

1. **TC-PAY-005**: Verify payment status cannot be manually set
   - **Test**: Attempt to set payment_status via API
   - **Expected**: Field ignored or request rejected
   - **Priority**: HIGH

2. **TC-PAY-006**: Test payment replay attacks
   - **Test**: Replay old payment webhook
   - **Expected**: Idempotency check prevents duplicate processing
   - **Priority**: HIGH

---

## 7. INFRASTRUCTURE SECURITY TESTING

### 7.1 Security Headers Testing

**Test Cases**:

1. **TC-HEAD-001**: Verify Content-Security-Policy header
   - **Test**: Check CSP header in response
   - **Expected**: Strict CSP present, no unsafe-inline/unsafe-eval
   - **Priority**: HIGH

2. **TC-HEAD-002**: Verify X-Frame-Options header
   - **Test**: Check X-Frame-Options header
   - **Expected**: DENY or SAMEORIGIN present
   - **Priority**: MEDIUM

3. **TC-HEAD-003**: Verify HSTS header
   - **Test**: Check Strict-Transport-Security header
   - **Expected**: HSTS header with max-age present
   - **Priority**: MEDIUM

4. **TC-HEAD-004**: Verify X-Content-Type-Options header
   - **Test**: Check X-Content-Type-Options header
   - **Expected**: nosniff present
   - **Priority**: MEDIUM

### 7.2 Error Handling Testing

**Test Cases**:

1. **TC-ERR-001**: Verify error messages don't leak information
   - **Test**: Trigger various errors
   - **Expected**: Generic messages, no stack traces or internal details
   - **Priority**: HIGH

2. **TC-ERR-002**: Test error handling for malformed requests
   - **Test**: Send malformed JSON, invalid HTTP methods
   - **Expected**: Proper error responses, no crashes
   - **Priority**: MEDIUM

---

## 8. BUSINESS LOGIC TESTING

### 8.1 Update Lock Testing

**Test Cases**:

1. **TC-LOCK-001**: Verify update lock after free period expires
   - **Test**: Attempt to update card after free period
   - **Expected**: Update rejected with lock message
   - **Priority**: HIGH

2. **TC-LOCK-002**: Verify update unlock after endorsement threshold
   - **Test**: Reach 6 endorsements, attempt update
   - **Expected**: Updates enabled for 6 months
   - **Priority**: HIGH

3. **TC-LOCK-003**: Verify payment unlocks updates
   - **Test**: Complete payment, attempt update
   - **Expected**: Updates enabled for 12 months
   - **Priority**: HIGH

### 8.2 Endorsement Testing

**Test Cases**:

1. **TC-END-001**: Verify endorsement count increments correctly
   - **Test**: Create multiple endorsements
   - **Expected**: Count increments, thresholds trigger correctly
   - **Priority**: MEDIUM

2. **TC-END-002**: Test endorsement spam prevention
   - **Test**: Attempt to endorse same card multiple times rapidly
   - **Expected**: Rate limiting or duplicate prevention
   - **Priority**: MEDIUM

---

## 9. AUTOMATED SECURITY TESTING

### 9.1 Static Analysis

**Tools**:
- ESLint security plugins
- Semgrep
- SonarQube
- CodeQL

**Requirements**:
- Run on every commit
- Block merge on critical findings
- Review medium/low findings weekly

### 9.2 Dependency Scanning

**Tools**:
- npm audit
- Snyk
- Dependabot

**Requirements**:
- Scan dependencies weekly
- Update vulnerable dependencies within 7 days
- Block deployment on critical vulnerabilities

### 9.3 Dynamic Analysis

**Tools**:
- OWASP ZAP
- Burp Suite
- Nuclei

**Requirements**:
- Run weekly scans
- Review findings within 48 hours
- Fix critical issues within 7 days

---

## 10. PENETRATION TESTING

### 10.1 Scope

**In-Scope**:
- All API endpoints
- Authentication mechanisms
- File upload functionality
- Payment processing
- Admin functions (if any)

**Out-of-Scope**:
- Infrastructure (Cloudflare)
- Third-party services (Stripe)

### 10.2 Frequency

- **Full Penetration Test**: Annually or before major releases
- **Focused Tests**: Quarterly or after significant changes
- **Bug Bounty**: Consider implementing

---

## 11. TEST EXECUTION REQUIREMENTS

### 11.1 Pre-Deployment Testing

**Required Tests** (Must Pass):
- All CRITICAL priority tests
- All HIGH priority authentication/authorization tests
- All HIGH priority input validation tests
- Payment security tests

### 11.2 Continuous Testing

**Automated**:
- Run on every commit
- Run on every pull request
- Run nightly full suite

**Manual**:
- Review automated test results weekly
- Perform manual security review monthly
- Full penetration test annually

---

## 12. TEST REPORTING

### 12.1 Test Results Format

```markdown
## Security Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Scope**: [Scope description]

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Critical Findings
[List critical findings]

### Recommendations
[List recommendations]
```

### 12.2 Severity Classification

- **CRITICAL**: Fix immediately, block deployment
- **HIGH**: Fix within 7 days
- **MEDIUM**: Fix within 30 days
- **LOW**: Fix in next release cycle

---

## 13. REMEDIATION PROCESS

1. **Identify**: Document vulnerability
2. **Assess**: Determine severity and impact
3. **Plan**: Create remediation plan
4. **Fix**: Implement fix
5. **Verify**: Re-test to confirm fix
6. **Document**: Update security documentation

---

## 14. REFERENCES

- OWASP Top 10
- OWASP Testing Guide
- CWE Top 25
- PCI DSS (if handling payments)
- LGPD (Brazil data protection law)

---

## APPENDIX: TEST SCRIPTS

### Example: SQL Injection Test Script

```bash
#!/bin/bash
# Test SQL injection in search endpoint

ENDPOINT="https://api.amei.beauty/api/search"

# Test vectors
declare -a vectors=(
  "test' OR '1'='1"
  "'; DROP TABLE cards; --"
  "1' UNION SELECT * FROM cards --"
)

for vector in "${vectors[@]}"; do
  echo "Testing: $vector"
  curl -X GET "$ENDPOINT?q=$vector" -H "Content-Type: application/json"
  echo -e "\n"
done
```

### Example: XSS Test Script

```javascript
// Test XSS in profile fields
const xssVectors = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')",
];

async function testXSS() {
  for (const vector of xssVectors) {
    const response = await fetch('/api/publish', {
      method: 'POST',
      body: JSON.stringify({
        profile: { full_name: vector }
      })
    });
    // Verify content is escaped in response
  }
}
```

---

**Document Owner**: Security Team  
**Review Frequency**: Quarterly  
**Next Review**: 2025-03-19

