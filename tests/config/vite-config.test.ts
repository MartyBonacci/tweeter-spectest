/**
 * Regression Test: Bug 901 - Vite Config Missing
 *
 * Purpose: Ensure vite.config.ts exists and contains React Router plugin
 *
 * This test should:
 * - Fail before fix (proves bug exists)
 * - Pass after fix (proves bug fixed)
 * - Prevent future regressions (catches if config removed)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 901: Vite Configuration Validation', () => {
  const projectRoot = process.cwd();
  const viteConfigPath = join(projectRoot, 'vite.config.ts');

  it('should have vite.config.ts file in project root', () => {
    const fileExists = existsSync(viteConfigPath);

    expect(fileExists).toBe(true);
  });

  it('vite.config.ts should import React Router plugin', () => {
    // Skip if file doesn't exist (covered by previous test)
    if (!existsSync(viteConfigPath)) {
      return;
    }

    const content = readFileSync(viteConfigPath, 'utf-8');

    // Must import reactRouter from @react-router/dev/vite
    expect(content).toContain('@react-router/dev/vite');
    expect(content).toContain('reactRouter');
  });

  it('vite.config.ts should use defineConfig from vite', () => {
    // Skip if file doesn't exist
    if (!existsSync(viteConfigPath)) {
      return;
    }

    const content = readFileSync(viteConfigPath, 'utf-8');

    // Must use defineConfig
    expect(content).toContain('defineConfig');
  });

  it('vite.config.ts should include reactRouter plugin in configuration', () => {
    // Skip if file doesn't exist
    if (!existsSync(viteConfigPath)) {
      return;
    }

    const content = readFileSync(viteConfigPath, 'utf-8');

    // Must include plugins array with reactRouter()
    expect(content).toContain('plugins');
    expect(content).toContain('reactRouter()');
  });
});
