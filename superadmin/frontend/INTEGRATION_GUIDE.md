# Frontend-Backend Integration Guide

This document explains the integration between the frontend and backend, known issues, and setup instructions.

## Overview

The SuperAdmin frontend is built with Next.js 16 and integrates with a Node.js/Express backend using RESTful APIs. The integration is designed to be robust, secure, and handle edge cases gracefully.

## Backend API Endpoints

### Available Endpoints

#### Authentication (`/user/*`)
- `POST /user/login` - User login with OTP verification
- `GET /user/data` - Get current user details (authenticated)
- `POST /user/logout` - Logout current session
- `POST /user/logout/all` - Logout all sessions
- `POST /user/forgot/password` - Reset password with OTP
- `POST /user/send-otp` - Send OTP for login (requires credentials validation)

#### User Management (`/admin/users/*`)
- `GET /users` - Get all users with login status
- `GET /admin/users/all` - Get all users (admin only)
- `GET /admin/users/:id` - Get user by ID
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/delete/user/:id` - Soft delete user
- `DELETE /admin/hard/delete/user/:id` - Hard delete user
- `PATCH /admin/recover/user/:id` - Recover soft-deleted user
- `POST /admin/logout/user/:id` - Logout user by admin
- `PATCH /admin/change/usertype/user/:id` - Change user role

#### Module Management (`/admin/modules/*`)
- `GET /admin/modules` - Get all modules
- `GET /admin/modules/:id` - Get module by ID
- `POST /admin/modules` - Create new module
- `PUT /admin/modules/:id` - Update module
- `PATCH /admin/modules/:id/deactivate` - Deactivate module

#### Roles & Permissions (`/admin/*`)
- `GET /admin/users/:userId/modules` - Get user's assigned modules
- `POST /admin/assign/module` - Assign module to user
- `POST /admin/unassign/module` - Unassign module from user

#### User Types (`/admin/user-types/*`)
- `GET /admin/user-types` - Get all user types
- `GET /admin/user-types/:id` - Get user type by ID
- `POST /admin/user-types` - Create new user type
- `PUT /admin/user-types/:id` - Update user type
- `DELETE /admin/user-types/:id` - Delete user type

### Currently Unavailable Endpoints

The following endpoints are **NOT implemented** in the backend yet:

#### Activity Logs (Planned)
- `GET /activity-logs`
- `GET /activity-logs/user/:userId`
- `GET /activity-logs/:id`
- `DELETE /activity-logs/:id`

#### Access Overview & Analytics (Planned)
- `GET /admin/access-matrix`
- `GET /admin/user-type-permissions`
- `GET /admin/permission-analytics`
- `POST /admin/bulk-assign-modules`

**Note:** These features are disabled by default using feature flags. See the "Feature Flags" section below.

## Key Integration Points

### 1. API Client (`lib/api.ts`)

The API client handles:
- **Automatic retry logic** for network errors and server errors
- **Network status monitoring** to detect offline/online state
- **Rate limit handling** with retry-after headers
- **Empty response handling** for endpoints that return no body
- **Cookie-based authentication** with credentials included on all requests
- **Type-safe interfaces** for all API requests and responses

#### Important Implementation Details

**Empty Response Handling:**
```typescript
// Some endpoints return empty bodies (status 204 or content-length 0)
// Examples: logout, recover user, change role
if (response.status === 204 || contentLength === '0') {
  data = undefined;
}
```

**409 Error Mapping:**
```typescript
// Backend returns 409 for invalid credentials during login
case 409:
  return error.message || 'Invalid credentials or verification code. Please try again.';
```

**UserType Response Mapping:**
```typescript
// Backend createUserType returns 'id' but frontend expects 'user_type_id'
const response = await apiClient.post('/admin/user-types', data);
return {
  message: response.message,
  userType: {
    user_type_id: response.userType.id, // Map id -> user_type_id
    user_type_name: response.userType.user_type_name,
    user_type_value: response.userType.user_type_value,
    is_active: true,
  }
};
```

### 2. Authentication Provider (`components/AuthProvider.tsx`)

The AuthProvider manages:
- User session state
- Automatic session validation
- Token refresh attempts
- Logout on auth errors
- Periodic session checks (every 5 minutes)

**Type Safety:**
```typescript
// Use UserDetails type instead of 'any'
const [user, setUser] = useState<UserDetails | null>(null);
```

### 3. Feature Flags (`lib/featureFlags.ts`)

Feature flags allow graceful handling of unimplemented backend features:

```typescript
export const FEATURE_FLAGS = {
  ACTIVITY_LOGS: process.env.NEXT_PUBLIC_ENABLE_ACTIVITY_LOGS === 'true',
  ACCESS_OVERVIEW: process.env.NEXT_PUBLIC_ENABLE_ACCESS_OVERVIEW === 'true',
  PERMISSION_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_PERMISSION_ANALYTICS === 'true',
  BULK_ASSIGN_MODULES: process.env.NEXT_PUBLIC_ENABLE_BULK_ASSIGN_MODULES === 'true',
};
```

When a feature is disabled, the frontend shows a user-friendly message instead of failing with API errors.

### 4. Type Safety Improvements

All date fields are now optional to handle backend responses that may omit them:

```typescript
export interface User {
  user_id: number;
  // ... other fields
  created_date?: string;      // Optional
  last_updated_date?: string; // Optional
}
```

This prevents runtime errors when rendering dates:
```typescript
{userType.created_date ? new Date(userType.created_date).toLocaleDateString() : 'N/A'}
```

## Development Setup

### 1. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Feature Flags (disabled by default for missing backend features)
NEXT_PUBLIC_ENABLE_ACTIVITY_LOGS=false
NEXT_PUBLIC_ENABLE_ACCESS_OVERVIEW=false
NEXT_PUBLIC_ENABLE_PERMISSION_ANALYTICS=false
NEXT_PUBLIC_ENABLE_BULK_ASSIGN_MODULES=false

# Backend API URL for proxy (optional)
BACKEND_API_URL=http://localhost:4000
```

### 2. Cookie Authentication in Development

The backend sets secure cookies (`secure: true`, `sameSite: 'lax'`). For proper authentication in development, you have two options:

#### Option A: Use HTTPS in Development (Recommended)

1. Install `mkcert` for local SSL certificates:
```bash
# macOS
brew install mkcert
mkcert -install

# Linux
sudo apt install libnss3-tools
sudo pacman -S nss # Arch Linux
mkcert -install

# Windows
choco install mkcert
mkcert -install
```

2. Generate certificates:
```bash
cd frontend
mkcert localhost
```

3. Run Next.js with HTTPS:
```bash
npm run dev -- --experimental-https
```

#### Option B: Use API Proxy (Alternative)

The frontend is configured with API rewrites. To use this:

1. Set `NEXT_PUBLIC_API_URL=/api` in `.env.local`
2. Run `npm run dev` normally
3. The `/api/*` requests will be proxied to `http://localhost:4000`

### 3. Running the Application

**Backend:**
```bash
cd devcreations-backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at:
- HTTP: `http://localhost:3000/superadmin`
- HTTPS (if configured): `https://localhost:3000/superadmin`

## Error Handling

### Network Errors
- Automatically retried up to 3 times with exponential backoff
- User sees "Network error. Please check your connection" message
- Offline state detected via browser `navigator.onLine` API

### Rate Limiting (429)
- Respects `Retry-After` header from backend
- Shows user how long to wait before retrying
- Prevents rapid retry attempts

### Authentication Errors (401)
- Triggers automatic logout
- Shows "Authentication required" message
- Redirects to login page (via `LayoutContent`)

### Validation Errors (400, 422)
- Shows backend error message if available
- Falls back to generic "Validation failed" message

### Server Errors (500+)
- Automatically retried for temporary issues
- Shows "Server error" message to user

## Security Considerations

1. **Credentials are included on all requests** - Ensures cookies are sent/received
2. **HTTPS in production** - Required for secure cookie transmission
3. **Rate limiting** - Prevents brute force attacks
4. **Session validation** - Periodic checks ensure valid session
5. **Auto-logout on auth errors** - Prevents unauthorized access
6. **Input validation** - Both client and server-side

## Testing

Run integration tests:
```bash
cd frontend
npm run test:integration
```

Run type checking:
```bash
npm run build
```

## Troubleshooting

### Issue: Always logged out in development
**Solution:** Enable HTTPS or use the API proxy. The backend sets secure cookies that won't work over HTTP.

### Issue: 404 errors on feature pages
**Solution:** Check feature flags in `.env.local`. Some features are disabled by default because backend endpoints don't exist yet.

### Issue: "Invalid credentials" on correct login
**Solution:** Ensure OTP is being sent correctly. The backend validates both password AND OTP on login.

### Issue: TypeScript errors on date fields
**Solution:** Use optional chaining: `user.created_date?.toLocaleDateString()` or provide fallback: `user.created_date ? ... : 'N/A'`

## Future Enhancements

1. **Activity Logs Backend** - Implement activity logging endpoints
2. **Access Analytics Backend** - Implement analytics and bulk assignment endpoints
3. **SSR for authenticated pages** - Improve initial load performance
4. **WebSocket support** - Real-time updates for user sessions and permissions
5. **Advanced caching** - React Query or SWR for better data synchronization

## API Response Examples

### Successful Response
```json
{
  "message": "User created successfully",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "is_active": true
  }
}
```

### Error Response
```json
{
  "error": "Invalid credentials!"
}
```

### Empty Response
Some endpoints return `res.status(200).end()` with no body:
- `POST /admin/logout/user/:id`
- `PATCH /admin/recover/user/:id`
- `PATCH /admin/change/usertype/user/:id`

The API client handles these gracefully by returning `undefined`.

## Summary

This integration is production-ready for all implemented backend features. The frontend handles:
- ✅ Robust error handling with retries
- ✅ Type safety throughout
- ✅ Graceful degradation for missing features
- ✅ Secure authentication with cookies
- ✅ Network resilience
- ✅ Rate limit compliance
- ✅ Comprehensive validation

When backend endpoints for activity logs and analytics are implemented, simply set the corresponding feature flags to `true` and the frontend will work immediately.
