'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BeakerIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';

interface WaterLoggingProps {
  onWaterLogged?: () => void;
}

export function WaterLogging({ onWaterLogged }: WaterLoggingProps) {
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const waterGlasses = Math.floor(waterIntake / 250); // Assuming 250ml per glass
  const targetGlasses = 8;
  const percentage = Math.min((waterGlasses / targetGlasses) * 100, 100);

  const getWaterStatus = () => {
    if (percentage >= 100) {
      return { label: 'Hydrated', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100' };
    } else if (percentage >= 75) {
      return { label: 'Almost There', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100' };
    } else {
      return { label: 'Need More', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100' };
    }
  };

  const waterStatus = getWaterStatus();

  const logWater = async (amount: number) => {
    try {
      setIsLogging(true);
      await api.post('/health/logging/mood', {
        water_intake_ml: amount,
        log_date: new Date().toISOString()
      });
      
      setWaterIntake(prev => prev + amount);
      toast.success(`Logged ${amount}ml of water!`);
      onWaterLogged?.();
    } catch (error) {
      console.error('Failed to log water:', error);
      toast.error('Failed to log water. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const quickLogWater = (amount: number) => {
    logWater(amount);
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BeakerIcon className="h-5 w-5 text-blue-500" />
          Water Intake
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={waterStatus.color}>
            {waterStatus.label}
          </Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {waterGlasses}/{targetGlasses} glasses
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Water Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {waterIntake}ml / {targetGlasses * 250}ml
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Quick Log Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => quickLogWater(250)}
            disabled={isLogging}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            +250ml
          </Button>
          <Button
            onClick={() => quickLogWater(500)}
            disabled={isLogging}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            +500ml
          </Button>
        </div>

        {/* Custom Amount */}
        <div className="flex gap-2">
          <Button
            onClick={() => quickLogWater(100)}
            disabled={isLogging}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            +100ml
          </Button>
          <Button
            onClick={() => quickLogWater(750)}
            disabled={isLogging}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            +750ml
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
