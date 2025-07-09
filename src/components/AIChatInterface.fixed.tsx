import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Sparkles, Image as ImageIcon, User, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { AIService } from '../services/ai';
import { EnhancedPrompt, ImageAnalysisResult } from '../types/ai';
import { debugLog } from '../utils/debug';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: Date;
  enhancedPrompts?: EnhancedPrompt[];
  imageAnalysis?: ImageAnalysisResult;
  error?: string;
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
      content: "Welcome to PromptShare AI! 🚀\n\nI can help you analyze images and generate enhanced prompts. Just upload an image to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug messages with enhanced prompts
  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.enhancedPrompts) {
        console.log(`🔍 AIChatInterface Message ${index} Enhanced Prompts Debug:`, {
          messageId: message.id,
          messageType: message.type,
          hasEnhancedPrompts: !!message.enhancedPrompts,
          enhancedPromptsLength: message.enhancedPrompts?.length || 0,
          enhancedPromptsContent: message.enhancedPrompts?.map((p: any) => ({
            id: p?.id,
            style: p?.style,
            hasPrompt: !!p?.prompt
          })) || 'No prompts'
        });
      }
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() && !selectedFile) return;
    if (isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: selectedFile ? `Uploaded image: ${selectedFile.name}` : inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      let aiResponse: ChatMessage;

      if (selectedFile) {
        // Handle image analysis
        debugLog('🖼️ Processing image in chat:', selectedFile.name);

        if (!AIService.isAIAvailable()) {
          aiResponse = {
            id: `ai_${Date.now()}_error`,
            type: 'error',
            content: `AI service is not available. Please check that your OpenRouter API key is properly configured.`,
            timestamp: new Date(),
            error: 'AI service unavailable'
          };
        } else {
          try {
            debugLog('✅ AI service available, analyzing image with real OpenRouter API...');
            const analysis = await AIService.analyzeImage(selectedFile);

            console.log('🔍 AIChatInterface - Enhanced prompts before message creation:', {
              hasEnhancedPrompts: !!analysis.enhancedPrompts,
              enhancedPromptsLength: analysis.enhancedPrompts?.length || 0,
              enhancedPromptsContent: analysis.enhancedPrompts?.map((p: any) => ({
                id: p?.id,
                style: p?.style,
                hasPrompt: !!p?.prompt
              })) || 'No prompts'
            });

            aiResponse = {
              id: `ai_${Date.now()}_response`,
              type: 'ai',
              content: `I've analyzed your image using real AI! Here's what I found:\n\n**Description:** ${analysis.description}\n\n**Detected Style:** ${analysis.detectedStyle}\n\nI've generated ${analysis.enhancedPrompts.length} professional AI-enhanced prompts for you:`,
              timestamp: new Date(),
              imageAnalysis: analysis,
              enhancedPrompts: analysis.enhancedPrompts
            };

            console.log('🔍 AIChatInterface - Created message object:', {
              messageId: aiResponse.id,
              hasEnhancedPrompts: !!aiResponse.enhancedPrompts,
              enhancedPromptsCount: aiResponse.enhancedPrompts?.length || 0
            });

          } catch (imageError: any) {
            debugLog('❌ Real AI image analysis failed:', imageError.message);
            
            aiResponse = {
              id: `ai_${Date.now()}_error`,
              type: 'error',
              content: `I couldn't analyze your image: ${imageError.message}. Please try again.`,
              timestamp: new Date(),
              error: imageError.message
            };
          }
        }
      } else {
        // Handle text input
        aiResponse = {
          id: `ai_${Date.now()}_response`,
          type: 'ai',
          content: `I received your message: "${inputText}". To analyze images and generate enhanced prompts, please upload an image using the image button.`,
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      debugLog('❌ Chat error:', error.message);
      
      const errorResponse: ChatMessage = {
        id: `ai_${Date.now()}_error`,
        type: 'error',
        content: `An error occurred: ${error.message}`,
        timestamp: new Date(),
        error: error.message
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      debugLog('📁 File selected:', file.name);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const applyPrompt = (prompt: EnhancedPrompt) => {
    if (onEnhancementSelect) {
      onEnhancementSelect(prompt);
    }
    if (onPromptGenerated) {
      onPromptGenerated(prompt.prompt);
    }
    toast.success(`Applied ${prompt.style} prompt!`);
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 ${fullHeight ? 'h-screen' : 'h-[600px]'} ${className}`}>
      {/* Chat Header */}
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {message.content.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>

                  {/* Enhanced Prompts Display */}
                  {message.enhancedPrompts && message.enhancedPrompts.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Generated Prompts ({message.enhancedPrompts.length})
                      </div>
                      {message.enhancedPrompts.map((prompt: any) => (
                        <div key={prompt.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {prompt.style}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => applyPrompt(prompt)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Apply
                              </button>
                              <button
                                onClick={() => copyToClipboard(prompt.prompt)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{prompt.description}</div>
                          <div className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2 font-mono">
                            {prompt.prompt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedFile ? `Selected: ${selectedFile.name}` : "Type a message or upload an image..."}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || (!inputText.trim() && !selectedFile)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatInterface;
