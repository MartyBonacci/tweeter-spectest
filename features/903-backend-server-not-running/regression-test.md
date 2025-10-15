# Regression Test: Bug 903

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: Backend Server Integration Test
**Created**: 2025-10-13

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves dotenv not configured, server won't start)
2. ✅ **Passes after fix** (proves server starts with loaded env vars)
3. ✅ **Prevents regression** (catches if dotenv removed or misconfigured)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Node.js installed (>= 18.0.0)
- Project dependencies installed (`npm install`)
- `.env` file exists in project root
- Database accessible (for server startup)

**Test data**: Use `.env` file in project root

### Test Execution

**Test Actions**:
1. Verify `dotenv` package is installed
2. Verify `src/server/index.ts` imports dotenv config
3. Attempt to start backend server programmatically or via process
4. Wait for server to be ready
5. Make HTTP request to health check endpoint
6. Verify response

### Test Assertions

**Package Installation**:
- ✅ Assertion 1: `dotenv` package exists in package.json dependencies

**Code Configuration**:
- ✅ Assertion 2: `src/server/index.ts` imports 'dotenv/config' or calls dotenv.config()

**Server Startup**:
- ✅ Assertion 3: Server starts without crashing
- ✅ Assertion 4: Server listens on expected port (from .env PORT variable)

**Functional Validation**:
- ✅ Assertion 5: HTTP GET /api/health returns 200 OK
- ✅ Assertion 6: Response body contains status: 'ok'

### Test Teardown

**Cleanup**: Kill server process if started

---

## Test Implementation

### Test File Location

**File**: `tests/integration/server-startup.test.ts`
**Test Name**: `test_bug_903_server_starts_with_env`

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail (dotenv not installed or not configured)
- Server startup fails with environment validation errors

**After Fix**:
- ✅ Test MUST pass (server starts successfully)
- ✅ Health check endpoint responds
- ✅ Environment variables loaded from .env file

---

## Manual Verification

**Quick Manual Test**:
```bash
# Before fix - should fail
npm run dev:server
# Expected: Server crashes with "Invalid environment variables" or similar

# After fix - should succeed
npm run dev:server
# Expected: Server starts on port 3000
# In another terminal:
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Edge Cases to Test

1. **dotenv installed but not imported**: Should fail (env vars not loaded)
2. **dotenv imported after env.ts**: Should fail (timing issue)
3. **dotenv imported correctly**: Should pass
4. **.env file missing**: Should fail gracefully with clear error

---

## Automated Test Code Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 903: Backend Server Startup Validation', () => {
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, 'package.json');
  const serverIndexPath = join(projectRoot, 'src/server/index.ts');

  let serverProcess: any;

  afterAll(() => {
    // Kill server if running
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should have dotenv package installed', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    expect(
      packageJson.dependencies?.dotenv ||
      packageJson.devDependencies?.dotenv
    ).toBeDefined();
  });

  it('src/server/index.ts should import dotenv config', () => {
    const content = readFileSync(serverIndexPath, 'utf-8');

    // Must import dotenv/config or call dotenv.config()
    const hasImport =
      content.includes("import 'dotenv/config'") ||
      content.includes("from 'dotenv'") ||
      content.includes('dotenv.config()');

    expect(hasImport).toBe(true);
  });

  it('backend server should start and respond to health check', async () => {
    // Start server process
    serverProcess = spawn('npm', ['run', 'dev:server'], {
      stdio: 'pipe'
    });

    // Wait for server to start (look for success message in stdout)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 15000);

      serverProcess.stdout.on('data', (data: Buffer) => {
        if (data.toString().includes('Server running')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('Server error:', data.toString());
      });
    });

    // Wait a bit for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Make health check request
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  }, 30000); // 30 second timeout for this test
});
```

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
