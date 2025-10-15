# Regression Test: Bug 901

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: Configuration Validation Test
**Created**: 2025-10-13

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves `vite.config.ts` is missing)
2. ✅ **Passes after fix** (proves config file exists and is valid)
3. ✅ **Prevents regression** (catches if config is removed or broken)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Node.js installed (>= 18.0.0)
- Project dependencies installed (`npm install`)
- Working directory at project root

**No additional setup needed** - this is a file existence and content validation test

### Test Execution

**Test Actions**:
1. Check if `vite.config.ts` exists in project root
2. If exists, read file content
3. Verify file imports React Router Vite plugin
4. Verify plugin is used in Vite configuration
5. Optionally: Attempt to start dev server (validates config works)

### Test Assertions

**File Existence**:
- ✅ Assertion 1: `vite.config.ts` exists at project root
- ✅ Assertion 2: File is readable and valid TypeScript

**Content Validation**:
- ✅ Assertion 3: File imports `reactRouter` from `@react-router/dev/vite`
- ✅ Assertion 4: File imports `defineConfig` from `vite`
- ✅ Assertion 5: Configuration includes `reactRouter()` in plugins array

**Functional Validation (optional)**:
- ✅ Assertion 6: Dev server can be started without errors

### Test Teardown

**Cleanup**: None needed (read-only test)

---

## Test Implementation

### Test File Location

**File**: `tests/config/vite-config.test.ts`
**Test Name**: `test_bug_901_vite_config_exists_and_valid`

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail (file doesn't exist)
- Error: "vite.config.ts not found"

**After Fix**:
- ✅ Test MUST pass (file exists and is valid)
- ✅ All content assertions pass
- ✅ Dev server can start (if functional test included)

---

## Manual Verification

**Quick Manual Test**:
```bash
# Before fix - should fail
npm run dev
# Expected: Error about missing React Router Vite plugin

# After fix - should succeed
npm run dev
# Expected: Dev server starts successfully
```

---

## Edge Cases to Test

1. **File exists but empty**: Should fail (invalid config)
2. **File exists but missing plugin import**: Should fail
3. **File exists but plugin not used**: Should fail
4. **File syntax error**: Should fail (TypeScript validation)

---

## Automated Test Code Structure

```typescript
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 901: Vite Config Validation', () => {
  const projectRoot = process.cwd();
  const viteConfigPath = join(projectRoot, 'vite.config.ts');

  it('vite.config.ts should exist', () => {
    expect(existsSync(viteConfigPath)).toBe(true);
  });

  it('vite.config.ts should have valid content', () => {
    const content = readFileSync(viteConfigPath, 'utf-8');

    // Must import reactRouter plugin
    expect(content).toContain('@react-router/dev/vite');
    expect(content).toContain('reactRouter');

    // Must use defineConfig
    expect(content).toContain('defineConfig');

    // Must include plugin in config
    expect(content).toContain('plugins');
    expect(content).toContain('reactRouter()');
  });
});
```

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
