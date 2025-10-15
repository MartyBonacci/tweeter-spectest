/**
 * Regression Test: Bug 902 - Tailwind CSS Styles Not Loading
 *
 * Purpose: Ensure Tailwind CSS processing is configured correctly
 *
 * This test should:
 * - Fail before fix (proves PostCSS config missing)
 * - Pass after fix (proves PostCSS and CSS import working)
 * - Prevent future regressions (catches if config removed)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 902: Tailwind CSS Configuration Validation', () => {
  const projectRoot = process.cwd();
  const rootPath = join(projectRoot, 'app/root.tsx');
  const postcssConfigPath = join(projectRoot, 'postcss.config.js');
  const globalsCssPath = join(projectRoot, 'app/globals.css');

  it('should have app/root.tsx file', () => {
    expect(existsSync(rootPath)).toBe(true);
  });

  it('app/root.tsx should import globals.css', () => {
    const content = readFileSync(rootPath, 'utf-8');

    // Must import globals.css as side effect
    expect(content).toContain("import './globals.css'");
  });

  it('should have postcss.config.js file', () => {
    expect(existsSync(postcssConfigPath)).toBe(true);
  });

  it('postcss.config.js should include tailwindcss plugin', () => {
    const content = readFileSync(postcssConfigPath, 'utf-8');

    // Must include tailwindcss in plugins
    expect(content).toContain('tailwindcss');
  });

  it('app/globals.css should have Tailwind directives', () => {
    expect(existsSync(globalsCssPath)).toBe(true);

    const content = readFileSync(globalsCssPath, 'utf-8');

    // Must include Tailwind directives
    expect(content).toContain('@tailwind base');
    expect(content).toContain('@tailwind components');
    expect(content).toContain('@tailwind utilities');
  });
});
