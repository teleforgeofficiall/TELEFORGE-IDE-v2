#!/bin/bash
# FreeCode AI - VPS Setup Script (Ubuntu 22.04+)
# Run as: sudo bash setup-vps.sh

set -e

echo "============================================"
echo "  FreeCode AI - VPS Deployment"
echo "============================================"

# --- 1. System Update ---
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# --- 2. Install Node.js 24 ---
echo "[2/8] Installing Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node -v && npm -v

# --- 3. Install Build Tools ---
echo "[3/8] Installing build tools..."
apt install -y build-essential python3 git nginx

# --- 4. Install Claude Code CLI ---
echo "[4/8] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code@2.1.177
claude --version

# --- 5. Setup Claude Code Settings (FreeModel) ---
echo "[5/8] Configuring Claude Code for FreeModel..."
mkdir -p /root/.claude

cat > /root/.claude/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_FREEMODEL_API_KEY_HERE",
    "ANTHROPIC_BASE_URL": "https://cc.freemodel.dev",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE": "0"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "theme": "dark"
}
EOF

echo "  ⚠️  Edit /root/.claude/settings.json and add your FreeModel API key!"

# --- 6. Setup Project ---
echo "[6/8] Setting up FreeCode AI project..."
cd /opt
git clone https://github.com/teleforgeofficiall/TELEFORGE-IDE-v2.git || echo "  (Or copy files manually to /opt/TELEFORGE-IDE-v2)"
cd freecode-ai

# Backend setup
cd backend
npm install
cp .env.example .env

# --- 7. Setup PM2 for auto-restart ---
echo "[7/8] Installing PM2..."
npm install -g pm2

# Create backend ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'freecode-ai-backend',
    script: 'src/index.js',
    cwd: '/opt/freecode-ai/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      JWT_SECRET: 'change-this-to-a-random-string',
      FRONTEND_URL: 'https://your-domain.com',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
  }]
};
EOF

# Start backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# --- 8. Setup Nginx Reverse Proxy ---
echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/freecode-ai << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (Next.js on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for Terminal
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/freecode-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL with Let's Encrypt
echo ""
echo "  🔐 To enable HTTPS, run:"
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d your-domain.com"
echo ""

echo "============================================"
echo "  ✅ FreeCode AI setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit /root/.claude/settings.json → add FreeModel API key"
echo "  2. Edit /opt/freecode-ai/backend/.env → set JWT_SECRET + Razorpay keys"
echo "  3. Edit ecosystem.config.cjs → update JWT_SECRET"
echo "  4. Replace 'your-domain.com' in Nginx config"
echo "  5. Run: cd /opt/freecode-ai/frontend && npm install && npm run build"
echo "  6. Run: cd /opt/freecode-ai/frontend && npx next start -p 3000"
echo "============================================"
