import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressRingProps {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  icon?: string;
  label?: string;
  unit?: string;
  showPercentage?: boolean;
  onPress?: () => void;
}

export default function ProgressRing({
  value,
  target,
  size = 80,
  strokeWidth = 6,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  icon,
  label,
  unit = '',
  showPercentage = true,
  onPress,
}: ProgressRingProps) {
  const percentage = Math.min((value / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStatusColor = () => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusText = () => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Needs Work';
  };

  const RingContent = () => (
    <View style={styles.ringContent}>
      {icon && (
        <Ionicons 
          name={icon as any} 
          size={size * 0.2} 
          color={getStatusColor()} 
        />
      )}
      <Text style={[styles.value, { color: getStatusColor() }]}>
        {showPercentage ? `${Math.round(percentage)}%` : value}
      </Text>
      {unit && (
        <Text style={styles.unit}>{unit}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, { width: size, height: size }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.ring, { width: size, height: size }]}>
          {/* Background Ring */}
          <View style={[
            styles.ringBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            }
          ]} />
          
          {/* Progress Ring */}
          <View style={[
            styles.ringProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: getStatusColor(),
              transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
            }
          ]} />
          
          <RingContent />
        </View>
        
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size }]}>
        {/* Background Ring */}
        <View style={[
          styles.ringBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]} />
        
        {/* Progress Ring */}
        <View style={[
          styles.ringProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: getStatusColor(),
            transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
          }
        ]} />
        
        <RingContent />
      </View>
      
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <Text style={[styles.status, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringProgress: {
    position: 'absolute',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  unit: {
    fontSize: 10,
    color: '#6b7280',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  status: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
