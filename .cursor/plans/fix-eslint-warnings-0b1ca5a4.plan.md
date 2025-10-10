<!-- 0b1ca5a4-8ae6-4346-8fea-18c1ef989cb4 21ab8da3-6d22-4f39-9c6a-b25ff42e248a -->
# Fix ESLint Warnings Plan

## Overview

Address 277 ESLint warnings across the mobile codebase, prioritizing fixes that prevent bugs and improve code maintainability.

## Phase 1: High-Priority Fixes (Bug Prevention)

### 1. React Hook Dependencies (~40 warnings)

**Impact**: High - Missing dependencies can cause stale closures and bugs

- Fix `useEffect` and `useCallback` missing dependencies
- Key files:
- `hooks/useBodyTypeGoalMetrics.ts` (3 warnings)
- `hooks/useFormState.ts` (3 validator warnings)
- `screens/main/EnhancedProfileScreen.tsx` (3 warnings)
- `screens/main/NutritionScreen.tsx` (2 warnings)
- `contexts/ToastContext.tsx` (1 warning)
- `components/ui/Toast.tsx` (1 warning)

**Strategy**: Add missing dependencies or wrap them in `useMemo`/`useCallback` if they cause render loops

### 2. Unused Variables (~110 warnings)

**Impact**: Medium - Code smell, potential logic errors

- Remove or prefix with underscore for intentionally unused variables
- Focus on:
- Error variables in catch blocks (prefix with `_`)
- Unused state variables (remove or use)
- Unused function parameters (prefix with `_`)

**Categories**:

- Catch block errors: `error` → `_error` (30+ instances)
- Unused imports: Remove unused imports (15+ instances)
- Unused state/functions: Remove or implement (40+ instances)

## Phase 2: Medium-Priority Fixes (Code Quality)

### 3. TypeScript `any` Types (~110 warnings)

**Impact**: Medium - Reduces type safety

- Replace `any` with proper types
- Priorities:
- Production code over test files
- Service layer and hooks (high impact)
- Component props and state

**Key files**:

- `services/routineService.ts` (8 warnings)
- `services/nutritionService.ts` (4 warnings)
- `services/healthService.ts` (6 warnings)
- `utils/loggingUtils.ts` (20 warnings)
- `hooks/*` files (15+ warnings)

**Strategy**:

- Test files: Can stay as `any` (acceptable)
- Production: Create proper interfaces/types

### 4. Unused Assignments (~25 warnings)

**Impact**: Low-Medium - Variables assigned but never used

- Remove or use the assigned values
- Examples: `response`, `newLoadingState`, `proteinTarget`

## Phase 3: Low-Priority Fixes (Polish)

### 5. Miscellaneous (~15 warnings)

- Fix `require()` style imports → ES6 imports
- Remove unknown properties in tests
- Fix array type syntax `Array<T>` → `T[]`

## Implementation Strategy

### Batch 1: Hook Dependencies (Prevents bugs)

- Review each hook dependency warning
- Add missing deps or memoize functions
- Test thoroughly after changes

### Batch 2: Unused Variables (Cleanup)

- Prefix catch block errors with `_`
- Remove unused imports and variables
- Keep unused params with `_` prefix

### Batch 3: TypeScript Types (Type safety)

- Create interfaces for complex objects
- Replace `any` in production code
- Leave test files as-is initially

### Batch 4: Final Cleanup

- Fix remaining minor issues
- Run `eslint --fix` for auto-fixable items
- Verify all changes don't break functionality

## Testing Checklist

- [ ] Run tests after each batch: `npm test`
- [ ] Verify app builds: `expo start`
- [ ] Test key user flows (login, logging workout, dashboard)
- [ ] Re-run eslint to verify warnings reduced

## Expected Outcome

- Reduce warnings from 277 to <50
- Fix all hook dependency issues (prevent bugs)
- Improve type safety in core services
- Cleaner, more maintainable codebase

## Files to Edit (Est. ~60 files)

Most warnings concentrated in:

- `hooks/` (13 files)
- `services/` (15 files)  
- `components/ui/` (12 files)
- `screens/main/` (5 files)
- Test files (20+ files - lower priority)

### To-dos

- [ ] Fix React Hook dependency warnings in useEffect and useCallback (~40 warnings) to prevent stale closures and bugs
- [ ] Remove or prefix unused variables, especially in catch blocks and unused imports (~110 warnings)
- [ ] Replace 'any' types with proper TypeScript interfaces in production code (~110 warnings, focus on services and hooks)
- [ ] Fix remaining warnings: require() imports, unknown test properties, array type syntax (~15 warnings)
- [ ] Run tests, verify app functionality, and confirm warnings reduced from 277 to <50