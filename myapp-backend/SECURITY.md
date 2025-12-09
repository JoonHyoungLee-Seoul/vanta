# Security Documentation

## Overview

This document describes the security improvements implemented for production deployment.

## JWT Authentication

### Implementation Details

The application uses JWT (JSON Web Token) authentication to secure API endpoints.

- **Token Generation**: JWT tokens are generated upon successful login in `/auth/login`
- **Token Storage**: Tokens are stored in localStorage on the frontend
- **Token Validation**: Tokens are validated on every protected endpoint request
- **Token Expiration**: Tokens expire after 24 hours by default (configurable via `JWT_EXPIRATION_HOURS`)
- **Algorithm**: HS256 (HMAC with SHA-256)

### Protected Endpoints

The following endpoints require JWT authentication:

1. **User Endpoints** (requires valid user token):
   - `GET /profile/{user_id}` - Users can only access their own profile
   - `GET /coupon/{user_id}/{party_id}` - Users can only access their own coupons
   - `PUT /coupon/use` - Users can only use their own coupons
   - `POST /enroll` - Users can only enroll themselves

2. **Admin Endpoints** (requires admin privileges):
   - `GET /enrollments` - View all enrollments
   - `GET /enrollments/party/{party_id}` - View enrollments for specific party

### Public Endpoints

The following endpoints do NOT require authentication:
- `POST /auth/invitation/verify`
- `POST /auth/login`
- `POST /auth/register/*` (all registration steps)
- `GET /health`
- `GET /payment/info`
- `GET /enrollment/check/{user_id}/{party_id}`

## Environment Variables

### Required Changes for Production

Before deploying to production, update the following environment variables in your `.env` file:

```bash
# JWT Configuration - CHANGE THESE IN PRODUCTION
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Application Secret - CHANGE THIS IN PRODUCTION
SECRET_KEY=your-secret-key-here-minimum-32-characters

# Database - UPDATE WITH PRODUCTION DATABASE
DATABASE_URL=postgresql://user:password@host:port/database

# CORS Origins - ADD YOUR PRODUCTION FRONTEND URL
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-production-domain.com

# Admin Configuration - SET ADMIN USER IDS
ADMIN_USER_IDS=1,2,3
```

### Security Recommendations

1. **JWT_SECRET_KEY**: Generate a strong random secret (32+ characters)
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **DATABASE_URL**: Change the default database password immediately
   - Current password should be rotated
   - Use a strong password (16+ characters, mixed case, numbers, symbols)

3. **ADMIN_USER_IDS**: Set appropriate admin user IDs
   - Only trusted administrators should be included
   - Update this list as admin access changes

4. **ALLOWED_ORIGINS**: Add your production frontend URL
   - Include only trusted domains
   - Do not use wildcards (*) in production

## Admin Access

Administrators are identified by user ID rather than a database field. To grant admin access:

1. Add the user's ID to `ADMIN_USER_IDS` environment variable
2. Multiple IDs should be comma-separated (e.g., `1,5,10`)
3. Restart the application for changes to take effect

## Error Handling

Global error handlers are implemented for:
- Unhandled exceptions (500)
- Validation errors (400)
- Database errors (500)
- Value errors (400)

Error responses hide sensitive implementation details while logging full errors server-side.

## CORS Configuration

Cross-Origin Resource Sharing is configured via the `ALLOWED_ORIGINS` environment variable:
- Development: `http://localhost:5173,http://127.0.0.1:5173`
- Production: Add your production domain(s)

## Security Checklist for Production Deployment

- [ ] Generate and set a strong JWT_SECRET_KEY
- [ ] Generate and set a strong SECRET_KEY
- [ ] Rotate database password
- [ ] Update DATABASE_URL with new password
- [ ] Set ADMIN_USER_IDS appropriately
- [ ] Add production frontend URL to ALLOWED_ORIGINS
- [ ] Verify all .env variables are set correctly
- [ ] Ensure .env file is in .gitignore (never commit secrets)
- [ ] Enable HTTPS on production server
- [ ] Set up rate limiting (recommended)
- [ ] Configure log rotation and monitoring
- [ ] Review and test all protected endpoints

## Testing Authentication

### Test User Endpoint

```bash
# Login to get token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "testuser", "password": "testpass"}'

# Use token to access protected endpoint
curl -X GET http://localhost:8000/profile/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Admin Endpoint

```bash
# Login as admin user
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "adminuser", "password": "adminpass"}'

# Access admin endpoint
curl -X GET http://localhost:8000/enrollments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Frontend Integration

The frontend automatically includes JWT tokens in protected API requests:

1. Token is stored in localStorage upon successful login
2. API client includes `Authorization: Bearer {token}` header for protected endpoints
3. Token is cleared when user logs out (implement logout functionality if needed)

## Future Security Enhancements

Consider implementing:
- Token refresh mechanism for better UX
- Rate limiting per user/IP
- Account lockout after failed login attempts
- 2FA (Two-Factor Authentication)
- Security audit logging
- HTTPS-only cookie storage (instead of localStorage)
- Role-based access control (RBAC) with database-backed roles

## Support

For security concerns or questions, contact the development team.
