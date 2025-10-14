# 🧶 AI Companion App - Architecture Audit Report

## Executive Summary
The app has become a "messy ball of yarn" with complex interdependencies, circular references, and tangled data flows. This audit identifies the major architectural issues and provides recommendations for simplification.

## 🔍 Critical Issues Identified

### 1. **Circular Dependencies & Import Hell**
```
AuthContext → api.ts → services → hooks → components → screens → AuthContext
```

**Examples:**
- `AuthContext` imports `api.ts`
- `api.ts` exports services that import `api.ts` again
- Services import hooks that import services
- Components import multiple services and hooks
- Screens import everything

### 2. **Multiple API Clients**
- `mobile/src/services/api.ts` (main API client)
- `mobile/src/services/ApiService.ts` (duplicate API client)
- Both create axios instances with different configurations
- Services randomly import from either one

### 3. **Service Layer Chaos**
**30+ Service Files:**
- `FitnessService.ts` (444 lines)
- `RoutineService.ts` (494 lines) 
- `NutritionService.ts`
- `MoodService.ts`
- `WeatherService.ts`
- `StepTrackingService.ts`
- `HealthDataService.ts`
- `NumericalGoalsService.ts`
- `BodyTypeGoalsService.ts`
- `ProfileService.ts`
- `OnboardingService.ts`
- `GoalRecommendationService.ts`
- `TimezoneDetectionService.ts`
- `activeRoutineService.ts`
- `BodyTypeGoalsApiService.ts`
- And more...

### 4. **Hook Dependencies Web**
**15+ Custom Hooks:**
- `useAuth` → `AuthContext`
- `useActiveRoutine` → `RoutineService` → `api.ts`
- `useTodaysWorkout` → `RoutineService` → `api.ts`
- `useProgressMetrics` → (removed Zustand, now static)
- `useOnboarding` → `api.ts`
- `useAuthActions` → `AuthContext` → `api.ts`
- `useWeeklyActivity` → multiple services
- `useDataFetch` → `api.ts`
- `useUnifiedForm` → multiple services
- And more...

### 5. **Context Overload**
- `AuthContext` (579 lines) - handles auth, onboarding, user data
- `ToastContext` (143 lines) - handles notifications
- Both contexts are imported everywhere

### 6. **Component Import Spaghetti**
**Screens import:**
- Multiple services (5-10 per screen)
- Multiple hooks (3-8 per screen)
- Multiple contexts
- Multiple utility functions
- Multiple components

**Example from NutritionScreen:**
```typescript
import { nutritionService } from '../../services/api';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';
import NutritionLogsView from '../../components/nutrition/NutritionLogsView';
import UnifiedNutritionLogger from '../../components/nutrition/UnifiedNutritionLogger';
import QuickAddMeals from '../../components/nutrition/QuickAddMeals';
import WeeklyNutritionChart from '../../components/nutrition/WeeklyNutritionChart';
// + theme imports, style presets, etc.
```

### 7. **Data Flow Confusion**
**Multiple Data Sources:**
- Local state (useState)
- Context state (AuthContext, ToastContext)
- Service state (cached in services)
- AsyncStorage (persistent storage)
- API responses (real-time data)

**No Clear Data Flow:**
- Components don't know where data comes from
- Services cache data inconsistently
- Hooks manage their own state
- Contexts override service state

### 8. **Error Handling Mess**
- Errors handled in 5+ different places
- Inconsistent error messages
- DebugUtils scattered everywhere
- No centralized error boundary

### 9. **Type Safety Issues**
- `any` types everywhere
- Inconsistent interfaces
- Services return different data shapes
- No shared type definitions

### 10. **Performance Problems**
- Unnecessary re-renders due to complex dependencies
- Multiple API calls for same data
- No memoization strategy
- Heavy components with too many responsibilities

## 🎯 Root Causes

### 1. **No Clear Architecture Pattern**
- Not following MVC, MVVM, or any pattern
- Services, hooks, and components all mixed together
- No separation of concerns

### 2. **Over-Engineering**
- Too many abstraction layers
- Services for everything (even simple API calls)
- Hooks for everything (even simple state)
- Contexts for everything

### 3. **Lack of Dependency Management**
- No dependency injection
- Hard-coded imports everywhere
- Circular dependencies not prevented

### 4. **No State Management Strategy**
- Removed Zustand but didn't replace it
- Local state + Context + Services = chaos
- No single source of truth

### 5. **Inconsistent Patterns**
- Some components use hooks, others don't
- Some services cache data, others don't
- Some errors are handled, others aren't

## 🚨 Immediate Problems

### 1. **"Maximum Update Depth Exceeded" Errors**
- Caused by circular dependencies in useEffect
- Hooks depending on each other
- Services triggering re-renders

### 2. **Memory Leaks**
- Services not cleaning up
- Hooks not unmounting properly
- Contexts holding references

### 3. **Bundle Size Bloat**
- Too many unused imports
- Duplicate code across services
- No tree shaking

### 4. **Development Experience**
- Hard to debug
- Hard to test
- Hard to modify
- Hard to understand

## 📊 Complexity Metrics

### File Count:
- **Services**: 30+ files
- **Hooks**: 15+ files  
- **Components**: 180+ files
- **Screens**: 11+ files
- **Contexts**: 2 files
- **Utils**: 27+ files

### Import Count (Average per file):
- **Screens**: 15-25 imports
- **Components**: 8-15 imports
- **Services**: 5-10 imports
- **Hooks**: 3-8 imports

### Lines of Code:
- **AuthContext**: 579 lines
- **RoutineService**: 494 lines
- **FitnessService**: 444 lines
- **EnhancedOnboardingScreen**: 453 lines
- **TabNavigator**: 241 lines

## 🎯 Recommendations

### 1. **Implement Clean Architecture**
```
Presentation Layer (Screens/Components)
    ↓
Application Layer (Hooks/Use Cases)
    ↓
Domain Layer (Business Logic)
    ↓
Infrastructure Layer (API/Services)
```

### 2. **Single API Client**
- Remove duplicate API clients
- Centralize all API calls
- Implement proper error handling

### 3. **Consolidate Services**
- Group related services
- Remove duplicate functionality
- Implement service interfaces

### 4. **Simplify State Management**
- Choose ONE state management solution
- Either Context + useReducer OR Zustand
- Not both, not neither

### 5. **Dependency Injection**
- Create service container
- Inject dependencies instead of importing
- Break circular dependencies

### 6. **Component Architecture**
- Single responsibility principle
- Props drilling instead of context overuse
- Composition over inheritance

### 7. **Error Boundaries**
- Implement React error boundaries
- Centralized error handling
- User-friendly error messages

### 8. **Type Safety**
- Shared type definitions
- Strict TypeScript
- No `any` types

## 🚀 Migration Strategy

### Phase 1: Stabilize (Week 1)
1. Fix circular dependencies
2. Consolidate API clients
3. Implement error boundaries
4. Add proper TypeScript types

### Phase 2: Simplify (Week 2)
1. Remove unused services
2. Consolidate related services
3. Simplify hooks
4. Reduce component complexity

### Phase 3: Refactor (Week 3)
1. Implement clean architecture
2. Add dependency injection
3. Centralize state management
4. Optimize performance

### Phase 4: Optimize (Week 4)
1. Bundle size optimization
2. Performance improvements
3. Testing implementation
4. Documentation

## 📈 Success Metrics

### Before:
- 30+ services
- 15+ hooks
- 180+ components
- Circular dependencies
- "Maximum update depth" errors
- Memory leaks
- Hard to debug

### After:
- 5-8 services (grouped by domain)
- 5-8 hooks (core functionality only)
- 50-80 components (simplified)
- No circular dependencies
- No React errors
- No memory leaks
- Easy to debug and maintain

## 🎯 Conclusion

The app has grown organically without architectural guidelines, resulting in a complex, tangled codebase. The "ball of yarn" metaphor is accurate - everything is connected to everything else, making it difficult to understand, debug, and maintain.

**Immediate Action Required:**
1. Stop adding new features
2. Fix critical errors (circular dependencies)
3. Implement clean architecture
4. Gradually refactor existing code

**Long-term Goal:**
A clean, maintainable, scalable architecture that's easy to understand and modify.

---

*This audit was conducted on the current codebase state. The recommendations should be implemented incrementally to avoid breaking existing functionality.*
