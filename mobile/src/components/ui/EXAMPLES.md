# UI Components Usage Examples

This document provides comprehensive examples and best practices for using the shared UI components.

## Table of Contents

- [Getting Started](#getting-started)
- [Component Examples](#component-examples)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Installation
```tsx
import { 
  StatsCard, 
  FormField, 
  DateSelector, 
  FormModal,
  COLORS,
  SPACING 
} from '../ui';
```

### Basic Setup
```tsx
import React from 'react';
import { View } from 'react-native';
import { StatsCard, FormField, DateSelector } from '../ui';

export default function ExampleScreen() {
  return (
    <View>
      <StatsCard
        title="Water Intake"
        value="1500ml"
        subtitle="Goal: 2000ml"
        icon="water"
        variant="primary"
      />
    </View>
  );
}
```

## Component Examples

### StatsCard

#### Basic Usage
```tsx
<StatsCard
  title="Workouts"
  value={5}
  subtitle="This week"
  icon="fitness"
  variant="primary"
/>
```

#### With Trend
```tsx
<StatsCard
  title="Weight"
  value="75kg"
  subtitle="Current"
  trend="down"
  trendValue="-2kg"
  icon="scale"
  variant="success"
/>
```

#### Interactive
```tsx
<StatsCard
  title="Calories"
  value="1200"
  subtitle="Consumed today"
  icon="flame"
  onPress={() => navigateToNutrition()}
  variant="warning"
/>
```

#### Loading State
```tsx
<StatsCard
  title="Loading..."
  value="..."
  loading
  icon="refresh"
/>
```

### FormField

#### Basic Input
```tsx
<FormField
  name="email"
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  keyboardType="email-address"
  required
/>
```

#### With Validation
```tsx
<FormField
  name="password"
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  error={passwordError}
  helperText="Must be at least 8 characters"
  required
/>
```

#### Numeric Input
```tsx
<FormField
  name="age"
  label="Age"
  value={age}
  onChangeText={setAge}
  keyboardType="numeric"
  maxLength={3}
  suffix="years"
/>
```

#### With Icon
```tsx
<FormField
  name="search"
  label="Search"
  value={searchQuery}
  onChangeText={setSearchQuery}
  icon="search"
  onIconPress={handleSearch}
  placeholder="Search..."
/>
```

### DateSelector

#### Basic Date Selection
```tsx
<DateSelector
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  label="Select Date"
/>
```

#### With Custom Label
```tsx
<DateSelector
  selectedDate={workoutDate}
  onDateSelect={setWorkoutDate}
  label="Workout Date"
  calendarModalTitle="Choose Workout Date"
  showLogsIndicator
/>
```

#### Without Today Button
```tsx
<DateSelector
  selectedDate={birthDate}
  onDateSelect={setBirthDate}
  label="Birth Date"
  showTodayButton={false}
/>
```

### FormModal

#### Basic Modal
```tsx
<FormModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Add Workout"
  subtitle="Log your exercise session"
  primaryAction={{
    label: 'Save',
    onPress: handleSave,
  }}
  secondaryAction={{
    label: 'Cancel',
    onPress: () => setShowModal(false),
  }}
>
  <FormField
    name="exercise"
    label="Exercise"
    value={exercise}
    onChangeText={setExercise}
  />
</FormModal>
```

#### With Loading State
```tsx
<FormModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Saving..."
  loading
  primaryAction={{
    label: 'Save',
    onPress: handleSave,
  }}
>
  {/* Form content */}
</FormModal>
```

#### With Form Validation
```tsx
<FormModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Create Account"
  isFormValid={isFormValid}
  primaryAction={{
    label: 'Create',
    onPress: handleCreate,
    disabled: !isFormValid,
  }}
>
  {/* Form content */}
</FormModal>
```

## Best Practices

### 1. Consistent Styling

#### Use Theme Constants
```tsx
// ✅ Good
<View style={{ padding: SPACING.medium, backgroundColor: COLORS.background.primary }}>

// ❌ Bad
<View style={{ padding: 16, backgroundColor: '#ffffff' }}>
```

#### Use Semantic Colors
```tsx
// ✅ Good
<StatsCard variant="success" />  // For positive metrics
<StatsCard variant="warning" />  // For attention needed
<StatsCard variant="error" />    // For negative metrics

// ❌ Bad
<StatsCard style={{ backgroundColor: '#00ff00' }} />
```

### 2. Accessibility

#### Always Provide Labels
```tsx
// ✅ Good
<FormField
  label="Email Address"
  accessibilityLabel="Email address input field"
/>

// ❌ Bad
<FormField placeholder="Enter email" />
```

#### Use Semantic Roles
```tsx
// ✅ Good
<StatsCard
  title="Clickable Stat"
  onPress={handlePress}
  accessibilityRole="button"
/>

// ❌ Bad
<StatsCard title="Stat" onPress={handlePress} />
```

### 3. Performance

#### Memoize Callbacks
```tsx
// ✅ Good
const handleDateSelect = useCallback((date: Date) => {
  setSelectedDate(date);
}, []);

<DateSelector
  selectedDate={selectedDate}
  onDateSelect={handleDateSelect}
/>

// ❌ Bad
<DateSelector
  selectedDate={selectedDate}
  onDateSelect={(date) => setSelectedDate(date)}
/>
```

#### Use Appropriate Variants
```tsx
// ✅ Good - Use size prop for different use cases
<StatsCard size="small" />   // For compact displays
<StatsCard size="large" />   // For prominent displays

// ❌ Bad - Don't override with custom styles
<StatsCard style={{ minHeight: 200 }} />
```

### 4. Error Handling

#### Provide Clear Error Messages
```tsx
// ✅ Good
<FormField
  name="email"
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  helperText="We'll never share your email"
/>

// ❌ Bad
<FormField
  name="email"
  label="Email"
  value={email}
  onChangeText={setEmail}
  error="Error"
/>
```

#### Handle Loading States
```tsx
// ✅ Good
<FormModal
  loading={isSubmitting}
  primaryAction={{
    label: isSubmitting ? 'Saving...' : 'Save',
    onPress: handleSave,
  }}
/>

// ❌ Bad
<FormModal
  primaryAction={{
    label: 'Save',
    onPress: handleSave,
  }}
/>
```

## Common Patterns

### 1. Form with Validation

```tsx
function WorkoutForm() {
  const [formData, setFormData] = useState({
    exercise: '',
    duration: '',
    calories: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.exercise) newErrors.exercise = 'Exercise is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.calories) newErrors.calories = 'Calories is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await saveWorkout(formData);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title="Log Workout"
      loading={isSubmitting}
      isFormValid={Object.keys(errors).length === 0}
      primaryAction={{
        label: 'Save',
        onPress: handleSubmit,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <FormField
        name="exercise"
        label="Exercise"
        value={formData.exercise}
        onChangeText={(text) => setFormData(prev => ({ ...prev, exercise: text }))}
        error={errors.exercise}
        required
      />
      <FormField
        name="duration"
        label="Duration (minutes)"
        value={formData.duration}
        onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
        keyboardType="numeric"
        error={errors.duration}
        required
      />
      <FormField
        name="calories"
        label="Calories Burned"
        value={formData.calories}
        onChangeText={(text) => setFormData(prev => ({ ...prev, calories: text }))}
        keyboardType="numeric"
        error={errors.calories}
        required
      />
    </FormModal>
  );
}
```

### 2. Dashboard with Stats

```tsx
function Dashboard() {
  const [stats, setStats] = useState({
    workouts: 0,
    calories: 0,
    water: 0,
    weight: 0,
  });

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatsCard
          title="Workouts"
          value={stats.workouts}
          subtitle="This week"
          icon="fitness"
          variant="primary"
          onPress={() => navigateToWorkouts()}
        />
        <StatsCard
          title="Calories"
          value={stats.calories}
          subtitle="Burned today"
          icon="flame"
          variant="warning"
          trend="up"
          trendValue="+5%"
        />
        <StatsCard
          title="Water"
          value={`${stats.water}ml`}
          subtitle="Goal: 2000ml"
          icon="water"
          variant="primary"
          onPress={() => navigateToWaterLog()}
        />
        <StatsCard
          title="Weight"
          value={`${stats.weight}kg`}
          subtitle="Current"
          icon="scale"
          variant="success"
          trend="down"
          trendValue="-1kg"
        />
      </View>
    </View>
  );
}
```

### 3. Date-based Logging

```tsx
function LoggingScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState([]);

  return (
    <View>
      <DateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        label="Select Date"
        showLogsIndicator
        calendarModalTitle="Choose Date"
      />
      
      {logs.length === 0 ? (
        <EmptyState message="No logs for this date" />
      ) : (
        <LogsList logs={logs} />
      )}
    </View>
  );
}
```

## Migration Guide

### From Custom Components

#### Before (Custom Stats Card)
```tsx
<View style={styles.customCard}>
  <Text style={styles.title}>Workouts</Text>
  <Text style={styles.value}>5</Text>
  <Text style={styles.subtitle}>This week</Text>
</View>
```

#### After (StatsCard Component)
```tsx
<StatsCard
  title="Workouts"
  value={5}
  subtitle="This week"
  variant="primary"
/>
```

#### Before (Custom Form Field)
```tsx
<View style={styles.fieldContainer}>
  <Text style={styles.label}>Email</Text>
  <TextInput
    style={styles.input}
    value={email}
    onChangeText={setEmail}
    placeholder="Enter email"
  />
  {error && <Text style={styles.error}>{error}</Text>}
</View>
```

#### After (FormField Component)
```tsx
<FormField
  name="email"
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email"
  error={error}
/>
```

### Theme Migration

#### Before (Hardcoded Values)
```tsx
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
  },
});
```

#### After (Theme Constants)
```tsx
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/constants';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.medium,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.small,
  },
});
```

## Troubleshooting

### Common Issues

#### 1. Component Not Rendering
```tsx
// Check imports
import { StatsCard } from '../ui'; // ✅ Correct
import StatsCard from '../ui/StatsCard'; // ✅ Also correct

// Check props
<StatsCard title="Test" value="100" /> // ✅ Required props
<StatsCard /> // ❌ Missing required props
```

#### 2. Styling Issues
```tsx
// Use theme constants
<StatsCard variant="primary" /> // ✅ Use variants
<StatsCard style={{ backgroundColor: 'red' }} /> // ❌ Avoid custom styles

// Check theme imports
import { COLORS, SPACING } from '../theme/constants'; // ✅ Correct
```

#### 3. Event Handling
```tsx
// Memoize callbacks
const handlePress = useCallback(() => {
  // Handle press
}, []);

<StatsCard onPress={handlePress} /> // ✅ Memoized
<StatsCard onPress={() => handlePress()} /> // ❌ Not memoized
```

#### 4. Accessibility Issues
```tsx
// Provide proper labels
<FormField
  label="Email Address" // ✅ Clear label
  accessibilityLabel="Email address input field" // ✅ A11y label
/>

<FormField placeholder="Email" /> // ❌ No label
```

### Performance Issues

#### 1. Re-renders
```tsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <StatsCard title="Complex" value={data.complexValue} />;
});

// Memoize callbacks
const handleDateSelect = useCallback((date: Date) => {
  setSelectedDate(date);
}, []);
```

#### 2. Large Lists
```tsx
// Use FlatList for large datasets
<FlatList
  data={largeDataset}
  renderItem={({ item }) => <StatsCard {...item} />}
  keyExtractor={(item) => item.id}
/>
```

### Debug Tips

1. **Check Console**: Look for prop validation warnings
2. **Use React DevTools**: Inspect component props and state
3. **Test in Isolation**: Test components individually
4. **Check Dependencies**: Ensure all required dependencies are installed
5. **Verify Imports**: Double-check import paths and names

## Resources

- [Component API Reference](./README.md)
- [Theme System Guide](../theme/constants.ts)
- [Testing Guide](./__tests__/README.md)
- [Design System Guidelines](./DESIGN_SYSTEM.md)
