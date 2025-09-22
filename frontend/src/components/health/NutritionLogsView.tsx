'use client';

import React from 'react';
import { NutritionLogsViewWithDataComponents } from './NutritionLogsViewWithDataComponents';

interface NutritionLogsViewProps {
  className?: string;
  refreshTrigger?: number;
  isActive?: boolean;
}

/**
 * Main NutritionLogsView component - now uses the new reusable data display components
 * This maintains backward compatibility while using the new modular architecture
 */
function NutritionLogsView({ className = '', refreshTrigger, isActive = true }: NutritionLogsViewProps) {
  return (
    <NutritionLogsViewWithDataComponents 
      className={className} 
      refreshTrigger={refreshTrigger}
      isActive={isActive}
    />
  );
}

export default NutritionLogsView;