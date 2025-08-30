import PerformanceDashboard from '@/components/monitoring/PerformanceDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor system performance, response quality, and memory accuracy
        </p>
      </div>
      
      <PerformanceDashboard />
    </div>
  );
}
