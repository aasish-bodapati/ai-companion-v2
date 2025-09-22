'use client';

import React from 'react';
import { FitnessLogsViewWithDataComponents } from './FitnessLogsViewWithDataComponents';

interface FitnessLogsViewProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Main FitnessLogsView component - now uses the new reusable data display components
 * This maintains backward compatibility while using the new modular architecture
 */
function FitnessLogsView({ className = '', refreshTrigger }: FitnessLogsViewProps) {
  return (
    <FitnessLogsViewWithDataComponents 
      className={className} 
      refreshTrigger={refreshTrigger} 
    />
  );
}

export default FitnessLogsView;
