-- Row Level Security Policies for PromptShare

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view their own posts" ON public.posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own posts" ON public.posts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- Reels policies
CREATE POLICY "Reels are viewable by everyone" ON public.reels
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create their own reels" ON public.reels
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own reels" ON public.reels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels" ON public.reels
    FOR DELETE USING (auth.uid() = user_id);

-- Tools policies
CREATE POLICY "Tools are viewable by everyone" ON public.tools
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tools" ON public.tools
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools" ON public.tools
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools" ON public.tools
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Saves policies
CREATE POLICY "Users can view their own saves" ON public.saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves" ON public.saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON public.saves
    FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket policies for media uploads
-- Media bucket policies (for posts, reels, etc.)
CREATE POLICY "Anyone can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own media files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own media files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Avatar bucket policies (for profile pictures)
CREATE POLICY "Anyone can view avatar files" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- User presence policies for real-time features
CREATE POLICY "Users can view all presence data" ON public.user_presence
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own presence" ON public.user_presence
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own presence" ON public.user_presence
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own presence" ON public.user_presence
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

-- Comment typing indicator policies
CREATE POLICY "Users can view typing indicators" ON public.comment_typing
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own typing indicators" ON public.comment_typing
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own typing indicators" ON public.comment_typing
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own typing indicators" ON public.comment_typing
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );
