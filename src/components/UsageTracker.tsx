import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { UsageTrackingService, UsageMetrics, UsageLimits } from '../services/usageTracking';

interface UsageTrackerProps {
  className?: string;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [limitStatus, setLimitStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = () => {
    const currentMetrics = UsageTrackingService.getUsageMetrics();
    const currentLimits = UsageTrackingService.getUsageLimits();
    const currentLimitStatus = UsageTrackingService.checkUsageLimits();

    setMetrics(currentMetrics);
    setLimits(currentLimits);
    setLimitStatus(currentLimitStatus);
  };

  if (!metrics || !limits || !limitStatus) {
    return null;
  }

  const successRate = metrics.totalRequests > 0 
    ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100) 
    : 0;

  const getStatusColor = () => {
    if (limitStatus.dailyLimitExceeded || limitStatus.monthlyLimitExceeded) {
      return 'text-red-600 dark:text-red-400';
    } else if (limitStatus.dailyWarning || limitStatus.monthlyWarning) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = () => {
    if (limitStatus.dailyLimitExceeded || limitStatus.monthlyLimitExceeded) {
      return <AlertTriangle className="h-4 w-4" />;
    } else if (limitStatus.dailyWarning || limitStatus.monthlyWarning) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">AI Usage</h3>
          </div>
          <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {limitStatus.dailyLimitExceeded || limitStatus.monthlyLimitExceeded 
                ? 'Limit Reached' 
                : limitStatus.dailyWarning || limitStatus.monthlyWarning 
                ? 'Near Limit' 
                : 'Good'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successRate}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(metrics.averageProcessingTime)}ms
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${metrics.costEstimate.toFixed(3)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Est. Cost</div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Daily Usage</span>
              <span className="text-gray-900 dark:text-white">
                {limits.dailyRequestLimit - limitStatus.remainingDaily}/{limits.dailyRequestLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  limitStatus.dailyLimitExceeded 
                    ? 'bg-red-500' 
                    : limitStatus.dailyWarning 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(((limits.dailyRequestLimit - limitStatus.remainingDaily) / limits.dailyRequestLimit) * 100, 100)}%` 
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Monthly Usage</span>
              <span className="text-gray-900 dark:text-white">
                {limits.monthlyRequestLimit - limitStatus.remainingMonthly}/{limits.monthlyRequestLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  limitStatus.monthlyLimitExceeded 
                    ? 'bg-red-500' 
                    : limitStatus.monthlyWarning 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(((limits.monthlyRequestLimit - limitStatus.remainingMonthly) / limits.monthlyRequestLimit) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Request Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Requests by Category
              </h4>
              <div className="space-y-2">
                {Object.entries(metrics.requestsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Models Used */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Models Used
              </h4>
              <div className="space-y-2">
                {Object.entries(metrics.requestsByModel).map(([model, count]) => (
                  <div key={model} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      {model.split('/').pop()?.split(':')[0] || model}
                    </span>
                    <span className="text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Performance
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Successful:</span>
                  <span className="text-gray-900 dark:text-white">{metrics.successfulRequests}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                  <span className="text-gray-900 dark:text-white">{metrics.failedRequests}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                  <span className="text-gray-900 dark:text-white">{Math.round(metrics.totalProcessingTime / 1000)}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                  <span className="text-gray-900 dark:text-white">{metrics.totalTokensUsed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const data = UsageTrackingService.exportUsageData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `promptshare-usage-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 px-3 py-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                Export Data
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all usage data?')) {
                    UsageTrackingService.clearUsageData();
                    loadUsageData();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageTracker;
