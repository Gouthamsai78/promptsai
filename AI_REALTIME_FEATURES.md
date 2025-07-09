# PromptShare AI & Real-time Features

## 🚀 Overview

PromptShare now includes advanced AI integration and real-time features that transform the content creation experience:

### ✨ AI Features
- **Automatic Prompt Enhancement**: Transform basic prompts into professional, detailed versions
- **Image-to-Prompt Generation**: Upload images and get AI-generated prompts automatically
- **Multi-Style Variants**: Get 4 different enhanced versions (photographic, artistic, cinematic, digital art)
- **Zero-Question Enhancement**: AI intelligently enhances without asking for clarification
- **Smart Content Generation**: Auto-generate titles, descriptions, and tags

### ⚡ Real-time Features
- **Live Notifications**: Instant notifications for likes, comments, follows, mentions
- **Real-time Comments**: Live commenting with typing indicators
- **User Presence**: See who's online with green dots
- **Live Engagement Counters**: Real-time like/comment counts across all users
- **Toast Notifications**: Beautiful popup notifications for new interactions

## 🔧 Setup Instructions

### 1. Environment Configuration

Add to your `.env.local` file:

```bash
# Existing Supabase config
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# New: OpenRouter AI Configuration
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 2. Get OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Create an account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Generate a new API key
5. Add it to your `.env.local` file

### 3. Database Setup

Run the updated SQL files in your Supabase project:

```sql
-- 1. Update schema (adds real-time tables)
-- Run: promptshareai/supabase/schema.sql

-- 2. Update functions (adds notification triggers)
-- Run: promptshareai/supabase/functions.sql

-- 3. Update policies (adds real-time RLS policies)
-- Run: promptshareai/supabase/policies.sql
```

### 4. Enable Supabase Real-time

In your Supabase dashboard:
1. Go to Database > Replication
2. Enable real-time for these tables:
   - `notifications`
   - `comments`
   - `likes`
   - `user_presence`
   - `comment_typing`

## 🎯 AI Features Usage

### Automatic Prompt Enhancement

**Basic Input**: `a cat`

**AI Enhanced Output**:
- **Photographic**: "A majestic tabby cat with piercing green eyes, sitting gracefully on a vintage wooden windowsill, soft natural lighting streaming through lace curtains, shot with 85mm lens, shallow depth of field, photorealistic, highly detailed"
- **Artistic**: "A regal cat rendered in oil painting style, rich textures and classical composition, museum-quality artwork, detailed brushwork, warm color palette"
- **Cinematic**: "A mysterious cat in dramatic lighting, film noir atmosphere, high contrast shadows, cinematic composition, movie scene quality"
- **Digital Art**: "A stylized cat in modern digital art style, 8K resolution, trending on ArtStation, vibrant colors, concept art quality"

### Image Analysis

Upload any image and get:
- **Detailed Description**: AI analyzes the image content
- **4 Enhanced Prompts**: Different styles to recreate similar content
- **Suggested Tags**: Relevant hashtags for social media
- **Auto-Generated Metadata**: Titles and descriptions

### Keyboard Shortcuts

- `Ctrl+E`: Enhance current prompt
- `Ctrl+C`: Copy enhanced prompt to clipboard
- `Ctrl+1-4`: Select specific enhancement styles
- `Ctrl+Shift+A`: Analyze uploaded image

## ⚡ Real-time Features Usage

### Live Notifications

- **Bell Icon**: Shows unread count with red badge
- **Toast Notifications**: Popup notifications for new interactions
- **Notification Types**:
  - ❤️ Likes (red)
  - 💬 Comments (blue)
  - 👥 Follows (green)
  - @ Mentions (purple)

### Real-time Comments

- **Live Updates**: Comments appear instantly across all users
- **Typing Indicators**: See "User is typing..." with animated dots
- **Optimistic Updates**: Your comments appear immediately
- **Live Counters**: Like/comment counts update in real-time

### User Presence

- **Online Status**: Green dots show who's currently online
- **Last Seen**: Track when users were last active
- **Connection Status**: Visual indicators for real-time connection

## 🧪 Testing

### Test Page Features

Visit `/test` to test all features:

1. **AI Enhancement Test**: Tests prompt enhancement with "a cat"
2. **Real-time Test**: Tests real-time connection and subscriptions
3. **Image Analysis Test**: Upload images to test AI analysis
4. **Connection Status**: Shows all service availability

### Debug Information

The test page shows:
- OpenRouter API key status
- Supabase connection status
- Real-time connection state
- AI service availability
- All test results with timestamps

## 🎨 UI Components

### AIPromptEnhancer Component

```tsx
<AIPromptEnhancer
  prompt={prompt}
  onPromptChange={setPrompt}
  onEnhancementSelect={handleEnhancement}
  disabled={isSubmitting}
/>
```

**Features**:
- Real-time enhancement (2-second debounce)
- Multiple style options
- One-click apply
- Keyboard shortcuts
- Copy to clipboard
- Loading states

### AIImageAnalyzer Component

```tsx
<AIImageAnalyzer
  files={uploadedFiles}
  onPromptsGenerated={handlePrompts}
  onTagsGenerated={handleTags}
  onTitleGenerated={handleTitle}
  onDescriptionGenerated={handleDescription}
/>
```

**Features**:
- Automatic image analysis
- Multiple prompt generation
- Tag suggestions
- Metadata generation
- Error handling

### RealtimeNotifications Component

```tsx
<RealtimeNotifications />
```

**Features**:
- Bell icon with unread count
- Dropdown notification list
- Toast notifications
- Mark as read functionality
- Connection status indicator

### RealtimeComments Component

```tsx
<RealtimeComments
  contentId={postId}
  contentType="post"
  initialComments={comments}
/>
```

**Features**:
- Live comment updates
- Typing indicators
- Optimistic updates
- Like/unlike comments
- Nested replies support

## 🔒 Security & Performance

### AI Service Security
- API keys stored in environment variables
- Client-side caching to reduce API calls
- Rate limiting and error handling
- Graceful fallback to mock data

### Real-time Security
- Row Level Security (RLS) policies
- User authentication required
- Presence tracking with privacy controls
- Automatic cleanup on disconnect

### Performance Optimizations
- Debounced AI requests (2-second delay)
- Cached enhancement results (30-minute expiry)
- Optimistic UI updates
- Efficient real-time subscriptions
- Automatic reconnection with exponential backoff

## 🚨 Troubleshooting

### AI Features Not Working
1. Check OpenRouter API key in `.env.local`
2. Verify API key is valid at [OpenRouter.ai](https://openrouter.ai)
3. Check browser console for error messages
4. Test on `/test` page

### Real-time Features Not Working
1. Check Supabase real-time is enabled
2. Verify RLS policies are applied
3. Check user authentication status
4. Test connection on `/test` page

### Common Issues
- **"AI service not available"**: Missing or invalid OpenRouter API key
- **"Real-time not connected"**: Supabase real-time not enabled or RLS issues
- **Notifications not appearing**: Check notification permissions in browser
- **Slow AI responses**: OpenRouter API may be experiencing high load

## 📊 Analytics & Monitoring

### AI Usage Tracking
- Enhancement request counts
- Processing times
- Error rates
- Cache hit rates

### Real-time Metrics
- Connection success rates
- Message delivery times
- User presence accuracy
- Notification delivery rates

## 🔮 Future Enhancements

### AI Features Roadmap
- Voice-to-prompt conversion
- Video content analysis
- Multi-language support
- Custom AI model training
- Batch prompt processing

### Real-time Features Roadmap
- Video call integration
- Screen sharing
- Collaborative editing
- Real-time drawing/annotation
- Advanced presence features

---

## 🎉 Success Criteria

✅ **AI Integration Complete**:
- Users can enter "a dog" and get professional prompts instantly
- Image uploads generate multiple enhanced prompts automatically
- All features work without asking questions
- Keyboard shortcuts function properly

✅ **Real-time Features Complete**:
- Notifications appear instantly across browser tabs
- Comments update live with typing indicators
- User presence shows accurate online status
- All features gracefully handle offline scenarios

The PromptShare platform now offers a cutting-edge AI-enhanced content creation experience with real-time social features that rival major social media platforms! 🚀
