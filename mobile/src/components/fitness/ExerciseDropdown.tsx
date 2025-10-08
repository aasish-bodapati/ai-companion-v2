import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService } from '../../services/fitnessService';

interface Exercise {
  id: number;
  name: string;
  logging_category: string;
}

interface ExerciseDropdownProps {
  visible: boolean;
  onClose: () => void;
  onExerciseSelected: (exercise: Exercise) => void;
  searchQuery: string;
}


export default function ExerciseDropdown({
  visible,
  onClose,
  onExerciseSelected,
  searchQuery,
}: ExerciseDropdownProps) {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible]);

  useEffect(() => {
    filterExercises();
  }, [allExercises, searchQuery, filterExercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const exercises = await fitnessService.getExerciseTypes();
      setAllExercises(exercises);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = useCallback(() => {
    let filtered = [...allExercises];

    // Filter by search term
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by relevance to search term
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Calculate relevance score for each exercise
        const getRelevanceScore = (name: string) => {
          let score = 0;
          
          // Exact match gets highest score
          if (name === searchTerm) score += 1000;
          
          // Starts with search term gets high score
          else if (name.startsWith(searchTerm)) score += 500;
          
          // Contains search term at word boundary gets medium score
          else if (name.includes(` ${searchTerm}`) || name.includes(`-${searchTerm}`)) score += 300;
          
          // Contains search term gets low score
          else if (name.includes(searchTerm)) score += 100;
          
          // Shorter names with same relevance get slight boost
          score += (100 - name.length) / 10;
          
          return score;
        };
        
        const aScore = getRelevanceScore(aName);
        const bScore = getRelevanceScore(bName);
        
        // Sort by relevance score (higher first), then alphabetically
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return aName.localeCompare(bName);
      });
    } else {
      // Sort alphabetically when no search term
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredExercises(filtered);
  }, [allExercises, searchQuery]);

  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelected(exercise);
    onClose();
  };

  const resetFilters = () => {
    // Reset search functionality if needed
  };

  if (!visible) return null;

  return (
    <View style={styles.dropdownContainer}>
      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={20} color="#6b7280" />
      </TouchableOpacity>
      


      {/* Exercise List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        ) : (
          <ScrollView 
            style={styles.exerciseList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredExercises.length > 0 ? (
              filteredExercises.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.exerciseItem}
                  activeOpacity={0.7}
                  onPressIn={() => handleExerciseSelect(item)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={32} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No exercises found</Text>
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
    maxHeight: 350,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10000,
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  exerciseList: {
    maxHeight: 250,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 48,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 12,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
});
