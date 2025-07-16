import { debugLog } from '../utils/debug';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  supportsVoice: boolean;
  supportsNotifications: boolean;
  supportsVibration: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  isOnline: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
}

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export class DeviceCapabilitiesService {
  private static deviceInfo: DeviceInfo | null = null;
  private static permissionStatus: PermissionStatus | null = null;

  // Initialize device capabilities detection
  static async initialize(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    debugLog('🔍 Detecting device capabilities...');

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = this.detectPlatform(userAgent);
    const browser = this.detectBrowser(userAgent);
    const screenSize = this.detectScreenSize();

    // Check for mobile/tablet
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                     (platform === 'ios') ||
                     (window.innerWidth <= 768);
    
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                     (window.innerWidth > 768 && window.innerWidth <= 1024);
    
    const isDesktop = !isMobile && !isTablet;

    // Check voice support
    const supportsVoice = this.checkVoiceSupport();

    // Check other capabilities
    const supportsNotifications = 'Notification' in window;
    const supportsVibration = 'vibrate' in navigator;
    const isOnline = navigator.onLine;

    // Check for media devices
    let hasCamera = false;
    let hasMicrophone = false;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasCamera = devices.some(device => device.kind === 'videoinput');
        hasMicrophone = devices.some(device => device.kind === 'audioinput');
      }
    } catch (error) {
      debugLog('❌ Failed to enumerate media devices:', error);
    }

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      platform,
      browser,
      supportsVoice,
      supportsNotifications,
      supportsVibration,
      hasCamera,
      hasMicrophone,
      isOnline,
      screenSize
    };

    debugLog('✅ Device capabilities detected:', this.deviceInfo);
    return this.deviceInfo;
  }

  // Check and request permissions
  static async checkPermissions(): Promise<PermissionStatus> {
    if (!navigator.permissions) {
      debugLog('⚠️ Permissions API not supported');
      return {
        microphone: 'unknown',
        camera: 'unknown',
        notifications: 'unknown'
      };
    }

    try {
      const [micPermission, cameraPermission, notificationPermission] = await Promise.allSettled([
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'notifications' as PermissionName })
      ]);

      this.permissionStatus = {
        microphone: micPermission.status === 'fulfilled' ? micPermission.value.state as any : 'unknown',
        camera: cameraPermission.status === 'fulfilled' ? cameraPermission.value.state as any : 'unknown',
        notifications: notificationPermission.status === 'fulfilled' ? notificationPermission.value.state as any : 'unknown'
      };

      debugLog('🔐 Permission status:', this.permissionStatus);
      return this.permissionStatus;
    } catch (error) {
      debugLog('❌ Failed to check permissions:', error);
      return {
        microphone: 'unknown',
        camera: 'unknown',
        notifications: 'unknown'
      };
    }
  }

  // Request microphone permission
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Update permission status
      if (this.permissionStatus) {
        this.permissionStatus.microphone = 'granted';
      }
      
      debugLog('✅ Microphone permission granted');
      return true;
    } catch (error: any) {
      debugLog('❌ Microphone permission denied:', error);
      
      // Update permission status
      if (this.permissionStatus) {
        this.permissionStatus.microphone = 'denied';
      }
      
      return false;
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      debugLog('⚠️ Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      // Update permission status
      if (this.permissionStatus) {
        this.permissionStatus.notifications = permission as any;
      }
      
      debugLog(granted ? '✅ Notification permission granted' : '❌ Notification permission denied');
      return granted;
    } catch (error) {
      debugLog('❌ Failed to request notification permission:', error);
      return false;
    }
  }

  // Get device-specific voice settings
  static getOptimalVoiceSettings(): any {
    const device = this.deviceInfo;
    if (!device) return {};

    const settings: any = {
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    };

    // Mobile-specific optimizations
    if (device.isMobile) {
      settings.autoStopTimeout = 20000; // Shorter timeout on mobile
      settings.maxAlternatives = 2; // Fewer alternatives to save processing
    }

    // iOS-specific optimizations
    if (device.platform === 'ios') {
      settings.continuous = false; // iOS has issues with continuous mode
      settings.autoStopTimeout = 15000; // Even shorter on iOS
    }

    // Android-specific optimizations
    if (device.platform === 'android') {
      settings.interimResults = device.browser === 'chrome'; // Only Chrome on Android supports interim results well
    }

    debugLog('🎤 Optimal voice settings for device:', settings);
    return settings;
  }

  // Get responsive breakpoints
  static getResponsiveBreakpoints() {
    return {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };
  }

  // Check if device should use mobile UI
  static shouldUseMobileUI(): boolean {
    const device = this.deviceInfo;
    return device ? (device.isMobile || device.screenSize === 'small') : false;
  }

  // Check if device supports haptic feedback
  static supportsHapticFeedback(): boolean {
    const device = this.deviceInfo;
    return device ? device.supportsVibration : false;
  }

  // Trigger haptic feedback
  static triggerHapticFeedback(pattern: number | number[] = 100): void {
    if (this.supportsHapticFeedback() && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Get current device info
  static getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // Get current permission status
  static getPermissionStatus(): PermissionStatus | null {
    return this.permissionStatus;
  }

  // Private helper methods

  private static detectPlatform(userAgent: string): DeviceInfo['platform'] {
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    if (/windows/i.test(userAgent)) return 'windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macos';
    if (/linux/i.test(userAgent)) return 'linux';
    return 'unknown';
  }

  private static detectBrowser(userAgent: string): DeviceInfo['browser'] {
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'chrome';
    if (/firefox/i.test(userAgent)) return 'firefox';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari';
    if (/edge/i.test(userAgent)) return 'edge';
    if (/opera/i.test(userAgent)) return 'opera';
    return 'unknown';
  }

  private static detectScreenSize(): DeviceInfo['screenSize'] {
    const width = window.innerWidth;
    if (width < 640) return 'small';
    if (width < 1024) return 'medium';
    if (width < 1280) return 'large';
    return 'xlarge';
  }

  private static checkVoiceSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Event listeners for device changes
  static addOrientationChangeListener(callback: () => void): void {
    window.addEventListener('orientationchange', callback);
    window.addEventListener('resize', callback);
  }

  static removeOrientationChangeListener(callback: () => void): void {
    window.removeEventListener('orientationchange', callback);
    window.removeEventListener('resize', callback);
  }

  static addOnlineStatusListener(callback: (isOnline: boolean) => void): void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  static removeOnlineStatusListener(callback: (isOnline: boolean) => void): void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
}
