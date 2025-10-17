/**
 * Email service using Mailgun
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * Principle 1: Functional Programming (factory functions, pure functions)
 * Principle 4: Security-First (env vars, error handling)
 */

import Mailgun from 'mailgun.js';
import formData from 'form-data';
import type { MailgunMessageData, IMailgunClient } from 'mailgun.js';

/**
 * Mailgun configuration
 */
interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Initialize Mailgun client (factory function)
 * Principle 1: Factory function instead of class constructor
 *
 * @param config - Mailgun configuration
 * @returns Configured Mailgun client
 *
 * @example
 * const client = initMailgun({
 *   apiKey: process.env.MAILGUN_API_KEY!,
 *   domain: process.env.MAILGUN_DOMAIN!,
 *   fromEmail: 'noreply@tweeter.com'
 * });
 */
export function initMailgun(config: MailgunConfig): IMailgunClient {
  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: 'api',
    key: config.apiKey,
  });
}

/**
 * Send password reset email with token link
 *
 * @param client - Mailgun client
 * @param config - Email configuration
 * @param toEmail - Recipient email address
 * @param token - Reset token (will be included in URL)
 * @param baseUrl - Base URL of application (e.g., http://localhost:5173)
 *
 * @example
 * await sendPasswordResetEmail(
 *   client,
 *   config,
 *   "user@example.com",
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   "http://localhost:5173"
 * );
 */
export async function sendPasswordResetEmail(
  client: IMailgunClient,
  config: MailgunConfig,
  toEmail: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  const fromName = config.fromName || 'Tweeter';

  const messageData: MailgunMessageData = {
    from: `${fromName} <${config.fromEmail}>`,
    to: toEmail,
    subject: 'Reset Your Password - Tweeter',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f7fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2d3748; margin-top: 0;">Reset Your Password</h1>
            <p style="color: #4a5568; font-size: 16px;">You requested to reset your password for your Tweeter account.</p>
            <p style="color: #4a5568; font-size: 16px;">Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #4299e1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #718096; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
          </div>
          <div style="color: #a0aec0; font-size: 12px; text-align: center;">
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;"><a href="${resetUrl}" style="color: #4299e1;">${resetUrl}</a></p>
          </div>
          <div style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 20px;">
            <p>© ${new Date().getFullYear()} Tweeter. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Your Password

You requested to reset your password for your Tweeter account.

Click the link below to reset your password. This link will expire in 1 hour.

${resetUrl}

If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.

---
© ${new Date().getFullYear()} Tweeter. All rights reserved.
    `,
  };

  try {
    await client.messages.create(config.domain, messageData);
    console.log(`✅ Password reset email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${toEmail}:`, error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Send password changed confirmation email
 * Notifies user that their password was successfully changed
 *
 * @param client - Mailgun client
 * @param config - Email configuration
 * @param toEmail - Recipient email address
 *
 * @example
 * await sendPasswordChangedEmail(client, config, "user@example.com");
 */
export async function sendPasswordChangedEmail(
  client: IMailgunClient,
  config: MailgunConfig,
  toEmail: string
): Promise<void> {
  const fromName = config.fromName || 'Tweeter';
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const messageData: MailgunMessageData = {
    from: `${fromName} <${config.fromEmail}>`,
    to: toEmail,
    subject: 'Your Password Was Changed - Tweeter',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f7fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2d3748; margin-top: 0;">Password Changed Successfully</h1>
            <p style="color: #4a5568; font-size: 16px;">Your Tweeter password was changed on <strong>${timestamp}</strong>.</p>
            <p style="color: #4a5568; font-size: 16px;">If you made this change, you can safely ignore this email.</p>
            <div style="background: #fed7d7; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #c53030; font-size: 14px; margin: 0;"><strong>⚠️ If you did NOT make this change:</strong></p>
              <p style="color: #c53030; font-size: 14px; margin: 10px 0 0 0;">Please contact our support team immediately at support@tweeter.com. Your account may have been compromised.</p>
            </div>
          </div>
          <div style="color: #a0aec0; font-size: 12px; text-align: center;">
            <p><strong>Security Tips:</strong></p>
            <ul style="list-style: none; padding: 0; margin: 10px 0;">
              <li>• Never share your password with anyone</li>
              <li>• Use a unique password for each service</li>
              <li>• Enable two-factor authentication when available</li>
            </ul>
          </div>
          <div style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 20px;">
            <p>© ${new Date().getFullYear()} Tweeter. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Password Changed Successfully

Your Tweeter password was changed on ${timestamp}.

If you made this change, you can safely ignore this email.

⚠️ If you did NOT make this change:
Please contact our support team immediately at support@tweeter.com. Your account may have been compromised.

Security Tips:
• Never share your password with anyone
• Use a unique password for each service
• Enable two-factor authentication when available

---
© ${new Date().getFullYear()} Tweeter. All rights reserved.
    `,
  };

  try {
    await client.messages.create(config.domain, messageData);
    console.log(`✅ Password changed confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send password changed email to ${toEmail}:`, error);
    // Don't throw - this is a confirmation email, not critical
    // Log error but allow the password reset to succeed
  }
}
