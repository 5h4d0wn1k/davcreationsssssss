# PHASE 1: COMPREHENSIVE BACKEND API ANALYSIS

**Project**: apmcode Frontend Overhaul  
**Date**: November 4, 2025  
**Status**: ✅ COMPLETED

---

## 📋 EXECUTIVE SUMMARY

This document serves as the **definitive API contract reference** for the frontend integration. The backend is **READ-ONLY** and uses:

- **Authentication**: Signed, httpOnly cookies (cookie name: `sid`)
- **Authorization**: Strict role hierarchy (superadmin > admin > manager > user)
- **Protocol**: JSON over HTTP with CORS requiring credentials
- **Session Management**: Cookie-based with 1-hour expiry, max 2 concurrent sessions

---

## 🔐 AUTHENTICATION & SESSION MANAGEMENT

### Authentication Flow

1. **OTP-Based Login**
   - User requests OTP via `POST /user/send-otp` (with credentials validation)
   - Backend generates OTP, stores in `OTP` table with 5-minute expiry
   - User submits email + password + OTP to `POST /user/login`
   - Backend validates OTP + credentials, creates `Session`, returns signed cookie

2. **Session Creation**
   ```javascript
   // Session created with:
   {
     user_id: number,
     expiry: Math.round(Date.now() / 1000) + 60 * 60 // epoch seconds, 1 hour
   }
   ```

3. **Cookie Details**
   ```javascript
   // Cookie options:
   {
     name: "sid",
     value: session.id,
     httpOnly: true,
     signed: true,  // Signed with MYSECRET
     sameSite: "lax",
     secure: true,  // ⚠️ REQUIRES HTTPS
     maxAge: 60 * 1000 * 60 * 24 * 7 // 7 days
   }
   ```

### CheckAuth Middleware Behavior

**Critical Auth Flow States:**

| Condition | Status | Response | Action Required |
|-----------|--------|----------|----------------|
| `sid` cookie missing/invalid signature | 401 | `{ error: "Not logged in!!" }` | Redirect to login |
| Session not found in DB | 401 | `{ error: "Not logged in!" }` | Redirect to login |
| Session expired (current time > expiry) | 200 ⚠️ | `{ message: "Loged out!" }` | Clear state, redirect to login |
| User not found | 401 | `{ error: "Not logged in!" }` | Redirect to login |
| User soft-deleted (`is_active: false`) | 403 | `{ error: "Your account has been deactivated..." }` | Show deactivation message |
| Valid session | 200 | Attaches `req.user`, calls `next()` | Proceed |

**⚠️ CRITICAL QUIRKS:**
- Expired sessions return **200 status** (not 401) with message "Loged out!" (typo in backend)
- `POST /user/logout/all` does NOT clear the `sid` cookie server-side
- Max 2 concurrent sessions enforced (oldest deleted when >=2, but not guaranteed LRU)

---

## 👥 ROLE HIERARCHY & AUTHORIZATION

### Role Levels (Numeric Hierarchy)

```
superadmin (4) > admin (3) > manager (2) > user (1)
```

### Authorization Middleware

| Middleware | Required Role | Response on Failure |
|------------|---------------|---------------------|
| `isOwner` | `superadmin` | 403: "You do not have access to perform owner operations!" |
| `isAdmin` | `superadmin` OR `admin` | 403: "You do not have access to manage users!" |
| `isManager` | `manager` | 403: "You do not have an access to manage users!" |
| `isAdminOrManager` | ⚠️ **BUG** - Checks `userType.name !== "user"` (always passes) | Effectively CheckAuth-only |

**⚠️ CRITICAL BUG:**
`isAdminOrManager` checks property `userType.name` which doesn't exist (should be `user_type_name`). This means `undefined !== "user"` is always `true`, allowing **any authenticated user** to pass. Frontend MUST implement role-based UI gating separately.

---

## 📡 COMPLETE API ENDPOINT REFERENCE

### 🔑 Authentication Endpoints

#### 1. POST /user/login
**Purpose**: Login with OTP verification

**Middlewares**: `authLimiter`, `validateRequest(loginUserSchema)`

**Request**:
```json
{
  "email": "user@example.com",
  "user_password": "password123",
  "otp": "123456"
}
```

**Success** (200):
```json
{
  "message": "Logged in"
}
```

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 401 | `{ error: "Invalid or Expired OTP!" }` | OTP not found or expired |
| 403 | `{ error: "Your account has been deactivated..." }` | `is_active: false` |
| 409 | `{ error: "Invalid credentials!" }` | Email not found OR password mismatch |

**Side Effects**:
- Deletes OTP record on success
- Creates `Session` with 1-hour expiry
- Sets signed `sid` cookie (requires HTTPS)
- Deletes oldest session if user has >=2 sessions

---

#### 2. POST /user/send-otp
**Purpose**: Request OTP for login

**Middlewares**: `authLimiter`, `checkCredentials`, `validateRequest(sendOtpSchema)`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Success** (201):
```json
{
  "message": "OTP sent successfully"
}
```

**Notes**: `checkCredentials` middleware validates user exists before sending OTP

---

#### 3. GET /user/data
**Purpose**: Get authenticated user details

**Middlewares**: `CheckAuth`

**Success** (200):
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "picture": null,  // ⚠️ Not in Prisma schema, may be null/undefined
  "userType": "admin"  // user_type_name from UserType table
}
```

---

#### 4. POST /user/logout
**Purpose**: Logout current session

**Middlewares**: None

**Request**: None (reads `sid` cookie)

**Success** (200): Empty response (`res.end()`)

**Side Effects**:
- Deletes `Session` record for `sid`
- Clears `sid` cookie
- Always returns 200 (even if session not found)

---

#### 5. POST /user/logout/all
**Purpose**: Logout all sessions for current user

**Middlewares**: None

**Request**: None (reads `sid` cookie)

**Success** (200): Empty response (`res.end()`)

**⚠️ QUIRK**: Does NOT clear `sid` cookie. Frontend must clear cookie manually.

**Side Effects**:
- Deletes ALL `Session` records for user
- Cookie remains set but sessions invalidated

---

#### 6. POST /user/forgot/password
**Purpose**: Reset password with OTP

**Middlewares**: `validateRequest(createNewPasswordSchema)`

**Request**:
```json
{
  "email": "user@example.com",
  "newPassword": "newpass123",
  "otp": "123456"
}
```

**Success** (201):
```json
{
  "message": "Password reset successfully!"
}
```

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 401 | `{ error: "Invalid or Expired OTP!" }` | OTP validation failed |
| 403 | `{ error: "Your account has been deleted..." }` | User deactivated |
| 404 | `{ error: "User not found!" }` | Email not found |
| 400 | `{ error: "New Password is same as current password!" }` | Password unchanged |

---

### 👤 User Management Endpoints

#### 7. GET /users
**Purpose**: Get all users with login status

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200):
```json
[
  {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "is_active": true,
    "userType": "admin",  // user_type_name
    "isLoggedIn": true    // Has active Session
  }
]
```

---

#### 8. POST /admin/users
**Purpose**: Create new user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(createAdminUserSchema)`

**Request**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",  // Optional
  "email": "jane@example.com",
  "user_password": "password123",
  "address": "123 Main St",  // Optional
  "user_type_id": 2,
  "is_active": true  // Optional
}
```

**Success** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "user_id": 5,
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1234567890",
    "email": "jane@example.com",
    "address": "123 Main St",
    "user_type_id": 2,
    "is_active": true
  }
}
```

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 400 | `{ error: "Missing required fields: firstName..." }` | Missing required fields |
| 400 | `{ error: "Email already in use" }` | Duplicate email |

---

#### 9. GET /admin/users/:id
**Purpose**: Get user by ID

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200):
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St",
  "user_type_id": 2,
  "is_active": true
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "User not found" }` |

---

#### 10. PUT /admin/users/:id
**Purpose**: Update user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(updateUserSchema)`

**Request** (all fields optional):
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "email": "newemail@example.com",
  "user_password": "newpassword",
  "address": "456 Oak St",
  "user_type_id": "3",  // ⚠️ MUST BE STRING (Zod expects string)
  "is_active": false
}
```

**Success** (200):
```json
{
  "message": "User updated successfully",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "email": "newemail@example.com",
    "address": "456 Oak St",
    "user_type_id": 3,
    "is_active": false
  }
}
```

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 404 | `{ error: "User not found" }` | User not found or inactive |
| 403 | `{ error: "Unauthorized to update this user" }` | Hierarchy violation |
| 400 | `{ error: "Email already in use" }` | Email conflict |

---

#### 11. DELETE /admin/delete/user/:id
**Purpose**: Soft delete user (set `is_active: false`)

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`

**Success** (200):
```json
{
  "message": "User deleted successfully!"
}
```

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 403 | `{ error: "You can not delete yourself!" }` | Self-deletion attempt |
| 403 | `{ error: "You can not delete your superior or yourself!" }` | Hierarchy violation |

**Side Effects**:
- Sets `is_active: false`
- Deletes ALL sessions for user

---

#### 12. DELETE /admin/hard/delete/user/:id
**Purpose**: Permanently delete user from database

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`

**Success** (200):
```json
{
  "message": "User deleted successfully!"
}
```

**Errors**: Same as soft delete

**Side Effects**:
- Permanently deletes user record
- Deletes ALL sessions for user
- Cascade deletes related records

---

#### 13. PATCH /admin/recover/user/:id
**Purpose**: Reactivate soft-deleted user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner` (superadmin only)

**Success** (201): Empty response

**Side Effects**: Sets `is_active: true`

---

#### 14. POST /admin/logout/user/:id
**Purpose**: Logout all sessions for specific user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200): Empty response

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 403 | `{ error: "You can only logout users lower than you in hierarchy!" }` | Hierarchy violation |
| 403 | `{ error: "You can not logout yourself!" }` | Self-logout attempt |

**Side Effects**: Deletes ALL sessions for target user

---

#### 15. PATCH /admin/change/usertype/user/:id
**Purpose**: Change user's role

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️, `validateRequest(changeUserRoleSchema)`

**Request**:
```json
{
  "user_type_name": "manager"
}
```

**Success** (201): Empty response

**Errors**:
| Status | Response | Meaning |
|--------|----------|---------|
| 403 | `{ error: "Unauthorized change is tried to perform!" }` | Hierarchy violation |
| 401 | `{ error: "You can not set superadmin user type!" }` | Attempted superadmin assignment |
| 400 | `{ error: "Invalid user type!" }` | user_type_name not found |

---

### 📦 Module Management Endpoints

#### 16. POST /admin/modules
**Purpose**: Create new module

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(createModuleSchema)`

**Request**:
```json
{
  "module_name": "User Management",
  "parent_id": 0,  // Optional, default 0
  "url_slug": "user-management",  // Optional
  "tool_tip": "Manage users",  // Optional
  "short_description": "Create, edit, delete users",  // Optional
  "is_active": true  // Optional
}
```

**Success** (201):
```json
{
  "message": "Module created successfully",
  "module": {
    "module_id": 10,
    "module_name": "User Management",
    "parent_id": 0,
    "url_slug": "user-management",
    "tool_tip": "Manage users",
    "short_description": "Create, edit, delete users",
    "is_active": true
  }
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 400 | `{ error: "Missing required fields: module_name, url_slug" }` |
| 400 | `{ error: "urlSlug already exists" }` |
| 400 | `{ error: "Invalid parentId" }` |

---

#### 17. GET /admin/modules
**Purpose**: Get all modules

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200):
```json
[
  {
    "module_id": 1,
    "module_name": "Dashboard",
    "parent_id": 0,
    "url_slug": "dashboard",
    "tool_tip": "Main dashboard",
    "short_description": "Overview of system",
    "is_active": true
  }
]
```

---

#### 18. GET /admin/modules/:id
**Purpose**: Get module by ID

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200):
```json
{
  "module_id": 1,
  "module_name": "Dashboard",
  "parent_id": 0,
  "url_slug": "dashboard",
  "tool_tip": "Main dashboard",
  "short_description": "Overview of system",
  "is_active": true
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "Module not found" }` |

---

#### 19. PUT /admin/modules/:id
**Purpose**: Update module

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(updateModuleSchema)`

**Request** (all fields optional):
```json
{
  "module_name": "Updated Dashboard",
  "parent_id": 1,
  "url_slug": "new-dashboard",
  "tool_tip": "Updated tooltip",
  "short_description": "New description",
  "is_active": false
}
```

**Success** (200):
```json
{
  "message": "Module updated successfully",
  "module": {
    "module_id": 1,
    "module_name": "Updated Dashboard",
    "parent_id": 1,
    "url_slug": "new-dashboard",
    "tool_tip": "Updated tooltip",
    "short_description": "New description",
    "is_active": false
  }
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "Module not found" }` |
| 400 | `{ error: "urlSlug already exists" }` |
| 400 | `{ error: "Invalid parentId" }` |

---

#### 20. PATCH /admin/modules/:id/deactivate
**Purpose**: Deactivate module

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`

**Success** (200):
```json
{
  "message": "Module deactivated successfully"
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "Module not found" }` |

---

### 🔐 Roles & Permissions Endpoints

#### 21. GET /admin/users/:userId/modules
**Purpose**: Get modules assigned to specific user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdminOrManager` ⚠️

**Success** (200):
```json
[
  {
    "module_id": 1,
    "module_name": "Dashboard",
    "parent_id": 0,
    "url_slug": "dashboard",
    "tool_tip": "Main dashboard",
    "short_description": "Overview",
    "is_active": true
  }
]
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "User not found" }` |

---

#### 22. POST /admin/assign/module
**Purpose**: Assign module to user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(assignModuleToUserSchema)`

**Request**:
```json
{
  "user_id": 5,
  "module_id": 10
}
```

**Success** (201):
```json
{
  "message": "Module assigned to user successfully",
  "access": {
    "user_access_id": 100,
    "user_id": 5,
    "module_id": 10,
    "created_by": 1,
    "is_active": true
  }
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 400 | `{ error: "Missing required fields: userId, module_id" }` |
| 404 | `{ error: "User not found" }` |
| 404 | `{ error: "Module not found" }` |
| 400 | `{ error: "Module already assigned to user" }` |

---

#### 23. POST /admin/unassign/module
**Purpose**: Unassign module from user

**Middlewares**: `adminLimiter`, `CheckAuth`, `isAdmin`, `validateRequest(unassignModuleFromUserSchema)`

**Request**:
```json
{
  "user_id": 5,
  "module_id": 10
}
```

**Success** (200):
```json
{
  "message": "Module unassigned from user successfully"
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 400 | `{ error: "Missing required fields: user_id, module_id" }` |
| 404 | `{ error: "User not found" }` |
| 404 | `{ error: "Module not found" }` |
| 400 | `{ error: "Module not assigned to user" }` |

---

### 🏷️ User Type Management Endpoints

#### 24. POST /admin/user-types
**Purpose**: Create new user type (role)

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner`, `validateRequest(createUserTypeSchema)`

**Request**:
```json
{
  "user_type_name": "contractor",
  "user_type_value": 50
}
```

**Success** (201):
```json
{
  "message": "UserType created successfully",
  "userType": {
    "id": 5,  // ⚠️ Returns 'id', not 'user_type_id'
    "user_type_name": "contractor",
    "user_type_value": 50
  }
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 400 | `{ error: "Missing required fields" }` |
| 400 | `{ error: "UserType with this user_type_name already exists" }` |

---

#### 25. GET /admin/user-types
**Purpose**: Get all user types

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner`

**Success** (200):
```json
[
  {
    "user_type_id": 1,
    "user_type_name": "superadmin",
    "user_type_value": 1,
    "is_active": true
  }
]
```

---

#### 26. GET /admin/user-types/:user_type_id
**Purpose**: Get user type by ID

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner`

**Success** (200):
```json
{
  "user_type_id": 1,
  "user_type_name": "superadmin",
  "user_type_value": 1,
  "is_active": true
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "UserType not found" }` |

---

#### 27. PUT /admin/user-types/:user_type_id
**Purpose**: Update user type

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner`, `validateRequest(updateUserTypeSchema)`

**Request** (all fields optional):
```json
{
  "user_type_name": "senior-contractor",
  "user_type_value": 55
}
```

**Success** (200):
```json
{
  "message": "UserType updated successfully",
  "userType": {
    "user_type_id": 5,
    "user_type_name": "senior-contractor",
    "user_type_value": 55
  }
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "UserType not found" }` |
| 400 | `{ error: "UserType with this user_type_name already exists" }` |

---

#### 28. DELETE /admin/user-types/:user_type_id
**Purpose**: Delete user type

**Middlewares**: `adminLimiter`, `CheckAuth`, `isOwner`

**Success** (200):
```json
{
  "message": "UserType deleted successfully"
}
```

**Errors**:
| Status | Response |
|--------|----------|
| 404 | `{ error: "UserType not found" }` |
| 400 | `{ error: "Cannot delete UserType as users are assigned to it" }` |

---

## ⚠️ ERROR HANDLING REFERENCE

### Validation Errors (Zod)

**Format** (400):
```json
{
  "error": "Validation failed",
  "details": "Invalid email format"  // ⚠️ String, not array
}
```

### Standard Error Responses

| Status | Format | Example Scenarios |
|--------|--------|-------------------|
| 400 | `{ error: "message" }` | Invalid input, duplicate entries, business logic violations |
| 401 | `{ error: "message" }` | Not logged in, invalid OTP, cannot set superadmin |
| 403 | `{ error: "message" }` | Permission denied, hierarchy violations, deactivated account |
| 404 | `{ error: "message" }` | Resource not found |
| 409 | `{ error: "message" }` | Invalid credentials (login only) |
| 500 | `{ error: "Something went wrong" }` | Unhandled server errors |

### Global Error Handler

All unhandled exceptions result in:
```json
{
  "error": "Something went wrong"
}
```
Status: `err.status` or 500

---

## 📊 DATA MODELS (Prisma Schema)

### UserType
```prisma
model UserType {
  user_type_id      Int      @id @default(autoincrement())
  user_type_name    String   @db.VarChar(100) @default("user")
  user_type_value   Int      @default(99)
  created_by        Int
  created_date      DateTime @default(now())
  last_updated_date DateTime @updatedAt
  is_active         Boolean  @default(true)
  
  // Relations
  Users Users[]
}
```

### Users
```prisma
model Users {
  user_id           Int      @id @default(autoincrement())
  first_name        String   @db.VarChar(100)
  last_name         String   @db.VarChar(100)
  user_type_id      Int
  address           String?
  email             String   @unique @db.VarChar(150)
  phone             String?  @db.VarChar(20)
  user_password     String   @db.VarChar(255)
  created_by        Int
  created_date      DateTime @default(now())
  last_updated_date DateTime @updatedAt
  is_active         Boolean  @default(true)
  
  // Relations
  userType   UserType     @relation(fields: [user_type_id], references: [user_type_id])
  userAccess UserAccess[]
  modules    Modules[]
  sessions   Session[]
}
```

### Modules
```prisma
model Modules {
  module_id         Int      @id @default(autoincrement())
  module_name       String   @db.VarChar(150)
  parent_id         Int      @default(0)
  tool_tip          String   @db.VarChar(255)
  short_description String
  url_slug          String   @unique @db.VarChar(255)
  created_by        Int
  created_date      DateTime @default(now())
  last_updated_date DateTime @updatedAt
  is_active         Boolean  @default(true)
  
  // Relations
  users      Users        @relation(fields: [created_by], references: [user_id])
  UserAccess UserAccess[]
}
```

### UserAccess
```prisma
model UserAccess {
  user_access_id    Int      @id @default(autoincrement())
  module_id         Int
  user_id           Int
  created_by        Int
  created_date      DateTime @default(now())
  last_updated_date DateTime @updatedAt
  is_active         Boolean  @default(true)
  
  // Relations
  users   Users   @relation(fields: [created_by], references: [user_id])
  modules Modules @relation(fields: [module_id], references: [module_id])
}
```

### Session
```prisma
model Session {
  id           Int      @id @default(autoincrement())
  user_id      Int
  expiry       Int      @default(dbgenerated("now() + interval '1 hour'"))
  created_date DateTime @default(now()) @db.Timestamp(6)
  
  // Relations
  users Users? @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
}
```

### OTP
```prisma
model OTP {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  otp          String
  expiry       DateTime @default(dbgenerated("now() + interval '5 minutes'"))
  created_date DateTime @default(now()) @db.Timestamp(6)
}
```

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

### 🔴 Must-Handle Quirks

1. **HTTPS Requirement**
   - `secure: true` cookies REQUIRE HTTPS
   - In development, use HTTPS proxy or disable secure flag in backend (not allowed per requirements)
   - Alternative: Test in production-like environment

2. **Expired Session Returns 200**
   - Expired sessions return **200** with `{ message: "Loged out!" }`
   - Frontend MUST treat this as logout, not success
   - Clear state and redirect to login

3. **logout/all Does Not Clear Cookie**
   - `POST /user/logout/all` invalidates sessions but leaves cookie
   - Frontend must manually clear cookie after calling this endpoint

4. **isAdminOrManager Bug**
   - Middleware allows all authenticated users (checks wrong property)
   - **Frontend MUST implement role-based UI gating separately**
   - Do not rely on backend to block admin endpoints from regular users

5. **user_type_id Type Inconsistency**
   - Create endpoint expects **number**
   - Update endpoint expects **string** (Zod schema issue)
   - Frontend must send correct type per endpoint

6. **Empty Response Bodies**
   - Some endpoints return 200/201 with NO JSON body (`res.end()`)
   - Handle empty bodies gracefully (check `Content-Length: 0`)

7. **Login Error Code 409**
   - Invalid credentials return **409** (not standard 401)
   - Map 409 to "Invalid credentials" message in login flow

8. **picture Field**
   - Returned in `GET /user/data` but NOT in Prisma Users model
   - Always `null` or `undefined` - handle gracefully

9. **Max 2 Sessions**
   - Backend enforces max 2 concurrent sessions
   - Oldest session deleted when >=2 exist
   - Not guaranteed LRU - first result of `Session.find()` deleted

10. **UserType Creation Response**
    - Returns `id` instead of `user_type_id`
    - Frontend must map `id` → `user_type_id`

---

## 🎯 PHASE 2 PREPARATION CHECKLIST

Based on this analysis, Phase 2 must address:

- [ ] **API Service Layer**:
  - ✅ Already exists in `lib/api.ts`
  - ⚠️ Needs updates for quirks (200 logout, 409 login, empty bodies)
  - ⚠️ Add `user_type_id` string conversion for PUT /admin/users/:id
  - ⚠️ Handle `id` → `user_type_id` mapping in createUserType

- [ ] **State Management**:
  - ⚠️ Implement session expiry detection (200 "Loged out!")
  - ⚠️ Add role-based permission checks (don't rely on isAdminOrManager)
  - ⚠️ Handle max 2 sessions gracefully

- [ ] **Component Refactoring**:
  - ⚠️ Add role-based UI gating for admin features
  - ⚠️ Handle empty response bodies in forms
  - ⚠️ Display Zod validation errors (details is string, not array)

- [ ] **Global Error Handling**:
  - ⚠️ Detect 200 + "Loged out!" as logout
  - ⚠️ Map 409 to invalid credentials in login
  - ⚠️ Handle empty bodies (204, Content-Length: 0)
  - ⚠️ Clear state on 401/403/expired sessions

- [ ] **Security Hardening**:
  - ⚠️ Enforce HTTPS in production
  - ⚠️ Implement frontend role checks (backend bug mitigation)
  - ⚠️ Validate inputs before sending to avoid rate limits
  - ⚠️ Handle signed cookie validation failures

---

## 📈 NEXT STEPS

1. ✅ **Phase 1 Complete**: Backend API fully documented
2. 🔄 **Phase 2 Starting**: Update API service layer with quirk handling
3. 🔄 **Phase 2**: Implement robust state management with auth context
4. 🔄 **Phase 2**: Refactor components for modularity and role-based rendering
5. ⏳ **Phase 3**: Implement global error interceptor
6. ⏳ **Phase 3**: Add frontend input validation
7. ⏳ **Phase 3**: Security hardening and production readiness

---

**Document Status**: ✅ PHASE 1 COMPLETED  
**Last Updated**: November 4, 2025  
**Next Phase**: Phase 2 - Frontend Integration & Refactoring
