# Forgot Password Feature - Disabled

## Status: Temporarily Disabled

The forgot password feature is currently disabled due to backend API compatibility issues.

## Issue

The backend's `/user/send-otp` endpoint requires both `email` and `user_password` parameters, which is designed specifically for the login flow where the user already knows their password.

For a "forgot password" flow, we cannot require the password (since that's what the user is trying to reset).

## Required Backend Changes

To enable this feature, the backend needs one of the following:

### Option 1: Separate Endpoint (Recommended)
Create a new endpoint specifically for password reset:
```javascript
POST /user/forgot-password/send-otp
Body: { email: string }
```

This endpoint should:
1. Verify the email exists
2. Generate and send OTP to that email
3. Not require password verification

### Option 2: Modified Endpoint
Modify `/user/send-otp` to make `user_password` optional:
- If `user_password` is provided → Login OTP flow
- If `user_password` is not provided → Password Reset OTP flow

## Workaround

Until backend changes are made, users who forget their password should contact the administrator for a password reset.

## Frontend Implementation Ready

The frontend code is ready and just needs the backend endpoint. Once available, uncomment the code in `/app/forgot-password/page.tsx` and update the API call.
