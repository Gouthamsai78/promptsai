import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Sparkles, Image as ImageIcon, User, Bot, Loader, AlertCircle, CheckCircle, X, Paperclip, Check, Heart, ChevronDown, ChevronUp, Zap, Camera, Palette, Film, Monitor } from 'lucide-react';
import { AIService } from '../services/ai';
import { EnhancedPrompt, ImageAnalysisResult } from '../types/ai';
import { debugLog } from '../utils/debug';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: Date;
  enhancedPrompts?: EnhancedPrompt[];
  imageAnalysis?: ImageAnalysisResult;
  isLoading?: boolean;
  error?: string;
  attachedFile?: {
    name: string;
    type: string;
    size: number;
  };
}

interface AIChatInterfaceProps {
  onPromptGenerated?: (prompt: string) => void;
  onEnhancementSelect?: (enhancement: EnhancedPrompt) => void;
  className?: string;
  fullHeight?: boolean;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  onPromptGenerated,
  onEnhancementSelect,
  className = '',
  fullHeight = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Welcome to PromptShare AI! 🚀\n\nI'm your dedicated prompt engineering assistant. I can help you:\n\n✨ **Transform basic ideas** into professional prompts\n🎨 **Analyze images** and generate recreation prompts\n📝 **Enhance existing prompts** for better results\n🎯 **Provide specialized templates** for different use cases\n\nJust describe what you want to create, upload an image, or ask me anything!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [copiedPrompts, setCopiedPrompts] = useState<Set<string>>(new Set());
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [favoritePrompts, setFavoritePrompts] = useState<Set<string>>(new Set());
  const [copyAllStatus, setCopyAllStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+C to copy focused prompt (when not in textarea)
      if (event.ctrlKey && event.key === 'c' && event.target !== textareaRef.current) {
        const focusedPromptCard = document.querySelector('.prompt-card:focus-within');
        if (focusedPromptCard) {
          const promptText = focusedPromptCard.querySelector('.prompt-content')?.textContent;
          if (promptText) {
            copyToClipboard(promptText);
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      setSelectedFile(imageFile);
      setError('');
    } else {
      setError('Please drop an image file');
    }
  };

  // Handle text input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!inputText.trim() && !selectedFile) || isProcessing) return;

    // Clear any previous errors
    setError('');

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: selectedFile ? `${inputText.trim()} [Image: ${selectedFile.name}]` : inputText.trim(),
      timestamp: new Date(),
      attachedFile: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      } : undefined
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);

    // Add loading AI message
    const loadingMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: selectedFile ? 'Analyzing your image and generating prompts...' : 'Creating enhanced prompts for you...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);
    setIsProcessing(true);

    try {
      let aiResponse: ChatMessage;

      if (selectedFile) {
        // Handle image analysis with enhanced error handling
        debugLog('🖼️ Processing image in chat:', selectedFile.name);

        // Check AI availability before processing
        if (!AIService.isAIAvailable()) {
          aiResponse = {
            id: `ai_${Date.now()}_error`,
            type: 'error',
            content: `AI service is not available. Please check that your OpenRouter API key is properly configured in the environment variables.`,
            timestamp: new Date(),
            error: 'AI service unavailable'
          };
        } else {
          try {
            debugLog('✅ AI service available, analyzing image with real OpenRouter API...');
            const analysis = await AIService.analyzeImage(selectedFile);

            debugLog('✅ Real AI image analysis completed:', {
              hasDescription: !!analysis.description,
              hasEnhancedPrompts: !!analysis.enhancedPrompts,
              promptCount: analysis.enhancedPrompts?.length || 0,
              promptStyles: analysis.enhancedPrompts?.map(p => p.style) || []
            });

            // Create AI response with enhanced prompts

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: `I've analyzed your image using real AI! Here's what I found:\n\n**Description:** ${analysis.description}\n\n**Detected Style:** ${analysis.detectedStyle}\n\n${analysis.textElements && analysis.textElements !== 'None detected' ? `**Text Elements:** ${analysis.textElements}\n\n` : ''}I've generated ${analysis.enhancedPrompts.length} professional AI-enhanced prompts for you:`,
              timestamp: new Date(),
              imageAnalysis: analysis,
              enhancedPrompts: analysis.enhancedPrompts
            };

            // Add the AI response to messages
          } catch (imageError: any) {
            debugLog('❌ Real AI image analysis failed:', imageError.message);

            // Provide specific error messages based on the error type
            let errorMessage = `I couldn't analyze your image: ${imageError.message}`;

            if (imageError.message.includes('API key') || imageError.message.includes('authentication')) {
              errorMessage = `OpenRouter API authentication failed. Please check your API key configuration.`;
            } else if (imageError.message.includes('network') || imageError.message.includes('fetch')) {
              errorMessage = `Network error occurred. Please check your internet connection and try again.`;
            } else if (imageError.message.includes('parse') || imageError.message.includes('JSON')) {
              errorMessage = `The AI service returned an invalid response. Please try again.`;
            }

            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'error',
              content: errorMessage,
              timestamp: new Date(),
              error: imageError.message
            };
          }
        }
      } else {
        // Determine if this is an image generation prompt or general chat
        const isImagePrompt = AIService.isImageGenerationPrompt(inputText.trim());

        if (isImagePrompt) {
          // Handle image generation prompt enhancement
          debugLog('✨ Enhancing image generation prompt in chat:', inputText);

          try {
            const enhancement = await AIService.enhancePrompt(inputText.trim(), true);

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: `I've enhanced your image generation prompt into ${enhancement.enhanced.length} professional variations:`,
              timestamp: new Date(),
              enhancedPrompts: enhancement.enhanced
            };
          } catch (enhanceError: any) {
            debugLog('❌ Prompt enhancement failed:', enhanceError.message);
            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'error',
              content: `I couldn't enhance your prompt: ${enhanceError.message}. Please try rephrasing your request.`,
              timestamp: new Date(),
              error: enhanceError.message
            };
          }
        } else {
          // Handle general chat conversation
          debugLog('💬 Processing general chat message:', inputText);

          try {
            const chatResponse = await AIService.chatResponse(inputText.trim());

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: chatResponse,
              timestamp: new Date()
            };
          } catch (chatError: any) {
            debugLog('❌ Chat response failed:', chatError.message);
            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'error',
              content: `I couldn't process your message: ${chatError.message}. Please try again.`,
              timestamp: new Date(),
              error: chatError.message
            };
          }
        }
      }

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id ? aiResponse : msg
      ));

    } catch (error: any) {
      debugLog('❌ Chat AI processing failed:', error.message);

      // Replace loading message with error
      const errorMessage: ChatMessage = {
        id: `ai_${Date.now()}_error`,
        type: 'error',
        content: `Sorry, I encountered an unexpected error: ${error.message}. Please try again or check if the AI service is available.`,
        timestamp: new Date(),
        error: error.message
      };

      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id ? errorMessage : msg
      ));
    } finally {
      setIsProcessing(false);
      setInputText('');
      setSelectedFile(null);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      debugLog('📁 File selected for chat:', file.name);
    }
  };

  // Enhanced copy to clipboard with green visual feedback
  const copyToClipboard = async (text: string, promptId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      debugLog('📋 Copied prompt to clipboard');

      // Add green visual feedback
      if (promptId) {
        setCopiedPrompts(prev => new Set(prev).add(promptId));
        // Remove the feedback after 3 seconds
        setTimeout(() => {
          setCopiedPrompts(prev => {
            const newSet = new Set(prev);
            newSet.delete(promptId);
            return newSet;
          });
        }, 3000);
      }
    } catch (error) {
      debugLog('❌ Failed to copy to clipboard:', error);
      setError('Failed to copy to clipboard. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Copy all enhanced prompts
  const copyAllPrompts = async (prompts: EnhancedPrompt[]) => {
    setCopyAllStatus('copying');
    try {
      const allPromptsText = prompts.map((prompt, index) =>
        `${index + 1}. ${prompt.style.toUpperCase()} STYLE:\n${prompt.prompt}\n`
      ).join('\n---\n\n');

      await navigator.clipboard.writeText(allPromptsText);
      debugLog('📋 Copied all prompts to clipboard');
      setCopyAllStatus('success');
      setTimeout(() => setCopyAllStatus('idle'), 2000);
    } catch (error) {
      debugLog('❌ Failed to copy all prompts:', error);
      setCopyAllStatus('error');
      setTimeout(() => setCopyAllStatus('idle'), 3000);
    }
  };

  // Toggle prompt expansion
  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  // Toggle favorite prompt
  const toggleFavoritePrompt = (promptId: string) => {
    setFavoritePrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  // Get style icon
  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'photographic': return Camera;
      case 'artistic': return Palette;
      case 'cinematic': return Film;
      case 'digital_art': return Monitor;
      default: return Sparkles;
    }
  };

  // Get style color
  const getStyleColor = (style: string) => {
    switch (style) {
      case 'photographic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'artistic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cinematic': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'digital_art': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Apply prompt
  const applyPrompt = (prompt: EnhancedPrompt) => {
    onPromptGenerated?.(prompt.prompt);
    onEnhancementSelect?.(prompt);
    debugLog('✨ Applied prompt from chat:', prompt.style);
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 ${fullHeight ? 'h-screen' : 'h-[600px]'} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Chat Header - ChatGPT Style */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PromptShare AI</h3>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${AIService.isAIAvailable() ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {AIService.isAIAvailable() ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:bg-red-100 dark:hover:bg-red-800 p-1 rounded">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Messages Area - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`w-full ${
              message.type === 'user'
                ? 'bg-white dark:bg-gray-900'
                : message.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/10'
                : 'bg-gray-50 dark:bg-gray-800'
            } ${dragOver && message.id === messages[messages.length - 1].id ? 'border-2 border-dashed border-blue-400' : ''}`}
          >
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'PromptShare AI'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.attachedFile && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Paperclip className="h-3 w-3" />
                        <span>{message.attachedFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                      {message.content}
                    </div>
                  </div>

                  {/* Loading indicator */}
                  {message.isLoading && (
                    <div className="flex items-center space-x-2 mt-4 text-gray-500 dark:text-gray-400">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}

                  {/* Enhanced Prompts - Improved UI */}
                  {message.enhancedPrompts && message.enhancedPrompts.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {/* Header with Copy All Button */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Sparkles className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Enhanced Prompts ({message.enhancedPrompts.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => copyAllPrompts(message.enhancedPrompts)}
                          disabled={copyAllStatus === 'copying'}
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            copyAllStatus === 'success'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : copyAllStatus === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {copyAllStatus === 'copying' ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              Copying...
                            </>
                          ) : copyAllStatus === 'success' ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied All!
                            </>
                          ) : copyAllStatus === 'error' ? (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Failed
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy All
                            </>
                          )}
                        </button>
                      </div>

                      {/* Enhanced Prompt Cards */}
                      <div className="grid gap-3 sm:gap-4 md:gap-6">
                        {message.enhancedPrompts.map((prompt: any) => {
                          const StyleIcon = getStyleIcon(prompt.style);
                          const isExpanded = expandedPrompts.has(prompt.id);
                          const isFavorite = favoritePrompts.has(prompt.id);
                          const isCopied = copiedPrompts.has(prompt.id);
                          const promptLength = prompt.prompt.length;
                          const shouldTruncate = promptLength > 120;

                          return (
                            <div
                              key={prompt.id}
                              className="prompt-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                              tabIndex={0}
                            >
                              {/* Header */}
                              <div className="flex flex-col space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStyleColor(prompt.style)}`}>
                                      <StyleIcon className="h-3 w-3 mr-1" />
                                      <span>{prompt.style.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {promptLength} chars
                                    </span>
                                  </div>

                                  {/* Favorite Button */}
                                  <button
                                    onClick={() => toggleFavoritePrompt(prompt.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isFavorite
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                                  </button>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex items-center space-x-2 w-full">
                                  {/* Apply Button */}
                                  <button
                                    onClick={() => applyPrompt(prompt)}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                  >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Use This Prompt
                                  </button>

                                  {/* Copy Button with Green Feedback */}
                                  <button
                                    onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                                    className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                                      isCopied
                                        ? 'text-white bg-green-500 hover:bg-green-600'
                                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                    title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Description */}
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {prompt.description}
                                </p>
                              </div>

                              {/* Prompt Content with Smart Truncation */}
                              <div className="relative">
                                <div className={`prompt-content text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 leading-relaxed border ${
                                  isFavorite ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'
                                } font-mono text-xs sm:text-sm`}>
                                  {shouldTruncate && !isExpanded ? (
                                    <div>
                                      <div className="mb-3 break-words">
                                        {prompt.prompt.substring(0, 120)}...
                                      </div>
                                      <button
                                        onClick={() => togglePromptExpansion(prompt.id)}
                                        className="inline-flex items-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium w-full sm:w-auto justify-center"
                                      >
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        Show more
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className={`break-words ${shouldTruncate ? 'mb-3' : ''}`}>
                                        {prompt.prompt}
                                      </div>
                                      {shouldTruncate && (
                                        <button
                                          onClick={() => togglePromptExpansion(prompt.id)}
                                          className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg transition-colors font-medium w-full sm:w-auto justify-center"
                                        >
                                          <ChevronUp className="h-4 w-4 mr-1" />
                                          Show less
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Image Analysis Details */}
                  {message.imageAnalysis && (
                    <div className="mt-6 space-y-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Image Analysis Details
                      </div>
                      <div className="grid gap-3">
                        {message.imageAnalysis.textElements && message.imageAnalysis.textElements !== 'None detected' && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Text Found</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">{message.imageAnalysis.textElements}</div>
                          </div>
                        )}
                        {message.imageAnalysis.colorPalette && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                            <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Color Palette</div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">{message.imageAnalysis.colorPalette}</div>
                          </div>
                        )}
                        {message.imageAnalysis.lightingAnalysis && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Lighting Analysis</div>
                            <div className="text-sm text-green-700 dark:text-green-300">{message.imageAnalysis.lightingAnalysis}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Selected File Display */}
            {selectedFile && (
              <div className="mb-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Container */}
            <div className="relative flex items-end space-x-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              {/* File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Upload image"
                disabled={isProcessing}
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    adjustTextareaHeight();
                  }}
                  placeholder={selectedFile ? `Describe what you want to do with this image...` : "Message PromptShare AI..."}
                  className="w-full bg-transparent border-0 resize-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base leading-6"
                  rows={1}
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  style={{ minHeight: '24px', maxHeight: '120px' }}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedFile) || isProcessing}
                className="flex-shrink-0 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Drag and Drop Overlay */}
            {dragOver && (
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Drop your image here</p>
                </div>
              </div>
            )}
          </form>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>💡 Try: "enhance this prompt" or drag & drop an image</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;