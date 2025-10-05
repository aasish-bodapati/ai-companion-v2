# Component Migration Guide

This guide explains how to safely migrate from old components to new unified components.

## 🚀 Quick Start

### 1. Enable Feature Flags (Gradually)

```typescript
// config/featureFlags.ts
export const FEATURE_FLAGS = {
  ENABLE_DEPRECATION_WARNINGS: true,  // Start with warnings
  USE_UNIFIED_PROGRESS_RING: false,   // Start disabled
  USE_UNIFIED_LOADING_STATE: false,   // Start disabled
  USE_NEW_STYLE_CONSTANTS: false,     // Start disabled
};
```

### 2. Use New Components in New Features Only

```typescript
// NEW component - can use new patterns
import { UnifiedProgressRing } from '../components/ui/UnifiedProgressRing';
import { createLoadingState } from '../utils/duplicateCodeUtils';

const NewFeature = () => {
  const { loading, withLoading } = createLoadingState();
  
  return (
    <UnifiedProgressRing
      value={75}
      target={100}
      label="Progress"
      color="#3b82f6"
    />
  );
};
```

### 3. Gradually Migrate Existing Components

```typescript
// EXISTING component - use migration helpers
import { MigrationHelpers } from '../utils/migrationHelpers';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';

const ExistingComponent = () => {
  // OLD: const [loading, setLoading] = useState(false);
  const { loading, withLoading } = MigrationHelpers.replaceLoadingState(ExistingComponent);
  
  return (
    <View style={MigrationHelpers.replaceStyle(styles.oldStyle, styles.newStyle)}>
      {/* Component content */}
    </View>
  );
};
```

## 📋 Migration Checklist

### Phase 1: Preparation ✅
- [x] Create unified components
- [x] Add deprecation warnings
- [x] Create migration helpers
- [x] Add feature flags

### Phase 2: Gradual Adoption (Current)
- [ ] Use new components in new features
- [ ] Enable deprecation warnings
- [ ] Test new components thoroughly
- [ ] Document any issues

### Phase 3: Migration
- [ ] Enable feature flags one by one
- [ ] Migrate existing components gradually
- [ ] Monitor for any issues
- [ ] Update documentation

### Phase 4: Cleanup
- [ ] Remove old components
- [ ] Clean up unused imports
- [ ] Optimize bundle size
- [ ] Final testing

## 🔧 Component Mappings

### ProgressRing Components

| Old Component | New Component | Migration Notes |
|---------------|---------------|-----------------|
| `shared/ProgressRing` | `UnifiedProgressRing` | Use `variant="shared"` |
| `ui/ProgressRing` | `UnifiedProgressRing` | Use `variant="ui"` |

**Migration Example:**
```typescript
// OLD
import ProgressRing from '../shared/ProgressRing';
<ProgressRing value={75} target={100} label="Progress" />

// NEW
import { UnifiedProgressRing } from '../ui/UnifiedProgressRing';
<UnifiedProgressRing 
  value={75} 
  target={100} 
  label="Progress" 
  variant="shared" 
/>
```

### LoadingState Components

| Old Component | New Component | Migration Notes |
|---------------|---------------|-----------------|
| `LoadingState` | `UnifiedLoadingState` | Use `variant="default"` |
| `EnhancedLoadingState` | `UnifiedLoadingState` | Use `variant="overlay"` |
| `ProgressIndicator` | `UnifiedLoadingState` | Use `variant="progress"` |

**Migration Example:**
```typescript
// OLD
import LoadingState from '../ui/LoadingState';
<LoadingState loading={true} message="Loading..." />

// NEW
import { UnifiedLoadingState } from '../ui/UnifiedLoadingState';
<UnifiedLoadingState 
  loading={true} 
  message="Loading..." 
  variant="default" 
/>
```

## 🎨 Style Migration

### Replace Hardcoded Values

```typescript
// OLD: Hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
  },
});

// NEW: Using constants
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';

const styles = StyleSheet.create({
  container: {
    backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC,
    borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_16,
    paddingHorizontal: DUPLICATE_STYLES.PADDING_HORIZONTAL_20,
    fontSize: DUPLICATE_STYLES.FONT_SIZE_18,
  },
});
```

### Use Migration Helpers

```typescript
// GRADUAL: Using migration helpers
import { MigrationHelpers } from '../utils/migrationHelpers';

const styles = StyleSheet.create({
  container: MigrationHelpers.replaceStyle(
    { backgroundColor: '#f8fafc' }, // Old style
    { backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC } // New style
  ),
});
```

## 🐛 Debugging

### Enable Debug Logging

```typescript
// OLD
console.log('Loading data...', data);

// NEW
import { DebugUtils } from '../utils/debugUtils';
DebugUtils.log('Loading data...', data);
```

### Check Feature Flags

```typescript
import { isFeatureEnabled } from '../config/featureFlags';

if (isFeatureEnabled('USE_UNIFIED_PROGRESS_RING')) {
  // Use new component
} else {
  // Use old component
}
```

## ⚠️ Common Issues

### 1. Import Errors
**Problem:** `Module not found` errors when importing new components
**Solution:** Check file paths and ensure components are exported correctly

### 2. Prop Mismatches
**Problem:** New component doesn't accept all old props
**Solution:** Use `variant` prop to specify which behavior to use

### 3. Style Differences
**Problem:** New components look different from old ones
**Solution:** Check that all style constants match the original hardcoded values

### 4. Performance Issues
**Problem:** New components are slower
**Solution:** Check if animations are properly optimized, use `animated={false}` if needed

## 🧪 Testing

### Test New Components

```typescript
// Test that new components work the same as old ones
import { render, screen } from '@testing-library/react-native';
import { UnifiedProgressRing } from '../ui/UnifiedProgressRing';

test('UnifiedProgressRing renders correctly', () => {
  render(
    <UnifiedProgressRing
      value={75}
      target={100}
      label="Test"
      variant="shared"
    />
  );
  
  expect(screen.getByText('75')).toBeTruthy();
  expect(screen.getByText('100')).toBeTruthy();
  expect(screen.getByText('Test')).toBeTruthy();
});
```

### Test Migration Helpers

```typescript
// Test that migration helpers work correctly
import { MigrationHelpers } from '../utils/migrationHelpers';

test('replaceStyle works correctly', () => {
  const oldStyle = { backgroundColor: '#f8fafc' };
  const newStyle = { backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC };
  
  const result = MigrationHelpers.replaceStyle(oldStyle, newStyle);
  expect(result).toEqual(newStyle);
});
```

## 📊 Progress Tracking

### Current Status
- ✅ Phase 1: Preparation Complete
- 🔄 Phase 2: Gradual Adoption (In Progress)
- ⏳ Phase 3: Migration (Pending)
- ⏳ Phase 4: Cleanup (Pending)

### Metrics
- **Files Cleaned:** 5 unused files removed
- **Components Created:** 2 unified components
- **Utilities Created:** 6 utility modules
- **Feature Flags:** 8 flags added
- **Deprecation Warnings:** Added to 2 components

### Next Steps
1. Enable deprecation warnings
2. Test new components in development
3. Start using new components in new features
4. Gradually migrate existing components
5. Monitor for any issues

## 🤝 Contributing

When adding new components or utilities:

1. **Follow the naming convention:** `Unified[ComponentName]`
2. **Add deprecation warnings** to old components
3. **Use feature flags** for gradual rollout
4. **Update this guide** with new information
5. **Test thoroughly** before enabling feature flags

## 📞 Support

If you encounter issues during migration:

1. Check the [Migration Examples](../examples/MigrationExamples.tsx)
2. Review the [Feature Flags](../config/featureFlags.ts)
3. Check the [Utility Functions](../utils/)
4. Create an issue with detailed information
