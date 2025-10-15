# Bug 901: React Router Vite Plugin Configuration Missing

**Status**: Active
**Created**: 2025-10-13
**Priority**: Critical
**Severity**: Critical

## Symptoms

The development server fails to start with an error about missing React Router Vite plugin configuration.

- `npm run dev` command fails immediately
- Error message: "React Router Vite plugin not found in Vite config"
- Application cannot run in development mode
- Blocks all development work

## Reproduction Steps

1. Clone/checkout the repository
2. Run `npm install`
3. Run `npm run dev`

**Expected Behavior**: Development server starts and application runs on localhost

**Actual Behavior**: Command fails with error: "React Router Vite plugin not found in Vite config"

## Root Cause Analysis

**Cause**: Missing `vite.config.ts` file with React Router plugin configuration

- **Component affected**: Build/dev server configuration
- **Code location**: Root directory - missing `vite.config.ts`
- **Logic error**: React Router v7 requires Vite configuration with `reactRouter()` plugin
- **Conditions**: Always fails when `vite.config.ts` is missing

**Technical Details**:
- React Router v7 uses Vite as its build tool
- The `react-router dev` command expects a Vite configuration
- The Vite config must include `@react-router/dev/vite` plugin
- Current state: `react-router.config.ts` exists but `vite.config.ts` is missing

## Impact Assessment

**Affected Users**: All developers

**Affected Features**:
- Development server: Completely broken
- Build process: Likely affected
- All features: Cannot be developed or tested

**Severity Justification**: Critical - blocks all development work

**Workaround Available**: No - this is a required configuration file

## Regression Test Requirements

Since this is a configuration issue, the regression test should verify:

1. `vite.config.ts` exists in project root
2. File imports React Router Vite plugin from `@react-router/dev/vite`
3. Plugin is included in Vite plugins array
4. Dev server can start successfully

**Test Success Criteria**:
- ✅ Test fails before fix (proves config is missing)
- ✅ Test passes after fix (proves config is correct)
- ✅ Dev server starts without errors

## Proposed Solution

Create `vite.config.ts` in project root with React Router plugin configuration.

**Changes Required**:
- **File to create**: `vite.config.ts`
- **Content**: Vite configuration importing and using `reactRouter()` plugin from `@react-router/dev/vite`

**Configuration Structure**:
```typescript
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
});
```

**Risks**: None - this is adding missing required configuration

**Alternative Approaches**: None - this configuration is required by React Router v7

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- Uses approved technology: React Router v7 (framework mode)
- Follows programmatic configuration approach
- No prohibited technologies

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
