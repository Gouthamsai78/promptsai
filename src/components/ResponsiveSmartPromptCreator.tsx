import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wifi, 
  WifiOff, 
  Battery, 
  Volume2,
  Settings,
  X
} from 'lucide-react';
import SmartPromptCreator from './SmartPromptCreator';
import { DeviceCapabilitiesService, DeviceInfo } from '../services/deviceCapabilities';
import { debugLog } from '../utils/debug';

interface ResponsiveSmartPromptCreatorProps {
  onPromptGenerated?: (prompt: string) => void;
  onPromptChange?: (prompt: string) => void;
  initialPrompt?: string;
  className?: string;
}

const ResponsiveSmartPromptCreator: React.FC<ResponsiveSmartPromptCreatorProps> = ({
  onPromptGenerated,
  onPromptChange,
  initialPrompt = '',
  className = ''
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeDevice();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeDevice = async () => {
    try {
      debugLog('📱 Initializing responsive smart prompt creator...');
      
      const device = await DeviceCapabilitiesService.initialize();
      setDeviceInfo(device);
      setIsInitialized(true);
      
      debugLog('✅ Device initialization complete:', device);
    } catch (error) {
      debugLog('❌ Device initialization failed:', error);
      setIsInitialized(true); // Still allow usage even if detection fails
    }
  };

  const setupEventListeners = () => {
    // Online/offline status
    DeviceCapabilitiesService.addOnlineStatusListener(setIsOnline);
    
    // Orientation changes
    DeviceCapabilitiesService.addOrientationChangeListener(() => {
      // Re-detect screen size on orientation change
      setTimeout(async () => {
        const updatedDevice = await DeviceCapabilitiesService.initialize();
        setDeviceInfo(updatedDevice);
      }, 100);
    });
  };

  const cleanupEventListeners = () => {
    DeviceCapabilitiesService.removeOnlineStatusListener(setIsOnline);
    DeviceCapabilitiesService.removeOrientationChangeListener(() => {});
  };

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Monitor className="w-4 h-4" />;
    
    if (deviceInfo.isMobile) return <Smartphone className="w-4 h-4" />;
    if (deviceInfo.isTablet) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getContainerClasses = () => {
    if (!deviceInfo) return 'container mx-auto px-4';
    
    const baseClasses = 'w-full';
    
    if (deviceInfo.isMobile) {
      return `${baseClasses} px-2 py-4`;
    }
    
    if (deviceInfo.isTablet) {
      return `${baseClasses} px-4 py-6 max-w-4xl mx-auto`;
    }
    
    return `${baseClasses} px-6 py-8 max-w-6xl mx-auto`;
  };

  const getLayoutClasses = () => {
    if (!deviceInfo) return '';
    
    if (deviceInfo.isMobile) {
      return 'space-y-4';
    }
    
    return 'space-y-6';
  };

  const renderDeviceStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowDeviceInfo(!showDeviceInfo)}
        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {getDeviceIcon()}
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
        </div>
      </button>

      {showDeviceInfo && deviceInfo && (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Device Info</h3>
            <button
              onClick={() => setShowDeviceInfo(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Device Type:</span>
              <span className="text-gray-900 dark:text-white capitalize">
                {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform:</span>
              <span className="text-gray-900 dark:text-white capitalize">{deviceInfo.platform}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Browser:</span>
              <span className="text-gray-900 dark:text-white capitalize">{deviceInfo.browser}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Screen Size:</span>
              <span className="text-gray-900 dark:text-white capitalize">{deviceInfo.screenSize}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Voice Support:</span>
              <span className={`${deviceInfo.supportsVoice ? 'text-green-600' : 'text-red-600'}`}>
                {deviceInfo.supportsVoice ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Microphone:</span>
              <span className={`${deviceInfo.hasMicrophone ? 'text-green-600' : 'text-red-600'}`}>
                {deviceInfo.hasMicrophone ? 'Available' : 'Not Available'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Online Status:</span>
              <span className={`${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {deviceInfo.supportsVibration && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Haptic Feedback:</span>
                <span className="text-green-600">Supported</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderOfflineNotice = () => {
    if (isOnline) return null;
    
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">You're offline</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Some features may be limited. Voice recognition and AI analysis will use cached responses.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileOptimizations = () => {
    if (!deviceInfo?.isMobile) return null;
    
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Mobile Optimizations Active</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Voice settings have been optimized for your mobile device. Tap and hold the record button for best results.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderUnsupportedFeatures = () => {
    if (!deviceInfo) return null;
    
    const unsupportedFeatures = [];
    
    if (!deviceInfo.supportsVoice) {
      unsupportedFeatures.push('Voice Recognition');
    }
    
    if (!deviceInfo.hasMicrophone) {
      unsupportedFeatures.push('Microphone Access');
    }
    
    if (unsupportedFeatures.length === 0) return null;
    
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <h4 className="font-medium text-red-800 dark:text-red-200">Limited Features</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              The following features are not available on your device: {unsupportedFeatures.join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing device capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Device Status - Hidden in production */}
      
      {/* Main Content */}
      <div className={getContainerClasses()}>
        <div className={getLayoutClasses()}>
          {/* Notices */}
          {renderOfflineNotice()}
          {/* Mobile optimizations and unsupported features notices hidden in production */}
          
          {/* Smart Prompt Creator */}
          <SmartPromptCreator
            onPromptGenerated={onPromptGenerated}
            onPromptChange={onPromptChange}
            initialPrompt={initialPrompt}
            showModeToggle={true} // Show mode toggle on all devices including mobile
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveSmartPromptCreator;
