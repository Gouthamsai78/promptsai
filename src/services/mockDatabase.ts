// Mock database service for offline mode
import { Post, Reel, Tool, Comment } from '../types';

// Mock posts data
const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    author_id: 'mock-user-123',
    content: 'Check out this amazing AI prompt for generating creative writing ideas! 🚀',
    prompt: 'You are a creative writing assistant. Generate 5 unique story prompts that combine [GENRE] with [UNEXPECTED_ELEMENT]. Each prompt should be exactly 2 sentences long and include a compelling conflict.',
    media_urls: ['https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=800'],
    media_type: 'image',
    tags: ['creative-writing', 'storytelling', 'ai-prompts'],
    status: 'published',
    likes_count: 42,
    comments_count: 8,
    saves_count: 15,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'mock-user-123',
      username: 'demo_user',
      full_name: 'Demo User',
      bio: 'AI enthusiast and prompt engineer',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      website: null,
      verified: true,
      followers_count: 42,
      following_count: 15,
      posts_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'post-2',
    author_id: 'mock-user-123',
    content: 'Perfect prompt for data analysis and visualization! 📊',
    prompt: 'Act as a data analyst. Analyze the following dataset: [DATA]. Provide: 1) Key insights (3-5 bullet points), 2) Recommended visualizations, 3) Potential business implications. Format your response with clear headers and actionable recommendations.',
    media_urls: ['https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800'],
    media_type: 'image',
    tags: ['data-analysis', 'business', 'visualization'],
    status: 'published',
    likes_count: 28,
    comments_count: 5,
    saves_count: 22,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'mock-user-123',
      username: 'demo_user',
      full_name: 'Demo User',
      bio: 'AI enthusiast and prompt engineer',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      website: null,
      verified: true,
      followers_count: 42,
      following_count: 15,
      posts_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: 'post-3',
    author_id: 'mock-user-123',
    content: 'Game-changing prompt for code reviews! 💻',
    prompt: 'You are a senior software engineer conducting a code review. Review the following code: [CODE]. Provide feedback on: 1) Code quality and best practices, 2) Potential bugs or security issues, 3) Performance optimizations, 4) Readability improvements. Be constructive and specific.',
    media_urls: ['https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'],
    media_type: 'image',
    tags: ['programming', 'code-review', 'software-development'],
    status: 'published',
    likes_count: 67,
    comments_count: 12,
    saves_count: 34,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'mock-user-123',
      username: 'demo_user',
      full_name: 'Demo User',
      bio: 'AI enthusiast and prompt engineer',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      website: null,
      verified: true,
      followers_count: 42,
      following_count: 15,
      posts_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
];

// Mock tools data
const MOCK_TOOLS: Tool[] = [
  {
    id: 'tool-1',
    name: 'ChatGPT',
    description: 'Advanced conversational AI for various tasks',
    website: 'https://chat.openai.com',
    logo_url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Conversational AI',
    pricing: 'Freemium',
    rating: 4.8,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-2',
    name: 'Claude',
    description: 'AI assistant for analysis, writing, and coding',
    website: 'https://claude.ai',
    logo_url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'AI Assistant',
    pricing: 'Freemium',
    rating: 4.7,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export class MockDatabaseService {
  // Posts
  static async getPosts(offset = 0, limit = 20): Promise<Post[]> {
    console.log('🔄 Mock: Getting posts', { offset, limit });
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const start = offset;
    const end = offset + limit;
    return MOCK_POSTS.slice(start, end);
  }

  static async getPostById(id: string): Promise<Post | null> {
    console.log('🔄 Mock: Getting post by ID', id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return MOCK_POSTS.find(post => post.id === id) || null;
  }

  static async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'saves_count'>): Promise<Post> {
    console.log('🔄 Mock: Creating post', post);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}`,
      likes_count: 0,
      comments_count: 0,
      saves_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    MOCK_POSTS.unshift(newPost);
    return newPost;
  }

  // Tools
  static async getTools(category?: string): Promise<Tool[]> {
    console.log('🔄 Mock: Getting tools', { category });
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (category) {
      return MOCK_TOOLS.filter(tool => tool.category.toLowerCase().includes(category.toLowerCase()));
    }
    
    return MOCK_TOOLS;
  }

  static async getFeaturedTools(): Promise<Tool[]> {
    console.log('🔄 Mock: Getting featured tools');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return MOCK_TOOLS.filter(tool => tool.featured);
  }

  // Interactions
  static async likePost(postId: string, userId: string): Promise<void> {
    console.log('🔄 Mock: Liking post', { postId, userId });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
      post.likes_count += 1;
    }
  }

  static async unlikePost(postId: string, userId: string): Promise<void> {
    console.log('🔄 Mock: Unliking post', { postId, userId });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post && post.likes_count > 0) {
      post.likes_count -= 1;
    }
  }

  static async savePost(postId: string, userId: string): Promise<void> {
    console.log('🔄 Mock: Saving post', { postId, userId });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
      post.saves_count += 1;
    }
  }

  static async unsavePost(postId: string, userId: string): Promise<void> {
    console.log('🔄 Mock: Unsaving post', { postId, userId });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post && post.saves_count > 0) {
      post.saves_count -= 1;
    }
  }

  // User interactions check
  static async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    // For demo purposes, randomly return true/false
    return Math.random() > 0.7;
  }

  static async hasUserSavedPost(postId: string, userId: string): Promise<boolean> {
    // For demo purposes, randomly return true/false
    return Math.random() > 0.8;
  }
}
