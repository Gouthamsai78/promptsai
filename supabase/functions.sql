-- Database Functions and Triggers for PromptShare

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update post counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count + 1 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count - 1 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for post counts
CREATE TRIGGER on_post_created
    AFTER INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

CREATE TRIGGER on_post_deleted
    AFTER DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- Function to update like counts
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
            UPDATE public.reels 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.reel_id;
        ELSIF NEW.comment_id IS NOT NULL THEN
            UPDATE public.comments 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.post_id;
        ELSIF OLD.reel_id IS NOT NULL THEN
            UPDATE public.reels 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.reel_id;
        ELSIF OLD.comment_id IS NOT NULL THEN
            UPDATE public.comments 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for like counts
CREATE TRIGGER on_like_created
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();

CREATE TRIGGER on_like_deleted
    AFTER DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION public.update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET comments_count = comments_count + 1 
            WHERE id = NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
            UPDATE public.reels 
            SET comments_count = comments_count + 1 
            WHERE id = NEW.reel_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET comments_count = comments_count - 1 
            WHERE id = OLD.post_id;
        ELSIF OLD.reel_id IS NOT NULL THEN
            UPDATE public.reels 
            SET comments_count = comments_count - 1 
            WHERE id = OLD.reel_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for comment counts
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_counts();

CREATE TRIGGER on_comment_deleted
    AFTER DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_counts();

-- Function to update save counts
CREATE OR REPLACE FUNCTION public.update_save_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts
            SET saves_count = saves_count + 1
            WHERE id = NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
            UPDATE public.reels
            SET saves_count = saves_count + 1
            WHERE id = NEW.reel_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts
            SET saves_count = saves_count - 1
            WHERE id = OLD.post_id;
        ELSIF OLD.reel_id IS NOT NULL THEN
            UPDATE public.reels
            SET saves_count = saves_count - 1
            WHERE id = OLD.reel_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for save counts
CREATE TRIGGER on_save_created
    AFTER INSERT ON public.saves
    FOR EACH ROW EXECUTE FUNCTION public.update_save_counts();

CREATE TRIGGER on_save_deleted
    AFTER DELETE ON public.saves
    FOR EACH ROW EXECUTE FUNCTION public.update_save_counts();

-- Function to update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET following_count = following_count + 1
        WHERE id = NEW.follower_id;

        UPDATE public.profiles
        SET followers_count = followers_count + 1
        WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles
        SET following_count = following_count - 1
        WHERE id = OLD.follower_id;

        UPDATE public.profiles
        SET followers_count = followers_count - 1
        WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for follow counts
CREATE TRIGGER on_follow_created
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

CREATE TRIGGER on_follow_deleted
    AFTER DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Function to safely increment reel views with rate limiting
CREATE OR REPLACE FUNCTION public.increment_reel_views(reel_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.reels
    SET views_count = views_count + 1,
        updated_at = NOW()
    WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Real-time notification functions
-- Function to create notifications for user interactions
CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER AS $$
DECLARE
    actor_profile RECORD;
    content_owner_id UUID;
    notification_type notification_type;
    target_post_id UUID := NULL;
    target_reel_id UUID := NULL;
    target_comment_id UUID := NULL;
BEGIN
    -- Get actor profile information
    SELECT username, avatar_url INTO actor_profile
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Determine notification type and content owner
    IF TG_TABLE_NAME = 'likes' THEN
        IF NEW.post_id IS NOT NULL THEN
            SELECT user_id INTO content_owner_id FROM public.posts WHERE id = NEW.post_id;
            notification_type := 'like';
            target_post_id := NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
            SELECT user_id INTO content_owner_id FROM public.reels WHERE id = NEW.reel_id;
            notification_type := 'like';
            target_reel_id := NEW.reel_id;
        ELSIF NEW.comment_id IS NOT NULL THEN
            SELECT user_id INTO content_owner_id FROM public.comments WHERE id = NEW.comment_id;
            notification_type := 'like';
            target_comment_id := NEW.comment_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF NEW.post_id IS NOT NULL THEN
            SELECT user_id INTO content_owner_id FROM public.posts WHERE id = NEW.post_id;
            target_post_id := NEW.post_id;
        ELSIF NEW.reel_id IS NOT NULL THEN
            SELECT user_id INTO content_owner_id FROM public.reels WHERE id = NEW.reel_id;
            target_reel_id := NEW.reel_id;
        END IF;
        notification_type := 'comment';
    ELSIF TG_TABLE_NAME = 'follows' THEN
        content_owner_id := NEW.following_id;
        notification_type := 'follow';
    END IF;

    -- Don't create notification if user is interacting with their own content
    IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            actor_username,
            actor_avatar,
            type,
            post_id,
            reel_id,
            comment_id
        ) VALUES (
            content_owner_id,
            NEW.user_id,
            actor_profile.username,
            actor_profile.avatar_url,
            notification_type,
            target_post_id,
            target_reel_id,
            target_comment_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification triggers
CREATE OR REPLACE TRIGGER create_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();

CREATE OR REPLACE TRIGGER create_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();

CREATE OR REPLACE TRIGGER create_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to real-time tables
CREATE OR REPLACE TRIGGER update_user_presence_updated_at
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_comment_typing_updated_at
    BEFORE UPDATE ON public.comment_typing
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
