export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          website: string | null
          verified: boolean
          followers_count: number
          following_count: number
          posts_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          verified?: boolean
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          verified?: boolean
          followers_count?: number
          following_count?: number
          posts_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          prompt: string | null
          tags: string[]
          media_urls: string[]
          media_type: 'image' | 'video' | 'carousel' | null
          allow_copy_prompt: boolean
          status: 'draft' | 'published' | 'archived'
          likes_count: number
          comments_count: number
          saves_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          prompt?: string | null
          tags?: string[]
          media_urls?: string[]
          media_type?: 'image' | 'video' | 'carousel' | null
          allow_copy_prompt?: boolean
          status?: 'draft' | 'published' | 'archived'
          likes_count?: number
          comments_count?: number
          saves_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          prompt?: string | null
          tags?: string[]
          media_urls?: string[]
          media_type?: 'image' | 'video' | 'carousel' | null
          allow_copy_prompt?: boolean
          status?: 'draft' | 'published' | 'archived'
          likes_count?: number
          comments_count?: number
          saves_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      reels: {
        Row: {
          id: string
          user_id: string
          title: string
          video_url: string
          thumbnail_url: string | null
          prompt: string | null
          tags: string[]
          allow_copy_prompt: boolean
          likes_count: number
          comments_count: number
          saves_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          video_url: string
          thumbnail_url?: string | null
          prompt?: string | null
          tags?: string[]
          allow_copy_prompt?: boolean
          likes_count?: number
          comments_count?: number
          saves_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          video_url?: string
          thumbnail_url?: string | null
          prompt?: string | null
          tags?: string[]
          allow_copy_prompt?: boolean
          likes_count?: number
          comments_count?: number
          saves_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tools: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          website_url: string
          logo_url: string | null
          category: string
          tags: string[]
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          website_url: string
          logo_url?: string | null
          category: string
          tags?: string[]
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          website_url?: string
          logo_url?: string | null
          category?: string
          tags?: string[]
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          reel_id: string | null
          parent_id: string | null
          content: string
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          reel_id?: string | null
          parent_id?: string | null
          content: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          reel_id?: string | null
          parent_id?: string | null
          content?: string
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          reel_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          reel_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          reel_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      saves: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          reel_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          reel_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          reel_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'mention'
          post_id: string | null
          reel_id: string | null
          comment_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'mention'
          post_id?: string | null
          reel_id?: string | null
          comment_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: 'like' | 'comment' | 'follow' | 'mention'
          post_id?: string | null
          reel_id?: string | null
          comment_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      media_type: 'image' | 'video' | 'carousel'
      post_status: 'draft' | 'published' | 'archived'
      notification_type: 'like' | 'comment' | 'follow' | 'mention'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
