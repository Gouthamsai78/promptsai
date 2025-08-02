// Community Feature Types
// Following the established patterns from existing types

export type CommunityPrivacy = 'public' | 'private';
export type CommunityMemberRole = 'owner' | 'admin' | 'moderator' | 'member';
export type CommunityMemberStatus = 'active' | 'pending' | 'banned' | 'left';
export type CommunityContentType = 'post' | 'reel';
export type CommunityInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Core Community interface
export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  privacy: CommunityPrivacy;
  require_approval: boolean;
  allow_member_posts: boolean;
  allow_member_reels: boolean;
  member_count: number;
  post_count: number;
  reel_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Community with creator profile information
export interface CommunityWithCreator extends Community {
  creator: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
}

// Community member interface
export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joined_at: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

// Community member with profile information
export interface CommunityMemberWithProfile extends CommunityMember {
  profile: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
  inviter?: {
    username: string;
    full_name?: string;
  };
}

// Community content association
export interface CommunityContent {
  id: string;
  community_id: string;
  content_type: CommunityContentType;
  post_id?: string;
  reel_id?: string;
  shared_by: string;
  is_pinned: boolean;
  created_at: string;
}

// Community content with full content and profile information
export interface CommunityContentWithDetails extends CommunityContent {
  post?: any; // Will be typed as Post from existing types
  reel?: any; // Will be typed as Reel from existing types
  sharer: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
}

// Community invitation interface
export interface CommunityInvitation {
  id: string;
  community_id: string;
  invited_user_id: string;
  invited_by: string;
  status: CommunityInvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Community invitation with profile and community information
export interface CommunityInvitationWithDetails extends CommunityInvitation {
  community: {
    name: string;
    slug: string;
    description?: string;
    cover_image_url?: string;
    privacy: CommunityPrivacy;
  };
  inviter: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Community activity log
export interface CommunityActivity {
  id: string;
  community_id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: string;
}

// Community activity with profile information
export interface CommunityActivityWithProfile extends CommunityActivity {
  user: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Community creation input
export interface CreateCommunityInput {
  name: string;
  description?: string;
  category: string;
  cover_image?: File;
  privacy: CommunityPrivacy;
  require_approval: boolean;
  allow_member_posts: boolean;
  allow_member_reels: boolean;
}

// Community update input
export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  category?: string;
  cover_image?: File;
  privacy?: CommunityPrivacy;
  require_approval?: boolean;
  allow_member_posts?: boolean;
  allow_member_reels?: boolean;
}

// Community membership management
export interface CommunityMembershipAction {
  community_id: string;
  user_id: string;
  action: 'join' | 'leave' | 'invite' | 'remove' | 'ban' | 'unban' | 'promote' | 'demote';
  new_role?: CommunityMemberRole;
}

// Community search and filtering
export interface CommunitySearchParams {
  query?: string;
  category?: string;
  privacy?: CommunityPrivacy;
  sort_by?: 'name' | 'member_count' | 'created_at' | 'activity';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Community statistics
export interface CommunityStats {
  total_members: number;
  active_members: number;
  total_posts: number;
  total_reels: number;
  recent_activity_count: number;
  growth_rate: number;
}

// Community feed options
export interface CommunityFeedOptions {
  community_id?: string;
  content_type?: CommunityContentType;
  include_pinned?: boolean;
  limit?: number;
  offset?: number;
}

// Community categories (can be extended)
export const COMMUNITY_CATEGORIES = {
  AI_ART: 'AI Art & Design',
  PHOTOGRAPHY: 'Photography',
  WRITING: 'Writing & Literature',
  CODING: 'Programming & Tech',
  BUSINESS: 'Business & Marketing',
  EDUCATION: 'Education & Learning',
  ENTERTAINMENT: 'Entertainment',
  LIFESTYLE: 'Lifestyle',
  SCIENCE: 'Science & Research',
  GAMING: 'Gaming',
  MUSIC: 'Music & Audio',
  OTHER: 'Other'
} as const;

export type CommunityCategory = keyof typeof COMMUNITY_CATEGORIES;

// Community permissions helper
export interface CommunityPermissions {
  can_view: boolean;
  can_join: boolean;
  can_post: boolean;
  can_comment: boolean;
  can_moderate: boolean;
  can_manage_members: boolean;
  can_edit_settings: boolean;
  can_delete: boolean;
}

// Extended Post and Reel types with community context
export interface PostWithCommunity {
  community_id?: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    privacy: CommunityPrivacy;
  };
}

export interface ReelWithCommunity {
  community_id?: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    privacy: CommunityPrivacy;
  };
}

// Community service response types
export interface CommunityServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Bulk operations
export interface BulkCommunityOperation {
  operation: 'invite' | 'remove' | 'change_role';
  user_ids: string[];
  community_id: string;
  new_role?: CommunityMemberRole;
  message?: string;
}

// Community analytics
export interface CommunityAnalytics {
  member_growth: Array<{ date: string; count: number }>;
  content_activity: Array<{ date: string; posts: number; reels: number }>;
  engagement_metrics: {
    avg_likes_per_post: number;
    avg_comments_per_post: number;
    most_active_members: Array<{ user_id: string; username: string; activity_count: number }>;
  };
}
