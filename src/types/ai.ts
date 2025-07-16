// AI Service Types

export type PromptStyle = 'photographic' | 'artistic' | 'cinematic' | 'digital_art';

export interface EnhancedPrompt {
  id: string;
  style: PromptStyle;
  prompt: string;
  description: string;
}

export interface PromptEnhancementResult {
  original: string;
  enhanced: EnhancedPrompt[];
  processingTime: number;
}

// Prompt Transformation Types
export interface PromptTransformationResult {
  original: string;
  transformedPrompt: string;
  transformationType: 'meta-prompt' | 'enhanced-prompt';
  qualityScore: number;
  improvements: string[];
  appliedTechniques: string[];
  expertRole: string;
  outputSpecifications: string[];
  processingTime: number;
  templateUsed?: string;
}

export interface PromptAnalysis {
  intent: string;
  domain: string;
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
  requiredExpertise: string[];
  suggestedFramework: string;
  missingElements: string[];
  improvementOpportunities: string[];
}

export interface PromptQualityMetrics {
  clarity: number;
  specificity: number;
  completeness: number;
  professionalism: number;
  actionability: number;
  overallScore: number;
}

export interface ImageAnalysisResult {
  description: string;
  enhancedPrompts: EnhancedPrompt[];
  suggestedTags: string[];
  detectedStyle: string;
  textElements?: string;
  colorPalette?: string;
  lightingAnalysis?: string;
  compositionNotes?: string;
}

export interface ContentMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface AIServiceStatus {
  available: boolean;
  model: string;
  cacheSize: number;
  lastUsed?: Date;
}

// Real-time Types

export interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  userId: string;
  actorId: string;
  actorUsername: string;
  actorAvatar?: string;
  postId?: string;
  reelId?: string;
  commentId?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  avatar?: string;
  postId?: string;
  reelId?: string;
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface RealtimeSubscription {
  id: string;
  channel: string;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
  isActive: boolean;
}

export interface RealtimeConnectionState {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

// Enhanced Comment Types for Real-time
export interface LiveComment {
  id: string;
  content: string;
  userId: string;
  username: string;
  avatar?: string;
  postId?: string;
  reelId?: string;
  parentId?: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: LiveComment[];
  isOptimistic?: boolean; // For optimistic updates
}

export interface CommentUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  comment: LiveComment;
  postId?: string;
  reelId?: string;
}

// Live Engagement Types
export interface LiveEngagement {
  type: 'like' | 'save' | 'view';
  contentId: string;
  contentType: 'post' | 'reel' | 'comment';
  userId: string;
  username: string;
  avatar?: string;
  timestamp: Date;
}

export interface EngagementCounts {
  likes: number;
  comments: number;
  saves: number;
  views?: number;
}

// AI Enhancement UI States
export interface PromptEnhancementState {
  isEnhancing: boolean;
  hasEnhancements: boolean;
  selectedEnhancement?: EnhancedPrompt;
  showEnhancements: boolean;
  error?: string;
}

export interface ImageAnalysisState {
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  analysis?: ImageAnalysisResult;
  error?: string;
}

// Keyboard Shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: string;
  description: string;
}

// Feature 1: Intelligent Prompt Requirements Analysis Types

export interface PromptRequirement {
  id: string;
  description: string;
  category: 'use_case' | 'audience' | 'format' | 'tone' | 'constraints' | 'output';
  priority: 'high' | 'medium' | 'low';
  value: string;
  examples?: string[];
}

export interface RequirementsAnalysisInput {
  naturalLanguageDescription: string;
  additionalContext?: string;
  preferredStyle?: string;
  targetLength?: 'short' | 'medium' | 'long';
  complexityLevel?: 'basic' | 'intermediate' | 'advanced';
}

export interface RequirementsAnalysisResult {
  originalDescription: string;
  parsedRequirements: PromptRequirement[];
  identifiedUseCase: string;
  targetAudience: string;
  desiredOutputFormat: string;
  suggestedTone: string;
  detectedConstraints: string[];
  generatedPrompts: GeneratedPrompt[];
  processingTime: number;
  confidence: number;
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  prompt: string;
  explanation: string;
  addressedRequirements: string[];
  qualityScore: number;
  estimatedEffectiveness: number;
  suggestedImprovements?: string[];
  tags: string[];
}

export interface RequirementRefinement {
  requirementId: string;
  newValue: string;
  reason: string;
}

// Feature 2: Voice-to-Text Types

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  error?: string;
}

export interface VoiceTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  alternatives?: VoiceAlternative[];
  processingTime: number;
}

export interface VoiceAlternative {
  text: string;
  confidence: number;
}

export interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  autoStop: boolean;
  autoStopTimeout: number;
}

export interface VoiceCapabilities {
  isSupported: boolean;
  supportedLanguages: string[];
  hasPermission: boolean;
  browserSupport: {
    webSpeechAPI: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
  };
}

export interface VoiceSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  transcriptionResults: VoiceTranscriptionResult[];
  finalText: string;
  wordCount: number;
  language: string;
}

// Combined Feature Types

export interface VoiceToRequirementsResult {
  voiceSession: VoiceSession;
  transcription: VoiceTranscriptionResult;
  requirementsAnalysis: RequirementsAnalysisResult;
  combinedProcessingTime: number;
}

export interface SmartPromptCreationState {
  mode: 'text' | 'voice' | 'hybrid';
  voiceState: VoiceRecordingState;
  transcriptionState: {
    isTranscribing: boolean;
    currentText: string;
    finalText: string;
    error?: string;
  };
  requirementsState: {
    isAnalyzing: boolean;
    hasAnalysis: boolean;
    analysis?: RequirementsAnalysisResult;
    error?: string;
  };
  generationState: {
    isGenerating: boolean;
    hasPrompts: boolean;
    prompts: GeneratedPrompt[];
    selectedPrompt?: GeneratedPrompt;
    error?: string;
  };
}

export const AI_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'e',
    ctrlKey: true,
    action: 'enhance_prompt',
    description: 'Enhance current prompt with AI'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: 'copy_enhanced',
    description: 'Copy enhanced prompt to clipboard'
  },
  {
    key: '1',
    ctrlKey: true,
    action: 'select_photographic',
    description: 'Select photographic style enhancement'
  },
  {
    key: '2',
    ctrlKey: true,
    action: 'select_artistic',
    description: 'Select artistic style enhancement'
  },
  {
    key: '3',
    ctrlKey: true,
    action: 'select_cinematic',
    description: 'Select cinematic style enhancement'
  },
  {
    key: '4',
    ctrlKey: true,
    action: 'select_digital',
    description: 'Select digital art style enhancement'
  },
  {
    key: 'r',
    ctrlKey: true,
    action: 'start_voice_recording',
    description: 'Start voice recording for prompt creation'
  },
  {
    key: 'r',
    ctrlKey: true,
    shiftKey: true,
    action: 'stop_voice_recording',
    description: 'Stop voice recording'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: 'analyze_requirements',
    description: 'Analyze prompt requirements'
  }
];
