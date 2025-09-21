'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MagnifyingGlassIcon, HeartIcon, ClockIcon, MapIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface LoggingAttribute {
  name: string;
  type: 'number' | 'text' | 'select';
  label: string;
  min?: number;
  max?: number;
  max_length?: number;
  options?: string[];
}

interface ExerciseCategory {
  id: number;
  name: string;
  category: string;
  display_name: string;
  description: string;
  logging_attributes: {
    required: LoggingAttribute[];
    optional: LoggingAttribute[];
  };
  icon: string;
  color: string;
}

interface Exercise {
  id: number;
  name: string;
  logging_category: string;
  logging_category_info: ExerciseCategory;
  difficulty: string;
  calories_per_minute: number;
  description: string;
  icon: string;
}

interface ExerciseCategorySelectorProps {
  onExerciseSelect: (exercise: Exercise) => void;
  onCategorySelect?: (category: ExerciseCategory) => void;
  selectedCategory?: string;
  className?: string;
}

const ExerciseCategorySelector: React.FC<ExerciseCategorySelectorProps> = ({
  onExerciseSelect,
  onCategorySelect,
  selectedCategory,
  className = ''
}) => {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(selectedCategory || '');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadExercises(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/health/exercises/categories');
      setCategories(response.data.categories);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoading(false);
    }
  };

  const loadExercises = async (categoryId: string) => {
    try {
      const response = await api.get(`/health/exercises/all`);
      const allExercises = response.data.exercises;
      const filteredExercises = allExercises.filter((ex: Exercise) => 
        ex.logging_category === categoryId
      );
      setExercises(filteredExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bodyweight':
        return <UserIcon className="h-5 w-5" />;
      case 'weighted':
        return <HeartIcon className="h-5 w-5" />; // Using HeartIcon as placeholder for weighted
      case 'cardio_duration':
        return <HeartIcon className="h-5 w-5" />;
      case 'hold_static':
        return <ClockIcon className="h-5 w-5" />;
      case 'repetition_only':
        return <ArrowPathIcon className="h-5 w-5" />;
      case 'distance_based':
        return <MapIcon className="h-5 w-5" />;
      default:
        return <HeartIcon className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Select Exercise Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategoryId === category.category
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedCategoryId(category.category);
                onCategorySelect?.(category);
              }}
            >
              <Card>
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category.category)}
                  <div className="flex-1">
                    <h4 className="font-medium">{category.display_name}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                    <Badge className={`mt-2 ${getCategoryColor(category.color)}`}>
                      {category.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Selection */}
      {selectedCategoryId && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Select Exercise</h3>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
                onClick={() => onExerciseSelect(exercise)}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{exercise.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-gray-600">{exercise.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficulty}
                          </Badge>
                          {exercise.calories_per_minute && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.calories_per_minute} cal/min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <HeartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No exercises found for this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseCategorySelector;
