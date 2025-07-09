# PromptShare - AI Social Media Platform

**The Instagram for AI Creators** - A modern social media platform designed specifically for sharing AI-generated content, prompts, and tools.

## 🚀 New Features

### ✨ AI Integration (NEW!)
- **Automatic Prompt Enhancement**: Transform "a cat" into professional, detailed prompts instantly
- **Image-to-Prompt Generation**: Upload images and get AI-generated prompts automatically  
- **Multi-Style Variants**: Get 4 enhanced versions (photographic, artistic, cinematic, digital art)
- **Zero-Question Enhancement**: AI intelligently enhances without asking for clarification
- **Smart Content Generation**: Auto-generate titles, descriptions, and tags

### ⚡ Real-time Features (NEW!)
- **Live Notifications**: Instant notifications for likes, comments, follows, mentions
- **Real-time Comments**: Live commenting with typing indicators
- **User Presence**: See who's online with green dots
- **Live Engagement Counters**: Real-time like/comment counts across all users
- **Toast Notifications**: Beautiful popup notifications for new interactions

## 🎯 Core Features

### Content Sharing
- **Smart File Upload**: Automatically detects content type and routes appropriately
- **Multi-media Support**: Images, videos, carousels
- **Vertical Video Detection**: Automatically creates reels for portrait videos
- **Prompt Sharing**: Users can share AI prompts with generated content
- **Tool Directory**: Community-driven AI tool discovery

### Social Features
- **User Profiles**: Customizable profiles with bio, avatar, verification status
- **Following System**: Follow other creators
- **Engagement**: Like, comment, and save content
- **Search & Discovery**: Find users, content, and tools
- **Category Filtering**: Organized by AI tool categories

### Technical Features
- **Offline Mode**: Graceful fallback when services are unavailable
- **Error Boundaries**: Comprehensive error handling
- **Protected Routes**: Authentication-based route protection
- **Responsive Design**: Mobile-first responsive layout
- **Dark Mode**: System-wide dark/light theme support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with dark mode
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **AI Integration**: OpenRouter + Google Gemini 2.5 Pro
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd promptshareai
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Integration (NEW!)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Database Setup
1. Create a Supabase project
2. Run SQL files in order:
   - `supabase/schema.sql`
   - `supabase/functions.sql` 
   - `supabase/policies.sql`
3. Create storage buckets: `media` and `avatars`
4. Enable real-time for: `notifications`, `comments`, `likes`, `user_presence`, `comment_typing`

### 4. Get API Keys
- **Supabase**: [supabase.com](https://supabase.com) → Project Settings → API
- **OpenRouter**: [openrouter.ai](https://openrouter.ai) → API Keys

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` and go to `/test` to verify all features work.

## 📖 Documentation

- **[AI & Real-time Features Guide](./AI_REALTIME_FEATURES.md)** - Comprehensive guide for new features
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[Critical Issues Fixed](./CRITICAL_ISSUES_FIXED.md)** - Recent bug fixes and improvements

## 🎮 Usage Examples

### AI Prompt Enhancement
```
Input: "a cat"
Output: "A majestic tabby cat with piercing green eyes, sitting gracefully on a vintage wooden windowsill, soft natural lighting streaming through lace curtains, shot with 85mm lens, shallow depth of field, photorealistic, highly detailed"
```

### Keyboard Shortcuts
- `Ctrl+E`: Enhance current prompt
- `Ctrl+C`: Copy enhanced prompt
- `Ctrl+1-4`: Select enhancement styles

### Real-time Features
- Bell icon shows live notification count
- Comments appear instantly across all users
- Typing indicators show when someone is composing
- Toast notifications for new interactions

## 🧪 Testing

Visit `/test` to test all features:
- ✅ Database connectivity
- ✅ File upload functionality  
- ✅ AI prompt enhancement
- ✅ Real-time connections
- ✅ Image analysis
- ✅ All service integrations

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AIPromptEnhancer.tsx    # AI prompt enhancement
│   ├── AIImageAnalyzer.tsx     # Image-to-prompt generation
│   ├── RealtimeNotifications.tsx # Live notifications
│   └── RealtimeComments.tsx    # Live commenting
├── services/           # Business logic layer
│   ├── ai.ts          # OpenRouter AI integration
│   ├── realtime.ts    # Supabase real-time features
│   ├── database.ts    # Database operations
│   └── storage.ts     # File storage
├── types/             # TypeScript definitions
│   ├── ai.ts         # AI and real-time types
│   └── index.ts      # Core types
├── pages/             # Route components
├── contexts/          # React contexts
└── utils/             # Utility functions
```

## 🔒 Security

- **Row Level Security (RLS)**: All database tables protected
- **Authentication**: Supabase Auth with Google OAuth
- **File Upload Security**: User-scoped storage policies
- **API Key Security**: Environment variables only
- **Real-time Security**: Authenticated subscriptions only

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using `/test` page
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create GitHub issues for bugs
- **Features**: Submit feature requests
- **Documentation**: Check `AI_REALTIME_FEATURES.md` for detailed guides
- **Testing**: Use `/test` page to diagnose issues

---

**PromptShare** - Empowering AI creators with cutting-edge social features and intelligent content enhancement! 🚀✨
"# promptsai" 
