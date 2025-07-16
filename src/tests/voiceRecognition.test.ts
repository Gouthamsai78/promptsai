import { VoiceRecognitionService } from '../services/voiceRecognition';
import { VoiceSettings, VoiceCapabilities } from '../types/ai';

// Mock browser APIs
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null
};

const mockMediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn()
};

const mockAudioContext = {
  createMediaStreamSource: jest.fn(),
  createAnalyser: jest.fn(),
  close: jest.fn()
};

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn(),
  connect: jest.fn()
};

// Setup global mocks
Object.defineProperty(window, 'SpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition)
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: jest.fn(() => mockSpeechRecognition)
});

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

describe('VoiceRecognitionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    VoiceRecognitionService.cleanup();
    
    // Reset mocks
    mockMediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    });
    
    mockMediaDevices.enumerateDevices.mockResolvedValue([
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' },
      { kind: 'videoinput', deviceId: 'cam1', label: 'Camera 1' }
    ]);

    mockAudioContext.createMediaStreamSource.mockReturnValue({
      connect: jest.fn()
    });

    mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
  });

  describe('getCapabilities', () => {
    it('should detect voice recognition capabilities', () => {
      const capabilities = VoiceRecognitionService.getCapabilities();

      expect(capabilities).toBeDefined();
      expect(capabilities.isSupported).toBe(true);
      expect(capabilities.supportedLanguages).toContain('en-US');
      expect(capabilities.browserSupport.webSpeechAPI).toBe(true);
      expect(capabilities.browserSupport.mediaRecorder).toBe(true);
    });

    it('should return false for unsupported browsers', () => {
      // Temporarily remove speech recognition
      const originalSpeechRecognition = window.SpeechRecognition;
      const originalWebkitSpeechRecognition = window.webkitSpeechRecognition;
      
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      const capabilities = VoiceRecognitionService.getCapabilities();
      expect(capabilities.isSupported).toBe(false);
      expect(capabilities.browserSupport.webSpeechAPI).toBe(false);

      // Restore
      window.SpeechRecognition = originalSpeechRecognition;
      window.webkitSpeechRecognition = originalWebkitSpeechRecognition;
    });
  });

  describe('requestPermission', () => {
    it('should request and grant microphone permission', async () => {
      const hasPermission = await VoiceRecognitionService.requestPermission();
      
      expect(hasPermission).toBe(true);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should handle permission denial', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
      
      const hasPermission = await VoiceRecognitionService.requestPermission();
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with default settings', async () => {
      const result = await VoiceRecognitionService.initialize();
      
      expect(result).toBe(true);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalled();
    });

    it('should initialize with custom settings', async () => {
      const customSettings: Partial<VoiceSettings> = {
        language: 'es-ES',
        continuous: false,
        autoStopTimeout: 20000
      };

      const result = await VoiceRecognitionService.initialize(customSettings);
      
      expect(result).toBe(true);
      
      const currentSettings = VoiceRecognitionService.getSettings();
      expect(currentSettings.language).toBe('es-ES');
      expect(currentSettings.continuous).toBe(false);
      expect(currentSettings.autoStopTimeout).toBe(20000);
    });

    it('should handle initialization failure', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('No microphone'));
      
      await expect(VoiceRecognitionService.initialize()).rejects.toThrow();
    });
  });

  describe('recording lifecycle', () => {
    beforeEach(async () => {
      await VoiceRecognitionService.initialize();
    });

    it('should start recording successfully', async () => {
      await VoiceRecognitionService.startRecording();
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      
      const session = VoiceRecognitionService.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.id).toBeDefined();
    });

    it('should stop recording', () => {
      VoiceRecognitionService.stopRecording();
      
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should pause and resume recording', async () => {
      await VoiceRecognitionService.startRecording();
      
      VoiceRecognitionService.pauseRecording();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      
      await VoiceRecognitionService.resumeRecording();
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('callbacks', () => {
    let stateCallback: jest.Mock;
    let volumeCallback: jest.Mock;
    let transcriptionCallback: jest.Mock;

    beforeEach(async () => {
      stateCallback = jest.fn();
      volumeCallback = jest.fn();
      transcriptionCallback = jest.fn();

      VoiceRecognitionService.setStateCallback(stateCallback);
      VoiceRecognitionService.setVolumeCallback(volumeCallback);
      VoiceRecognitionService.setTranscriptionCallback(transcriptionCallback);

      await VoiceRecognitionService.initialize();
    });

    it('should call state callback on recording state changes', async () => {
      await VoiceRecognitionService.startRecording();
      
      expect(stateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isRecording: true,
          isProcessing: false,
          isPaused: false
        })
      );
    });

    it('should call transcription callback on speech results', async () => {
      await VoiceRecognitionService.startRecording();
      
      // Simulate speech recognition result
      const mockEvent = {
        resultIndex: 0,
        results: [{
          0: { transcript: 'Hello world', confidence: 0.9 },
          isFinal: true,
          length: 1
        }]
      };

      // Trigger the onresult handler
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent as any);
      }

      expect(transcriptionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello world',
          confidence: 0.9,
          isFinal: true
        })
      );
    });
  });

  describe('settings management', () => {
    it('should update settings correctly', async () => {
      await VoiceRecognitionService.initialize();
      
      const newSettings: Partial<VoiceSettings> = {
        language: 'fr-FR',
        maxAlternatives: 5
      };

      VoiceRecognitionService.updateSettings(newSettings);
      
      const currentSettings = VoiceRecognitionService.getSettings();
      expect(currentSettings.language).toBe('fr-FR');
      expect(currentSettings.maxAlternatives).toBe(5);
    });
  });

  describe('utility methods', () => {
    it('should format duration correctly', () => {
      expect(VoiceRecognitionService.formatDuration(0)).toBe('0s');
      expect(VoiceRecognitionService.formatDuration(30000)).toBe('30s');
      expect(VoiceRecognitionService.formatDuration(90000)).toBe('1:30');
      expect(VoiceRecognitionService.formatDuration(3661000)).toBe('61:01');
    });

    it('should get language names correctly', () => {
      expect(VoiceRecognitionService.getLanguageName('en-US')).toBe('English (US)');
      expect(VoiceRecognitionService.getLanguageName('es-ES')).toBe('Spanish (Spain)');
      expect(VoiceRecognitionService.getLanguageName('unknown')).toBe('unknown');
    });

    it('should clean transcription text correctly', () => {
      const dirtyText = '  um  hello   world  uh  how are you  ';
      const cleanText = VoiceRecognitionService.cleanTranscriptionText(dirtyText);
      
      expect(cleanText).toBe('hello world how are you');
    });

    it('should format transcription for prompts correctly', () => {
      const text = 'hello world. this is a test';
      const formatted = VoiceRecognitionService.formatTranscriptionForPrompt(text);
      
      expect(formatted).toBe('Hello world. This is a test');
    });
  });

  describe('error handling', () => {
    it('should handle speech recognition errors', async () => {
      const stateCallback = jest.fn();
      VoiceRecognitionService.setStateCallback(stateCallback);
      
      await VoiceRecognitionService.initialize();
      await VoiceRecognitionService.startRecording();
      
      // Simulate error
      const mockError = { error: 'network' };
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockError as any);
      }

      expect(stateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Recognition error: network'
        })
      );
    });

    it('should handle audio context setup failure', async () => {
      mockAudioContext.createMediaStreamSource.mockImplementationOnce(() => {
        throw new Error('Audio context error');
      });

      // Should still initialize successfully even if audio context fails
      const result = await VoiceRecognitionService.initialize();
      expect(result).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources correctly', async () => {
      await VoiceRecognitionService.initialize();
      await VoiceRecognitionService.startRecording();
      
      VoiceRecognitionService.cleanup();
      
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      
      const session = VoiceRecognitionService.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('session management', () => {
    it('should create and manage voice sessions', async () => {
      await VoiceRecognitionService.initialize();
      await VoiceRecognitionService.startRecording();
      
      const session = VoiceRecognitionService.getCurrentSession();
      
      expect(session).toBeDefined();
      expect(session?.id).toMatch(/^voice_\d+_[a-z0-9]+$/);
      expect(session?.startTime).toBeInstanceOf(Date);
      expect(session?.language).toBe('en-US');
    });

    it('should export session data correctly', async () => {
      await VoiceRecognitionService.initialize();
      await VoiceRecognitionService.startRecording();
      
      const session = VoiceRecognitionService.getCurrentSession();
      if (session) {
        const exported = VoiceRecognitionService.exportSession(session);
        const parsed = JSON.parse(exported);
        
        expect(parsed.id).toBe(session.id);
        expect(parsed.language).toBe(session.language);
      }
    });
  });
});
