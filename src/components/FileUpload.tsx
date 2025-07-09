import React, { useState, useRef } from 'react';
import { Upload, X, Image, Video, FileText } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizeInMB?: number;
  bucket?: 'media' | 'avatars';
  folder?: string;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  maxFiles = 5,
  maxSizeInMB = 50,
  bucket = 'media',
  folder,
  className = '',
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!StorageService.validateFileType(file, acceptedTypes)) {
        onError(`File type ${file.type} not allowed`);
        continue;
      }
      
      if (!StorageService.validateFileSize(file, maxSizeInMB)) {
        onError(`File ${file.name} exceeds ${maxSizeInMB}MB limit`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Start upload process
    uploadFiles(validFiles);
  };

  const uploadFiles = async (files: File[]) => {
    if (!user) return;

    // Initialize uploading state
    const initialUploadingFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
    }));
    
    setUploadingFiles(initialUploadingFiles);

    try {
      const uploadResults = await StorageService.uploadMultipleFiles(
        files,
        bucket,
        user.id,
        folder
      );

      const successfulUploads: string[] = [];
      const updatedFiles = initialUploadingFiles.map((uploadingFile, index) => {
        const result = uploadResults[index];
        if (result.error) {
          return { ...uploadingFile, error: result.error, progress: 0 };
        } else {
          successfulUploads.push(result.url);
          return { ...uploadingFile, url: result.url, progress: 100 };
        }
      });

      setUploadingFiles(updatedFiles);

      if (successfulUploads.length > 0) {
        onFilesUploaded(successfulUploads);
      }

      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);

    } catch (error: any) {
      onError(error.message || 'Upload failed');
      setUploadingFiles([]);
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType.startsWith('video/')) return <Video size={24} />;
    return <FileText size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Max {maxFiles} files, {maxSizeInMB}MB each
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
          Supported: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="text-gray-500 dark:text-gray-400">
                {getFileIcon(uploadingFile.file.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                
                {uploadingFile.error ? (
                  <p className="text-xs text-red-500 mt-1">{uploadingFile.error}</p>
                ) : (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeUploadingFile(index);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
