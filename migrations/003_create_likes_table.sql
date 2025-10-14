-- Migration: Create likes table
-- Feature: 003-like-functionality
-- Created: 2025-10-12
-- Description: Store user engagement data - which users have liked which tweets

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_tweet_id_profile_id_key UNIQUE(tweet_id, profile_id)
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_tweet_profile ON likes(tweet_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile_id ON likes(profile_id);

-- Add comments for documentation
COMMENT ON TABLE likes IS 'User engagement data - which users liked which tweets';
COMMENT ON COLUMN likes.id IS 'UUID v7 primary key (time-sortable)';
COMMENT ON COLUMN likes.tweet_id IS 'Tweet being liked (FK to tweets.id, cascade delete)';
COMMENT ON COLUMN likes.profile_id IS 'User who liked the tweet (FK to profiles.id, cascade delete)';
COMMENT ON COLUMN likes.created_at IS 'When the like was created';
COMMENT ON CONSTRAINT likes_tweet_id_profile_id_key ON likes IS 'Ensures one like per user per tweet';
