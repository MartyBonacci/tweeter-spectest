# Quick Start: Password Reset Diagnosis

## 🚀 Fast Track - Start Here

If you're seeing "Token has already been used" errors, run this **ONE COMMAND**:

```bash
npx tsx diagnose-password-reset.ts your-email@example.com
```

Replace `your-email@example.com` with the email you're testing.

## 📊 What You'll See

### ✅ Good State (Everything Working)
```
Total tokens: 1
  🟢 Valid: 1
  🔴 Used: 0
  🟡 Expired: 0

✅ Exactly 1 valid token exists - this is correct!
```

**What to do**: Clear browser cache, use the latest reset link from your email

---

### ⚠️ Multiple Valid Tokens (Bug 916 Still Active)
```
Total tokens: 3
  🟢 Valid: 2
  🔴 Used: 1

⚠️  PROBLEM: Multiple valid tokens exist
```

**What to do**:
1. Restart server: `npm run dev:server`
2. Request NEW password reset at `/forgot-password`
3. Run diagnostic again

---

### 🔄 Need New Reset
```
Total tokens: 2
  🔴 Used: 1
  🟡 Expired: 1

⚠️ All tokens have been used or expired
```

**What to do**: Request new password reset at `/forgot-password`

---

### 📭 No Tokens Found
```
⚠️ No password reset tokens found
```

**What to do**: Request password reset at `/forgot-password`

## 🔧 Before Testing

1. **Restart server** (loads Bug 916/917 fixes):
   ```bash
   npm run dev:server
   ```

2. **Clear browser cache** (removes cached errors):
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
   - Or use incognito/private window

3. **Request NEW reset** (don't use old email links):
   - Go to `/forgot-password`
   - Enter your email
   - Check your email inbox

4. **Run diagnostic**:
   ```bash
   npx tsx diagnose-password-reset.ts your@email.com
   ```

## 📋 Expected Flow

### Step 1: Request Reset
```bash
npm run dev:server  # Server running
```

Navigate to `/forgot-password`, enter email, submit.

**Server logs should show**:
```
🧹 Cleaned up X old tokens for user <user-id>
```

### Step 2: Check Token State
```bash
npx tsx diagnose-password-reset.ts your@email.com
```

**Expected output**:
```
Total tokens: 1
  🟢 Valid: 1
```

### Step 3: Click Reset Link
Open email → Click reset link → Should see password form (NOT error)

### Step 4: Verify After Reset
```bash
npx tsx diagnose-password-reset.ts your@email.com
```

**Expected output**:
```
Total tokens: 1
  🔴 Used: 1
```

## 🐛 If Still Broken

If diagnostic shows ✅ but you still see errors:

1. **Check browser console** (F12) for JavaScript errors
2. **Check Network tab** (F12 → Network):
   - Look for `/api/auth/verify-reset-token/:token` request
   - Check response status and body
3. **Verify fixes applied**:
   ```bash
   grep "Invalidate any existing tokens" src/routes/auth.ts
   grep "cache-busting headers" app/pages/ResetPassword.tsx
   ```

## 📝 Detailed Documentation

See `PASSWORD-RESET-DEBUGGING.md` for:
- Complete analysis of both bugs
- Code change details
- Full testing procedures
- Troubleshooting guide

## 🎯 Summary

**Two bugs fixed:**
- ✅ Bug 916: Multiple tokens → Fixed with DELETE before INSERT
- ✅ Bug 917: Cached errors → Fixed with cache-busting headers

**Your action:**
1. Run diagnostic tool
2. Follow recommendations
3. Test with fresh reset request
