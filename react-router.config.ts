import type { Config } from '@react-router/dev/config';

export default {
  // Server-side rendering configuration
  ssr: true,

  // App directory
  appDirectory: 'app',

  // Server build output
  serverBuildFile: 'index.js',
} satisfies Config;
