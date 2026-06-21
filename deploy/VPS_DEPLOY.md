# FreeCode AI - VPS Deployment Guide (Ubuntu)

## ⚡ Quick Deploy (1-command setup)

```bash
# SSH into your VPS first
ssh root@your-vps-ip

# Download and run setup script
bash <(curl -s https://raw.githubusercontent.com/YOUR_USER/freecode-ai/main/deploy/setup-vps.sh)
```

---

## 🛠️ Manual Step-by-Step

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash -
sudo apt install -y nodejs git nginx

# Verify
node -v   # Should be v24.x
npm -v    # Should be 10+
```

### 2. Install & Configure Claude Code CLI (FreeModel)

```bash
# Install Claude Code globally
sudo npm install -g @anthropic-ai/claude-code@2.1.177

# Test
claude --version   # Should show 2.1.177

# Create settings.json with FreeModel config
mkdir -p ~/.claude
```

Create `~/.claude/settings.json`:
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "your-freemodel-api-key-here",
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
```

> ⚠️ Get your FreeModel API key from: https://freemodel.dev/dashboard/keys

### 3. Deploy Project Files

```bash
# Option A: Clone from Git
git clone https://github.com/YOUR_USER/freecode-ai.git /opt/freecode-ai

# Option B: Upload via SCP (from your local machine)
scp -r freecode-ai/* root@your-vps-ip:/opt/freecode-ai/
```

### 4. Setup Backend

```bash
cd /opt/freecode-ai/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env   # Edit: JWT_SECRET, Razorpay keys, FRONTEND_URL
```

`.env` file:
```
PORT=3001
JWT_SECRET=generate-a-random-64-char-string
DATABASE_PATH=./data/freecode.db
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx
FRONTEND_URL=https://your-domain.com
```

### 5. Setup Frontend

```bash
cd /opt/freecode-ai/frontend

# Install dependencies
npm install

# Configure API URL
echo "NEXT_PUBLIC_API_URL=https://your-domain.com" > .env.local

# Build for production
npm run build
```

### 6. Setup PM2 (Process Manager)

```bash
# Install PM2
sudo npm install -g pm2

# Copy ecosystem config
cp /opt/freecode-ai/deploy/ecosystem.config.cjs /opt/freecode-ai/ecosystem.config.cjs

# Edit config with your domain
nano /opt/freecode-ai/ecosystem.config.cjs

# Start both services
cd /opt/freecode-ai
pm2 start ecosystem.config.cjs

# Save PM2 config (auto-restart on reboot)
pm2 save
sudo pm2 startup
```

### 7. Setup Nginx Reverse Proxy

```bash
# Copy Nginx config
sudo cp /opt/freecode-ai/deploy/nginx.conf /etc/nginx/sites-available/freecode-ai

# Edit with your domain
sudo nano /etc/nginx/sites-available/freecode-ai

# Enable site
sudo ln -sf /etc/nginx/sites-available/freecode-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Enable HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔄 How It Works (Free Tier Flow)

```
User sends message in IDE
        │
        ▼
Backend checks credits (50 shared via VPS Claude Code)
        │
        ├── Has credits & No API key?
        │       └── Run: echo "prompt" | claude --print
        │           (uses VPS's settings.json → FreeModel)
        │
        ├── Has own API key?
        │       └── Direct FreeModel API call with user's key
        │
        └── No credits?
                └── Show: "Buy Pro plan or add your API key"
```

### Credit System
| Resource | Free Tier | Pro (₹299/mo) |
|----------|-----------|---------------|
| Requests | 50 (shared VPS Claude Code) | Unlimited (own API or VPS) |
| Models | Claude Sonnet 4.6, Opus 4.7 | All models including Fable 5, GPT-5.5 |
| API Key | Not needed (uses VPS shared) | Optional (bring your own) |

---

## 📊 Monitoring

```bash
# Check service status
pm2 status
pm2 logs freecode-ai-backend
pm2 monit

# Check Claude Code CLI
claude --version
cat ~/.claude/settings.json

# Test CLI (should respond)
echo "say hello" | claude --print
```

---

## 🔒 Security Notes

1. **Change JWT_SECRET** to a random 64-char string
2. **Restrict /root/.claude/settings.json** permissions:
   ```bash
   chmod 600 ~/.claude/settings.json
   ```
3. **Enable firewall**:
   ```bash
   ufw allow 22,80,443/tcp
   ufw enable
   ```
4. **Regular updates**:
   ```bash
   apt update && apt upgrade -y
   npm update -g @anthropic-ai/claude-code
   ```

---

## 🐛 Troubleshooting

**Claude Code CLI not found:**
```bash
which claude
npm list -g @anthropic-ai/claude-code
```

**"claude --print" hangs:**
- Check internet connectivity
- Verify FreeModel API key in settings.json
- Test: `curl -X POST https://cc.freemodel.dev/v1/messages -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" -d '{"model":"claude-sonnet-4-6","max_tokens":50,"messages":[{"role":"user","content":"hi"}]}'`

**Backend can't find claude command:**
```bash
# Add to .env
CLAUDE_PATH=$(which claude)
echo "CLAUDE_PATH=$CLAUDE_PATH" >> /opt/freecode-ai/backend/.env
```

**PM2 processes keep crashing:**
```bash
pm2 logs --lines 50
# Check Node memory
free -h
```
