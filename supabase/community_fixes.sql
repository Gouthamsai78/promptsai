-- ============================================================================
-- COMMUNITY ACCESS AND RLS POLICY FIXES
-- ============================================================================
-- This file fixes the community access issues by:
-- 1. Creating missing database functions referenced in RLS policies
-- 2. Fixing circular dependency issues in RLS policies
-- 3. Ensuring proper authentication context handling
-- ============================================================================

-- Drop existing problematic policies to avoid conflicts
DROP POLICY IF EXISTS "Communities are viewable by authenticated users" ON public.communities;
DROP POLICY IF EXISTS "Community owners and admins can update communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_members;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Function to check if user can view a community (avoiding circular dependency)
CREATE OR REPLACE FUNCTION public.user_can_view_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    -- Check if community exists and is public, or user is a member
    RETURN EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = community_uuid
        AND (
            c.privacy = 'public' OR
            EXISTS (
                SELECT 1 FROM public.community_members cm
                WHERE cm.community_id = community_uuid
                AND cm.user_id = user_uuid
                AND cm.status = 'active'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can update a community
CREATE OR REPLACE FUNCTION public.user_can_update_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    -- Check if user is owner, admin, or moderator of the community
    RETURN EXISTS (
        SELECT 1 FROM public.community_members cm
        WHERE cm.community_id = community_uuid
        AND cm.user_id = user_uuid
        AND cm.role IN ('owner', 'admin', 'moderator')
        AND cm.status = 'active'
    ) OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = community_uuid
        AND c.created_by = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can join a community (avoiding circular dependency)
CREATE OR REPLACE FUNCTION public.can_user_join_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
    community_privacy community_privacy;
    is_already_member boolean;
BEGIN
    -- Get community privacy setting
    SELECT privacy INTO community_privacy
    FROM public.communities
    WHERE id = community_uuid;

    -- Check if user is already a member
    SELECT EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = community_uuid
        AND user_id = user_uuid
        AND status IN ('active', 'pending')
    ) INTO is_already_member;

    -- User can join if:
    -- 1. Community exists
    -- 2. User is not already a member
    -- 3. Community is public (private communities require invitation)
    RETURN community_privacy IS NOT NULL
        AND NOT is_already_member
        AND community_privacy = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIXED RLS POLICIES
-- ============================================================================

-- Communities table policies (fixed to avoid circular dependency)
CREATE POLICY "Communities are viewable by authenticated users" ON public.communities
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        user_can_view_community(id, auth.uid())
    );

-- Community owners and admins can update communities
CREATE POLICY "Community owners and admins can update communities" ON public.communities
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        user_can_update_community(id, auth.uid())
    );

-- Only community owners can delete communities
CREATE POLICY "Community owners can delete communities" ON public.communities
    FOR DELETE USING (
        auth.role() = 'authenticated' AND created_by = auth.uid()
    );

-- Community members table policies
-- Members can view other members of communities they belong to
CREATE POLICY "Community members are viewable by community members" ON public.community_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- Users can join communities (insert membership)
CREATE POLICY "Users can join communities" ON public.community_members
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

-- Users can update their own membership status, admins can update others
CREATE POLICY "Users can update their membership, admins can update others" ON public.community_members
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    );

-- Users can leave communities, admins can remove members
CREATE POLICY "Users can leave communities, admins can remove members" ON public.community_members
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    );

-- Community members table policies (simplified to avoid circular dependency)
CREATE POLICY "Users can view community memberships" ON public.community_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see their own memberships
            user_id = auth.uid() OR
            -- Users can see memberships in communities they own
            community_id IN (
                SELECT id FROM public.communities
                WHERE created_by = auth.uid()
            ) OR
            -- Users can see memberships in public communities they're members of
            (community_id IN (
                SELECT cm.community_id FROM public.community_members cm
                JOIN public.communities c ON c.id = cm.community_id
                WHERE cm.user_id = auth.uid()
                AND cm.status = 'active'
                AND c.privacy = 'public'
            ))
        )
    );

-- ============================================================================
-- COMMUNITY CREATION FUNCTION (Enhanced)
-- ============================================================================

-- Enhanced community creation function with better error handling
CREATE OR REPLACE FUNCTION public.create_community_with_membership(
    p_name text,
    p_slug text,
    p_description text,
    p_category text,
    p_cover_image_url text,
    p_privacy community_privacy,
    p_require_approval boolean,
    p_allow_member_posts boolean,
    p_allow_member_reels boolean
)
RETURNS json AS $$
DECLARE
    new_community_id uuid;
    result json;
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();

    -- Validate user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a community';
    END IF;

    -- Validate required fields
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Community name is required';
    END IF;

    -- Insert the community
    INSERT INTO public.communities (
        name, slug, description, category, cover_image_url,
        privacy, require_approval, allow_member_posts, allow_member_reels, created_by
    ) VALUES (
        trim(p_name), trim(p_slug), p_description, p_category, p_cover_image_url,
        p_privacy, p_require_approval, p_allow_member_posts, p_allow_member_reels, current_user_id
    ) RETURNING id INTO new_community_id;

    -- Return the created community data with creator info
    SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'description', c.description,
        'category', c.category,
        'privacy', c.privacy,
        'member_count', c.member_count,
        'created_by', c.created_by,
        'created_at', c.created_at
    ) INTO result
    FROM public.communities c
    WHERE c.id = new_community_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.user_can_view_community(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_update_community(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_join_community(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_with_membership(text, text, text, text, text, community_privacy, boolean, boolean, boolean) TO authenticated;

-- ============================================================================
-- DEBUGGING FUNCTION
-- ============================================================================

-- Function to debug community access issues
CREATE OR REPLACE FUNCTION public.debug_community_access(community_uuid uuid)
RETURNS json AS $$
DECLARE
    result json;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();

    SELECT json_build_object(
        'user_id', current_user_id,
        'community_id', community_uuid,
        'community_exists', EXISTS(SELECT 1 FROM public.communities WHERE id = community_uuid),
        'community_privacy', (SELECT privacy FROM public.communities WHERE id = community_uuid),
        'is_member', EXISTS(
            SELECT 1 FROM public.community_members
            WHERE community_id = community_uuid
            AND user_id = current_user_id
            AND status = 'active'
        ),
        'can_view', user_can_view_community(community_uuid, current_user_id),
        'can_update', user_can_update_community(community_uuid, current_user_id),
        'can_join', can_user_join_community(community_uuid, current_user_id)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debug_community_access(uuid) TO authenticated;

-- Community invitations table policies
-- Invitations are viewable by the invited user and community admins
CREATE POLICY "Invitations are viewable by invited users and admins" ON public.community_invitations
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            invited_user_id = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    );

-- Community admins can create invitations
CREATE POLICY "Community admins can create invitations" ON public.community_invitations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        invited_by = auth.uid() AND
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Invited users and admins can update invitations
CREATE POLICY "Invited users and admins can update invitations" ON public.community_invitations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            invited_user_id = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    );

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON public.community_invitations
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Community activity table policies
-- Activity is viewable by community moderators and admins
CREATE POLICY "Activity is viewable by community moderators" ON public.community_activity
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator') AND status = 'active'
        )
    );

-- System can insert activity logs (this will be handled by triggers or service functions)
CREATE POLICY "System can insert activity logs" ON public.community_activity
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins can delete activity logs
CREATE POLICY "Admins can delete activity logs" ON public.community_activity
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );
