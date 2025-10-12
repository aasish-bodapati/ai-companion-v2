# 📝 **File Naming Conventions**

## **🎯 Standardized Naming Rules**

### **1. Components (React Components)**
- **Pattern**: `PascalCase.tsx`
- **Examples**: 
  - ✅ `UserProfile.tsx`
  - ✅ `WorkoutLogger.tsx`
  - ✅ `NutritionTracker.tsx`
  - ❌ `userProfile.tsx`
  - ❌ `workout-logger.tsx`

### **2. Hooks (Custom Hooks)**
- **Pattern**: `usePascalCase.ts`
- **Examples**:
  - ✅ `useActiveRoutine.ts`
  - ✅ `useFormValidation.ts`
  - ✅ `useDataFetch.ts`
  - ❌ `use_active_routine.ts`
  - ❌ `useactiveRoutine.ts`

### **3. Services (API/Data Services)**
- **Pattern**: `PascalCaseService.ts`
- **Examples**:
  - ✅ `AuthService.ts`
  - ✅ `NutritionService.ts`
  - ✅ `BaseService.ts`
  - ❌ `authService.ts`
  - ❌ `nutrition_service.ts`

### **4. Utilities (Helper Functions)**
- **Pattern**: `camelCaseUtils.ts` or `camelCase.ts`
- **Examples**:
  - ✅ `dateUtils.ts`
  - ✅ `formValidation.ts`
  - ✅ `responsive.ts`
  - ❌ `DateUtils.ts`
  - ❌ `form_validation.ts`

### **5. Stores (State Management)**
- **Pattern**: `camelCaseStore.ts`
- **Examples**:
  - ✅ `appStore.ts`
  - ✅ `fitnessStore.ts`
  - ✅ `userStore.ts`
  - ❌ `AppStore.ts`
  - ❌ `fitness_store.ts`

### **6. Types (Type Definitions)**
- **Pattern**: `PascalCase.ts`
- **Examples**:
  - ✅ `UserTypes.ts`
  - ✅ `ApiTypes.ts`
  - ✅ `CommonTypes.ts`
  - ❌ `userTypes.ts`
  - ❌ `api_types.ts`

### **7. Constants (Configuration)**
- **Pattern**: `camelCase.ts`
- **Examples**:
  - ✅ `apiConfig.ts`
  - ✅ `themeConstants.ts`
  - ✅ `appConstants.ts`
  - ❌ `ApiConfig.ts`
  - ❌ `api_config.ts`

### **8. Tests**
- **Pattern**: `PascalCase.test.ts` or `PascalCase.test.tsx`
- **Examples**:
  - ✅ `UserProfile.test.tsx`
  - ✅ `AuthService.test.ts`
  - ❌ `userProfile.test.tsx`
  - ❌ `auth_service.test.ts`

### **9. Configuration Files**
- **Pattern**: `camelCase.ts`
- **Examples**:
  - ✅ `apiConfig.ts`
  - ✅ `appConfig.ts`
  - ❌ `ApiConfig.ts`

### **10. Index Files**
- **Pattern**: `index.ts` (always lowercase)
- **Examples**:
  - ✅ `index.ts`
  - ❌ `Index.ts`

## **🔄 Migration Plan**

### **Phase 1: Services (High Priority)**
- `activeRoutineService.ts` → `ActiveRoutineService.ts`
- `bodyTypeGoalsApi.ts` → `BodyTypeGoalsService.ts`
- `exerciseCategoryService.ts` → `ExerciseCategoryService.ts`
- `fitnessService.ts` → `FitnessService.ts`
- `healthService.ts` → `HealthService.ts`
- `nutritionService.ts` → `NutritionService.ts`
- `profileService.ts` → `ProfileService.ts`
- `routineService.ts` → `RoutineService.ts`
- `weatherService.ts` → `WeatherService.ts`

### **Phase 2: Utilities (Medium Priority)**
- `exerciseCategoryUtils.ts` → `exerciseCategoryUtils.ts` (already correct)
- `formValidation.ts` → `formValidation.ts` (already correct)
- `duplicateStyles.ts` → `duplicateStyles.ts` (already correct)
- `styleMigration.ts` → `styleMigration.ts` (already correct)

### **Phase 3: Components (Low Priority)**
- Most components already follow PascalCase correctly
- Focus on any remaining inconsistencies

### **Phase 4: Hooks (Low Priority)**
- Most hooks already follow `usePascalCase` correctly
- Focus on any remaining inconsistencies

## **📋 File Structure Standards**

```
src/
├── components/           # React components (PascalCase.tsx)
│   ├── ui/              # UI components
│   ├── forms/           # Form components
│   └── shared/          # Shared components
├── hooks/               # Custom hooks (usePascalCase.ts)
├── services/            # API services (PascalCaseService.ts)
├── stores/              # State stores (camelCaseStore.ts)
├── utils/               # Utility functions (camelCaseUtils.ts)
├── types/               # Type definitions (PascalCase.ts)
├── constants/           # Constants (camelCase.ts)
└── config/              # Configuration (camelCase.ts)
```

## **✅ Benefits of Standardization**

1. **Consistency**: Predictable file naming across the project
2. **Discoverability**: Easy to find files by type and purpose
3. **Maintainability**: Clear separation of concerns
4. **Team Collaboration**: Shared understanding of conventions
5. **Tooling**: Better IDE support and autocomplete
6. **Scalability**: Easy to add new files following established patterns

## **🚀 Implementation Steps**

1. **Audit**: Identify all files that don't follow conventions
2. **Rename**: Update file names to match standards
3. **Update Imports**: Fix all import statements
4. **Test**: Ensure all references are updated
5. **Document**: Update any documentation references
6. **Enforce**: Add linting rules to prevent future inconsistencies
