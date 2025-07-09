import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, FileText, Plus, AlertCircle } from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
  type: string;
}

interface SmartFileUploadProps {
  onFilesSelected: (files: FileWithPreview[], mediaType: 'image' | 'video' | 'carousel' | 'reel') => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  className?: string;
}

const SmartFileUpload: React.FC<SmartFileUploadProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxSizeInMB = 50,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaTypeLabel, setMediaTypeLabel] = useState('Image Post');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectMediaType = async (files: FileWithPreview[]): Promise<'image' | 'video' | 'carousel' | 'reel'> => {
    if (files.length === 0) return 'image';

    const hasVideo = files.some(file => file.type.startsWith('video/'));
    const hasImage = files.some(file => file.type.startsWith('image/'));

    if (hasVideo && files.length === 1) {
      // Check if video is vertical (for reels)
      const videoFile = files.find(file => file.type.startsWith('video/'));
      if (videoFile) {
        try {
          const isVertical = await checkIfVideoIsVertical(videoFile);
          console.log('🎬 Video orientation detected:', {
            fileName: videoFile.name,
            isVertical,
            mediaType: isVertical ? 'reel' : 'video'
          });
          return isVertical ? 'reel' : 'video'; // Vertical videos become reels
        } catch (error) {
          console.error('Error checking video orientation:', error);
        }
      }
      return 'video';
    }
    if (hasImage && files.length > 1) return 'carousel';
    return 'image';
  };

  const checkIfVideoIsVertical = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const isVertical = height > width;

        console.log('🎬 Video dimensions detected:', {
          fileName: file.name,
          width,
          height,
          aspectRatio: width / height,
          isVertical,
          classification: isVertical ? 'REEL' : 'VIDEO'
        });

        URL.revokeObjectURL(video.src);
        resolve(isVertical);
      };

      video.onerror = (error) => {
        console.error('❌ Error loading video metadata:', error);
        URL.revokeObjectURL(video.src);
        resolve(false); // Default to horizontal if we can't determine
      };

      video.src = URL.createObjectURL(file);
      video.load(); // Explicitly load the video
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxSizeInMB}MB.`;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov', 'video/avi'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" is not a supported format. Please use images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, MOV, AVI).`;
    }

    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.currentTime = 1; // Get frame at 1 second
        };
        
        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0);
          resolve(canvas.toDataURL());
        };
        
        video.src = URL.createObjectURL(file);
      } else {
        resolve(''); // No preview for other file types
      }
    });
  };

  const processFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    setError('');

    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    // Check total file count
    if (files.length + fileList.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once.`);
      setIsProcessing(false);
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      try {
        const preview = await createPreview(file);
        const fileWithPreview: FileWithPreview = Object.assign(file, { preview });
        newFiles.push(fileWithPreview);
      } catch (error) {
        errors.push(`Failed to process file "${file.name}".`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);

      // Auto-detect media type and notify parent
      const mediaType = await detectMediaType(updatedFiles);
      onFilesSelected(updatedFiles, mediaType);

      // Update label
      await updateMediaTypeLabel(updatedFiles);
    }

    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const removeFile = async (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    if (updatedFiles.length > 0) {
      const mediaType = await detectMediaType(updatedFiles);
      onFilesSelected(updatedFiles, mediaType);
      await updateMediaTypeLabel(updatedFiles);
    } else {
      onFilesSelected([], 'image');
      setMediaTypeLabel('Image Post');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const updateMediaTypeLabel = async (fileList: FileWithPreview[]) => {
    const hasVideo = fileList.some(file => file.type.startsWith('video/'));
    const hasImage = fileList.some(file => file.type.startsWith('image/'));

    if (hasVideo && fileList.length === 1) {
      const videoFile = fileList.find(file => file.type.startsWith('video/'));
      if (videoFile) {
        try {
          const isVertical = await checkIfVideoIsVertical(videoFile);
          setMediaTypeLabel(isVertical ? 'Reel (Vertical Video)' : 'Video Post');
          return;
        } catch (error) {
          setMediaTypeLabel('Video Post');
          return;
        }
      }
      setMediaTypeLabel('Video Post');
      return;
    }
    if (hasImage && fileList.length > 1) {
      setMediaTypeLabel('Carousel Post');
      return;
    }
    setMediaTypeLabel('Image Post');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* User Guidance Section */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📋 Upload Guidelines
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p>• <strong>Images:</strong> JPG, PNG, WebP, GIF (up to {maxSizeInMB}MB each)</p>
          <p>• <strong>Videos:</strong> MP4, WebM, MOV (up to {maxSizeInMB}MB each)</p>
          <p>• <strong>Vertical videos</strong> will automatically become Reels</p>
          <p>• <strong>Multiple images</strong> will create a carousel post</p>
          <p>• <strong>Original quality</strong> is preserved - no compression</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isProcessing ? 'Processing files...' : 'Upload your content'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Drag and drop images or videos, or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports: JPEG, PNG, GIF, WebP, MP4, WebM, MOV, AVI (max {maxSizeInMB}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {mediaTypeLabel} ({files.length} file{files.length > 1 ? 's' : ''})
            </h4>
            <button
              onClick={() => {
                setFiles([]);
                onFilesSelected([], 'image');
              }}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await removeFile(index);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                  {file.name}
                </p>
              </div>
            ))}
            
            {files.length < maxFiles && (
              <button
                onClick={openFileDialog}
                className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <Plus className="w-8 h-8 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFileUpload;
