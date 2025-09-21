'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface DynamicExerciseLoggerProps {
  exercise: Exercise;
  onSave: (exerciseData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const DynamicExerciseLogger: React.FC<DynamicExerciseLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<any>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with default values
    const defaults: any = {};
    
    // Set defaults for required fields
    exercise.logging_category_info.logging_attributes.required.forEach(attr => {
      if (attr.type === 'number') {
        defaults[attr.name] = attr.min || 0;
      } else if (attr.type === 'select') {
        defaults[attr.name] = attr.options?.[0] || '';
      } else {
        defaults[attr.name] = '';
      }
    });

    setFormData({ ...defaults, ...initialData });
  }, [exercise, initialData]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev: any) => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    exercise.logging_category_info.logging_attributes.required.forEach(attr => {
      const value = formData[attr.name];
      
      if (attr.type === 'number') {
        if (!value || value < (attr.min || 0)) {
          newErrors[attr.name] = `${attr.label} must be at least ${attr.min || 0}`;
        } else if (attr.max && value > attr.max) {
          newErrors[attr.name] = `${attr.label} must be at most ${attr.max}`;
        }
      } else if (attr.type === 'text') {
        if (!value || value.trim() === '') {
          newErrors[attr.name] = `${attr.label} is required`;
        } else if (attr.max_length && value.length > attr.max_length) {
          newErrors[attr.name] = `${attr.label} must be at most ${attr.max_length} characters`;
        }
      } else if (attr.type === 'select') {
        if (!value || value === '') {
          newErrors[attr.name] = `${attr.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        logging_category: exercise.logging_category,
        ...formData
      });
    }
  };

  const renderInput = (attr: LoggingAttribute) => {
    const value = formData[attr.name] || '';
    const error = errors[attr.name];

    if (attr.type === 'number') {
      return (
        <div className="space-y-2">
          <Label htmlFor={attr.name}>{attr.label}</Label>
          <Input
            id={attr.name}
            type="number"
            min={attr.min}
            max={attr.max}
            value={value}
            onChange={(e) => handleInputChange(attr.name, parseFloat(e.target.value) || 0)}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
    }

    if (attr.type === 'select') {
      return (
        <div className="space-y-2">
          <Label htmlFor={attr.name}>{attr.label}</Label>
          <Select
            value={value}
            onValueChange={(val) => handleInputChange(attr.name, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Select ${attr.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attr.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
    }

    // Text input
    return (
      <div className="space-y-2">
        <Label htmlFor={attr.name}>{attr.label}</Label>
        <Input
          id={attr.name}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(attr.name, e.target.value)}
          maxLength={attr.max_length}
          className={error ? 'border-red-500' : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{exercise.icon}</div>
            <div>
              <CardTitle className="text-xl">{exercise.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(exercise.logging_category_info.color)}>
                  {exercise.logging_category_info.display_name}
                </Badge>
                <Badge variant="outline">{exercise.difficulty}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
        {exercise.description && (
          <p className="text-sm text-gray-600 mt-2">{exercise.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Required Fields */}
        {exercise.logging_category_info.logging_attributes.required.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Required Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercise.logging_category_info.logging_attributes.required.map((attr) => (
                <div key={attr.name}>
                  {renderInput(attr)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Fields */}
        {exercise.logging_category_info.logging_attributes.optional.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Optional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercise.logging_category_info.logging_attributes.optional.map((attr) => (
                <div key={attr.name}>
                  {renderInput(attr)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1">
            Log Exercise
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicExerciseLogger;
