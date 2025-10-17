-- Migration: Create password_reset_tokens table for password reset flow
-- Feature: 915-password-reset-flow-with-email-token-verification
-- Created: 2025-10-16

-- Ensure UUID v7 extension is enabled (may already exist from migration 001)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_profile_id ON password_reset_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add comments for documentation
COMMENT ON TABLE password_reset_tokens IS 'Time-limited, single-use tokens for password reset';
COMMENT ON COLUMN password_reset_tokens.id IS 'UUID v7 primary key';
COMMENT ON COLUMN password_reset_tokens.profile_id IS 'Foreign key to profiles table (user requesting reset)';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of reset token (for security)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration time (1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'NULL if unused, set to NOW() when password reset successful';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'When token was generated';
