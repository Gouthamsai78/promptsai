import {
  VoiceRecordingState,
  VoiceTranscriptionResult,
  VoiceAlternative,
  VoiceSettings,
  VoiceCapabilities,
  VoiceSession
} from '../types/ai';
import { DeviceCapabilitiesService } from './deviceCapabilities';
import { debugLog } from '../utils/debug';

export class VoiceRecognitionService {
  private static recognition: SpeechRecognition | null = null;
  private static mediaRecorder: MediaRecorder | null = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static currentSession: VoiceSession | null = null;
  private static volumeCallback: ((volume: number) => void) | null = null;
  private static stateCallback: ((state: VoiceRecordingState) => void) | null = null;
  private static transcriptionCallback: ((result: VoiceTranscriptionResult) => void) | null = null;

  // Default settings
  private static defaultSettings: VoiceSettings = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    autoStop: true,
    autoStopTimeout: 30000 // 30 seconds
  };

  private static currentSettings: VoiceSettings = { ...this.defaultSettings };
  private static autoStopTimer: NodeJS.Timeout | null = null;

  // Check browser capabilities
  static getCapabilities(): VoiceCapabilities {
    const hasWebSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasMediaRecorder = 'MediaRecorder' in window;
    const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;

    const capabilities = {
      isSupported: hasWebSpeechAPI && hasMediaRecorder,
      supportedLanguages: this.getSupportedLanguages(),
      hasPermission: false, // Will be checked when requesting permission
      browserSupport: {
        webSpeechAPI: hasWebSpeechAPI,
        mediaRecorder: hasMediaRecorder,
        audioContext: hasAudioContext
      }
    };

    debugLog('🎤 Voice capabilities:', capabilities);
    return capabilities;
  }

  // Request microphone permission
  static async requestPermission(): Promise<boolean> {
    try {
      debugLog('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
      debugLog('✅ Microphone permission granted');
      return true;
    } catch (error: any) {
      debugLog('❌ Microphone permission denied:', error);
      debugLog('❌ Error details:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      return false;
    }
  }

  // Initialize voice recognition
  static async initialize(settings?: Partial<VoiceSettings>): Promise<boolean> {
    try {
      // Initialize device capabilities
      await DeviceCapabilitiesService.initialize();

      // Get device-optimized settings
      const deviceOptimizedSettings = DeviceCapabilitiesService.getOptimalVoiceSettings();

      // Merge settings: user settings > device optimized > defaults
      this.currentSettings = {
        ...this.defaultSettings,
        ...deviceOptimizedSettings,
        ...settings
      };

      // Check capabilities
      const capabilities = this.getCapabilities();
      if (!capabilities.isSupported) {
        throw new Error('Voice recognition not supported in this browser');
      }

      // Request permission using device capabilities service
      const hasPermission = await DeviceCapabilitiesService.requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission required');
      }

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = this.currentSettings.continuous;
      this.recognition.interimResults = this.currentSettings.interimResults;
      this.recognition.lang = this.currentSettings.language;
      this.recognition.maxAlternatives = this.currentSettings.maxAlternatives;

      this.setupRecognitionEventHandlers();

      debugLog('✅ Voice recognition initialized successfully');
      return true;
    } catch (error: any) {
      debugLog('❌ Failed to initialize voice recognition:', error);
      throw new Error(`Voice recognition initialization failed: ${error.message}`);
    }
  }

  // Start recording
  static async startRecording(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Voice recognition not initialized');
    }

    try {
      // Create new session
      this.currentSession = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        totalDuration: 0,
        transcriptionResults: [],
        finalText: '',
        wordCount: 0,
        language: this.currentSettings.language
      };

      // Setup audio context for volume monitoring
      await this.setupAudioContext();

      // Update state
      this.updateState({
        isRecording: true,
        isProcessing: false,
        isPaused: false,
        duration: 0,
        volume: 0
      });

      // Start recognition
      this.recognition.start();

      // Setup auto-stop timer if enabled
      if (this.currentSettings.autoStop) {
        this.autoStopTimer = setTimeout(() => {
          this.stopRecording();
        }, this.currentSettings.autoStopTimeout);
      }

      debugLog('🎤 Voice recording started');
    } catch (error: any) {
      debugLog('❌ Failed to start recording:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  // Stop recording
  static stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    this.updateState({
      isRecording: false,
      isProcessing: true,
      isPaused: false,
      duration: this.currentSession?.totalDuration || 0,
      volume: 0
    });

    debugLog('🛑 Voice recording stopped');
  }

  // Pause recording
  static pauseRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }

    this.updateState({
      isRecording: false,
      isProcessing: false,
      isPaused: true,
      duration: this.currentSession?.totalDuration || 0,
      volume: 0
    });

    debugLog('⏸️ Voice recording paused');
  }

  // Resume recording
  static async resumeRecording(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Voice recognition not initialized');
    }

    this.updateState({
      isRecording: true,
      isProcessing: false,
      isPaused: false,
      duration: this.currentSession?.totalDuration || 0,
      volume: 0
    });

    this.recognition.start();
    debugLog('▶️ Voice recording resumed');
  }

  // Set callbacks
  static setVolumeCallback(callback: (volume: number) => void): void {
    this.volumeCallback = callback;
  }

  static setStateCallback(callback: (state: VoiceRecordingState) => void): void {
    this.stateCallback = callback;
  }

  static setTranscriptionCallback(callback: (result: VoiceTranscriptionResult) => void): void {
    this.transcriptionCallback = callback;
  }

  // Get current session
  static getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  // Update settings
  static updateSettings(settings: Partial<VoiceSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    
    if (this.recognition) {
      this.recognition.lang = this.currentSettings.language;
      this.recognition.continuous = this.currentSettings.continuous;
      this.recognition.interimResults = this.currentSettings.interimResults;
      this.recognition.maxAlternatives = this.currentSettings.maxAlternatives;
    }

    debugLog('⚙️ Voice settings updated:', this.currentSettings);
  }

  // Get current settings
  static getSettings(): VoiceSettings {
    return { ...this.currentSettings };
  }

  // Private helper methods

  private static setupRecognitionEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      debugLog('🎤 Speech recognition started');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      debugLog('❌ Speech recognition error:', event.error);
      this.updateState({
        isRecording: false,
        isProcessing: false,
        isPaused: false,
        duration: this.currentSession?.totalDuration || 0,
        volume: 0,
        error: `Recognition error: ${event.error}`
      });
    };

    this.recognition.onend = () => {
      debugLog('🏁 Speech recognition ended');
      if (this.currentSession) {
        this.currentSession.endTime = new Date();
        this.currentSession.totalDuration = 
          this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      }

      this.updateState({
        isRecording: false,
        isProcessing: false,
        isPaused: false,
        duration: this.currentSession?.totalDuration || 0,
        volume: 0
      });
    };
  }

  private static handleRecognitionResult(event: SpeechRecognitionEvent): void {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Create alternatives array
    const alternatives: VoiceAlternative[] = [];
    if (event.results.length > 0) {
      const lastResult = event.results[event.results.length - 1];
      for (let i = 0; i < Math.min(lastResult.length, this.currentSettings.maxAlternatives); i++) {
        alternatives.push({
          text: lastResult[i].transcript,
          confidence: lastResult[i].confidence || 0
        });
      }
    }

    // Create transcription result
    const transcriptionResult: VoiceTranscriptionResult = {
      text: finalTranscript || interimTranscript,
      confidence: alternatives[0]?.confidence || 0,
      language: this.currentSettings.language,
      isFinal: !!finalTranscript,
      alternatives,
      processingTime: Date.now() - (this.currentSession?.startTime.getTime() || Date.now())
    };

    // Update session
    if (this.currentSession) {
      this.currentSession.transcriptionResults.push(transcriptionResult);
      if (finalTranscript) {
        this.currentSession.finalText += finalTranscript;
        this.currentSession.wordCount = this.currentSession.finalText.split(/\s+/).length;
      }
    }

    // Call transcription callback
    if (this.transcriptionCallback) {
      this.transcriptionCallback(transcriptionResult);
    }

    debugLog('📝 Transcription result:', transcriptionResult);
  }

  private static async setupAudioContext(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context for volume monitoring
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      source.connect(this.analyser);

      // Start volume monitoring
      this.startVolumeMonitoring();

      debugLog('🔊 Audio context setup complete');
    } catch (error) {
      debugLog('❌ Failed to setup audio context:', error);
    }
  }

  private static startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = Math.round((average / 255) * 100);

      // Call volume callback
      if (this.volumeCallback) {
        this.volumeCallback(volume);
      }

      // Continue monitoring if recording
      if (this.currentSession && !this.currentSession.endTime) {
        requestAnimationFrame(updateVolume);
      }
    };

    updateVolume();
  }

  private static updateState(state: VoiceRecordingState): void {
    if (this.stateCallback) {
      this.stateCallback(state);
    }
  }

  private static getSupportedLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'es-AR', 'es-CO',
      'fr-FR', 'fr-CA',
      'de-DE',
      'it-IT',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'zh-CN', 'zh-TW',
      'ar-SA',
      'hi-IN',
      'nl-NL',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI',
      'pl-PL',
      'tr-TR',
      'he-IL',
      'th-TH',
      'vi-VN'
    ];
  }

  // Utility methods

  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }

  static getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'en-AU': 'English (Australia)',
      'en-CA': 'English (Canada)',
      'en-IN': 'English (India)',
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'fr-FR': 'French (France)',
      'fr-CA': 'French (Canada)',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'pt-BR': 'Portuguese (Brazil)',
      'pt-PT': 'Portuguese (Portugal)',
      'ru-RU': 'Russian',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ar-SA': 'Arabic',
      'hi-IN': 'Hindi',
      'nl-NL': 'Dutch',
      'sv-SE': 'Swedish',
      'da-DK': 'Danish',
      'no-NO': 'Norwegian',
      'fi-FI': 'Finnish',
      'pl-PL': 'Polish',
      'tr-TR': 'Turkish',
      'he-IL': 'Hebrew',
      'th-TH': 'Thai',
      'vi-VN': 'Vietnamese'
    };

    return languageNames[code] || code;
  }

  // Clean up resources
  static cleanup(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    this.analyser = null;
    this.currentSession = null;
    this.volumeCallback = null;
    this.stateCallback = null;
    this.transcriptionCallback = null;

    debugLog('🧹 Voice recognition service cleaned up');
  }

  // Text processing utilities
  static cleanTranscriptionText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Ensure proper spacing after punctuation
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add periods between sentences if missing
      .replace(/\b(um|uh|er|ah)\b/gi, '') // Remove filler words
      .replace(/\s+/g, ' ') // Clean up extra spaces again
      .trim();
  }

  static formatTranscriptionForPrompt(text: string): string {
    const cleaned = this.cleanTranscriptionText(text);

    // Capitalize first letter of sentences
    return cleaned.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
  }

  // Export session data
  static exportSession(session: VoiceSession): string {
    return JSON.stringify({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.totalDuration,
      finalText: session.finalText,
      wordCount: session.wordCount,
      language: session.language,
      transcriptionCount: session.transcriptionResults.length
    }, null, 2);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
