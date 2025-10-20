#!/usr/bin/env tsx
/**
 * Password Reset Diagnostic Tool
 *
 * Usage: npx tsx diagnose-password-reset.ts <email>
 *
 * This script helps diagnose password reset issues by:
 * 1. Checking if migrations have run
 * 2. Verifying user exists
 * 3. Listing all tokens for user with status (VALID/USED/EXPIRED)
 * 4. Analyzing token state
 * 5. Providing specific recommendations
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { isTokenExpired, isTokenUsed } from './src/server/utils/password-reset-tokens.js';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in environment variables');
  console.error('Please ensure .env file exists with DATABASE_URL');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ ERROR: Email argument required');
  console.error('Usage: npx tsx diagnose-password-reset.ts <email>');
  process.exit(1);
}

// Initialize database connection
const db = postgres(DATABASE_URL, {
  transform: postgres.camel,
});

async function diagnose() {
  console.log('🔍 Password Reset Diagnostic Tool\n');
  console.log(`Checking password reset state for: ${email}\n`);

  try {
    // 1. Check if migrations have run
    console.log('📋 Step 1: Checking database schema...');
    const [tableCheck] = await db`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'password_reset_tokens'
      ) as exists
    `;

    if (!tableCheck.exists) {
      console.error('❌ ERROR: password_reset_tokens table does not exist');
      console.error('Please run migrations: npm run migrate');
      process.exit(1);
    }
    console.log('✅ Database schema OK\n');

    // 2. Find user by email
    console.log('📋 Step 2: Looking up user...');
    const [user] = await db`
      SELECT id, username, email
      FROM profiles
      WHERE email = ${email}
    `;

    if (!user) {
      console.error(`❌ ERROR: No user found with email: ${email}`);
      console.error('Please verify the email address is correct');
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})\n`);

    // 3. List all tokens for this user
    console.log('📋 Step 3: Analyzing password reset tokens...');
    const tokens = await db`
      SELECT
        id,
        token_hash,
        expires_at,
        used_at,
        created_at
      FROM password_reset_tokens
      WHERE profile_id = ${user.id}
      ORDER BY created_at DESC
    `;

    if (tokens.length === 0) {
      console.log('⚠️  No password reset tokens found for this user');
      console.log('\n📌 RECOMMENDATION:');
      console.log('   Request a new password reset at /forgot-password');
      await db.end();
      process.exit(0);
    }

    console.log(`Found ${tokens.length} token(s):\n`);

    // Analyze each token
    let validTokenCount = 0;
    let usedTokenCount = 0;
    let expiredTokenCount = 0;

    tokens.forEach((token, index) => {
      const tokenNum = index + 1;
      const isExpired = isTokenExpired(token.expiresAt);
      const isUsed = isTokenUsed(token.usedAt);

      let status = '';
      if (isUsed) {
        status = '🔴 USED';
        usedTokenCount++;
      } else if (isExpired) {
        status = '🟡 EXPIRED';
        expiredTokenCount++;
      } else {
        status = '🟢 VALID';
        validTokenCount++;
      }

      console.log(`Token #${tokenNum}: ${status}`);
      console.log(`  Created: ${new Date(token.createdAt).toISOString()}`);
      console.log(`  Expires: ${new Date(token.expiresAt).toISOString()}`);
      console.log(`  Used At: ${token.usedAt ? new Date(token.usedAt).toISOString() : 'NULL (unused)'}`);
      console.log(`  Hash (first 16 chars): ${token.tokenHash.substring(0, 16)}...`);
      console.log('');
    });

    // 4. Provide analysis and recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total tokens: ${tokens.length}`);
    console.log(`  🟢 Valid: ${validTokenCount}`);
    console.log(`  🔴 Used: ${usedTokenCount}`);
    console.log(`  🟡 Expired: ${expiredTokenCount}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (validTokenCount > 1) {
      console.log('⚠️  PROBLEM: Multiple valid tokens exist (Bug 916)');
      console.log('   This indicates the token cleanup fix is not working.');
      console.log('   The forgot-password endpoint should delete old tokens before creating new ones.\n');
      console.log('   ACTION REQUIRED:');
      console.log('   1. Verify src/routes/auth.ts has the DELETE query (lines 225-233)');
      console.log('   2. Restart the server');
      console.log('   3. Request a NEW password reset');
      console.log('   4. Run this diagnostic again to verify only 1 valid token exists\n');
    } else if (validTokenCount === 1) {
      console.log('✅ Exactly 1 valid token exists - this is correct!');
      console.log('   The password reset should work.\n');
      console.log('   If you\'re still seeing "already used" errors:');
      console.log('   1. Clear your browser cache completely');
      console.log('   2. Make sure you\'re using the LATEST reset link from your email');
      console.log('   3. Check the browser console for any errors');
      console.log('   4. Verify the loader has cache-busting headers (Bug 917 fix)\n');
    } else if (usedTokenCount > 0 && validTokenCount === 0) {
      console.log('⚠️  All tokens have been used or expired');
      console.log('   This is normal if you\'ve already reset your password.\n');
      console.log('   ACTION REQUIRED:');
      console.log('   Request a new password reset at /forgot-password\n');
    }

    // Environment check
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ENVIRONMENT CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const mailgunConfigured = process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN;
    if (mailgunConfigured) {
      console.log('✅ Mailgun credentials configured');
    } else {
      console.log('⚠️  Mailgun credentials missing in .env');
      console.log('   Password reset emails will NOT be sent');
    }

  } catch (error) {
    console.error('❌ ERROR during diagnosis:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run diagnosis
diagnose();
