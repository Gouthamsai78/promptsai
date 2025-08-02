import { supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../utils/supabaseWrapper';
import { StorageService } from './storage';
import { 
  Community, 
  CommunityWithCreator,
  CommunityMember,
  CommunityMemberWithProfile,
  CommunityContent,
  CommunityContentWithDetails,
  CommunityInvitation,
  CommunityInvitationWithDetails,
  CommunityActivity,
  CommunityActivityWithProfile,
  CreateCommunityInput,
  UpdateCommunityInput,
  CommunityMembershipAction,
  CommunitySearchParams,
  CommunityStats,
  CommunityFeedOptions,
  CommunityPermissions,
  CommunityServiceResponse,
  CommunityPrivacy,
  CommunityMemberRole,
  CommunityMemberStatus
} from '../types/community';
import { debugLog, debugError } from '../utils/debug';

export class CommunityService {
  // ============================================================================
  // COMMUNITY CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new community
   */
  static async createCommunity(input: CreateCommunityInput): Promise<CommunityServiceResponse<Community>> {
    try {
      debugLog('🏘️ Creating community:', input.name);

      // First, verify authentication state
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        debugError('❌ No active session found:', sessionError?.message);
        throw new Error('You must be logged in to create a community');
      }

      debugLog('🔐 Session verified for user:', sessionData.session.user.id);

      // Generate unique slug with enhanced fallback
      let slugData: string;
      try {
        const { data, error: slugError } = await supabase
          .rpc('generate_community_slug', { community_name: input.name });

        if (slugError) {
          debugLog('⚠️ Database function not available, using fallback slug generation');
          slugData = await this.generateSlugFallback(input.name);
        } else {
          slugData = data;
        }
      } catch (error) {
        debugLog('⚠️ Database function error, using fallback slug generation');
        slugData = await this.generateSlugFallback(input.name);
      }

      // Double-check slug uniqueness before proceeding
      const { data: existingSlug } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slugData)
        .single();

      if (existingSlug) {
        debugLog('⚠️ Generated slug already exists, regenerating...');
        slugData = await this.generateSlugFallback(input.name, true); // Force new generation
      }

      // Upload cover image if provided
      let cover_image_url: string | undefined;
      if (input.cover_image) {
        const uploadResult = await StorageService.uploadFile(
          input.cover_image,
          'community-covers',
          supabase.auth.getUser().then(u => u.data.user?.id || ''),
          'community'
        );

        if (uploadResult.error) {
          debugError('Failed to upload cover image:', uploadResult.error);
        } else {
          cover_image_url = uploadResult.url;
        }
      }

      // Get current user ID and ensure it's valid
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user?.id) {
        throw new Error('User not authenticated or user ID not available');
      }

      const userId = userData.user.id;
      debugLog('🔐 Creating community for user:', userId);

      // Ensure user profile exists (handle race condition with profile creation)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        debugError('❌ User profile not found, this might be a timing issue:', profileError?.message);
        throw new Error('User profile not found. Please try again in a moment.');
      }

      // Debug authentication state right before INSERT
      try {
        const { data: debugData } = await supabase.rpc('debug_auth_state');
        debugLog('🔍 Auth state before INSERT:', debugData);
      } catch (debugError) {
        debugLog('⚠️ Could not debug auth state:', debugError);
      }

      // Create community record
      const insertData = {
        name: input.name,
        slug: slugData,
        description: input.description,
        category: input.category,
        cover_image_url,
        privacy: input.privacy,
        require_approval: input.require_approval,
        allow_member_posts: input.allow_member_posts,
        allow_member_reels: input.allow_member_reels,
        created_by: userId
      };

      debugLog('📝 Inserting community data:', insertData);

      // Ensure we have a fresh session before the INSERT
      await supabase.auth.refreshSession();

      // Try direct INSERT with proper session context
      let { data, error } = await supabase
        .from('communities')
        .insert(insertData)
        .select()
        .single();

      // If we get an infinite recursion error, immediately try the secure function
      if (error && error.message.includes('infinite recursion')) {
        debugLog('🚨 Infinite recursion detected, using secure function immediately...');

        try {
          const { data: functionResult, error: functionError } = await supabase
            .rpc('create_community_secure', {
              p_name: input.name,
              p_slug: slugData,
              p_description: input.description || '',
              p_category: input.category,
              p_cover_image_url: cover_image_url || null,
              p_privacy: input.privacy,
              p_require_approval: input.require_approval,
              p_allow_member_posts: input.allow_member_posts,
              p_allow_member_reels: input.allow_member_reels
            });

          if (functionError) {
            debugError('❌ Secure function failed:', functionError.message);
            throw new Error(`Failed to create community: ${functionError.message}`);
          } else {
            data = functionResult;
            error = null;
            debugLog('✅ Community created successfully using secure function (recursion fix)');
          }
        } catch (functionError: any) {
          debugError('❌ Secure function exception:', functionError.message);
          throw new Error(`Failed to create community: ${functionError.message}`);
        }
      }

      // If direct INSERT fails with RLS policy error, try alternative approaches
      if (error && (error.message.includes('row-level security policy') || error.message.includes('infinite recursion'))) {
        debugLog('🔄 Direct INSERT failed with RLS/recursion error, trying secure function...');

        try {
          // Use the secure function that bypasses RLS policies
          const { data: functionResult, error: functionError } = await supabase
            .rpc('create_community_secure', {
              p_name: input.name,
              p_slug: slugData,
              p_description: input.description || '',
              p_category: input.category,
              p_cover_image_url: cover_image_url || null,
              p_privacy: input.privacy,
              p_require_approval: input.require_approval,
              p_allow_member_posts: input.allow_member_posts,
              p_allow_member_reels: input.allow_member_reels
            });

          if (functionError) {
            debugError('❌ Secure function failed:', functionError.message);
            throw new Error(`Failed to create community: ${functionError.message}`);
          } else {
            data = functionResult;
            error = null;
            debugLog('✅ Community created successfully using secure function');
          }
        } catch (functionError: any) {
          debugError('❌ Secure function exception:', functionError.message);
          throw new Error(`Failed to create community: ${functionError.message}`);
        }
      }

      // Handle duplicate slug error specifically
      if (error && error.message.includes('duplicate key value violates unique constraint "communities_slug_key"')) {
        debugLog('🔄 Duplicate slug detected, regenerating and retrying...');

        try {
          // Generate a new unique slug
          const newSlug = await this.generateSlugFallback(input.name, true);

          // Update the insert data with new slug
          const retryInsertData = {
            ...insertData,
            slug: newSlug
          };

          debugLog('🔄 Retrying with new slug:', newSlug);

          // Try the insert again with the new slug
          const retryResult = await supabase
            .from('communities')
            .insert(retryInsertData)
            .select()
            .single();

          if (retryResult.error) {
            // If still failing, try the secure function
            const { data: functionResult, error: functionError } = await supabase
              .rpc('create_community_secure', {
                p_name: input.name,
                p_slug: newSlug,
                p_description: input.description || '',
                p_category: input.category,
                p_cover_image_url: cover_image_url || null,
                p_privacy: input.privacy,
                p_require_approval: input.require_approval,
                p_allow_member_posts: input.allow_member_posts,
                p_allow_member_reels: input.allow_member_reels
              });

            if (functionError) {
              throw new Error(`Failed to create community after retry: ${functionError.message}`);
            } else {
              data = functionResult;
              error = null;
            }
          } else {
            data = retryResult.data;
            error = null;
            debugLog('✅ Community created successfully after slug retry');
          }
        } catch (retryError: any) {
          debugError('❌ Failed to retry community creation:', retryError.message);
          throw new Error(`Failed to create community: ${retryError.message}`);
        }
      } else if (error) {
        debugError('❌ Database error creating community:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId: userId,
          communityData: {
            name: input.name,
            slug: slugData,
            created_by: userId
          }
        });
        throw new Error(`Failed to create community: ${error.message}`);
      }

      debugLog('✅ Community created successfully:', data.id);
      return { success: true, data, message: 'Community created successfully' };

    } catch (error: any) {
      debugError('❌ Failed to create community:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community by ID with creator information
   */
  static async getCommunity(communityId: string): Promise<CommunityServiceResponse<CommunityWithCreator>> {
    try {
      debugLog('🔍 Fetching community:', communityId);

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('id', communityId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch community: ${error.message}`);
      }

      if (!data) {
        throw new Error('Community not found');
      }

      return { success: true, data };

    } catch (error: any) {
      debugError('❌ Failed to fetch community:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Alias for getCommunity - Get community by ID with creator information
   */
  static async getCommunityById(communityId: string): Promise<CommunityServiceResponse<CommunityWithCreator>> {
    return this.getCommunity(communityId);
  }

  /**
   * Get community by slug
   */
  static async getCommunityBySlug(slug: string): Promise<CommunityServiceResponse<CommunityWithCreator>> {
    try {
      debugLog('🔍 Fetching community by slug:', slug);

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        throw new Error(`Failed to fetch community: ${error.message}`);
      }

      if (!data) {
        throw new Error('Community not found');
      }

      return { success: true, data };

    } catch (error: any) {
      debugError('❌ Failed to fetch community by slug:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update community
   */
  static async updateCommunity(
    communityId: string, 
    updates: UpdateCommunityInput
  ): Promise<CommunityServiceResponse<Community>> {
    try {
      debugLog('📝 Updating community:', communityId);

      // Handle cover image upload if provided
      let cover_image_url: string | undefined;
      if (updates.cover_image) {
        const uploadResult = await StorageService.uploadFile(
          updates.cover_image,
          'community-covers',
          supabase.auth.getUser().then(u => u.data.user?.id || ''),
          'community'
        );

        if (uploadResult.error) {
          debugError('Failed to upload cover image:', uploadResult.error);
        } else {
          cover_image_url = uploadResult.url;
        }
      }

      // Prepare update data
      const updateData: any = { ...updates };
      delete updateData.cover_image; // Remove file object
      if (cover_image_url) {
        updateData.cover_image_url = cover_image_url;
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('communities')
        .update(updateData)
        .eq('id', communityId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update community: ${error.message}`);
      }

      debugLog('✅ Community updated successfully');
      return { success: true, data, message: 'Community updated successfully' };

    } catch (error: any) {
      debugError('❌ Failed to update community:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete community
   */
  static async deleteCommunity(communityId: string): Promise<CommunityServiceResponse<void>> {
    try {
      debugLog('🗑️ Deleting community:', communityId);

      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) {
        throw new Error(`Failed to delete community: ${error.message}`);
      }

      debugLog('✅ Community deleted successfully');
      return { success: true, message: 'Community deleted successfully' };

    } catch (error: any) {
      debugError('❌ Failed to delete community:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // COMMUNITY SEARCH AND DISCOVERY
  // ============================================================================

  /**
   * Search communities with filters
   */
  static async searchCommunities(params: CommunitySearchParams): Promise<CommunityServiceResponse<CommunityWithCreator[]>> {
    try {
      debugLog('🔍 Searching communities with params:', params);

      let query = supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `);

      // Apply filters
      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
      }

      if (params.category) {
        query = query.eq('category', params.category);
      }

      if (params.privacy) {
        query = query.eq('privacy', params.privacy);
      }

      // Apply sorting
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to search communities: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to search communities:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trending communities
   */
  static async getTrendingCommunities(limit: number = 10): Promise<CommunityServiceResponse<CommunityWithCreator[]>> {
    try {
      debugLog('📈 Fetching trending communities');

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('privacy', 'public')
        .order('member_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch trending communities: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to fetch trending communities:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // COMMUNITY MEMBERSHIP MANAGEMENT
  // ============================================================================

  /**
   * Join a community
   */
  static async joinCommunity(communityId: string): Promise<CommunityServiceResponse<CommunityMember>> {
    try {
      debugLog('🚪 Joining community:', communityId);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check if user can join this community
      const { data: canJoin, error: checkError } = await supabase
        .rpc('can_user_join_community', {
          community_uuid: communityId,
          user_uuid: user.data.user.id
        });

      if (checkError) {
        throw new Error(`Failed to check join eligibility: ${checkError.message}`);
      }

      if (!canJoin) {
        throw new Error('You cannot join this community. It may be private or you may already be a member.');
      }

      // Get community info to determine status
      const { data: community } = await supabase
        .from('communities')
        .select('privacy, require_approval')
        .eq('id', communityId)
        .single();

      const status: CommunityMemberStatus =
        community?.privacy === 'private' || community?.require_approval ? 'pending' : 'active';

      // Create membership record
      const { data, error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.data.user.id,
          role: 'member',
          status
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to join community: ${error.message}`);
      }

      const message = status === 'pending'
        ? 'Join request sent. Waiting for approval.'
        : 'Successfully joined community!';

      debugLog('✅ Community join successful');
      return { success: true, data, message };

    } catch (error: any) {
      debugError('❌ Failed to join community:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave a community
   */
  static async leaveCommunity(communityId: string): Promise<CommunityServiceResponse<void>> {
    try {
      debugLog('🚪 Leaving community:', communityId);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check if user is the owner
      const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.data.user.id)
        .single();

      if (membership?.role === 'owner') {
        throw new Error('Community owners cannot leave. Transfer ownership or delete the community.');
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.data.user.id);

      if (error) {
        throw new Error(`Failed to leave community: ${error.message}`);
      }

      debugLog('✅ Successfully left community');
      return { success: true, message: 'Successfully left community' };

    } catch (error: any) {
      debugError('❌ Failed to leave community:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community members with profiles
   */
  static async getCommunityMembers(
    communityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CommunityServiceResponse<CommunityMemberWithProfile[]>> {
    try {
      debugLog('👥 Fetching community members:', communityId);

      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profile:profiles!community_members_user_id_fkey (
            username,
            full_name,
            avatar_url,
            verified
          ),
          inviter:profiles!community_members_invited_by_fkey (
            username,
            full_name
          )
        `)
        .eq('community_id', communityId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch community members: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to fetch community members:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manage community membership (invite, remove, change role)
   */
  static async manageMembership(action: CommunityMembershipAction): Promise<CommunityServiceResponse<any>> {
    try {
      debugLog('⚙️ Managing membership:', action);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check permissions
      const hasPermission = await this.checkMembershipPermission(
        action.community_id,
        user.data.user.id,
        action.action
      );

      if (!hasPermission.success || !hasPermission.data) {
        throw new Error('Insufficient permissions for this action');
      }

      switch (action.action) {
        case 'invite':
          return await this.inviteUserToCommunity(action.community_id, action.user_id);

        case 'remove':
          return await this.removeMemberFromCommunity(action.community_id, action.user_id);

        case 'ban':
          return await this.banMemberFromCommunity(action.community_id, action.user_id);

        case 'unban':
          return await this.unbanMemberFromCommunity(action.community_id, action.user_id);

        case 'promote':
        case 'demote':
          if (!action.new_role) {
            throw new Error('New role is required for role changes');
          }
          return await this.changeMemberRole(action.community_id, action.user_id, action.new_role);

        default:
          throw new Error(`Unsupported action: ${action.action}`);
      }

    } catch (error: any) {
      debugError('❌ Failed to manage membership:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Invite user to community
   */
  private static async inviteUserToCommunity(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<CommunityInvitation>> {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('community_invitations')
      .insert({
        community_id: communityId,
        invited_user_id: userId,
        invited_by: user.data.user?.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send invitation: ${error.message}`);
    }

    return { success: true, data, message: 'Invitation sent successfully' };
  }

  /**
   * Remove member from community
   */
  private static async removeMemberFromCommunity(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<void>> {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }

    return { success: true, message: 'Member removed successfully' };
  }

  /**
   * Ban member from community
   */
  private static async banMemberFromCommunity(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<void>> {
    const { error } = await supabase
      .from('community_members')
      .update({ status: 'banned' })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to ban member: ${error.message}`);
    }

    return { success: true, message: 'Member banned successfully' };
  }

  /**
   * Unban member from community
   */
  private static async unbanMemberFromCommunity(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<void>> {
    const { error } = await supabase
      .from('community_members')
      .update({ status: 'active' })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unban member: ${error.message}`);
    }

    return { success: true, message: 'Member unbanned successfully' };
  }

  /**
   * Change member role
   */
  private static async changeMemberRole(
    communityId: string,
    userId: string,
    newRole: CommunityMemberRole
  ): Promise<CommunityServiceResponse<void>> {
    const { error } = await supabase
      .from('community_members')
      .update({ role: newRole })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to change member role: ${error.message}`);
    }

    return { success: true, message: `Member role changed to ${newRole}` };
  }

  // ============================================================================
  // COMMUNITY CONTENT OPERATIONS
  // ============================================================================

  /**
   * Share content to community
   */
  static async shareContentToCommunity(
    communityId: string,
    contentType: 'post' | 'reel',
    contentId: string
  ): Promise<CommunityServiceResponse<CommunityContent>> {
    try {
      debugLog('📤 Sharing content to community:', { communityId, contentType, contentId });

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check if user is a member and can share content
      const permissions = await this.getCommunityPermissions(communityId, user.data.user.id);
      if (!permissions.success || !permissions.data?.can_post) {
        throw new Error('You do not have permission to share content in this community');
      }

      // Create community content association
      const { data, error } = await supabase
        .from('community_content')
        .insert({
          community_id: communityId,
          content_type: contentType,
          post_id: contentType === 'post' ? contentId : null,
          reel_id: contentType === 'reel' ? contentId : null,
          shared_by: user.data.user.id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to share content: ${error.message}`);
      }

      debugLog('✅ Content shared successfully');
      return { success: true, data, message: 'Content shared to community successfully' };

    } catch (error: any) {
      debugError('❌ Failed to share content:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community feed
   */
  static async getCommunityFeed(options: CommunityFeedOptions): Promise<CommunityServiceResponse<CommunityContentWithDetails[]>> {
    try {
      debugLog('📰 Fetching community feed:', options);

      let query = supabase
        .from('community_content')
        .select(`
          *,
          post:posts (*,
            author:profiles!posts_user_id_fkey (
              username,
              full_name,
              avatar_url,
              verified
            )
          ),
          reel:reels (*,
            author:profiles!reels_user_id_fkey (
              username,
              full_name,
              avatar_url,
              verified
            )
          ),
          sharer:profiles!community_content_shared_by_fkey (
            username,
            full_name,
            avatar_url,
            verified
          )
        `);

      // Apply filters
      if (options.community_id) {
        query = query.eq('community_id', options.community_id);
      }

      if (options.content_type) {
        query = query.eq('content_type', options.content_type);
      }

      // Handle pinned content
      if (options.include_pinned) {
        query = query.order('is_pinned', { ascending: false });
      }

      // Apply sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 20);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch community feed: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to fetch community feed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pin/unpin content in community
   */
  static async toggleContentPin(
    communityId: string,
    contentId: string,
    isPinned: boolean
  ): Promise<CommunityServiceResponse<void>> {
    try {
      debugLog('📌 Toggling content pin:', { communityId, contentId, isPinned });

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check if user has moderation permissions
      const permissions = await this.getCommunityPermissions(communityId, user.data.user.id);
      if (!permissions.success || !permissions.data?.can_moderate) {
        throw new Error('You do not have permission to pin content in this community');
      }

      const { error } = await supabase
        .from('community_content')
        .update({ is_pinned: isPinned })
        .eq('id', contentId)
        .eq('community_id', communityId);

      if (error) {
        throw new Error(`Failed to ${isPinned ? 'pin' : 'unpin'} content: ${error.message}`);
      }

      const message = isPinned ? 'Content pinned successfully' : 'Content unpinned successfully';
      debugLog('✅', message);
      return { success: true, message };

    } catch (error: any) {
      debugError('❌ Failed to toggle content pin:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // PERMISSION CHECKING AND VALIDATION
  // ============================================================================

  /**
   * Get user's permissions in a community
   */
  static async getCommunityPermissions(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<CommunityPermissions>> {
    try {
      debugLog('🔐 Checking community permissions:', { communityId, userId });

      // Get user's membership status and role
      const { data: membership } = await supabase
        .from('community_members')
        .select('role, status')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      // Get community settings
      const { data: community } = await supabase
        .from('communities')
        .select('privacy, allow_member_posts, allow_member_reels, created_by')
        .eq('id', communityId)
        .single();

      if (!community) {
        throw new Error('Community not found');
      }

      const isOwner = community.created_by === userId;
      const isMember = membership?.status === 'active';
      const role = membership?.role;

      const permissions: CommunityPermissions = {
        can_view: community.privacy === 'public' || isMember,
        can_join: community.privacy === 'public' && !isMember,
        can_post: isMember && (community.allow_member_posts || ['owner', 'admin', 'moderator'].includes(role || '')),
        can_comment: isMember,
        can_moderate: isMember && ['owner', 'admin', 'moderator'].includes(role || ''),
        can_manage_members: isMember && ['owner', 'admin'].includes(role || ''),
        can_edit_settings: isMember && ['owner', 'admin'].includes(role || ''),
        can_delete: isOwner
      };

      return { success: true, data: permissions };

    } catch (error: any) {
      debugError('❌ Failed to check permissions:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has permission for specific membership action
   */
  private static async checkMembershipPermission(
    communityId: string,
    userId: string,
    action: string
  ): Promise<CommunityServiceResponse<boolean>> {
    try {
      const permissions = await this.getCommunityPermissions(communityId, userId);

      if (!permissions.success || !permissions.data) {
        return { success: false, error: 'Failed to check permissions' };
      }

      let hasPermission = false;

      switch (action) {
        case 'invite':
        case 'remove':
        case 'ban':
        case 'unban':
          hasPermission = permissions.data.can_manage_members;
          break;
        case 'promote':
        case 'demote':
          hasPermission = permissions.data.can_manage_members;
          break;
        default:
          hasPermission = false;
      }

      return { success: true, data: hasPermission };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's communities (where they are members)
   */
  static async getUserCommunities(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommunityServiceResponse<CommunityWithCreator[]>> {
    try {
      debugLog('👤 Fetching user communities:', userId);

      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community:communities (
            *,
            creator:profiles!communities_created_by_fkey (
              id,
              username,
              full_name,
              avatar_url,
              verified
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch user communities: ${error.message}`);
      }

      const communities = data?.map(item => item.community).filter(Boolean) || [];
      return { success: true, data: communities };

    } catch (error: any) {
      debugError('❌ Failed to fetch user communities:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get communities created by a user
   */
  static async getUserCreatedCommunities(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommunityServiceResponse<CommunityWithCreator[]>> {
    try {
      debugLog('👑 Fetching user created communities:', userId);

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch user created communities: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to fetch user created communities:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all communities accessible to a user (created + joined)
   */
  static async getAllUserCommunities(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommunityServiceResponse<CommunityWithCreator[]>> {
    try {
      debugLog('🏘️ Fetching all user accessible communities:', userId);

      // With the fixed RLS policies, we can now query communities directly
      // The RLS policy will automatically filter to show only accessible communities
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch all user communities: ${error.message}`);
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      debugError('❌ Failed to fetch all user communities:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community statistics
   */
  static async getCommunityStats(communityId: string): Promise<CommunityServiceResponse<CommunityStats>> {
    try {
      debugLog('📊 Fetching community stats:', communityId);

      // Get basic counts from community record
      const { data: community } = await supabase
        .from('communities')
        .select('member_count, post_count, reel_count')
        .eq('id', communityId)
        .single();

      if (!community) {
        throw new Error('Community not found');
      }

      // Get active members count
      const { count: activeMembers } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'active');

      // Get recent activity count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentActivity } = await supabase
        .from('community_activity')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .gte('created_at', sevenDaysAgo.toISOString());

      const stats: CommunityStats = {
        total_members: community.member_count,
        active_members: activeMembers || 0,
        total_posts: community.post_count,
        total_reels: community.reel_count,
        recent_activity_count: recentActivity || 0,
        growth_rate: 0 // TODO: Calculate growth rate based on historical data
      };

      return { success: true, data: stats };

    } catch (error: any) {
      debugError('❌ Failed to fetch community stats:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is member of community
   */
  static async isUserMember(communityId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('status')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      return data?.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Get user's membership in a community
   */
  static async getUserMembership(
    communityId: string,
    userId: string
  ): Promise<CommunityServiceResponse<CommunityMember>> {
    try {
      debugLog('👤 Fetching user membership:', { communityId, userId });

      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no membership found, return success with no data
        if (error.code === 'PGRST116') {
          return { success: true, data: undefined };
        }
        throw new Error(`Failed to fetch user membership: ${error.message}`);
      }

      return { success: true, data };

    } catch (error: any) {
      debugError('❌ Failed to fetch user membership:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate URL-friendly slug from community name (fallback method)
   */
  private static async generateSlugFallback(communityName: string, forceUnique: boolean = false): Promise<string> {
    try {
      debugLog('🔧 Generating slug fallback for:', communityName, forceUnique ? '(forced unique)' : '');

      // Create base slug from name
      let baseSlug = communityName
        .toLowerCase()
        .trim()
        // Remove special characters except spaces and hyphens
        .replace(/[^a-z0-9\s-]/g, '')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Replace spaces with hyphens
        .replace(/\s/g, '-')
        // Replace multiple hyphens with single hyphen
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');

      // Ensure slug is not empty
      if (!baseSlug) {
        baseSlug = 'community';
      }

      // Ensure slug is not too long (max 40 characters for base to leave room for counter)
      if (baseSlug.length > 40) {
        baseSlug = baseSlug.substring(0, 40).replace(/-+$/, '');
      }

      // If forcing unique, start with a timestamp suffix
      let finalSlug = forceUnique ? `${baseSlug}-${Date.now()}` : baseSlug;
      let counter = forceUnique ? 0 : 0;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 100) {
        attempts++;

        const { data: existingCommunity, error } = await supabase
          .from('communities')
          .select('id')
          .eq('slug', finalSlug)
          .single();

        // If there's an error (like PGRST116 - no rows), the slug is unique
        if (error && error.code === 'PGRST116') {
          isUnique = true;
        } else if (!existingCommunity) {
          isUnique = true;
        } else {
          counter++;
          if (forceUnique) {
            // For forced unique, use timestamp + counter
            finalSlug = `${baseSlug}-${Date.now()}-${counter}`;
          } else {
            finalSlug = `${baseSlug}-${counter}`;
          }
        }

        // Add small delay to prevent race conditions
        if (!isUnique && attempts % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Ultimate fallback if we couldn't find a unique slug
      if (!isUnique) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        finalSlug = `${baseSlug}-${timestamp}-${randomSuffix}`;
        debugLog('⚠️ Using ultimate fallback slug:', finalSlug);
      }

      debugLog('✅ Generated slug:', finalSlug);
      return finalSlug;

    } catch (error: any) {
      debugError('❌ Error generating slug fallback:', error.message);
      // Ultimate fallback - use timestamp with random suffix
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      return `community-${timestamp}-${randomSuffix}`;
    }
  }
}
