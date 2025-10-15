-- Migration: Create profiles table for user authentication
-- Feature: 001-user-authentication-system
-- Created: 2025-10-12

-- Enable UUID v7 extension (requires PostgreSQL 17+)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  bio VARCHAR(160),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20),
  ADD CONSTRAINT chk_bio_length CHECK (bio IS NULL OR LENGTH(bio) <= 160);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with authentication credentials';
COMMENT ON COLUMN profiles.id IS 'UUID v7 primary key';
COMMENT ON COLUMN profiles.username IS 'Unique username (3-20 chars, used for @mentions)';
COMMENT ON COLUMN profiles.email IS 'Unique email address for signin';
COMMENT ON COLUMN profiles.password_hash IS 'Argon2 password hash (never exposed in API)';
COMMENT ON COLUMN profiles.bio IS 'Optional user bio (max 160 chars)';
COMMENT ON COLUMN profiles.avatar_url IS 'Optional avatar image URL (Cloudinary)';
