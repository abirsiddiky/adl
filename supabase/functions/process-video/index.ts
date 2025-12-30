import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// CONFIGURATION - Update these for your server
// ============================================

// Your self-hosted yt-dlp server endpoint (update this!)
const YTDLP_SERVER = Deno.env.get('YTDLP_SERVER_URL') || 'http://localhost:3000';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

// In-memory rate limit store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ============================================
// RATE LIMITING
// ============================================

function getClientIP(req: Request): string {
  // Try various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }
  return 'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [ip, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count, 
    resetIn: record.resetTime - now 
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP and check rate limit
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);

  console.log(`Request from IP: ${clientIP}, Rate limit remaining: ${rateLimit.remaining}`);

  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        details: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
        } 
      }
    );
  }

  try {
    const { url } = await req.json();
    
    console.log('Processing video URL with yt-dlp:', url);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let videoUrl: URL;
    try {
      videoUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine platform
    const hostname = videoUrl.hostname.toLowerCase();
    let platform = 'unknown';
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      platform = 'youtube';
    } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      platform = 'facebook';
    } else if (hostname.includes('instagram.com')) {
      platform = 'instagram';
    } else if (hostname.includes('tiktok.com')) {
      platform = 'tiktok';
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      platform = 'twitter';
    } else if (hostname.includes('vimeo.com')) {
      platform = 'vimeo';
    }

    console.log('Detected platform:', platform);

    // Extract video ID for thumbnail
    let videoId = '';
    let thumbnail = 'https://via.placeholder.com/1280x720/FF385C/FFFFFF?text=Video+Thumbnail';
    
    if (platform === 'youtube') {
      if (hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.slice(1);
      } else {
        videoId = videoUrl.searchParams.get('v') || '';
      }
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Call your self-hosted yt-dlp server
    try {
      console.log('Calling yt-dlp server:', YTDLP_SERVER);
      
      const ytdlpResponse = await fetch(`${YTDLP_SERVER}/api/video-info`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!ytdlpResponse.ok) {
        throw new Error(`yt-dlp server returned ${ytdlpResponse.status}`);
      }

      const ytdlpData = await ytdlpResponse.json();
      console.log('yt-dlp response received, title:', ytdlpData.title || 'Unknown');

      // Build response with available formats from yt-dlp
      const formats = [];
      const audioFormats = [];

      // Parse yt-dlp formats
      if (ytdlpData.formats && Array.isArray(ytdlpData.formats)) {
        // Video formats
        const videoFormats = ytdlpData.formats.filter((f: any) => 
          f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4'
        );
        
        videoFormats.slice(0, 5).forEach((f: any) => {
          formats.push({
            quality: f.height ? `${f.height}p` : f.format_note || 'Unknown',
            format: f.ext?.toUpperCase() || 'MP4',
            size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(1)} MB` : 'Variable',
            downloadUrl: f.url || '#',
          });
        });

        // Audio formats
        const audioOnly = ytdlpData.formats.filter((f: any) => 
          f.vcodec === 'none' && f.acodec !== 'none'
        );
        
        audioOnly.slice(0, 3).forEach((f: any) => {
          audioFormats.push({
            quality: f.abr ? `${f.abr}kbps` : 'Audio',
            format: f.ext?.toUpperCase() || 'Audio',
            size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(1)} MB` : 'Variable',
            downloadUrl: f.url || '#',
          });
        });
      }

      // Fallback if no formats parsed
      if (formats.length === 0) {
        formats.push({
          quality: 'Best Available',
          format: 'MP4',
          size: 'Variable',
          downloadUrl: ytdlpData.url || url,
        });
      }

      if (audioFormats.length === 0) {
        audioFormats.push({
          quality: 'Audio',
          format: 'M4A',
          size: 'Variable',
          downloadUrl: '#',
        });
      }

      const videoInfo = {
        title: ytdlpData.title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
        thumbnail: ytdlpData.thumbnail || thumbnail,
        duration: ytdlpData.duration ? formatDuration(ytdlpData.duration) : 'Unknown',
        platform,
        formats,
        audioFormats,
      };

      console.log('Video info processed successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          videoInfo,
          message: 'Video processed successfully using yt-dlp',
          rateLimit: {
            remaining: rateLimit.remaining,
            resetIn: Math.ceil(rateLimit.resetIn / 1000)
          }
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          }
        }
      );

    } catch (apiError) {
      console.error('yt-dlp server call failed:', apiError);
      
      // Fallback response if yt-dlp server fails
      const fallbackVideoInfo = {
        title: 'Demo Video (yt-dlp server unavailable)',
        thumbnail,
        duration: 'Unknown',
        platform,
        formats: [
          {
            quality: 'Fallback',
            format: 'MP4',
            size: 'Unknown',
            downloadUrl: url,
          },
        ],
        audioFormats: [
          {
            quality: 'Fallback Audio',
            format: 'Audio',
            size: 'Unknown',
            downloadUrl: '#',
          },
        ],
      };

      return new Response(
        JSON.stringify({ 
          success: true,
          fallback: true,
          videoInfo: fallbackVideoInfo,
          message: 'yt-dlp server is unavailable. Please ensure your server is running.',
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error processing video:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
