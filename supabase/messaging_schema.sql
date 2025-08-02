-- ============================================================================
-- USER-TO-USER MESSAGING SYSTEM
-- ============================================================================
-- This file creates the database schema for direct messaging between users
-- ============================================================================

-- Message status enum
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Conversations table (tracks direct message conversations between users)
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    participant_1_unread_count INTEGER DEFAULT 0,
    participant_2_unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure participants are different and ordered consistently
    CONSTRAINT different_participants CHECK (participant_1 != participant_2),
    CONSTRAINT ordered_participants CHECK (participant_1 < participant_2),
    UNIQUE(participant_1, participant_2)
);

-- Messages table (stores individual messages in conversations)
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    status message_status DEFAULT 'sent',
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message read receipts (tracks when messages are read)
CREATE TABLE public.message_read_receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Typing indicators for real-time messaging
CREATE TABLE public.message_typing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    username TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Conversations indexes
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Message read receipts indexes
CREATE INDEX idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);

-- Typing indicators indexes
CREATE INDEX idx_message_typing_conversation_id ON public.message_typing(conversation_id);
CREATE INDEX idx_message_typing_updated_at ON public.message_typing(updated_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
    conversation_id uuid;
    participant_1 uuid;
    participant_2 uuid;
BEGIN
    -- Ensure consistent ordering of participants
    IF user1_id < user2_id THEN
        participant_1 := user1_id;
        participant_2 := user2_id;
    ELSE
        participant_1 := user2_id;
        participant_2 := user1_id;
    END IF;

    -- Try to find existing conversation
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE participant_1 = participant_1 AND participant_2 = participant_2;

    -- Create new conversation if it doesn't exist
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_1, participant_2)
        VALUES (participant_1, participant_2)
        RETURNING id INTO conversation_id;
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the conversation's last message info
    UPDATE public.conversations
    SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = NOW(),
        -- Increment unread count for the recipient
        participant_1_unread_count = CASE
            WHEN participant_1 != NEW.sender_id THEN participant_1_unread_count + 1
            ELSE participant_1_unread_count
        END,
        participant_2_unread_count = CASE
            WHEN participant_2 != NEW.sender_id THEN participant_2_unread_count + 1
            ELSE participant_2_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conv_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
    -- Insert read receipts for unread messages
    INSERT INTO public.message_read_receipts (message_id, user_id)
    SELECT m.id, user_id
    FROM public.messages m
    WHERE m.conversation_id = conv_id
    AND m.sender_id != user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.message_read_receipts mrr
        WHERE mrr.message_id = m.id AND mrr.user_id = user_id
    );

    -- Reset unread count for this user
    UPDATE public.conversations
    SET
        participant_1_unread_count = CASE
            WHEN participant_1 = user_id THEN 0
            ELSE participant_1_unread_count
        END,
        participant_2_unread_count = CASE
            WHEN participant_2 = user_id THEN 0
            ELSE participant_2_unread_count
        END,
        updated_at = NOW()
    WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update conversation when new message is sent
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_typing ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND sender_id = auth.uid()
    );

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (
        auth.role() = 'authenticated' AND sender_id = auth.uid()
    );

-- Message read receipts policies
CREATE POLICY "Users can view read receipts for their messages" ON public.message_read_receipts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            message_id IN (
                SELECT id FROM public.messages WHERE sender_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create read receipts" ON public.message_read_receipts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

-- Typing indicators policies
CREATE POLICY "Users can view typing indicators in their conversations" ON public.message_typing
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
    );

CREATE POLICY "Users can create typing indicators" ON public.message_typing
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own typing indicators" ON public.message_typing
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own typing indicators" ON public.message_typing
    FOR DELETE USING (
        auth.role() = 'authenticated' AND user_id = auth.uid()
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(uuid, uuid) TO authenticated;