-- Migration 002: Create tweets table
-- Feature: 002-tweet-posting-and-feed-system
-- Purpose: Store user tweets with content, author, and timestamps

-- Create tweets table
CREATE TABLE IF NOT EXISTS tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL,
  content VARCHAR(140) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_tweets_profile_id FOREIGN KEY (profile_id)
    REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content validation constraints
  CONSTRAINT chk_tweets_content_length CHECK (LENGTH(content) <= 140),
  CONSTRAINT chk_tweets_content_not_empty CHECK (LENGTH(TRIM(content)) >= 1)
);

-- Index for feed ordering (newest first)
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);

-- Index for user tweets lookup
CREATE INDEX IF NOT EXISTS idx_tweets_profile_id ON tweets(profile_id);

-- Comment for documentation
COMMENT ON TABLE tweets IS 'User tweets with 140 character limit';
COMMENT ON COLUMN tweets.content IS 'Tweet text content (1-140 chars)';
COMMENT ON COLUMN tweets.profile_id IS 'Foreign key to profiles table (tweet author)';
