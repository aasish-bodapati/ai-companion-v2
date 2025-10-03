# Body Type Scoring System & Dashboard

A comprehensive point-based scoring system that tracks how well user actions align with their chosen body type goals, featuring real-time feedback and gamification elements.

## 🎯 Overview

The Body Type Scoring System transforms simple activity logging into an engaging, coach-like experience that motivates users to stay aligned with their specific body type goals.

### Key Features

- **Point-based scoring** for all activities and meals
- **Real-time alignment tracking** (Closer ↗, Neutral →, Farther ↘)
- **Visual progress meters** and trend graphs
- **Smart feedback** with actionable suggestions
- **Gamification elements** (streaks, achievements)
- **Comprehensive dashboard** with detailed breakdowns

## 📊 Scoring Tables

### Sleek & Graceful
| Activity | Points | Notes |
|----------|--------|-------|
| Cardio/Mobility/Yoga | +10 | Perfect for lean goals |
| Light/Moderate Strength | +5 | Balanced approach |
| Heavy Hypertrophy | -5 | Too intense for lean goals |
| Skipped Workout | -8 | Consistency is key |
| Protein 1.2-1.6 g/kg | +7 | Optimal for lean muscle |
| Calorie Deficit/Maintenance | +10 | Weight management focus |
| Overeating (+20%) | -10 | Counterproductive |
| Junk/Processed Meal | -5 | Quality matters |
| 4-5 Sessions/Week | +15 | Consistency bonus |
| 2+ Missed Sessions | -10 | Consistency penalty |

### Strong & Steady
| Activity | Points | Notes |
|----------|--------|-------|
| Strength Training | +12 | Core focus |
| Moderate Cardio | +5 | Balanced approach |
| Only Cardio All Week | -5 | Missing strength focus |
| Skipped Workout | -10 | Consistency critical |
| Protein 1.6-2.0 g/kg | +10 | Muscle building range |
| Calories Near Maintenance | +8 | Steady progress |
| Severe Deficit (-20%) | -10 | Counterproductive |
| Junk/Processed | -5 | Quality matters |
| 4-5 Sessions/Week | +15 | Consistency bonus |
| Progressive Overload | +10 | Strength building |

### Big & Bold
| Activity | Points | Notes |
|----------|--------|-------|
| Heavy Strength/Hypertrophy | +15 | Primary focus |
| Moderate Cardio | +3 | Recovery only |
| Excess Cardio | -8 | Counterproductive |
| Skipped Strength | -12 | Major setback |
| Protein 1.8-2.4 g/kg | +12 | High protein needs |
| Calorie Surplus | +10 | Growth focus |
| Calorie Deficit | -15 | Counterproductive |
| Junk/Processed | -7 | Quality critical |
| 5-6 Strength/Week | +20 | High frequency bonus |
| Progressive Overload | +15 | Essential for growth |

## 🏗️ Architecture

### Core Components

1. **BodyTypeScoringService** - Core scoring logic
2. **BodyTypeProgressDashboard** - Main dashboard UI
3. **ScoringCard** - Individual score display
4. **useBodyTypeScoring** - React hook for easy integration

### Data Flow

```
User Logs Activity/Meal
    ↓
Scoring Engine (BodyTypeScoringService)
    ↓
Point Assignment (+/- points)
    ↓
Daily Score Calculation
    ↓
Alignment Assessment (Closer/Neutral/Farther)
    ↓
Dashboard Display (BodyTypeProgressDashboard)
    ↓
User Feedback & Suggestions
```

## 🎨 Dashboard Features

### Goal Overview Section
- **Goal icon** and name display
- **Weekly alignment percentage**
- **Visual status indicator**

### Progress Meter
- **Today's score** with +/- points
- **Visual progress bar** (Closer ↗ to Farther ↘)
- **Real-time alignment** color coding

### Daily Breakdown Cards
- **Workout points** with session details
- **Nutrition points** with meal analysis
- **Consistency tracking** with missed sessions

### Trend Graph
- **7-day alignment** visualization
- **Progress tracking** over time
- **Pattern recognition** for insights

### Smart Feedback Box
- **Contextual coaching** messages
- **Actionable suggestions** based on performance
- **Motivational tone** adjustment

### Gamification Elements
- **Streak tracking** (consecutive days >70% alignment)
- **Achievement badges** (milestone rewards)
- **Progress celebrations** (visual feedback)

## 🚀 Usage Examples

### Basic Integration

```typescript
import { useBodyTypeScoring } from '../hooks/useBodyTypeScoring';
import BodyTypeProgressDashboard from '../components/bodyType/BodyTypeProgressDashboard';

function MyDashboard() {
  const { dailyResult, weeklyResult, loading } = useBodyTypeScoring({
    bodyTypeGoal: selectedGoal,
    userAttributes: userData,
    dailyLog: todayLogs,
    weeklyLog: weekLogs,
  });

  return (
    <BodyTypeProgressDashboard
      bodyTypeGoal={selectedGoal}
      userAttributes={userData}
      dailyLog={todayLogs}
      weeklyLog={weekLogs}
      onRefresh={handleRefresh}
      onLogActivity={handleLogActivity}
    />
  );
}
```

### Individual Score Cards

```typescript
import ScoringCard from '../components/bodyType/ScoringCard';

function ScoreDisplay({ result }) {
  return (
    <ScoringCard
      title="Today's Progress"
      result={result}
      onPress={() => navigateToDetails()}
      compact={true}
    />
  );
}
```

### Custom Scoring Logic

```typescript
import { BodyTypeScoringService } from '../services/bodyTypeScoringService';

const scoringService = new BodyTypeScoringService(bodyTypeGoal, userAttributes);

// Score individual activities
const workoutScore = scoringService.scoreWorkout({
  type: 'strength',
  duration: 60,
  intensity: 'moderate'
});

const nutritionScore = scoringService.scoreNutrition({
  proteinPerKg: 1.8,
  calories: 2200,
  tdee: 2000,
  isJunkProcessed: false
});
```

## 🎯 Alignment Calculation

### Daily Alignment
```
Daily Score = Sum of all activity points
Alignment % = (Positive Points ÷ Max Possible Points) × 100
```

### Weekly Alignment
```
Weekly Score = Sum of daily scores + consistency bonuses
Alignment % = (Weekly Score ÷ Max Weekly Score) × 100
```

### Alignment Categories
- **Closer ↗**: >70% alignment (Green)
- **Neutral →**: 40-70% alignment (Yellow)
- **Farther ↘**: <40% alignment (Red)

## 🔧 Customization

### Adding New Body Types
1. Update scoring tables in `BodyTypeScoringService`
2. Add goal-specific logic in scoring methods
3. Update UI components to handle new types

### Modifying Point Values
1. Edit scoring tables in the service
2. Adjust max score calculations
3. Update alignment thresholds if needed

### Custom Feedback Messages
1. Modify feedback methods in `BodyTypeScoringService`
2. Add goal-specific suggestions
3. Customize motivational tone

## 📱 UI Components

### BodyTypeProgressDashboard
Main dashboard with all sections and features.

**Props:**
- `bodyTypeGoal`: User's selected body type goal
- `userAttributes`: User's physical attributes
- `dailyLog`: Today's activity and nutrition logs
- `weeklyLog`: This week's logs (optional)
- `onRefresh`: Refresh callback
- `onLogActivity`: Log activity callback

### ScoringCard
Individual score display component.

**Props:**
- `title`: Card title
- `result`: ScoringResult object
- `onPress`: Press callback (optional)
- `compact`: Compact display mode

### useBodyTypeScoring
React hook for easy integration.

**Returns:**
- `dailyResult`: Today's scoring result
- `weeklyResult`: Weekly scoring result
- `loading`: Loading state
- `error`: Error message
- `refreshScores`: Refresh function
- `isReady`: Ready state

## 🎮 Gamification Features

### Streak Tracking
- Tracks consecutive days with >70% alignment
- Visual flame icon with day count
- Motivates consistency

### Achievement System
- Milestone-based rewards
- Progress celebrations
- Social sharing potential

### Progress Visualization
- Color-coded alignment indicators
- Trend graphs and charts
- Real-time feedback

## 🔮 Future Enhancements

### Planned Features
- **Social leaderboards** for community motivation
- **Custom goal creation** for advanced users
- **AI-powered suggestions** based on patterns
- **Integration with wearables** for automatic logging
- **Team challenges** and group goals

### Advanced Analytics
- **Pattern recognition** in user behavior
- **Predictive scoring** based on trends
- **Personalized recommendations** using ML
- **Long-term progress tracking** and insights

## 📈 Performance Considerations

### Optimization Tips
- Use `useMemo` for expensive calculations
- Implement proper loading states
- Cache scoring results when possible
- Lazy load dashboard components

### Memory Management
- Clean up scoring service instances
- Avoid memory leaks in long-running sessions
- Optimize image and icon usage

## 🧪 Testing

### Unit Tests
- Test scoring logic with various inputs
- Verify alignment calculations
- Test edge cases and error handling

### Integration Tests
- Test dashboard with real data
- Verify hook behavior
- Test user interactions

### Performance Tests
- Measure rendering performance
- Test with large datasets
- Verify smooth animations

---

This scoring system transforms simple activity logging into an engaging, coach-like experience that motivates users to stay aligned with their body type goals while providing clear, actionable feedback and progress tracking.
