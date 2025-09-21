/**
 * Dynamic Exercise Type Form - Handles different exercise types with flexible attributes
 * Updated to use the new logging category system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Activity, 
  Heart, 
  Clock, 
  MapPin,
  Target,
  Zap
} from 'lucide-react';

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

interface ExerciseType {
  id: string;
  name: string;
  logging_category: string;
  logging_category_info: ExerciseCategory;
  difficulty: string;
  calories_per_minute: number;
  description: string;
  icon: string;
}

interface ExerciseTypeFormProps {
  exerciseType: ExerciseType;
  initialAttributes?: any;
  onSave: (attributes: any) => void;
  onCancel: () => void;
  isLogging?: boolean; // True for workout logging, false for routine creation
}

const ExerciseTypeForm: React.FC<ExerciseTypeFormProps> = ({
  exerciseType,
  initialAttributes = {},
  onSave,
  onCancel,
  isLogging = false
}) => {
  const [attributes, setAttributes] = useState<any>(initialAttributes);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with default values based on exercise type
    if (Object.keys(initialAttributes).length === 0) {
      setAttributes(getDefaultAttributes(exerciseType));
    }
  }, [exerciseType, initialAttributes]);

  const getDefaultAttributes = (exerciseType: ExerciseType) => {
    const defaults: any = {};
    
    // Set defaults for required fields based on logging category
    exerciseType.logging_category_info.logging_attributes.required.forEach(attr => {
      if (attr.type === 'number') {
        defaults[attr.name] = attr.min || 0;
      } else if (attr.type === 'select') {
        defaults[attr.name] = attr.options?.[0] || '';
      } else {
        defaults[attr.name] = '';
      }
    });
    
    return defaults;
  };

  const handleAttributeChange = (key: string, value: any) => {
    setAttributes((prev: any) => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev: any) => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const validateAttributes = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields based on logging category
    exerciseType.logging_category_info.logging_attributes.required.forEach(attr => {
      const value = attributes[attr.name];
      
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
    if (validateAttributes()) {
      onSave(attributes);
    }
  };

  const renderInput = (attr: LoggingAttribute) => {
    const value = attributes[attr.name] || '';
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
            onChange={(e) => handleAttributeChange(attr.name, parseFloat(e.target.value) || 0)}
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
            onValueChange={(val) => handleAttributeChange(attr.name, val)}
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
          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
          maxLength={attr.max_length}
          className={error ? 'border-red-500' : ''}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  };

  const renderForm = () => {
    return (
      <div className="space-y-6">
        {/* Required Fields */}
        {exerciseType.logging_category_info.logging_attributes.required.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Required Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exerciseType.logging_category_info.logging_attributes.required.map((attr) => (
                <div key={attr.name}>
                  {renderInput(attr)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Fields */}
        {exerciseType.logging_category_info.logging_attributes.optional.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Optional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exerciseType.logging_category_info.logging_attributes.optional.map((attr) => (
                <div key={attr.name}>
                  {renderInput(attr)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCategoryIcon = () => {
    // Use the icon from the exercise category info
    return <span className="text-2xl">{exerciseType.icon}</span>;
  };

  const getCategoryColor = () => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      teal: 'bg-teal-100 text-teal-800',
    };
    return colorMap[exerciseType.logging_category_info.color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getCategoryIcon()}
          <div>
            <CardTitle className="text-xl">{exerciseType.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getCategoryColor()}>
                {exerciseType.logging_category_info.display_name}
              </Badge>
              <Badge variant="outline">
                {exerciseType.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        {exerciseType.description && (
          <p className="text-sm text-gray-600 mt-2">{exerciseType.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderForm()}
        
        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={attributes.notes || ''}
            onChange={(e) => handleAttributeChange('notes', e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} className="flex-1">
            {isLogging ? 'Log Workout' : 'Save Exercise'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseTypeForm;
