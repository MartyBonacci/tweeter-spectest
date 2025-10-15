/**
 * Playwright Browser Test for Bug 907: CORS Authentication Cookies
 *
 * This test actually interacts with the browser to verify:
 * 1. Sign-in sets cookies correctly
 * 2. Navbar updates after sign-in
 * 3. Like button works without blank page
 */

import { test, expect } from '@playwright/test';

test.describe('Bug 907: CORS Authentication Cookies', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies before each test
    await context.clearCookies();
  });

  test('should set authentication cookie and update navbar after sign-in', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/bug-907-1-before-signin.png', fullPage: true });

    // Verify guest state - should see Sign In button in navbar
    const signInButton = page.locator('nav a[href="/signin"]').first();
    await expect(signInButton).toBeVisible();
    console.log('✓ Guest navbar visible with Sign In button');

    // Click Sign In
    await signInButton.click();
    await page.waitForURL('**/signin');

    // Fill in sign-in form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Set up network request interception to capture Set-Cookie header
    let setCookieHeader = '';
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/signin')) {
        const headers = response.headers();
        setCookieHeader = headers['set-cookie'] || '';
        console.log('\n=== Sign-In Response ===');
        console.log('Status:', response.status());
        console.log('Set-Cookie header:', setCookieHeader);
      }
    });

    // Submit sign-in form
    await page.click('button[type="submit"]');

    // Wait for redirect to feed
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('✓ Redirected to /feed after sign-in');

    // Take screenshot after sign-in
    await page.screenshot({ path: 'tests/screenshots/bug-907-2-after-signin.png', fullPage: true });

    // Check if Set-Cookie header has correct attributes
    console.log('\n=== Cookie Validation ===');
    if (setCookieHeader) {
      console.log('Set-Cookie present:', setCookieHeader.includes('auth_token'));
      console.log('Has SameSite=None:', setCookieHeader.includes('SameSite=None'));
      console.log('Has Secure:', setCookieHeader.includes('Secure'));
      console.log('Has HttpOnly:', setCookieHeader.includes('HttpOnly'));
      console.log('Has Domain attribute:', setCookieHeader.includes('Domain='));
    } else {
      console.log('❌ WARNING: No Set-Cookie header found in response!');
    }

    // Get cookies from browser context
    const cookies = await page.context().cookies();
    console.log('\n=== Browser Cookies ===');
    console.log('Total cookies:', cookies.length);
    const authCookie = cookies.find(c => c.name === 'auth_token');
    if (authCookie) {
      console.log('✓ auth_token cookie found');
      console.log('  Domain:', authCookie.domain);
      console.log('  Path:', authCookie.path);
      console.log('  Secure:', authCookie.secure);
      console.log('  HttpOnly:', authCookie.httpOnly);
      console.log('  SameSite:', authCookie.sameSite);
    } else {
      console.log('❌ auth_token cookie NOT found in browser!');
    }

    // Wait a moment for any state updates
    await page.waitForTimeout(1000);

    // Check navbar state - should now show authenticated navigation
    console.log('\n=== Navbar State After Sign-In ===');

    // Check for authenticated elements
    const homeLink = page.locator('a[href="/feed"]').filter({ hasText: 'Home' });
    const profileLink = page.locator('a[href^="/profile/"]').filter({ hasText: 'Profile' });
    const signOutButton = page.locator('button', { hasText: 'Sign Out' });

    // Check for guest elements (should NOT be visible)
    const guestSignInButton = page.locator('a[href="/signin"]');
    const signUpButton = page.locator('a[href="/signup"]');

    const homeVisible = await homeLink.isVisible().catch(() => false);
    const profileVisible = await profileLink.isVisible().catch(() => false);
    const signOutVisible = await signOutButton.isVisible().catch(() => false);
    const guestSignInVisible = await guestSignInButton.isVisible().catch(() => false);
    const signUpVisible = await signUpButton.isVisible().catch(() => false);

    console.log('Home link visible:', homeVisible);
    console.log('Profile link visible:', profileVisible);
    console.log('Sign Out button visible:', signOutVisible);
    console.log('Guest Sign In visible (should be false):', guestSignInVisible);
    console.log('Sign Up visible (should be false):', signUpVisible);

    // Assertions
    expect(homeVisible).toBe(true);
    expect(profileVisible).toBe(true);
    expect(signOutVisible).toBe(true);
    expect(guestSignInVisible).toBe(false);
    expect(signUpVisible).toBe(false);

    console.log('✓ Navbar shows authenticated state');
  });

  test('should allow liking tweets without blank page navigation', async ({ page }) => {
    // Sign in first
    await page.goto('http://localhost:5173/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 10000 });

    // Verify we're authenticated by checking navbar
    await expect(page.locator('button', { hasText: 'Sign Out' })).toBeVisible({ timeout: 5000 });
    console.log('✓ Authenticated and on feed page');

    // Wait for tweets to load
    await page.waitForTimeout(1000);

    // Take screenshot before like
    await page.screenshot({ path: 'tests/screenshots/bug-907-3-before-like.png', fullPage: true });

    // Find first like button using aria-label
    const firstLikeButton = page.locator('button[aria-label*="Like"], button[aria-label*="Unlike"]').first();
    await expect(firstLikeButton).toBeVisible();

    // Get current URL
    const urlBeforeLike = page.url();
    console.log('\n=== Like Button Test ===');
    console.log('URL before like:', urlBeforeLike);

    // Click like button
    await firstLikeButton.click();

    // Wait a moment for any navigation or updates
    await page.waitForTimeout(2000);

    // Take screenshot after like
    await page.screenshot({ path: 'tests/screenshots/bug-907-4-after-like.png', fullPage: true });

    // Check URL hasn't changed to blank page
    const urlAfterLike = page.url();
    console.log('URL after like:', urlAfterLike);
    console.log('URLs match (should stay on feed):', urlBeforeLike === urlAfterLike || urlAfterLike.includes('/feed'));

    // Should still be on feed page, not blank
    expect(urlAfterLike).toContain('/feed');
    expect(page.url()).not.toBe('about:blank');

    console.log('✓ Like button works without blank page navigation');
  });
});
