-- ============================================================================
-- COMMUNITIES FEATURE - DATABASE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically add community creator as owner
CREATE OR REPLACE FUNCTION public.add_community_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Add the creator as the owner of the community
    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (NEW.id, NEW.created_by, 'owner', 'active');
    
    -- Log the community creation activity
    INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
    VALUES (NEW.id, NEW.created_by, 'community_created', jsonb_build_object('community_name', NEW.name));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as owner when community is created
CREATE TRIGGER trigger_add_community_creator_as_owner
    AFTER INSERT ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION public.add_community_creator_as_owner();

-- Function to update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Increment member count
        UPDATE public.communities 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = NEW.community_id;
        
        -- Log member join activity
        INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
        VALUES (NEW.community_id, NEW.user_id, 'member_joined', 
                jsonb_build_object('role', NEW.role, 'invited_by', NEW.invited_by));
                
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status = 'active' AND NEW.status != 'active' THEN
            -- Decrement member count
            UPDATE public.communities 
            SET member_count = member_count - 1,
                updated_at = NOW()
            WHERE id = NEW.community_id;
            
            -- Log member leave/ban activity
            INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
            VALUES (NEW.community_id, NEW.user_id, 
                    CASE WHEN NEW.status = 'banned' THEN 'member_banned' ELSE 'member_left' END,
                    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
                    
        ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
            -- Increment member count
            UPDATE public.communities 
            SET member_count = member_count + 1,
                updated_at = NOW()
            WHERE id = NEW.community_id;
            
            -- Log member rejoin activity
            INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
            VALUES (NEW.community_id, NEW.user_id, 'member_rejoined',
                    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
        
        -- Handle role changes
        IF OLD.role != NEW.role THEN
            INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
            VALUES (NEW.community_id, NEW.user_id, 'role_changed',
                    jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
        END IF;
        
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        -- Decrement member count
        UPDATE public.communities 
        SET member_count = member_count - 1,
            updated_at = NOW()
        WHERE id = OLD.community_id;
        
        -- Log member removal activity
        INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
        VALUES (OLD.community_id, OLD.user_id, 'member_removed',
                jsonb_build_object('role', OLD.role));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update member count
CREATE TRIGGER trigger_update_community_member_count
    AFTER INSERT OR UPDATE OR DELETE ON public.community_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_member_count();

-- Function to update community content count
CREATE OR REPLACE FUNCTION public.update_community_content_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment content count based on type
        IF NEW.content_type = 'post' THEN
            UPDATE public.communities 
            SET post_count = post_count + 1,
                updated_at = NOW()
            WHERE id = NEW.community_id;
        ELSIF NEW.content_type = 'reel' THEN
            UPDATE public.communities 
            SET reel_count = reel_count + 1,
                updated_at = NOW()
            WHERE id = NEW.community_id;
        END IF;
        
        -- Log content sharing activity
        INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
        VALUES (NEW.community_id, NEW.shared_by, 'content_shared',
                jsonb_build_object('content_type', NEW.content_type, 'content_id', 
                    CASE WHEN NEW.content_type = 'post' THEN NEW.post_id ELSE NEW.reel_id END));
                    
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement content count based on type
        IF OLD.content_type = 'post' THEN
            UPDATE public.communities 
            SET post_count = post_count - 1,
                updated_at = NOW()
            WHERE id = OLD.community_id;
        ELSIF OLD.content_type = 'reel' THEN
            UPDATE public.communities 
            SET reel_count = reel_count - 1,
                updated_at = NOW()
            WHERE id = OLD.community_id;
        END IF;
        
        -- Log content removal activity
        INSERT INTO public.community_activity (community_id, user_id, activity_type, activity_data)
        VALUES (OLD.community_id, OLD.shared_by, 'content_removed',
                jsonb_build_object('content_type', OLD.content_type, 'content_id',
                    CASE WHEN OLD.content_type = 'post' THEN OLD.post_id ELSE OLD.reel_id END));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update content count
CREATE TRIGGER trigger_update_community_content_count
    AFTER INSERT OR DELETE ON public.community_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_content_count();

-- Function to generate unique community slug
CREATE OR REPLACE FUNCTION public.generate_community_slug(community_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from name
    base_slug := lower(regexp_replace(trim(community_name), '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'community';
    END IF;
    
    -- Check for uniqueness and add counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.communities WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can join community
CREATE OR REPLACE FUNCTION public.can_user_join_community(community_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    community_privacy community_privacy;
    community_approval BOOLEAN;
    existing_membership community_member_status;
BEGIN
    -- Get community settings
    SELECT privacy, require_approval INTO community_privacy, community_approval
    FROM public.communities WHERE id = community_uuid;

    -- Check if user is already a member
    SELECT status INTO existing_membership
    FROM public.community_members
    WHERE community_id = community_uuid AND user_id = user_uuid;

    -- If already a member with active status, cannot join again
    IF existing_membership = 'active' THEN
        RETURN FALSE;
    END IF;

    -- If community is private, user needs invitation
    IF community_privacy = 'private' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.community_invitations
            WHERE community_id = community_uuid
            AND invited_user_id = user_uuid
            AND status = 'pending'
            AND expires_at > NOW()
        );
    END IF;

    -- Public communities allow joining
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CIRCULAR DEPENDENCY BREAKING FUNCTIONS
-- ============================================================================
-- These functions break the circular dependency between communities and
-- community_members tables by encapsulating the logic in functions that
-- don't trigger RLS policy evaluation loops.

-- Function to check if user can view a community (breaks circular dependency)
CREATE OR REPLACE FUNCTION public.user_can_view_community(community_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    community_privacy community_privacy;
    community_creator UUID;
    is_member BOOLEAN := FALSE;
BEGIN
    -- Get community info
    SELECT privacy, created_by INTO community_privacy, community_creator
    FROM public.communities WHERE id = community_uuid;

    -- Public communities are viewable by all
    IF community_privacy = 'public' THEN
        RETURN TRUE;
    END IF;

    -- Creators can always view their communities
    IF community_creator = user_uuid THEN
        RETURN TRUE;
    END IF;

    -- Check if user is an active member (for private communities)
    -- This function is SECURITY DEFINER so it bypasses RLS policies
    SELECT EXISTS(
        SELECT 1 FROM public.community_members
        WHERE community_id = community_uuid
        AND user_id = user_uuid
        AND status = 'active'
    ) INTO is_member;

    RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can update a community (breaks circular dependency)
CREATE OR REPLACE FUNCTION public.user_can_update_community(community_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    community_creator UUID;
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Get community creator
    SELECT created_by INTO community_creator
    FROM public.communities WHERE id = community_uuid;

    -- Creators can always update
    IF community_creator = user_uuid THEN
        RETURN TRUE;
    END IF;

    -- Check if user is admin/owner
    -- This function is SECURITY DEFINER so it bypasses RLS policies
    SELECT EXISTS(
        SELECT 1 FROM public.community_members
        WHERE community_id = community_uuid
        AND user_id = user_uuid
        AND role IN ('owner', 'admin')
        AND status = 'active'
    ) INTO is_admin;

    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMUNITY CREATION SECURITY DEFINER FUNCTION (RLS BYPASS)
-- ============================================================================
-- This function provides a fallback for community creation when RLS policies
-- have authentication context issues. It bypasses RLS while maintaining security.

-- Function to create community with explicit security checks (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_community_secure(
    p_name text,
    p_slug text,
    p_description text DEFAULT '',
    p_category text DEFAULT 'AI_ART',
    p_cover_image_url text DEFAULT NULL,
    p_privacy community_privacy DEFAULT 'public',
    p_require_approval boolean DEFAULT false,
    p_allow_member_posts boolean DEFAULT true,
    p_allow_member_reels boolean DEFAULT true,
    p_created_by uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    new_community_id uuid;
    result json;
    auth_user_id uuid;
    auth_user_role text;
BEGIN
    -- Get current auth state
    auth_user_id := auth.uid();
    auth_user_role := auth.role();

    -- Verify the user is authenticated
    IF auth_user_role IS NULL OR auth_user_role != 'authenticated' THEN
        RAISE EXCEPTION 'User must be authenticated. Current role: %', auth_user_role;
    END IF;

    -- Verify user ID is provided
    IF p_created_by IS NULL THEN
        RAISE EXCEPTION 'Created by user ID cannot be null';
    END IF;

    -- Verify user ID matches authenticated user
    IF auth_user_id != p_created_by THEN
        RAISE EXCEPTION 'User ID mismatch: authenticated=% vs provided=%', auth_user_id, p_created_by;
    END IF;

    -- Verify user profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_created_by) THEN
        RAISE EXCEPTION 'User profile not found for ID: %', p_created_by;
    END IF;

    -- Verify required fields
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Community name cannot be empty';
    END IF;

    IF p_slug IS NULL OR trim(p_slug) = '' THEN
        RAISE EXCEPTION 'Community slug cannot be empty';
    END IF;

    -- Insert the community (this function is SECURITY DEFINER so it bypasses RLS)
    INSERT INTO public.communities (
        name, slug, description, category, cover_image_url,
        privacy, require_approval, allow_member_posts, allow_member_reels, created_by
    ) VALUES (
        trim(p_name), trim(p_slug), p_description, p_category, p_cover_image_url,
        p_privacy, p_require_approval, p_allow_member_posts, p_allow_member_reels, p_created_by
    ) RETURNING id INTO new_community_id;

    -- Return the created community data
    SELECT to_json(c.*) INTO result
    FROM public.communities c
    WHERE c.id = new_community_id;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create community: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
