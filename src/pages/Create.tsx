import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Video, X, Plus, Check, FileText, Wrench, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { StorageService } from '../services/storage';
import SmartFileUpload from '../components/SmartFileUpload';
import ToolSubmissionForm from '../components/ToolSubmissionForm';
import PageLayout from '../components/PageLayout';

const Create: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'post' | 'tool'>('post');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    tags: [] as string[],
    allowCopyPrompt: true,
    mediaType: 'image' as 'image' | 'video' | 'carousel' | 'reel',
    status: 'published' as 'draft' | 'published'
  });

  const [currentTag, setCurrentTag] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Simple prompt change handler
  const handlePromptChange = (newPrompt: string) => {
    setFormData(prev => ({ ...prev, prompt: newPrompt }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSmartFileUpload = async (files: File[], mediaType: 'image' | 'video' | 'carousel' | 'reel') => {
    setUploadedFiles(files);
    setFormData(prev => ({ ...prev, mediaType }));
    setError('');
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      console.log('🔄 Starting file upload process...', {
        fileCount: files.length,
        mediaType,
        isReel: mediaType === 'reel',
        fileSizes: files.map(f => `${f.name}: ${(f.size / 1024 / 1024).toFixed(2)}MB`),
        fileTypes: files.map(f => f.type)
      });

      // Upload files to Supabase Storage
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            const result = await StorageService.uploadFile(file, 'media', user.id, 'posts');

            if (result.error) {
              console.error('Upload error for file:', file.name, result.error);
              throw new Error(`Failed to upload ${file.name}: ${result.error}`);
            }

            console.log('✅ File uploaded successfully:', file.name, result.url);
            return result.url;
          } catch (error: any) {
            console.error('Error uploading file:', file.name, error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
          }
        })
      );

      // Filter out any failed uploads
      const successfulUrls = uploadResults.filter(url => url && url.length > 0);

      if (successfulUrls.length === 0) {
        throw new Error('No files were uploaded successfully');
      }

      if (successfulUrls.length < files.length) {
        console.warn(`⚠️ Only ${successfulUrls.length} of ${files.length} files uploaded successfully`);
      }

      setMediaUrls(successfulUrls);
      console.log('✅ All files uploaded successfully:', successfulUrls);

    } catch (error: any) {
      console.error('❌ File upload failed:', error);

      // Provide user-friendly error messages
      let userMessage = 'File upload failed. ';

      if (error.message && error.message.includes('row-level security policy')) {
        userMessage += 'Please make sure you are logged in and try again. If the problem persists, contact support.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        userMessage += 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.message && error.message.includes('storage')) {
        userMessage += 'Storage service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.message && error.message.includes('size')) {
        userMessage += 'File size too large. Please use files smaller than 50MB.';
      } else if (error.message && error.message.includes('type')) {
        userMessage += 'File type not supported. Please use JPEG, PNG, GIF, WebP, MP4, WebM, or MOV files.';
      } else {
        userMessage += error.message || 'An unexpected error occurred.';
      }

      setError(userMessage);

      // Clear uploaded files on error
      setUploadedFiles([]);
      setMediaUrls([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (formData.title.length > 100) {
      setError('Title must be less than 100 characters');
      return false;
    }
    if (formData.description && formData.description.length > 500) {
      setError('Description must be less than 500 characters');
      return false;
    }
    if (formData.prompt && formData.prompt.length > 2000) {
      setError('Prompt must be less than 2000 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Check if this should be a reel (vertical video)
      if (formData.mediaType === 'reel' && mediaUrls.length > 0) {
        console.log('🎬 Creating reel instead of post');

        const reelData = {
          user_id: user.id,
          title: formData.title.trim(),
          video_url: mediaUrls[0], // Reels only have one video
          prompt: formData.prompt.trim() || null,
          tags: formData.tags,
          allow_copy_prompt: formData.allowCopyPrompt,
        };

        await DatabaseService.createReel(reelData);
        console.log('✅ Reel created successfully');
      } else {
        // Create regular post
        const postData = {
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          prompt: formData.prompt.trim() || null,
          tags: formData.tags,
          media_urls: mediaUrls,
          media_type: mediaUrls.length > 0 ? (formData.mediaType === 'reel' ? 'video' : formData.mediaType) : null,
          allow_copy_prompt: formData.allowCopyPrompt,
          status: formData.status
        };

        await DatabaseService.createPost(postData);
        console.log('✅ Post created successfully');
      }

      setSuccess(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        prompt: '',
        tags: [],
        allowCopyPrompt: true,
        mediaType: 'image',
        status: 'published'
      });
      setMediaUrls([]);
      setUploadedFiles([]);
      setCurrentTag('');

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating content:', error);

      // Provide specific error messages for common issues
      let userMessage = 'Failed to create content. ';

      if (error.message && error.message.includes('Permission denied')) {
        userMessage += 'Please make sure you are logged in and try again. If the problem persists, try logging out and logging back in.';
      } else if (error.message && error.message.includes('row-level security policy')) {
        userMessage += 'There was a permission issue. Please log out and log back in, then try again.';
      } else if (error.message && error.message.includes('Authentication error')) {
        userMessage += 'Authentication failed. Please log out and log back in.';
      } else if (error.message && error.message.includes('User ID mismatch')) {
        userMessage += 'Session error detected. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('not-null constraint')) {
        userMessage += 'Some required information is missing. Please check all fields and try again.';
      } else if (error.message && error.message.includes('foreign key constraint')) {
        userMessage += 'User profile issue detected. Please log out and log back in.';
      } else {
        userMessage += error.message || 'An unexpected error occurred. Please try again.';
      }

      setError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {formData.mediaType === 'reel' ? 'Reel Created Successfully!' : 'Post Created Successfully!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {formData.mediaType === 'reel'
              ? 'Your reel has been published and will appear in the Reels section.'
              : 'Your post has been published and will appear in the feed.'
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to home...
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create & Share
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Share your amazing AI prompts or submit useful AI tools
          </p>

          {/* Step-by-step guidance */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🚀 Quick Start Guide with AI Enhancement
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-blue-800 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Upload & Analyze</p>
                  <p className="text-blue-700 dark:text-blue-300">Upload images/videos - AI will generate prompts automatically</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Enhance Prompts</p>
                  <p className="text-blue-700 dark:text-blue-300">Type basic ideas - AI enhances them into professional prompts</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">One-Click Apply</p>
                  <p className="text-blue-700 dark:text-blue-300">Choose AI-enhanced style and publish instantly</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Pro tip:</strong> Use keyboard shortcuts - Ctrl+E to enhance, Ctrl+1-4 to select styles, Ctrl+C to copy
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'post', label: 'Create Post', icon: FileText },
            { key: 'tool', label: 'Submit Tool', icon: Wrench }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'post' ? (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

        {/* Smart File Upload - Prominent at the top */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📁 Upload Your Content
          </h3>
          <SmartFileUpload
            onFilesSelected={handleSmartFileUpload}
            maxFiles={10}
            maxSizeInMB={50}
          />

          {/* AI Features Notice */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Need AI assistance?</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Visit our dedicated <a href="/chat" className="underline hover:no-underline">AI Chat</a> to analyze images and enhance prompts with advanced AI features.
              </p>
            </div>
          )}

          {/* Debug Info */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Upload Status:</strong>
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Files selected: {uploadedFiles.length}</p>
                <p>• Media URLs generated: {mediaUrls.length}</p>
                <p>• Content type: <strong>{formData.mediaType}</strong></p>
                {formData.mediaType === 'reel' && (
                  <p className="text-purple-700 dark:text-purple-300">
                    🎬 <strong>REEL DETECTED:</strong> This will be saved to the reels table and appear in /reels
                  </p>
                )}
                {formData.mediaType === 'video' && (
                  <p className="text-green-700 dark:text-green-300">
                    📹 <strong>VIDEO POST:</strong> This will be saved as a regular video post
                  </p>
                )}
              </div>
              {mediaUrls.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Generated URLs:</p>
                  {mediaUrls.map((url, index) => (
                    <p key={index} className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {index + 1}: {url}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Post Information
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                    (Make it descriptive and engaging)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 'Perfect Portrait Photography Prompt' or 'Creative Writing Assistant'"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.title.length}/100 characters • This will be the main headline for your post
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                    (Optional - explain what your prompt achieves)
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 'Get stunning professional portraits with this detailed prompt that includes lighting, composition, and style instructions...'"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length}/500 characters • Help others understand what your prompt does
                </p>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Prompt
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                    (The actual prompt text that others can copy and use)
                  </span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 'a cat' → AI will enhance to 'A majestic tabby cat with piercing green eyes, sitting gracefully on a vintage wooden windowsill...'"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.prompt.length}/2000 characters • For AI enhancement, visit our <a href="/chat" className="text-blue-500 hover:underline">AI Chat</a>
                </p>
              </div>
            </div>
          </div>

          {/* Media Summary */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📎 Uploaded Content
              </h3>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex-shrink-0">
                  {formData.mediaType === 'video' && <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {formData.mediaType === 'reel' && <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  {formData.mediaType === 'image' && <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {formData.mediaType === 'carousel' && <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {formData.mediaType === 'video' && 'Video Post'}
                    {formData.mediaType === 'reel' && '🎬 Reel (Vertical Video)'}
                    {formData.mediaType === 'image' && 'Image Post'}
                    {formData.mediaType === 'carousel' && 'Carousel Post'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                    {formData.mediaType === 'reel' && ' • Will appear in Reels section'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags and Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tags & Settings
            </h3>

            <div className="space-y-4">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Tag List */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowCopyPrompt}
                    onChange={(e) => handleInputChange('allowCopyPrompt', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Allow others to copy this prompt
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                handleInputChange('status', 'draft');
                handleSubmit(new Event('submit') as any);
              }}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && formData.status === 'draft' ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && formData.status === 'published' ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>

        {/* AI Chat Promotion */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl shadow-lg p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Need AI Assistance?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get professional prompt enhancement, image analysis, and personalized AI assistance in our dedicated chat interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/chat"
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Open AI Chat</span>
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              ✨ Advanced prompt engineering • 🎨 Image analysis • 💬 Conversation memory
            </div>
          </div>
        </div>
          </>
        ) : (
          /* Tool Submission Tab */
          <ToolSubmissionForm
            isOpen={true}
            onClose={() => setActiveTab('post')}
            onSuccess={() => {
              setActiveTab('post');
              navigate('/explore');
            }}
            inline={true}
          />
        )}


      </div>
    </PageLayout>
  );
};

export default Create;