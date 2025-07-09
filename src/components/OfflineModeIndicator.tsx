import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const OfflineModeIndicator: React.FC = () => {
  const { isOfflineMode } = useAuth();

  if (!isOfflineMode) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Demo Mode Active
            </span>
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">
              Using mock data - Supabase connection unavailable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeIndicator;
