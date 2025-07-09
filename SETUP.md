# PromptShare Setup Guide

## Issues Fixed

### 1. Media Display Problem ✅
**Problem**: Uploaded files were showing random/incorrect images instead of actual uploaded content.

**Root Cause**: The `handleSmartFileUpload` function in `Create.tsx` was using hardcoded placeholder URLs instead of actually uploading files to Supabase Storage.

**Solution**: 
- Updated the upload handler to use `StorageService.uploadFile()` 
- Added proper error handling and fallback to placeholders if Supabase storage is unavailable
- Added debug information to show upload status

### 2. Tools Data Fetching Issue ✅
**Problem**: The Explore page was showing mock data instead of fetching real tools from the Supabase database.

**Root Cause**: `Explore.tsx` was directly using `mockTools` instead of calling `DatabaseService.getTools()`.

**Solution**:
- Updated Explore page to use `DatabaseService.getTools()`
- Added loading states and error handling
- Fixed ToolCard component to use correct database field names (`website_url` vs `websiteUrl`)

## Setup Instructions

### 1. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to [Supabase](https://supabase.com) and create a project
   - Navigate to Project Settings > API
   - Copy the Project URL and anon/public key
   - Update `.env.local` with your values

### 2. Database Setup

1. In your Supabase project, go to the SQL Editor
2. Run the following files in order:
   ```sql
   -- 1. First run schema.sql to create tables
   -- 2. Then run functions.sql to create triggers
   -- 3. Finally run policies.sql to set up RLS
   ```

### 3. Storage Setup

1. In Supabase, go to Storage
2. Create two buckets:
   - `media` (for posts, reels, etc.)
   - `avatars` (for user profile pictures)
3. Set appropriate permissions for public access

### 4. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `/test` to run diagnostics:
   - Check Supabase connection
   - Test database queries
   - Verify media display

### 5. Authentication Setup

1. In Supabase, go to Authentication > Providers
2. Enable Google OAuth (optional)
3. Configure redirect URLs for your domain

## Troubleshooting

### File Upload Issues
- Check if Supabase storage buckets exist
- Verify environment variables are set
- Check browser console for upload errors
- The app will fall back to placeholder images if storage fails

### Tools Not Loading
- Verify database connection in `/test` page
- Check if tools table has data
- Ensure RLS policies allow reading tools

### Offline Mode
- The app automatically switches to offline mode if Supabase is unavailable
- Look for the "Demo Mode Active" banner at the top
- Mock data will be used instead of real database queries

## Development Notes

- Use `/test` page for debugging
- Check browser console for detailed error messages
- The app gracefully handles Supabase unavailability
- All components have proper TypeScript types
