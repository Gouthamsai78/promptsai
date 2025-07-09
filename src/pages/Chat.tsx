import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Sparkles, Image as ImageIcon, User, Bot, Loader, MessageCircle, Wand2, Download, Trash2, RefreshCw, Check, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIService } from '../services/ai';
import { EnhancedPrompt, ImageAnalysisResult, PromptTransformationResult } from '../types/ai';
import { debugLog } from '../utils/debug';
import PageLayout from '../components/PageLayout';
import { PromptQualityValidator } from '../services/promptQualityValidator';
import {
  ConversationMemoryService,
  ConversationMemory,
  ConversationMessage as MemoryMessage,
  UserPreferences
} from '../services/conversationMemory';
import {
  PromptTemplateService,
  TemplateDetectionResult,
  TemplateApplication
} from '../services/promptTemplates';
import UsageTracker from '../components/UsageTracker';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  enhancedPrompts?: EnhancedPrompt[];
  imageAnalysis?: ImageAnalysisResult;
  promptTransformation?: PromptTransformationResult;
  qualityValidation?: any;
  isLoading?: boolean;
  templateSuggestion?: TemplateDetectionResult;
  appliedTemplate?: TemplateApplication;
  metadata?: {
    promptCategory?: string;
    processingTime?: number;
    modelUsed?: string;
  };
}

// Remove the old interface as we're using the one from conversationMemory service

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory>(() =>
    ConversationMemoryService.initializeMemory(user?.id)
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [enhancedPromptsCache, setEnhancedPromptsCache] = useState<Record<string, EnhancedPrompt[]>>({});

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() =>
    ConversationMemoryService.analyzeUserPreferences(conversationMemory)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize messages from conversation memory
  useEffect(() => {
    if (conversationMemory.messages.length > 0) {
      const convertedMessages: ChatMessage[] = conversationMemory.messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.timestamp), // Ensure proper Date object
        metadata: msg.metadata
      }));
      setMessages(convertedMessages);
    } else {
      // Set welcome message if no conversation history
      setMessages([
        {
          id: 'welcome',
          type: 'ai',
          content: "Welcome to PromptShare AI Chat! 🚀\n\nI'm your dedicated AI prompt engineering assistant. I can help you:\n\n✨ **Transform basic ideas** into professional, detailed prompts\n🎨 **Analyze images** and generate recreation prompts\n📝 **Refine existing prompts** for better results\n🎯 **Provide specialized templates** for different use cases\n\nJust describe what you want to create, upload an image, or ask me anything about prompt engineering!",
          timestamp: new Date(),
          metadata: { promptCategory: 'welcome' }
        }
      ]);
    }
  }, [conversationMemory.messages.length]); // Only depend on length to avoid infinite loops

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update conversation memory and preferences
  const updateConversationMemory = (message: ChatMessage, category?: string) => {
    try {
      const memoryMessage: MemoryMessage = {
        id: message.id,
        type: message.type,
        content: message.content,
        timestamp: message.timestamp,
        metadata: {
          ...message.metadata,
          promptCategory: category || message.metadata?.promptCategory,
          enhancementCount: message.enhancedPrompts?.length || 0
        }
      };

      const updatedMemory = ConversationMemoryService.addMessage(conversationMemory, memoryMessage);
      setConversationMemory(updatedMemory);

      // Update user preferences based on new conversation data
      const newPreferences = ConversationMemoryService.analyzeUserPreferences(updatedMemory);
      setUserPreferences(newPreferences);
    } catch (error) {
      debugLog('❌ Failed to update conversation memory:', error);
      // Continue without memory update if it fails
    }
  };

  // Handle text input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!inputText.trim() && !selectedFile) || isProcessing) return;

    // Check if AI service is available
    if (!AIService.isAIAvailable()) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: "I'm sorry, but the AI service is currently unavailable. Please check your internet connection and try again.",
        timestamp: new Date(),
        metadata: { promptCategory: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: selectedFile ? `${inputText.trim()} [Image: ${selectedFile.name}]` : inputText.trim(),
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);

    // Add loading AI message
    const loadingMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: selectedFile ? 'Analyzing your image and generating professional prompts...' : 'Creating enhanced prompts for you...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);
    setIsProcessing(true);

    // Clear input
    const originalInput = inputText.trim();
    setInputText('');
    setSelectedFile(null);

    try {
      let aiResponse: ChatMessage;
      const startTime = Date.now();

      if (selectedFile) {
        // Handle image analysis with enhanced error handling
        debugLog('🖼️ Processing image in chat:', selectedFile.name);

        try {
          debugLog('🚀 Starting real AI image analysis with OpenRouter...');
          const analysis = await AIService.analyzeImage(selectedFile);

          debugLog('✅ Real AI image analysis completed successfully:', {
            hasDescription: !!analysis.description,
            hasDetectedStyle: !!analysis.detectedStyle,
            hasEnhancedPrompts: !!analysis.enhancedPrompts,
            promptCount: analysis.enhancedPrompts?.length || 0,
            promptStyles: analysis.enhancedPrompts?.map(p => p.style) || [],
            analysisStructure: Object.keys(analysis),
            isRealAI: true,
            apiUsed: 'OpenRouter'
          });

          // Detailed debugging of enhanced prompts
          debugLog('🔍 Enhanced prompts detailed analysis:', {
            enhancedPromptsExists: !!analysis.enhancedPrompts,
            enhancedPromptsType: typeof analysis.enhancedPrompts,
            enhancedPromptsIsArray: Array.isArray(analysis.enhancedPrompts),
            enhancedPromptsLength: analysis.enhancedPrompts?.length || 0,
            enhancedPromptsContent: analysis.enhancedPrompts?.map((p: any, i: number) => ({
              index: i,
              id: p?.id,
              style: p?.style,
              promptPreview: p?.prompt?.substring(0, 50) + '...',
              promptLength: p?.prompt?.length || 0,
              hasDescription: !!p?.description
            })) || 'No enhanced prompts'
          });

          // Additional validation
          if (!analysis.enhancedPrompts || analysis.enhancedPrompts.length === 0) {
            debugLog('⚠️ WARNING: No enhanced prompts found in analysis result');
          } else if (analysis.enhancedPrompts.length !== 4) {
            debugLog('⚠️ WARNING: Expected 4 prompts, got:', analysis.enhancedPrompts.length);
          } else {
            debugLog('🎉 SUCCESS: All 4 enhanced prompts found');
          }

          // Ensure enhanced prompts are properly typed and preserved
          const enhancedPrompts: EnhancedPrompt[] = analysis.enhancedPrompts || [];

          // Create a completely new message object with explicit enhanced prompts
          const messageId = `ai_${Date.now()}_response`;
          aiResponse = {
            id: messageId,
            type: 'ai' as const,
            content: `I've analyzed your image! Here's what I found:\n\n**Description:** ${analysis.description}\n\n**Detected Style:** ${analysis.detectedStyle}\n\n**Suggested Tags:** ${analysis.suggestedTags.join(', ')}\n\n${analysis.textElements && analysis.textElements !== 'None detected' ? `**Text Elements:** ${analysis.textElements}\n\n` : ''}I've generated ${enhancedPrompts.length} professional prompts to recreate similar content:`,
            timestamp: new Date(),
            imageAnalysis: analysis,
            enhancedPrompts: enhancedPrompts,
            metadata: {
              promptCategory: 'image_analysis',
              processingTime: Date.now() - startTime,
              modelUsed: 'vision'
            }
          };

          // Force explicit assignment to ensure no loss
          aiResponse.enhancedPrompts = enhancedPrompts;

          // Cache enhanced prompts separately to prevent loss
          setEnhancedPromptsCache(prev => ({
            ...prev,
            [messageId]: enhancedPrompts
          }));

          // Verify enhanced prompts are preserved
          console.log('🔍 Enhanced prompts verification before message update:', {
            messageId: aiResponse.id,
            originalCount: analysis.enhancedPrompts?.length || 0,
            preservedCount: aiResponse.enhancedPrompts?.length || 0,
            enhancedPromptsPreview: aiResponse.enhancedPrompts?.map(p => ({ id: p.id, style: p.style })) || 'None',
            aiResponseKeys: Object.keys(aiResponse),
            enhancedPromptsType: typeof aiResponse.enhancedPrompts,
            enhancedPromptsIsArray: Array.isArray(aiResponse.enhancedPrompts)
          });

          // Debug the message object being created
          debugLog('🔍 AI response message object created:', {
            messageId: aiResponse.id,
            hasImageAnalysis: !!aiResponse.imageAnalysis,
            hasEnhancedPrompts: !!aiResponse.enhancedPrompts,
            enhancedPromptsCount: aiResponse.enhancedPrompts?.length || 0,
            enhancedPromptsPreview: aiResponse.enhancedPrompts?.map((p: any) => ({
              id: p?.id,
              style: p?.style,
              hasPrompt: !!p?.prompt
            })) || 'No prompts',
            messageKeys: Object.keys(aiResponse)
          });

          updateConversationMemory(aiResponse, 'image_analysis');
        } catch (imageError: any) {
          debugLog('❌ Real AI image analysis failed:', {
            error: imageError.message,
            stack: imageError.stack,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            apiAvailable: AIService.isAIAvailable()
          });

          // Provide specific error messages based on the error type
          let errorMessage = `I couldn't analyze your image: ${imageError.message}`;

          if (imageError.message.includes('API key') || imageError.message.includes('authentication')) {
            errorMessage = `OpenRouter API authentication failed. Please check your API key configuration.`;
          } else if (imageError.message.includes('network') || imageError.message.includes('fetch')) {
            errorMessage = `Network error occurred while connecting to OpenRouter. Please check your internet connection and try again.`;
          } else if (imageError.message.includes('parse') || imageError.message.includes('JSON')) {
            errorMessage = `The AI service returned an invalid response format. Please try again.`;
          } else if (imageError.message.includes('AI service not available')) {
            errorMessage = `AI service is not properly configured. Please check your OpenRouter API key.`;
          }

          aiResponse = {
            id: `ai_${Date.now()}_error`,
            type: 'ai',
            content: errorMessage,
            timestamp: new Date(),
            metadata: {
              promptCategory: 'error',
              processingTime: Date.now() - startTime,
              modelUsed: 'vision',
              isRealAIError: true
            }
          };
        }
      } else {
        // Determine prompt category and handle accordingly using the universal detection method
        const isImagePrompt = AIService.isImageGenerationPrompt(originalInput);
        const category = isImagePrompt ? 'image_generation' : 'text_ai';

        if (isImagePrompt) {
          // Handle image generation prompt enhancement
          debugLog('✨ Enhancing image generation prompt in chat:', {
            originalInput,
            isImagePrompt,
            category,
            detectedByUniversalMethod: AIService.isImageGenerationPrompt(originalInput)
          });

          try {
            const enhancement = await AIService.enhancePrompt(originalInput, true);

            // Debug the enhancement result
            debugLog('✅ Enhancement result received:', {
              originalLength: enhancement.original.length,
              enhancedCount: enhancement.enhanced.length,
              enhancedStyles: enhancement.enhanced.map(e => e.style),
              processingTime: enhancement.processingTime
            });

            // Verify we got the expected 4 styles for image generation
            if (enhancement.enhanced.length === 4) {
              debugLog('🎉 SUCCESS: Chat.tsx received all 4 style variants!', {
                styles: enhancement.enhanced.map(e => e.style),
                allStylesPresent: ['photographic', 'artistic', 'cinematic', 'digital_art'].every(style =>
                  enhancement.enhanced.some(e => e.style === style)
                )
              });
            } else {
              debugLog('⚠️ WARNING: Expected 4 styles, got:', enhancement.enhanced.length);
            }

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: `Perfect! I've enhanced your image generation prompt. Here are ${enhancement.enhanced.length} professional versions optimized for different styles:`,
              timestamp: new Date(),
              enhancedPrompts: enhancement.enhanced,
              metadata: {
                promptCategory: category,
                processingTime: enhancement.processingTime,
                modelUsed: 'text'
              }
            };

          } catch (enhanceError: any) {
            debugLog('❌ Image generation prompt enhancement failed:', {
              error: enhanceError.message,
              stack: enhanceError.stack,
              originalInput,
              apiAvailable: AIService.isAIAvailable()
            });

            // Provide specific error message for enhancement failure
            let errorMessage = `I couldn't enhance your image generation prompt: ${enhanceError.message}`;

            if (enhanceError.message.includes('API key') || enhanceError.message.includes('authentication')) {
              errorMessage = `OpenRouter API authentication failed. Please check your API key configuration.`;
            } else if (enhanceError.message.includes('network') || enhanceError.message.includes('fetch')) {
              errorMessage = `Network error occurred. Please check your internet connection and try again.`;
            }

            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'ai',
              content: errorMessage,
              timestamp: new Date(),
              metadata: {
                promptCategory: category,
                processingTime: Date.now() - startTime,
                modelUsed: 'text',
                isRealAIError: true
              }
            };
          }

        } else {
          // Handle general chat with template detection and memory context
          debugLog('💬 Processing general chat message with template detection:', originalInput);

          try {
            // Build context-aware prompt using conversation memory
            const contextPrompt = ConversationMemoryService.generateContextualPrompt(conversationMemory, originalInput);

            // Use template-enhanced chat response
            const chatResult = await AIService.chatResponseWithTemplates(originalInput, contextPrompt);

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: chatResult.response,
              timestamp: new Date(),
              templateSuggestion: chatResult.templateSuggestion,
              appliedTemplate: chatResult.appliedTemplate,
              metadata: {
                promptCategory: category,
                processingTime: Date.now() - startTime,
                modelUsed: 'text'
              }
            };

          } catch (chatError: any) {
            debugLog('❌ General chat processing failed:', {
              error: chatError.message,
              stack: chatError.stack,
              originalInput,
              apiAvailable: AIService.isAIAvailable()
            });

            // Provide fallback response for chat errors
            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'ai',
              content: `I apologize, but I encountered an issue processing your message: ${chatError.message}. Please try rephrasing your request or try again later.`,
              timestamp: new Date(),
              metadata: {
                promptCategory: category,
                processingTime: Date.now() - startTime,
                modelUsed: 'text',
                isRealAIError: true
              }
            };
          }
        }

        updateConversationMemory(aiResponse, category);
      }

      // Replace loading message with actual response
      console.log('🔍 About to replace loading message with AI response:', {
        aiResponseId: aiResponse.id,
        aiResponseType: aiResponse.type,
        aiResponseHasEnhancedPrompts: !!aiResponse.enhancedPrompts,
        aiResponseEnhancedPromptsCount: aiResponse.enhancedPrompts?.length || 0,
        aiResponseKeys: Object.keys(aiResponse)
      });

      setMessages(prev => {
        const updatedMessages = prev.map(msg => {
          if (msg.isLoading) {
            console.log('🔍 Replacing loading message with AI response:', {
              oldId: msg.id,
              newId: aiResponse.id,
              newHasEnhancedPrompts: !!aiResponse.enhancedPrompts,
              newEnhancedPromptsCount: aiResponse.enhancedPrompts?.length || 0,
              newEnhancedPromptsPreview: aiResponse.enhancedPrompts?.map(p => ({ id: p.id, style: p.style })) || 'None'
            });

            // Create a new message object to ensure no reference issues
            const newMessage: ChatMessage = {
              ...aiResponse,
              enhancedPrompts: aiResponse.enhancedPrompts // Explicitly preserve enhanced prompts
            };

            console.log('🔍 New message object created:', {
              messageId: newMessage.id,
              hasEnhancedPrompts: !!newMessage.enhancedPrompts,
              enhancedPromptsCount: newMessage.enhancedPrompts?.length || 0,
              enhancedPromptsType: typeof newMessage.enhancedPrompts
            });

            return newMessage;
          }
          return msg;
        });

        console.log('🔍 Messages after replacement:', {
          totalMessages: updatedMessages.length,
          messagesWithEnhancedPrompts: updatedMessages.filter(m => m.enhancedPrompts && m.enhancedPrompts.length > 0).length,
          lastMessageHasEnhancedPrompts: !!updatedMessages[updatedMessages.length - 1]?.enhancedPrompts,
          lastMessageEnhancedPromptsCount: updatedMessages[updatedMessages.length - 1]?.enhancedPrompts?.length || 0
        });

        return updatedMessages;
      });

    } catch (error: any) {
      debugLog('❌ Chat processing failed:', error.message);

      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}_error`,
        type: 'ai',
        content: `I apologize, but I encountered an error while processing your request: ${error.message}\n\nPlease try again or rephrase your request.`,
        timestamp: new Date(),
        metadata: {
          promptCategory: 'error',
          processingTime: Date.now() - Date.now()
        }
      };

      setMessages(prev => prev.map(msg =>
        msg.isLoading ? errorMessage : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  // Copy prompt to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Clear conversation and reset memory
  const clearConversation = () => {
    try {
      ConversationMemoryService.clearMemory();
      const newMemory = ConversationMemoryService.initializeMemory(user?.id);
      setConversationMemory(newMemory);
      setUserPreferences(ConversationMemoryService.analyzeUserPreferences(newMemory));

      setMessages([
        {
          id: 'welcome',
          type: 'ai',
          content: "Welcome to a fresh conversation! I'm ready to help you create amazing prompts. What would you like to work on?",
          timestamp: new Date(),
          metadata: { promptCategory: 'welcome' }
        }
      ]);
    } catch (error) {
      debugLog('❌ Failed to clear conversation:', error);
      // Fallback: just reset messages without clearing memory
      setMessages([
        {
          id: 'welcome',
          type: 'ai',
          content: "Welcome to a fresh conversation! I'm ready to help you create amazing prompts. What would you like to work on?",
          timestamp: new Date(),
          metadata: { promptCategory: 'welcome' }
        }
      ]);
    }
  };

  if (!AIService.isAIAvailable()) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <Wand2 className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              AI Chat Unavailable
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              The AI chat feature requires an OpenRouter API key to be configured.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Please add your OpenRouter API key to the environment variables to enable AI features.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-8rem)] flex gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Prompt Chat
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional prompt engineering assistant
                </p>
              </div>
            </div>

          <div className="flex items-center space-x-2">
            {/* Session Stats */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span>Prompts: {conversationMemory.sessionContext.totalPrompts}</span>
              <span>Enhanced: {conversationMemory.sessionContext.successfulEnhancements}</span>
              <span>Avg: {Math.round(conversationMemory.sessionContext.averageProcessingTime)}ms</span>
              <span>Templates: {Object.keys(PromptTemplateService.getUsageStatistics() || {}).length}</span>
            </div>

            <button
              onClick={clearConversation}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>{message.content}</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>



                    {/* Enhanced Prompts Display */}
                    {(() => {
                      // Get enhanced prompts from message or cache
                      const enhancedPrompts = message.enhancedPrompts || enhancedPromptsCache[message.id] || [];
                      const hasValidPrompts = Array.isArray(enhancedPrompts) && enhancedPrompts.length > 0;

                      console.log('🔍 Enhanced Prompts Rendering Check:', {
                        messageId: message.id,
                        fromMessage: !!message.enhancedPrompts,
                        fromCache: !!enhancedPromptsCache[message.id],
                        finalCount: enhancedPrompts.length,
                        hasValidPrompts
                      });

                      return hasValidPrompts ? (
                        <div className="mt-4 space-y-3">
                          <div className="text-sm font-medium text-green-600 mb-2">
                            ✅ Found {enhancedPrompts.length} Enhanced Prompts:
                          </div>
                          {enhancedPrompts.map((prompt, index) => (
                          <div
                            key={prompt.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
                                  {prompt.style.replace('_', ' ')}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(prompt.prompt)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {prompt.description}
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm text-gray-800 dark:text-gray-200 font-mono">
                              {prompt.prompt}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null;
                    })()}

                    {/* Template Suggestions */}
                    {message.templateSuggestion && message.templateSuggestion.suggestedTemplate && (
                      <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Wand2 className="h-4 w-4 text-purple-500" />
                            <span className="font-medium text-sm text-purple-700 dark:text-purple-300">
                              Template Suggestion
                            </span>
                            <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                              {Math.round(message.templateSuggestion.confidence)}% match
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const template = message.templateSuggestion?.suggestedTemplate;
                              if (template) {
                                setSelectedTemplate(template.id);
                                setInputText(prev =>
                                  prev
                                    ? `Apply ${template.name} template to: ${prev}`
                                    : `Use the ${template.name} template`
                                );
                              }
                            }}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-600 text-purple-700 dark:text-purple-300 rounded transition-colors"
                          >
                            <span>Apply Template</span>
                          </button>
                        </div>
                        <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                          {message.templateSuggestion.suggestedTemplate?.name || 'Unknown Template'}
                        </h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                          {message.templateSuggestion.suggestedTemplate?.description || 'No description available'}
                        </p>
                        <p className="text-xs text-purple-500 dark:text-purple-400">
                          {message.templateSuggestion.reasoning || 'No reasoning provided'}
                        </p>
                      </div>
                    )}

                    {/* Applied Template Info */}
                    {message.appliedTemplate && (
                      <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm text-green-700 dark:text-green-300">
                            Template Applied: {message.appliedTemplate.appliedTemplate?.name || 'Unknown Template'}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          <strong>Improvements:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {(message.appliedTemplate.improvements || []).map((improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Prompt Transformation Display */}
                    {message.promptTransformation && (
                      <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm text-blue-700 dark:text-blue-300">
                              Professional Meta-Prompt
                            </span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                              Quality: {message.promptTransformation.qualityScore}/100
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(message.promptTransformation!.transformedPrompt);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-1"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                            {message.promptTransformation.transformedPrompt}
                          </pre>
                        </div>

                        {/* Applied Techniques */}
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Applied Techniques:</div>
                          <div className="flex flex-wrap gap-1">
                            {message.promptTransformation.appliedTechniques.map((technique, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                              >
                                {technique}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {message.metadata && message.type === 'ai' && !message.isLoading && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {message.metadata.processingTime && (
                          <span>Processed in {message.metadata.processingTime}ms</span>
                        )}
                        {message.metadata.promptCategory && (
                          <span className="ml-2 capitalize">• {message.metadata.promptCategory.replace('_', ' ')}</span>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {/* Template Selector */}
            {showTemplateSelector && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Choose a Template</h4>
                  <button
                    onClick={() => setShowTemplateSelector(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {(PromptTemplateService.getCategories() || []).map(category => (
                    <div key={category} className="mb-3">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                        {category.replace('_', ' ')}
                      </h5>
                      {(PromptTemplateService.getTemplatesByCategory(category) || []).map(template => {
                        const usageStats = PromptTemplateService.getUsageStatistics() || {};
                        const usageCount = usageStats[template.id] || 0;
                        return (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template.id);
                              setShowTemplateSelector(false);
                              setInputText(prev =>
                                prev
                                  ? `Use the ${template.name} template for: ${prev}`
                                  : `Use the ${template.name} template`
                              );
                            }}
                            className="w-full text-left p-2 text-sm bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded mb-1 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                              <div className="flex items-center space-x-1">
                                {usageCount > 0 && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-1 rounded">
                                    {usageCount}
                                  </span>
                                )}
                                <span className="text-xs bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 px-1 rounded">
                                  {template.effectiveness}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{template.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Preview */}
            {selectedFile && (
              <div className="mb-3 flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <ImageIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              {/* Template Selector Button */}
              <button
                type="button"
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                disabled={isProcessing}
                className={`flex-shrink-0 p-2 transition-colors disabled:opacity-50 ${
                  showTemplateSelector
                    ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Choose a template"
              >
                <Wand2 className="h-5 w-5" />
              </button>

              {/* Prompt Transformation Button */}
              <button
                type="button"
                onClick={async () => {
                  if (!inputText.trim()) return;

                  try {
                    const transformation = AIService.transformPrompt(inputText.trim());
                    const validation = PromptQualityValidator.validatePrompt(transformation);

                    const transformationMessage: ChatMessage = {
                      id: `transformation_${Date.now()}`,
                      type: 'ai',
                      content: `I've transformed your prompt into a professional meta-prompt with a quality score of ${transformation.qualityScore}/100.`,
                      timestamp: new Date(),
                      promptTransformation: transformation,
                      qualityValidation: validation
                    };

                    setMessages(prev => [...prev, transformationMessage]);
                    setInputText('');
                  } catch (error: any) {
                    console.error('Transformation failed:', error);
                  }
                }}
                disabled={isProcessing || !inputText.trim()}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                title="Transform to meta-prompt"
              >
                <TrendingUp className="h-5 w-5" />
              </button>

              {/* File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                title="Upload image for analysis"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={selectedFile ? "Describe what you want to create with this image..." : "Describe what you want to create, or ask me anything about prompt engineering..."}
                  disabled={isProcessing}
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none disabled:opacity-50"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedFile) || isProcessing}
                className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                title="Send message"
              >
                {isProcessing ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </form>

            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setInputText("Help me develop a more engaging writing style for my blog")}
                disabled={isProcessing}
                className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-600 text-purple-700 dark:text-purple-300 rounded-full transition-colors disabled:opacity-50"
              >
                📝 Writing Style
              </button>
              <button
                onClick={() => setInputText("Create a content strategy for my sustainable fashion brand")}
                disabled={isProcessing}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 rounded-full transition-colors disabled:opacity-50"
              >
                📊 Content Strategy
              </button>
              <button
                onClick={() => setInputText("Plan a 2-week budget trip to Southeast Asia for $1500")}
                disabled={isProcessing}
                className="px-3 py-1 text-xs bg-green-100 dark:bg-green-700 hover:bg-green-200 dark:hover:bg-green-600 text-green-700 dark:text-green-300 rounded-full transition-colors disabled:opacity-50"
              >
                ✈️ Travel Planning
              </button>
              <button
                onClick={() => setInputText("Help me set goals for launching my online coaching business")}
                disabled={isProcessing}
                className="px-3 py-1 text-xs bg-orange-100 dark:bg-orange-700 hover:bg-orange-200 dark:hover:bg-orange-600 text-orange-700 dark:text-orange-300 rounded-full transition-colors disabled:opacity-50"
              >
                🎯 Goal Setting
              </button>
              <button
                onClick={() => setShowTemplateSelector(true)}
                disabled={isProcessing}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors disabled:opacity-50"
              >
                🔧 All Templates
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Usage Tracker Sidebar */}
        <div className="hidden lg:block w-80">
          <UsageTracker />
        </div>
      </div>
    </PageLayout>
  );
};

export default Chat;
