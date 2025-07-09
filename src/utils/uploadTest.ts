// Test utility to verify file upload functionality
import { StorageService } from '../services/storage';

export const testFileUpload = async (userId: string): Promise<{ success: boolean; message: string; url?: string }> => {
  try {
    // Create a small test file
    const testContent = 'This is a test file for upload verification';
    const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
    
    console.log('🧪 Testing file upload with user ID:', userId);
    
    // Attempt to upload the test file
    const result = await StorageService.uploadFile(testFile, 'media', userId, 'test');
    
    if (result.error) {
      return {
        success: false,
        message: `Upload failed: ${result.error}`
      };
    }
    
    if (!result.url) {
      return {
        success: false,
        message: 'Upload completed but no URL returned'
      };
    }
    
    console.log('✅ Test upload successful:', result.url);
    
    return {
      success: true,
      message: 'Upload test successful',
      url: result.url
    };
    
  } catch (error: any) {
    console.error('❌ Upload test failed:', error);
    return {
      success: false,
      message: `Upload test failed: ${error.message}`
    };
  }
};

export const createTestVideoFile = (): File => {
  // Create a minimal test video file (just metadata, not actual video content)
  const canvas = document.createElement('canvas');
  canvas.width = 480;  // Vertical video dimensions
  canvas.height = 854;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Test Vertical Video', canvas.width / 2, canvas.height / 2);
  }
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'test-vertical-video.mp4', { type: 'video/mp4' });
        resolve(file);
      }
    }, 'image/png'); // Note: This creates a PNG, not actual video, but for testing purposes
  }) as any; // Type assertion for demo purposes
};
