# BasePath Fix - `/superadmin` Routing Issue

## Issue
When logging out, users were being redirected to `http://localhost:3000/login` instead of `http://localhost:3000/superadmin/login`. This was because some components were using `window.location.href` which bypasses Next.js's basePath handling.

## Root Cause
Next.js config has `basePath: '/superadmin'` set, but some components were using direct browser navigation (`window.location.href`) instead of Next.js router (`router.push()`).

## Solution
Replace all `window.location.href = '/login'` with `router.push('/login')` to properly respect the basePath configuration.

## Files Fixed

### 1. **DashboardHeader.tsx**
**Issue**: Logout was redirecting to `/login` without basePath
**Fix**: 
- Added `import { useRouter } from 'next/navigation'`
- Changed `window.location.href = '/login'` → `router.push('/login')`
- Applied to both successful logout and error cases

**Before:**
```typescript
window.location.href = '/login';
```

**After:**
```typescript
router.push('/login');
```

### 2. **roles-permissions/page.tsx**
**Issue**: "Go to Login" button was redirecting without basePath
**Fix**:
- Added `import { useRouter } from 'next/navigation'`
- Added `const router = useRouter();`
- Changed `window.location.href = '/login'` → `router.push('/login')`

**Before:**
```typescript
onClick={() => window.location.href = '/login'}
```

**After:**
```typescript
onClick={() => router.push('/login')}
```

## How It Works

### Next.js Router with BasePath
When using `router.push('/login')` with `basePath: '/superadmin'`:
- Next.js automatically prepends the basePath
- Final URL: `http://localhost:3000/superadmin/login` ✅

### Direct Browser Navigation (Broken)
When using `window.location.href = '/login'`:
- Browser navigates directly, bypassing Next.js
- Final URL: `http://localhost:3000/login` ❌

## Testing Checklist

- [x] Logout from dashboard → Should redirect to `/superadmin/login`
- [x] Logout after error → Should redirect to `/superadmin/login`
- [x] Click "Go to Login" on unauthorized page → Should redirect to `/superadmin/login`
- [x] All existing navigation still works
- [x] Build passes successfully
- [x] TypeScript compilation passes

## Best Practices

### ✅ DO: Use Next.js Router
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/login');        // Respects basePath
router.push('/dashboard');    // Respects basePath
```

### ❌ DON'T: Use Direct Browser Navigation
```typescript
window.location.href = '/login';     // Ignores basePath
window.location.replace('/login');   // Ignores basePath
```

### ✅ DO: Use Link Component
```typescript
import Link from 'next/link';

<Link href="/login">Login</Link>  // Respects basePath
```

## Additional Notes

### Files Already Using Router Correctly
These files were already using `router.push()` and didn't need changes:
- `app/login/page.tsx` - Redirects after login
- `app/page.tsx` - Authentication redirects
- `app/forgot-password/page.tsx` - Post-reset redirect
- `components/Header.tsx` - Uses `<Link>` component
- `components/Footer.tsx` - Uses `<Link>` component

### Next.js Config
The basePath is configured in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  basePath: '/superadmin',
};
```

This means all routes are automatically prefixed with `/superadmin` when using Next.js navigation methods.

## URL Structure

### Development
- Base URL: `http://localhost:3000`
- Login Page: `http://localhost:3000/superadmin/login`
- Dashboard: `http://localhost:3000/superadmin/`
- API: `http://localhost:4000` (backend runs separately)

### Production
- Base URL: `https://yourdomain.com`
- Login Page: `https://yourdomain.com/superadmin/login`
- Dashboard: `https://yourdomain.com/superadmin/`

## Build Status
✅ **PASSING**
```
✓ Compiled successfully
✓ TypeScript passed
✓ All pages generated
```

---

**Fixed on**: 2025-11-04  
**Issue**: Logout redirecting to wrong URL  
**Solution**: Use Next.js router instead of direct browser navigation  
**Status**: ✅ Resolved
