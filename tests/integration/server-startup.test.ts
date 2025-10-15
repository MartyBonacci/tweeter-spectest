/**
 * Regression Test: Bug 903 - Backend Server Not Running
 *
 * Purpose: Ensure backend server can start with environment variables loaded from .env
 *
 * This test should:
 * - Fail before fix (proves dotenv not configured)
 * - Pass after fix (proves server starts with loaded env)
 * - Prevent future regressions (catches if dotenv removed)
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug 903: Backend Server Startup Validation', () => {
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, 'package.json');
  const serverIndexPath = join(projectRoot, 'src/server/index.ts');

  let serverProcess: ChildProcess | null = null;

  afterAll(() => {
    // Kill server if running
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
  });

  it('should have dotenv package installed', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    const hasDotenv =
      packageJson.dependencies?.dotenv ||
      packageJson.devDependencies?.dotenv;

    expect(hasDotenv).toBeDefined();
  });

  it('src/server/index.ts should import dotenv config', () => {
    expect(existsSync(serverIndexPath)).toBe(true);

    const content = readFileSync(serverIndexPath, 'utf-8');

    // Must import dotenv/config or call dotenv.config()
    const hasImport =
      content.includes("import 'dotenv/config'") ||
      (content.includes("from 'dotenv'") && content.includes('dotenv.config()'));

    expect(hasImport).toBe(true);
  });

  it(
    'backend server should start and respond to health check',
    async () => {
      // Start server process
      serverProcess = spawn('npm', ['run', 'dev:server'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      // Wait for server to start (look for success message in stdout)
      const serverReady = await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout - server did not start within 15 seconds'));
        }, 15000);

        let stdoutData = '';
        let stderrData = '';

        serverProcess!.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();
          stdoutData += output;

          // Look for server ready message
          if (output.includes('Server running') || output.includes('listening')) {
            clearTimeout(timeout);
            resolve(true);
          }
        });

        serverProcess!.stderr?.on('data', (data: Buffer) => {
          stderrData += data.toString();
        });

        serverProcess!.on('exit', (code) => {
          clearTimeout(timeout);
          if (code !== 0) {
            reject(
              new Error(
                `Server process exited with code ${code}\nStdout: ${stdoutData}\nStderr: ${stderrData}`
              )
            );
          }
        });
      });

      expect(serverReady).toBe(true);

      // Wait a bit for server to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Make health check request
      const response = await fetch('http://localhost:3000/api/health');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
    },
    30000
  ); // 30 second timeout for this test
});
