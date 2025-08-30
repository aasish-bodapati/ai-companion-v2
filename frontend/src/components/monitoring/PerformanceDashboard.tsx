'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Brain,
  MessageSquare,
  Zap
} from 'lucide-react';

interface PerformanceMetrics {
  response_quality?: {
    avg: number;
    count: number;
    latest: number;
  };
  memory_accuracy?: {
    avg: number;
    count: number;
    latest: number;
  };
  llm_latency_ms?: {
    avg: number;
    count: number;
    latest: number;
  };
  llm_requests?: {
    count: number;
  };
  llm_errors?: {
    count: number;
  };
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unknown';
  indicators: {
    response_quality: number;
    memory_accuracy: number;
    llm_latency_ms: number;
    error_rate: number;
  };
  thresholds: {
    response_quality: number;
    memory_accuracy: number;
    retrieval_latency_ms: number;
    error_rate: number;
  };
}

interface Alert {
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
  metadata: Record<string, any>;
}

interface PerformanceDashboardData {
  current_performance: {
    '1h': PerformanceMetrics;
    '24h': PerformanceMetrics;
  };
  recent_alerts: Alert[];
  system_health: SystemHealth;
  performance_trends: {
    response_quality?: 'improving' | 'declining' | 'stable';
    latency?: 'improving' | 'declining' | 'stable';
  };
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/memory-monitoring/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const { system_health, current_performance, recent_alerts, performance_trends } = data;
  const metrics1h = current_performance['1h'];
  const metrics24h = current_performance['24h'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">
            System health and performance metrics
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(system_health.status)}
            System Health: {system_health.status.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Quality</span>
                {getTrendIcon(performance_trends.response_quality)}
              </div>
              <Progress 
                value={system_health.indicators.response_quality * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {formatPercentage(system_health.indicators.response_quality)} 
                (Target: {formatPercentage(system_health.thresholds.response_quality)})
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Accuracy</span>
                <Brain className="h-4 w-4 text-blue-500" />
              </div>
              <Progress 
                value={system_health.indicators.memory_accuracy * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {formatPercentage(system_health.indicators.memory_accuracy)}
                (Target: {formatPercentage(system_health.thresholds.memory_accuracy)})
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LLM Latency</span>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <Progress 
                value={Math.min(100, (system_health.indicators.llm_latency_ms / system_health.thresholds.retrieval_latency_ms) * 100)} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {formatLatency(system_health.indicators.llm_latency_ms)}
                (Target: {formatLatency(system_health.thresholds.retrieval_latency_ms)})
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <Progress 
                value={system_health.indicators.error_rate * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {formatPercentage(system_health.indicators.error_rate)}
                (Target: {formatPercentage(system_health.thresholds.error_rate)})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Tabs defaultValue="1h" className="space-y-4">
        <TabsList>
          <TabsTrigger value="1h">Last Hour</TabsTrigger>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="1h" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Response Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics1h.response_quality ? formatPercentage(metrics1h.response_quality.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics1h.response_quality?.count || 0} responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Memory Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics1h.memory_accuracy ? formatPercentage(metrics1h.memory_accuracy.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics1h.memory_accuracy?.count || 0} retrievals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  LLM Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics1h.llm_latency_ms ? formatLatency(metrics1h.llm_latency_ms.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics1h.llm_requests?.count || 0} requests
                  {metrics1h.llm_errors?.count ? `, ${metrics1h.llm_errors.count} errors` : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="24h" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Response Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics24h.response_quality ? formatPercentage(metrics24h.response_quality.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics24h.response_quality?.count || 0} responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Memory Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics24h.memory_accuracy ? formatPercentage(metrics24h.memory_accuracy.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics24h.memory_accuracy?.count || 0} retrievals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  LLM Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics24h.llm_latency_ms ? formatLatency(metrics24h.llm_latency_ms.avg) : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics24h.llm_requests?.count || 0} requests
                  {metrics24h.llm_errors?.count ? `, ${metrics24h.llm_errors.count} errors` : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Alerts */}
      {recent_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Recent Alerts ({recent_alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_alerts.slice(0, 5).map((alert, index) => (
                <Alert key={index} className={getSeverityColor(alert.severity)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={alert.severity === 'error' ? 'destructive' : 'secondary'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{alert.type}</span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
