# Security Considerations

## Overview

This application includes several security measures, but as with any web application, there are important security considerations to be aware of.

## Implemented Security Features

### 1. Password Hashing
- All passwords are hashed using bcrypt with 10 rounds
- Passwords are never stored in plain text
- Password comparison is done securely using bcrypt.compare()

### 2. Session Management
- Sessions are managed server-side using express-session
- Session cookies are httpOnly to prevent XSS access
- Sessions expire after 24 hours
- Session secret should be set via environment variable

### 3. SQL Injection Protection
- All database queries use parameterized statements via mysql2
- User input is never concatenated directly into SQL queries

### 4. Role-Based Access Control (RBAC)
- Two roles: ADMIN and CAJERO (cashier)
- Middleware functions check authentication and authorization
- Frontend also restricts UI based on roles

### 5. CSRF Protection (Production Only)
- CSRF tokens are enabled in production mode
- Disabled in development for easier testing
- Can be enabled by setting `NODE_ENV=production`

## Known Security Considerations

### 1. Rate Limiting (Not Implemented)

**Issue**: API endpoints are not rate-limited.

**Risk**: Could be vulnerable to brute force attacks on login endpoint or DoS attacks.

**Mitigation Options**:
- For local/internal use: Risk is minimal
- For internet-facing deployments: Add rate limiting using express-rate-limit

Example implementation:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', loginLimiter);
```

### 2. CSRF Protection (Disabled in Development)

**Issue**: CSRF protection is disabled in development mode.

**Risk**: Cross-Site Request Forgery attacks possible in development.

**Mitigation**: 
- Enable CSRF in production by setting `NODE_ENV=production`
- Update frontend to include CSRF tokens if needed

### 3. Password Requirements

**Issue**: No password complexity requirements enforced.

**Risk**: Users can set weak passwords.

**Mitigation**: Consider adding password strength validation if deploying to production.

### 4. Input Validation

**Issue**: Limited input validation on API endpoints.

**Risk**: Malformed data could cause unexpected behavior.

**Mitigation**: Add validation library like express-validator for production use.

## Deployment Recommendations

### For Local/Internal Use
The current security implementation is suitable for:
- Local development
- Internal network deployment
- Trusted user environments
- Single-location stores

### For Internet-Facing Deployment
Additional security measures recommended:
1. **Enable HTTPS**: Use SSL/TLS certificates
2. **Add Rate Limiting**: Prevent abuse and DoS
3. **Enable CSRF Protection**: Set NODE_ENV=production
4. **Add Input Validation**: Use express-validator
5. **Regular Updates**: Keep dependencies updated
6. **Password Policies**: Enforce strong passwords
7. **Audit Logging**: Log security-relevant events
8. **Regular Backups**: Implement database backup strategy
9. **Firewall Rules**: Restrict database access
10. **Security Headers**: Use helmet.js

Example additions for production:
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('express-validator');

// Use helmet for security headers
app.use(helmet());

// Rate limit all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

## Environment Variables Security

### Required in Production
```env
DB_PASSWORD=<strong-database-password>
SESSION_SECRET=<random-32-byte-hex-string>
NODE_ENV=production
```

### Generating Secure Secrets
```bash
# Generate a secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Security

1. **Principle of Least Privilege**: Database user should only have necessary permissions
2. **Network Access**: Restrict MySQL to localhost or trusted IPs
3. **Regular Backups**: Implement automated backup strategy
4. **Encrypted Connections**: Use SSL for database connections in production

## Monitoring and Maintenance

1. **Log Review**: Regularly review application logs
2. **Dependency Updates**: Keep npm packages updated
3. **Security Scanning**: Run `npm audit` regularly
4. **CodeQL Scans**: Review CodeQL results periodically

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Contact the repository maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for a fix before public disclosure

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
