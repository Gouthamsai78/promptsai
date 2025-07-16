import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader,
  Languages,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  VoiceRecordingState,
  VoiceTranscriptionResult,
  VoiceSettings,
  VoiceCapabilities,
  VoiceSession
} from '../types/ai';
import { VoiceRecognitionService } from '../services/voiceRecognition';
import { debugLog } from '../utils/debug';

interface VoiceRecorderProps {
  onTranscriptionUpdate?: (result: VoiceTranscriptionResult) => void;
  onSessionComplete?: (session: VoiceSession) => void;
  onTextGenerated?: (text: string) => void;
  onApplyToEnhancer?: (text: string) => void;
  className?: string;
  autoStart?: boolean;
  showSettings?: boolean;
  showApplyButton?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionUpdate,
  onSessionComplete,
  onTextGenerated,
  onApplyToEnhancer,
  className = '',
  autoStart = false,
  showSettings = true,
  showApplyButton = true
}) => {
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    isPaused: false,
    duration: 0,
    volume: 0
  });
  
  const [currentTranscription, setCurrentTranscription] = useState<VoiceTranscriptionResult | null>(null);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const volumeBarRef = useRef<HTMLDivElement>(null);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  // Initialize voice recognition on component mount
  useEffect(() => {
    initializeVoiceRecognition();
    return () => {
      VoiceRecognitionService.cleanup();
    };
  }, []);

  // Auto-scroll transcription
  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [finalText, interimText]);

  const initializeVoiceRecognition = async () => {
    try {
      debugLog('🎤 Initializing voice recognition...');
      
      // Check capabilities
      const caps = VoiceRecognitionService.getCapabilities();
      setCapabilities(caps);

      if (!caps.isSupported) {
        setError('Voice recognition is not supported in this browser');
        return;
      }

      // Initialize service
      await VoiceRecognitionService.initialize();
      
      // Get current settings
      const currentSettings = VoiceRecognitionService.getSettings();
      setSettings(currentSettings);

      // Set up callbacks
      VoiceRecognitionService.setStateCallback(setRecordingState);
      VoiceRecognitionService.setVolumeCallback((volume) => {
        setRecordingState(prev => ({ ...prev, volume }));
      });
      VoiceRecognitionService.setTranscriptionCallback(handleTranscriptionUpdate);

      setIsInitialized(true);
      setError(null);

      if (autoStart) {
        startRecording();
      }

      debugLog('✅ Voice recognition initialized successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize voice recognition';
      setError(errorMessage);
      debugLog('❌ Voice recognition initialization failed:', err);
    }
  };

  const handleTranscriptionUpdate = (result: VoiceTranscriptionResult) => {
    setCurrentTranscription(result);
    
    if (result.isFinal) {
      setFinalText(prev => prev + result.text + ' ');
      setInterimText('');
    } else {
      setInterimText(result.text);
    }

    if (onTranscriptionUpdate) {
      onTranscriptionUpdate(result);
    }

    debugLog('📝 Transcription update:', result);
  };

  const startRecording = async () => {
    if (!isInitialized) {
      await initializeVoiceRecognition();
    }

    try {
      await VoiceRecognitionService.startRecording();
      setError(null);
      setFinalText('');
      setInterimText('');
      
      const newSession = VoiceRecognitionService.getCurrentSession();
      setSession(newSession);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    VoiceRecognitionService.stopRecording();
    
    // Generate final text and trigger callbacks
    const completeText = VoiceRecognitionService.formatTranscriptionForPrompt(finalText);
    if (onTextGenerated && completeText.trim()) {
      onTextGenerated(completeText);
    }

    const currentSession = VoiceRecognitionService.getCurrentSession();
    if (onSessionComplete && currentSession) {
      onSessionComplete(currentSession);
    }
  };

  const pauseRecording = () => {
    VoiceRecognitionService.pauseRecording();
  };

  const resumeRecording = async () => {
    try {
      await VoiceRecognitionService.resumeRecording();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resume recording');
    }
  };

  const resetRecording = () => {
    VoiceRecognitionService.stopRecording();
    setFinalText('');
    setInterimText('');
    setCurrentTranscription(null);
    setSession(null);
    setError(null);
  };

  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    if (settings) {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      VoiceRecognitionService.updateSettings(updatedSettings);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVolumeColor = (volume: number) => {
    if (volume > 70) return 'bg-red-500';
    if (volume > 40) return 'bg-yellow-500';
    if (volume > 10) return 'bg-green-500';
    return 'bg-gray-300';
  };

  if (!capabilities) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Checking voice capabilities...</span>
      </div>
    );
  }

  if (!capabilities.isSupported) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300 font-medium">Voice Recognition Not Supported</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mt-2">
          Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voice-to-Text Recorder
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Record your voice to create prompts or describe requirements
            </p>
          </div>
        </div>

        {showSettings && (
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && settings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {VoiceRecognitionService.getCapabilities().supportedLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {VoiceRecognitionService.getLanguageName(lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-stop timeout (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.autoStopTimeout / 1000}
                onChange={(e) => updateSettings({ autoStopTimeout: parseInt(e.target.value) * 1000 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="continuous"
                checked={settings.continuous}
                onChange={(e) => updateSettings({ continuous: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="continuous" className="text-sm text-gray-700 dark:text-gray-300">
                Continuous recording
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="interimResults"
                checked={settings.interimResults}
                onChange={(e) => updateSettings({ interimResults: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="interimResults" className="text-sm text-gray-700 dark:text-gray-300">
                Show interim results
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center space-x-4 mb-6">
          {/* Main Record Button */}
          <button
            onClick={recordingState.isRecording ? stopRecording : startRecording}
            disabled={recordingState.isProcessing}
            className={`p-4 rounded-full transition-all duration-200 ${
              recordingState.isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {recordingState.isRecording ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Pause/Resume Button */}
          {recordingState.isRecording && (
            <button
              onClick={recordingState.isPaused ? resumeRecording : pauseRecording}
              className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
            >
              {recordingState.isPaused ? (
                <Play className="w-6 h-6" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={resetRecording}
            disabled={recordingState.isRecording}
            className="p-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-full transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Status Display */}
        <div className="text-center space-y-3">
          {/* Recording Status */}
          <div className="flex items-center justify-center space-x-2">
            {recordingState.isRecording && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
            <span className={`font-medium ${
              recordingState.isRecording
                ? 'text-red-600 dark:text-red-400'
                : recordingState.isPaused
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {recordingState.isRecording
                ? 'Recording...'
                : recordingState.isPaused
                ? 'Paused'
                : recordingState.isProcessing
                ? 'Processing...'
                : 'Ready to record'
              }
            </span>
          </div>

          {/* Duration and Volume */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(recordingState.duration)}</span>
            </div>

            {recordingState.isRecording && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${getVolumeColor(recordingState.volume)}`}
                    style={{ width: `${Math.min(recordingState.volume, 100)}%` }}
                  />
                </div>
                <span className="text-xs w-8">{recordingState.volume}%</span>
              </div>
            )}
          </div>

          {/* Language Display */}
          {settings && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
              <Languages className="w-4 h-4" />
              <span>{VoiceRecognitionService.getLanguageName(settings.language)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transcription Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Transcription
            </h4>
            {currentTranscription && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                <span>Confidence: {Math.round((currentTranscription.confidence || 0) * 100)}%</span>
                {currentTranscription.isFinal && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <div
          ref={transcriptionRef}
          className="p-4 max-h-64 overflow-y-auto"
        >
          {finalText || interimText ? (
            <div className="space-y-2">
              {/* Final Text */}
              {finalText && (
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {finalText}
                </p>
              )}

              {/* Interim Text */}
              {interimText && (
                <p className="text-gray-500 dark:text-gray-400 italic leading-relaxed">
                  {interimText}
                </p>
              )}

              {/* Word Count and Actions */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Words: {(finalText + interimText).trim().split(/\s+/).filter(word => word.length > 0).length}
                  </div>

                  {/* Apply to Prompt Enhancer Button */}
                  {showApplyButton && finalText.trim() && onApplyToEnhancer && (
                    <button
                      onClick={() => onApplyToEnhancer(finalText.trim())}
                      className="flex items-center space-x-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
                      title="Apply transcribed text to prompt enhancer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply to Enhancer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start recording to see live transcription</p>
              <p className="text-sm mt-1">Your speech will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>

      {/* Session Info */}
      {session && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Information</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-500">Started:</span>
              <p className="text-gray-900 dark:text-white">
                {session.startTime.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">Duration:</span>
              <p className="text-gray-900 dark:text-white">
                {formatDuration(session.totalDuration)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">Words:</span>
              <p className="text-gray-900 dark:text-white">
                {session.wordCount}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">Language:</span>
              <p className="text-gray-900 dark:text-white">
                {VoiceRecognitionService.getLanguageName(session.language)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
        <p>Keyboard shortcuts: Ctrl+R to start/stop recording • Ctrl+Shift+R to pause/resume</p>
      </div>
    </div>
  );
};

export default VoiceRecorder;
