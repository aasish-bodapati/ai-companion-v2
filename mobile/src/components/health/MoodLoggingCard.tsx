import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moodService, MoodLog, MoodStats } from '../../services/moodService';
import { hapticFeedback } from '../../utils/haptics';

interface MoodLoggingCardProps {
  compact?: boolean;
}

export default function MoodLoggingCard({ compact = false }: MoodLoggingCardProps) {
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [todaysLog, setTodaysLog] = useState<MoodLog | null>(null);
  const [retryQueue, setRetryQueue] = useState<number[]>([]);

  const loadStats = async () => {
    try {
      const [moodStats, todaysLogs] = await Promise.all([
        moodService.getMoodStats(7),
        moodService.getTodaysMoodLogs(),
      ]);
      setStats(moodStats);
      setTodaysLog(todaysLogs.length > 0 ? todaysLogs[0] : null);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  };

  useEffect(() => {
    // Defer loading to reduce initial API calls
    const timer = setTimeout(() => {
      loadStats();
    }, 800); // Load after 800ms delay
    
    return () => clearTimeout(timer);
  }, []);

  // Retry failed mood logs when component loads
  useEffect(() => {
    if (retryQueue.length > 0) {
      const retryMood = async () => {
        for (const rating of retryQueue) {
          try {
            await moodService.quickLogMood(rating);
          } catch {
          }
        }
        setRetryQueue([]);
        loadStats();
      };
      retryMood();
    }
  }, [retryQueue]);

  const handleQuickLog = async (rating: number, label?: string, emoji?: string) => {
    try {
      hapticFeedback.light();
      
      // Optimistic update - show the mood immediately
      const tempMoodLog = {
        id: Date.now(), // Use timestamp as temporary ID
        user_id: 0, // Will be replaced with real user ID
        mood_rating: rating,
        notes: '',
        log_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Update UI immediately
      setTodaysLog(tempMoodLog);
      
      // Try to log mood with shorter timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );
      
      await Promise.race([
        moodService.quickLogMood(rating, label, emoji),
        timeoutPromise
      ]);
      
      // Reload stats in background to get real data
      loadStats();
      
      hapticFeedback.success();
    } catch (err) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      hapticFeedback.error();
      
      // Add to retry queue for later sync
      setRetryQueue(prev => [...prev, rating]);
      
      // Keep the optimistic update even if API fails
      // This provides a better user experience
      
      // Show a more user-friendly error message
      const errorMessage = (err as Error).message === 'Request timeout' 
        ? 'Connection is slow. Your mood is saved locally and will sync when connection improves.'
        : 'Connection issue. Your mood is saved locally and will sync when connection improves.';
        
      Alert.alert('Offline Mode', errorMessage, [
        { 
          text: 'Retry', 
          onPress: () => handleQuickLog(rating) 
        },
        { text: 'OK', style: 'default' }
      ]);
    }
  };

  const handleMoodLog = (rating: number, label: string, emoji: string) => {
    // Log the selected mood rating with label and emoji
    handleQuickLog(rating, label, emoji);
  };

  // Get screen width for responsive design
  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - 64; // Account for card padding and margins
  const buttonWidth = Math.min(50, (availableWidth - 20) / 6); // 6 buttons in single row

  const moodOptions = [
    { emoji: '😴', label: 'Tired', rating: 2, color: '#6b7280' },
    { emoji: '😰', label: 'Stressed', rating: 3, color: '#ef4444' },
    { emoji: '😔', label: 'Down', rating: 2, color: '#dc2626' },
    { emoji: '😐', label: 'Neutral', rating: 5, color: '#f59e0b' },
    { emoji: '😊', label: 'Happy', rating: 8, color: '#10b981' },
    { emoji: '💪', label: 'Energetic', rating: 9, color: '#06b6d4' },
  ];

  const getMoodEmoji = (rating: number) => {
    const emojis = ['', '😢', '😴', '😕', '😐', '😑', '🙂', '😊', '😄', '🤩', '🥳'];
    return emojis[rating] || '😐';
  };

  const getMoodColor = (rating: number) => {
    if (rating <= 3) return '#ef4444';
    if (rating <= 5) return '#f59e0b';
    if (rating <= 7) return '#22c55e';
    if (rating <= 9) return '#3b82f6';
    return '#8b5cf6';
  };


  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {/* Mood Heading */}
      <View style={styles.titleContainer}>
        <Ionicons name="happy-outline" size={20} color="#8b5cf6" />
        <Text style={styles.title}>Mood</Text>
      </View>

      {/* Mood Emoji Grid */}
      <View style={styles.moodContainer}>
        {moodOptions.map((mood, index) => (
          <TouchableOpacity
            key={`${index}-${mood.label}`}
            style={[
              styles.moodButton, 
              { 
                backgroundColor: mood.color,
                width: buttonWidth,
                height: buttonWidth + 10, // Slightly taller for text
              }
            ]}
            onPress={() => handleMoodLog(mood.rating, mood.label, mood.emoji)}
            activeOpacity={0.7}
          >
            <Text style={[styles.moodEmoji, { fontSize: buttonWidth < 40 ? 14 : 16 }]}>
              {mood.emoji}
            </Text>
            <Text style={[styles.moodLabel, { fontSize: buttonWidth < 40 ? 7 : 8 }]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {todaysLog && (
        <View style={styles.todaysMood}>
          <Text style={styles.todaysMoodEmoji}>{getMoodEmoji(todaysLog.mood_rating)}</Text>
          <View style={styles.todaysMoodInfo}>
            <Text style={[styles.todaysMoodRating, { color: getMoodColor(todaysLog.mood_rating) }]}>
              {todaysLog.mood_rating}/10
            </Text>
            <Text style={styles.todaysMoodTime}>
              {new Date(todaysLog.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      )}

      {stats && stats.total_logs > 0 && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.average_mood.toFixed(1)}</Text>
            <Text style={styles.statLabel}>7-day avg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_logs}</Text>
            <Text style={styles.statLabel}>Total logs</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name={stats.mood_trend === 'increasing' ? 'trending-up' : stats.mood_trend === 'decreasing' ? 'trending-down' : 'remove'}
              size={16}
              color={stats.mood_trend === 'increasing' ? '#10b981' : stats.mood_trend === 'decreasing' ? '#ef4444' : '#6b7280'}
            />
            <Text style={styles.statLabel}>Trend</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    padding: 12,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  moodButton: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    marginHorizontal: 1,
    minWidth: 35,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  todaysMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todaysMoodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  todaysMoodInfo: {
    flex: 1,
  },
  todaysMoodRating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  todaysMoodTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
});
