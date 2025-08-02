-- ============================================================================
-- COMMUNITY DISCUSSIONS SYSTEM
-- ============================================================================
-- This file creates the database schema for community discussions/messaging
-- ============================================================================

-- Community discussion messages table
CREATE TABLE public.community_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'announcement')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community message reactions table
CREATE TABLE public.community_message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Community message read status table
CREATE TABLE public.community_message_reads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Community messages indexes
CREATE INDEX idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX idx_community_messages_user_id ON public.community_messages(user_id);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at DESC);
CREATE INDEX idx_community_messages_community_created ON public.community_messages(community_id, created_at DESC);
CREATE INDEX idx_community_messages_reply_to ON public.community_messages(reply_to_id);
CREATE INDEX idx_community_messages_pinned ON public.community_messages(community_id, is_pinned, created_at DESC);

-- Reactions indexes
CREATE INDEX idx_community_message_reactions_message_id ON public.community_message_reactions(message_id);
CREATE INDEX idx_community_message_reactions_user_id ON public.community_message_reactions(user_id);

-- Read status indexes
CREATE INDEX idx_community_message_reads_message_id ON public.community_message_reads(message_id);
CREATE INDEX idx_community_message_reads_user_id ON public.community_message_reads(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_reads ENABLE ROW LEVEL SECURITY;

-- Community messages policies
-- Members can view messages in communities they belong to
CREATE POLICY "Members can view community messages" ON public.community_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        community_id IN (
            SELECT cm.community_id FROM public.community_members cm
            WHERE cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- Members can post messages in communities they belong to
CREATE POLICY "Members can post community messages" ON public.community_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        user_id = auth.uid() AND
        community_id IN (
            SELECT cm.community_id FROM public.community_members cm
            WHERE cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.community_messages
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

-- Users can delete their own messages, moderators can delete any message
CREATE POLICY "Users and moderators can delete messages" ON public.community_messages
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            community_id IN (
                SELECT cm.community_id FROM public.community_members cm
                WHERE cm.user_id = auth.uid()
                AND cm.role IN ('owner', 'admin', 'moderator')
                AND cm.status = 'active'
            )
        )
    );

-- Message reactions policies
CREATE POLICY "Members can view reactions" ON public.community_message_reactions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        message_id IN (
            SELECT id FROM public.community_messages cmsg
            WHERE cmsg.community_id IN (
                SELECT cm.community_id FROM public.community_members cm
                WHERE cm.user_id = auth.uid() AND cm.status = 'active'
            )
        )
    );

CREATE POLICY "Members can add reactions" ON public.community_message_reactions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        user_id = auth.uid() AND
        message_id IN (
            SELECT id FROM public.community_messages cmsg
            WHERE cmsg.community_id IN (
                SELECT cm.community_id FROM public.community_members cm
                WHERE cm.user_id = auth.uid() AND cm.status = 'active'
            )
        )
    );

CREATE POLICY "Users can remove own reactions" ON public.community_message_reactions
    FOR DELETE USING (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

-- Message read status policies
CREATE POLICY "Users can view read status" ON public.community_message_reads
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            message_id IN (
                SELECT id FROM public.community_messages cmsg
                WHERE cmsg.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can mark messages as read" ON public.community_message_reads
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );