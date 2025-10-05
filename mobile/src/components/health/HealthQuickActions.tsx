import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHealthLogger } from '../../hooks/useHealthLogger';
import UniversalHealthLogger from './UniversalHealthLogger';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  type: 'workout' | 'meal' | 'water' | 'mood';
  description?: string;
  shortcut?: string;
}

interface HealthQuickActionsProps {
  actions?: QuickAction[];
  layout?: 'grid' | 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  onActionPress?: (action: QuickAction) => void;
  style?: any;
}

const defaultActions: QuickAction[] = [
  {
    id: 'workout',
    title: 'Log Workout',
    icon: 'fitness',
    color: '#3b82f6',
    type: 'workout',
    description: 'Track your exercise',
    shortcut: 'W',
  },
  {
    id: 'meal',
    title: 'Log Meal',
    icon: 'restaurant',
    color: '#10b981',
    type: 'meal',
    description: 'Record your food',
    shortcut: 'M',
  },
  {
    id: 'water',
    title: 'Log Water',
    icon: 'water',
    color: '#06b6d4',
    type: 'water',
    description: 'Track hydration',
    shortcut: 'H',
  },
  {
    id: 'mood',
    title: 'Log Mood',
    icon: 'happy',
    color: '#f59e0b',
    type: 'mood',
    description: 'Check in with yourself',
    shortcut: 'E',
  },
];

export default function HealthQuickActions({
  actions = defaultActions,
  layout = 'grid',
  showDescriptions = false,
  onActionPress,
  style,
}: HealthQuickActionsProps) {
  const workoutLogger = useHealthLogger({ type: 'workout' });
  const mealLogger = useHealthLogger({ type: 'meal' });
  const waterLogger = useHealthLogger({ type: 'water' });
  const moodLogger = useHealthLogger({ type: 'mood' });

  const getLogger = (type: string) => {
    switch (type) {
      case 'workout': return workoutLogger;
      case 'meal': return mealLogger;
      case 'water': return waterLogger;
      case 'mood': return moodLogger;
      default: return null;
    }
  };

  const handleActionPress = (action: QuickAction) => {
    if (onActionPress) {
      onActionPress(action);
      return;
    }

    const logger = getLogger(action.type);
    if (logger) {
      logger.openLogger();
    }
  };


  const getContainerStyle = () => {
    switch (layout) {
      case 'horizontal':
        return styles.horizontalContainer;
      case 'vertical':
        return styles.verticalContainer;
      default:
        return styles.gridContainer;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={getContainerStyle()}>
        {actions.map((action) => {
          const logger = getLogger(action.type);
          const isVisible = logger?.isVisible || false;

          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.color },
                layout === 'horizontal' && styles.horizontalAction,
                layout === 'vertical' && styles.verticalAction,
                layout === 'grid' && styles.gridAction,
              ]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.8}
            >
              <View style={styles.actionContent}>
                <Ionicons name={action.icon as any} size={12} color="#ffffff" />
                <Text style={styles.actionTitle}>{action.title}</Text>
                {showDescriptions && action.description && (
                  <Text style={styles.actionDescription}>{action.description}</Text>
                )}
                {action.shortcut && (
                  <View style={styles.shortcutBadge}>
                    <Text style={styles.shortcutText}>{action.shortcut}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Universal Loggers */}
      <UniversalHealthLogger
        visible={workoutLogger.isVisible}
        onClose={workoutLogger.closeLogger}
        onSave={workoutLogger.saveData}
        type="workout"
      />
      
      <UniversalHealthLogger
        visible={mealLogger.isVisible}
        onClose={mealLogger.closeLogger}
        onSave={mealLogger.saveData}
        type="meal"
      />
      
      <UniversalHealthLogger
        visible={waterLogger.isVisible}
        onClose={waterLogger.closeLogger}
        onSave={waterLogger.saveData}
        type="water"
      />
      
      <UniversalHealthLogger
        visible={moodLogger.isVisible}
        onClose={moodLogger.closeLogger}
        onSave={moodLogger.saveData}
        type="mood"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingLeft: 0,
  },
  horizontalContent: {
    gap: 2,
  },
  verticalContainer: {
    gap: 4,
  },
  actionButton: {
    borderRadius: 3,
    padding: 3,
    minHeight: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  horizontalAction: {
    flex: 1,
    marginHorizontal: 0.25,
  },
  verticalAction: {
    width: '100%',
  },
  gridAction: {
    width: '48%',
    marginBottom: 12,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  actionDescription: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  shortcutBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shortcutText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
