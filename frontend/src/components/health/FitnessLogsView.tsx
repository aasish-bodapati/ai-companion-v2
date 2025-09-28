'use client';

import React from 'react';
import { UnifiedHealthLoggingView } from './UnifiedHealthLoggingView';

interface FitnessLogsViewProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Main FitnessLogsView component - now uses the unified health logging architecture
 * This maintains backward compatibility while using the new consolidated pattern
 */
function FitnessLogsView({ className = '', refreshTrigger }: FitnessLogsViewProps) {
  return (
    <UnifiedHealthLoggingView 
      type="fitness"
      className={className} 
      refreshTrigger={refreshTrigger} 
    />
  );
}

export default FitnessLogsView;
