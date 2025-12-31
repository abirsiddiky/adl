# ADL - Online Video Downloader

A fast, free online video downloader supporting YouTube, Facebook, Instagram, TikTok, and more platforms. Built with React and powered by yt-dlp for reliable video extraction.

## ✨ Features

- 🎬 **Multi-Platform Support** - Download videos from YouTube, Facebook, Instagram, TikTok, Twitter/X, Vimeo, and 1000+ more sites
- 📊 **Multiple Quality Options** - Choose from 360p to 4K resolution
- 🎵 **Audio Extraction** - Download audio-only in MP3/M4A format
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- ⚡ **Rate Limiting** - Built-in abuse protection (10 requests/minute)
- 🔒 **Secure Processing** - Edge function handles all video extraction server-side

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Lovable Cloud Edge Functions |
| Video Processing | yt-dlp (self-hosted server) |

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or bun package manager
- A deployed yt-dlp server (see [Deployment Guide](./DEPLOYMENT-GUIDE.md))

### Installation

```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

The project uses Lovable Cloud, which automatically configures these environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Backend API URL (auto-configured) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key (auto-configured) |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier (auto-configured) |

### Backend Secret Configuration

⚠️ **Required:** Set the following secret in Lovable Cloud settings:

| Secret | Description | Example |
|--------|-------------|---------|
| `YTDLP_SERVER_URL` | Your deployed yt-dlp server URL | `https://ytdlp.yourdomain.com` |

**How to set the secret:**
1. Open your Lovable project
2. Go to Settings → Secrets
3. Add `YTDLP_SERVER_URL` with your server URL
4. The edge function will automatically use the new URL

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── Hero.tsx         # Main download interface
│   │   ├── VideoResults.tsx # Download results display
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Footer.tsx       # Site footer
│   │   ├── Features.tsx     # Feature showcase
│   │   └── HowTo.tsx        # Usage instructions
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Home page
│   │   └── NotFound.tsx     # 404 page
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   └── integrations/        # Backend integrations
├── supabase/
│   └── functions/           # Edge functions
│       └── process-video/   # Video processing function
├── public/                  # Static assets
├── DEPLOYMENT-GUIDE.md      # Detailed deployment instructions
└── README.md                # This file
```

## 🌐 Deployment

### Quick Deploy (Lovable)

1. Click **"Publish"** in the Lovable editor
2. Set the `YTDLP_SERVER_URL` secret to your yt-dlp server
3. Your app is live!

### Self-Hosted Deployment

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions:

- ✅ Setting up your yt-dlp server with Node.js
- ✅ Configuring API key authentication
- ✅ Deploying edge functions
- ✅ Nginx/Apache reverse proxy setup
- ✅ SSL certificate configuration
- ✅ Security hardening

## 🎥 Supported Platforms

| Platform | Status |
|----------|--------|
| YouTube | ✅ Full support |
| Facebook | ✅ Full support |
| Instagram | ✅ Full support |
| TikTok | ✅ Full support |
| Twitter/X | ✅ Full support |
| Vimeo | ✅ Full support |
| 1000+ more | ✅ Via yt-dlp |

## ⚡ Rate Limiting

The API includes built-in rate limiting to prevent abuse:

| Limit | Value |
|-------|-------|
| Requests per minute | 10 |
| Window duration | 60 seconds |
| Reset behavior | Automatic |

Users receive clear feedback when limits are reached, including the time until reset.

## 🔒 Security

- **No user data stored** - Stateless processing, no database required
- **Rate limiting** - Prevents abuse and DDoS attacks
- **API key protection** - yt-dlp server secured with authentication
- **CORS configured** - Only allows requests from your domain
- **Edge function isolation** - Server-side processing protects your infrastructure

## 🐛 Troubleshooting

### "yt-dlp server unavailable" Error

1. Verify your yt-dlp server is running and accessible
2. Check the `YTDLP_SERVER_URL` secret is set correctly
3. Ensure the URL includes the protocol (https://)
4. Check server logs for connection issues

### Rate Limit Exceeded

- Wait for the cooldown period (shown in error message)
- The limit resets automatically after 60 seconds

### Video Not Found

- Verify the video URL is valid and publicly accessible
- Some private or age-restricted videos may not be accessible
- Try a different video to test functionality

## 📄 License

© 2025 ADL. All rights reserved.

---

Built with ❤️ using [Lovable](https://lovable.dev)
