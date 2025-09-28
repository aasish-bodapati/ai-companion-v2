'use client';

import React from 'react';
import { UnifiedHealthLoggingView } from './UnifiedHealthLoggingView';

interface NutritionLogsViewProps {
  className?: string;
  refreshTrigger?: number;
  isActive?: boolean;
}

/**
 * Main NutritionLogsView component - now uses the unified health logging architecture
 * This maintains backward compatibility while using the new consolidated pattern
 */
function NutritionLogsView({ className = '', refreshTrigger, isActive = true }: NutritionLogsViewProps) {
  return (
    <UnifiedHealthLoggingView 
      type="nutrition"
      className={className} 
      refreshTrigger={refreshTrigger}
      isActive={isActive}
    />
  );
}

export default NutritionLogsView;