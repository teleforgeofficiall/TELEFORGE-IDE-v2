module.exports = {
  apps: [
    {
      name: 'freecode-ai-backend',
      script: 'src/index.js',
      cwd: '/opt/freecode-ai/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        JWT_SECRET: 'change-this-to-a-random-secret-key',
        FRONTEND_URL: 'https://your-domain.com',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
    },
    {
      name: 'freecode-ai-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/opt/freecode-ai/frontend',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://your-domain.com',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
    },
  ],
};
