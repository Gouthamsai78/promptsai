-- ============================================================================
-- COMMUNITIES FEATURE - ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Communities table policies
-- Public communities are visible to all authenticated users
-- Private communities are only visible to members
CREATE POLICY "Communities are viewable by authenticated users" ON public.communities
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            privacy = 'public' OR 
            id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- Only authenticated users can create communities
CREATE POLICY "Authenticated users can create communities" ON public.communities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Only community owners and admins can update communities
CREATE POLICY "Community owners and admins can update communities" ON public.communities
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
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

-- Community content table policies
-- Community content is viewable by community members
CREATE POLICY "Community content is viewable by community members" ON public.community_content
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Community members can share content to communities
CREATE POLICY "Community members can share content" ON public.community_content
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        shared_by = auth.uid() AND
        community_id IN (
            SELECT community_id FROM public.community_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Content sharers and moderators can update community content
CREATE POLICY "Content sharers and moderators can update community content" ON public.community_content
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            shared_by = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator') AND status = 'active'
            )
        )
    );

-- Content sharers and moderators can delete community content
CREATE POLICY "Content sharers and moderators can delete community content" ON public.community_content
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            shared_by = auth.uid() OR
            community_id IN (
                SELECT community_id FROM public.community_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator') AND status = 'active'
            )
        )
    );

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
