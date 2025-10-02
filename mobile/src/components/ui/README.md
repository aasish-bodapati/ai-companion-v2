# Mobile UI Components

This directory contains reusable UI components for the mobile app. These components follow consistent design patterns and provide a unified user experience.

## Theme System

### Constants (`../../theme/constants.ts`)
- `COLORS` - Color palette with semantic naming
- `SPACING` - Consistent spacing values
- `FONT_SIZE` - Typography scale
- `SHADOWS` - Shadow presets
- `MIXINS` - Common style combinations

## Components

### Layout & Structure

#### `DateSelector`
Reusable date selection component with navigation and calendar modal.
```tsx
<DateSelector
  selectedDate={date}
  onDateSelect={setDate}
  label="Select Date"
  calendarModalTitle="Choose Date"
/>
```

#### `FormModal`
Base modal component for forms with action buttons and loading states.
```tsx
<FormModal
  visible={visible}
  onClose={onClose}
  title="Form Title"
  primaryAction={{
    label: "Save",
    onPress: handleSave,
    variant: "primary"
  }}
  secondaryAction={{
    label: "Cancel",
    onPress: onClose
  }}
>
  {/* Form content */}
</FormModal>
```

#### `SectionHeader`
Consistent section headers with optional action buttons.
```tsx
<SectionHeader
  title="Section Title"
  subtitle="Optional subtitle"
  icon="settings"
  actionLabel="Add"
  onActionPress={handleAdd}
/>
```

### Data Display

#### `StatsCard`
Card component for displaying statistics with progress and achievements.
```tsx
<StatsCard
  title="Water Intake"
  icon="water"
  stats={[
    { label: "Today", value: 1500, unit: "ml" },
    { label: "Goal", value: 2000, unit: "ml" }
  ]}
  progress={{
    current: 1500,
    target: 2000,
    label: "Daily Goal"
  }}
  achievement={{
    reached: false,
    message: "Keep going!"
  }}
/>
```

### Form Inputs

#### `NumericInput`
Input component specifically for numeric values with validation.
```tsx
<NumericInput
  label="Weight"
  value={weight}
  onChangeText={setWeight}
  suffix="kg"
  allowDecimals={true}
  min={0}
  max={500}
/>
```

## Usage Guidelines

### Importing Components
```tsx
import { DateSelector, StatsCard, COLORS, SPACING } from '../ui';
```

### Styling
- Use theme constants instead of hardcoded values
- Follow the established color palette
- Maintain consistent spacing using `SPACING` constants
- Use `MIXINS` for common style patterns

### Accessibility
- All interactive components have minimum touch target sizes
- Components support haptic feedback where appropriate
- Proper semantic labeling is included

## Migration from Old Components

When refactoring existing components:

1. **Replace hardcoded colors** with theme constants
2. **Use DateSelector** instead of custom date selection UI
3. **Use StatsCard** for metric displays
4. **Use FormModal** for modal forms
5. **Use SectionHeader** for consistent section styling

## Examples

See the refactored components for examples:
- `WaterLoggingCard.tsx` - Uses `StatsCard`
- `MealLoggingModal.tsx` - Uses `DateSelector`
- `WorkoutLoggingModal.tsx` - Uses `DateSelector`
