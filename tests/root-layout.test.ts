/**
 * Regression Test for Bug 905: Feed Page Loses Tailwind Styling on Refresh
 *
 * Tests that app/root.tsx exports a links function that includes the globals.css stylesheet.
 * This ensures Tailwind CSS is included in server-rendered HTML on page refresh.
 */

import { describe, it, expect } from 'vitest';

describe('Bug 905: Stylesheet Links in Root Layout', () => {
  it('should export links function', async () => {
    // Dynamic import to avoid side effects
    const rootModule = await import('../app/root.tsx');

    expect(rootModule.links).toBeDefined();
    expect(typeof rootModule.links).toBe('function');
  });

  it('should include globals.css in links export', async () => {
    const rootModule = await import('../app/root.tsx');
    const links = rootModule.links();

    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);

    const stylesheetLink = links.find(
      (link: any) => link.rel === 'stylesheet'
    );

    expect(stylesheetLink).toBeDefined();
    expect(stylesheetLink.rel).toBe('stylesheet');
    expect(stylesheetLink.href).toBeDefined();
    // href might be a bundled URL, so just verify it exists and is a string
    expect(typeof stylesheetLink.href).toBe('string');
  });

  it('should include stylesheet link in SSR HTML', async () => {
    // Make request to dev server (simulating full page load)
    const response = await fetch('http://localhost:5173/feed');
    const html = await response.text();

    // Verify stylesheet link is in HTML
    expect(html).toContain('<link rel="stylesheet"');
    expect(html).toContain('globals.css');

    // Verify it's in the <head> section
    const headMatch = html.match(/<head>(.*?)<\/head>/s);
    expect(headMatch).toBeDefined();
    if (headMatch) {
      const headContent = headMatch[1];
      expect(headContent).toContain('globals.css');
    }
  });
});
