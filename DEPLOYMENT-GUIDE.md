# ADL Video Downloader - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Node.js (v18 or higher)
- npm or bun package manager
- A server with yt-dlp installed
- Supabase account (or your own PostgreSQL database)

## Files Included

This application consists of:
- Frontend React application (Vite + TypeScript + Tailwind CSS)
- Supabase Edge Functions for video processing
- Configuration files

## Step 1: Download Project Files

### Option A: Using Git (Recommended)
```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_NAME>
```

### Option B: Download from Lovable
1. Go to your Lovable project
2. Click on the GitHub icon to connect and push to GitHub
3. Clone from your GitHub repository

## Step 2: Install Dependencies

```bash
npm install
# or
bun install
```

## Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### Getting Supabase Credentials:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Project Settings > API
4. Copy the Project URL and anon/public key

## Step 4: Set Up Your yt-dlp Server

### Installing yt-dlp on Your Server

#### Linux/Ubuntu:
```bash
sudo apt update
sudo apt install python3 python3-pip ffmpeg
pip3 install yt-dlp
```

#### Using Docker (Recommended):
```bash
docker run -d \
  --name ytdlp-server \
  -p 3000:3000 \
  -v /path/to/downloads:/downloads \
  jauderho/yt-dlp:latest
```

### Creating a yt-dlp API Endpoint

You'll need to create a simple HTTP wrapper around yt-dlp. Here's a basic Node.js example:

**server.js** (place on your server):
```javascript
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/api/video-info', (req, res) => {
  const { url } = req.body;
  
  exec(`yt-dlp -J "${url}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(400).json({ error: stderr });
    }
    res.json(JSON.parse(stdout));
  });
});

app.listen(3000, () => {
  console.log('yt-dlp server running on port 3000');
});
```

## Step 5: Configure Edge Function

Update `supabase/functions/process-video/index.ts` to point to your yt-dlp server:

```typescript
const YTDLP_SERVER = 'https://your-server.com:3000'; // Your yt-dlp server URL
```

## Step 6: Deploy Supabase Edge Functions

### Install Supabase CLI:
```bash
npm install -g supabase
```

### Login and Link Project:
```bash
supabase login
supabase link --project-ref your-project-id
```

### Deploy Edge Functions:
```bash
supabase functions deploy process-video
```

## Step 7: Build Frontend

### For Development:
```bash
npm run dev
```

### For Production:
```bash
npm run build
```

This creates a `dist` folder with optimized static files.

## Step 8: Deploy Frontend

### Option A: Static Hosting (Netlify, Vercel, Cloudflare Pages)

1. **Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

2. **Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

### Option B: Your Own Server (Nginx)

1. **Copy files to server:**
   ```bash
   scp -r dist/* user@your-server:/var/www/adl-downloader
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/adl-downloader;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

### Option C: Apache

1. **Copy files:**
   ```bash
   cp -r dist/* /var/www/html/adl-downloader
   ```

2. **Create .htaccess:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## Step 9: SSL Certificate (HTTPS)

For production, use Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Server Requirements

### Minimum:
- 1 CPU Core
- 2GB RAM
- 20GB Storage
- Ubuntu 20.04 or higher

### Recommended:
- 2+ CPU Cores
- 4GB+ RAM
- 50GB+ Storage
- CDN for static assets

## Troubleshooting

### Edge Function Errors:
```bash
# View logs
supabase functions logs process-video
```

### Build Errors:
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### yt-dlp Not Working:
```bash
# Update yt-dlp
pip3 install -U yt-dlp

# Test manually
yt-dlp -F "https://www.youtube.com/watch?v=test"
```

## Security Considerations

1. **Rate Limiting:** Implement rate limiting on your yt-dlp server
2. **CORS:** Configure proper CORS headers
3. **API Keys:** Use environment variables, never commit secrets
4. **Firewall:** Only allow necessary ports (80, 443)
5. **Updates:** Keep yt-dlp and dependencies updated

## Monitoring

### Log Files:
- Frontend: Browser console
- Edge Functions: Supabase dashboard
- yt-dlp Server: `/var/log/ytdlp.log`

### Health Checks:
Create a health endpoint on your yt-dlp server:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Redeploy edge functions if changed
supabase functions deploy process-video

# Copy new files to server
scp -r dist/* user@server:/var/www/adl-downloader
```

## Support

For issues or questions:
- Check browser console for frontend errors
- Check Supabase logs for backend errors
- Verify yt-dlp is working: `yt-dlp --version`

## License

© 2024 ADL. All rights reserved.
