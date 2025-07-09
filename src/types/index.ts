import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'] & {
  author: Profile;
  isLiked?: boolean;
  isSaved?: boolean;
};
export type Reel = Database['public']['Tables']['reels']['Row'] & {
  author: Profile;
  isLiked?: boolean;
  isSaved?: boolean;
};
export type Tool = Database['public']['Tables']['tools']['Row'] & {
  author: Profile;
};
export type Comment = Database['public']['Tables']['comments']['Row'] & {
  author: Profile;
  replies?: Comment[];
  isLiked?: boolean;
};

// Legacy User interface for backward compatibility
export interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  verified?: boolean;
}

// Legacy interfaces for backward compatibility - these will be gradually replaced
export interface LegacyPost {
  id: string;
  title: string;
  description?: string;
  prompt?: string;
  tags: string[];
  media?: {
    type: 'image' | 'video' | 'carousel';
    urls: string[];
  };
  allowCopyPrompt: boolean;
  author: User;
  likes: number;
  comments: number;
  saves: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface LegacyReel {
  id: string;
  videoUrl: string;
  prompt: string;
  title: string;
  tags: string[];
  author: User;
  likes: number;
  comments: number;
  saves: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  allowCopyPrompt: boolean;
}

export interface LegacyTool {
  id: string;
  name: string;
  logo?: string;
  websiteUrl: string;
  description: string;
  category: string;
  tags: string[];
  author: User;
  createdAt: string;
}

export interface LegacyComment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: number;
}