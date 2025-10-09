import React from 'react';
import { View, StyleSheet } from 'react-native';
import Badge, { CategoryBadge, StatusBadge, DifficultyBadge } from './Badge';

/**
 * Badge Component Usage Examples
 * 
 * This file demonstrates how to use the reusable Badge component
 * and its convenience variants throughout the app.
 */

export default function BadgeExamples() {
  return (
    <View style={styles.container}>
      {/* Basic Badge Usage */}
      <Badge variant="primary" size="small">Primary</Badge>
      <Badge variant="success" size="small">Success</Badge>
      <Badge variant="warning" size="small">Warning</Badge>
      <Badge variant="error" size="small">Error</Badge>
      
      {/* Badge with Icons */}
      <Badge variant="info" icon="heart" size="small">With Icon</Badge>
      <Badge variant="secondary" icon="star" size="medium">Medium</Badge>
      
      {/* Outline Style */}
      <Badge variant="primary" outline size="small">Outline</Badge>
      
      {/* Custom Colors */}
      <Badge backgroundColor="#8b5cf6" textColor="#fff" size="small">Custom</Badge>
      
      {/* Convenience Components */}
      <CategoryBadge category="bodyweight" size="small">Bodyweight</CategoryBadge>
      <CategoryBadge category="weighted" size="small">Weighted</CategoryBadge>
      <CategoryBadge category="cardio_duration" size="small">Cardio</CategoryBadge>
      <CategoryBadge category="running" size="small">Running</CategoryBadge>
      
      <StatusBadge status="active" size="small">Active</StatusBadge>
      <StatusBadge status="completed" size="small">Completed</StatusBadge>
      <StatusBadge status="pending" size="small">Pending</StatusBadge>
      
      <DifficultyBadge difficulty="beginner" size="small">Beginner</DifficultyBadge>
      <DifficultyBadge difficulty="intermediate" size="small">Intermediate</DifficultyBadge>
      <DifficultyBadge difficulty="advanced" size="small">Advanced</DifficultyBadge>
      
      {/* Pressable Badge */}
      <Badge variant="primary" onPress={() => console.log('Badge pressed!')} size="small">
        Pressable
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
});
