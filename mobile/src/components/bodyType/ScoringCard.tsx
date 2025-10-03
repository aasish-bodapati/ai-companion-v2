import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScoringResult } from '../../services/bodyTypeScoringService';

interface ScoringCardProps {
  title: string;
  result: ScoringResult;
  onPress?: () => void;
  compact?: boolean;
}

export default function ScoringCard({ title, result, onPress, compact = false }: ScoringCardProps) {
  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return { name: 'trending-up', color: '#10b981' };
      case 'neutral':
        return { name: 'remove', color: '#f59e0b' };
      case 'farther':
        return { name: 'trending-down', color: '#ef4444' };
      default:
        return { name: 'help', color: '#6b7280' };
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return '#10b981';
      case 'neutral':
        return '#f59e0b';
      case 'farther':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const alignmentIcon = getAlignmentIcon(result.alignment);
  const alignmentColor = getAlignmentColor(result.alignment);

  const CardContent = () => (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
        <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor + '20' }]}>
          <Ionicons name={alignmentIcon.name as any} size={compact ? 12 : 16} color={alignmentColor} />
          <Text style={[styles.alignmentText, { color: alignmentColor }, compact && styles.compactAlignmentText]}>
            {result.alignment.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.scoreMain}>
          <Text style={[styles.scoreValue, compact && styles.compactScoreValue]}>{result.percentage}%</Text>
          <Text style={[styles.scoreLabel, compact && styles.compactScoreLabel]}>Alignment</Text>
        </View>
        
        {!compact && (
          <View style={styles.scoreDetails}>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailValue}>{result.score}</Text>
              <Text style={styles.scoreDetailLabel}>Points</Text>
            </View>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailValue}>{result.maxScore}</Text>
              <Text style={styles.scoreDetailLabel}>Max</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${result.percentage}%`,
              backgroundColor: alignmentColor
            }
          ]} 
        />
      </View>

      {!compact && (
        <>
          <Text style={styles.feedbackText}>{result.feedback}</Text>

          {result.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              {result.suggestions.slice(0, 2).map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Ionicons name="bulb-outline" size={12} color="#f59e0b" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactContainer: {
    padding: 16,
    marginHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  compactTitle: {
    fontSize: 16,
  },
  alignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  compactAlignmentText: {
    fontSize: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreMain: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  compactScoreValue: {
    fontSize: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  compactScoreLabel: {
    fontSize: 12,
  },
  scoreDetails: {
    alignItems: 'flex-end',
  },
  scoreDetail: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  scoreDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  feedbackText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
});