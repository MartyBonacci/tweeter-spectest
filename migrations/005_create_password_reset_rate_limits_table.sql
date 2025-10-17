-- Migration: Create password_reset_rate_limits table for rate limiting
-- Feature: 915-password-reset-flow-with-email-token-verification
-- Created: 2025-10-16

-- Ensure UUID v7 extension is enabled (may already exist from migration 001)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Create password_reset_rate_limits table
CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email VARCHAR(255) NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_email ON password_reset_rate_limits(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_requested_at ON password_reset_rate_limits(requested_at);

-- Add comments for documentation
COMMENT ON TABLE password_reset_rate_limits IS 'Tracks password reset requests for rate limiting (max 3/hour per email)';
COMMENT ON COLUMN password_reset_rate_limits.id IS 'UUID v7 primary key';
COMMENT ON COLUMN password_reset_rate_limits.email IS 'Email address requesting password reset';
COMMENT ON COLUMN password_reset_rate_limits.requested_at IS 'Timestamp of reset request';
