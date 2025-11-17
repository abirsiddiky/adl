import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cobalt API endpoint (uses yt-dlp under the hood)
const COBALT_API = 'https://api.cobalt.tools/api/json';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Call Cobalt API (yt-dlp wrapper)
    try {
      const cobaltResponse = await fetch(COBALT_API, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          videoQuality: '1080',
          filenameStyle: 'basic',
          downloadMode: 'auto'
        })
      });

      const cobaltData = await cobaltResponse.json();
      console.log('Cobalt API response:', cobaltData);

      // Handle Cobalt API response
      if (cobaltData.status === 'error' || cobaltData.status === 'rate-limit') {
        console.error('Cobalt API error:', cobaltData);
        return new Response(
          JSON.stringify({ 
            error: cobaltData.text || 'Failed to process video',
            details: 'The video service returned an error. Please try again or use a different URL.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      // Build response with available formats
      const formats = [];
      const audioFormats = [];

      // Add the main download URL from Cobalt
      if (cobaltData.url) {
        formats.push({
          quality: 'Best Available',
          format: 'MP4',
          size: 'Variable',
          downloadUrl: cobaltData.url,
        });
      }

      // Add audio-only option if available
      if (cobaltData.audio) {
        audioFormats.push({
          quality: 'Best Available',
          format: 'MP3/M4A',
          size: 'Variable',
          downloadUrl: cobaltData.audio,
        });
      }

      // If picker array is available (multiple quality options)
      if (cobaltData.picker && Array.isArray(cobaltData.picker)) {
        cobaltData.picker.forEach((item: any, index: number) => {
          if (item.url) {
            formats.push({
              quality: item.type === 'video' ? `Option ${index + 1}` : 'Audio',
              format: item.type === 'video' ? 'MP4' : 'Audio',
              size: 'Variable',
              downloadUrl: item.url,
            });
          }
        });
      }

      // If no formats were found, add fallback
      if (formats.length === 0 && audioFormats.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No download links available',
            details: 'Could not extract download URLs from this video.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const videoInfo = {
        title: cobaltData.filename || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
        thumbnail,
        duration: 'Unknown',
        platform,
        formats: formats.length > 0 ? formats : [{
          quality: 'Available',
          format: 'MP4',
          size: 'Variable',
          downloadUrl: cobaltData.url || '#',
        }],
        audioFormats: audioFormats.length > 0 ? audioFormats : [{
          quality: 'Audio',
          format: 'Audio',
          size: 'Variable',
          downloadUrl: cobaltData.audio || '#',
        }],
      };

      console.log('Video info processed successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          videoInfo,
          message: 'Video processed successfully using yt-dlp (via Cobalt API)' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (apiError) {
      console.error('Cobalt API call failed:', apiError);
      
      // Fallback response if Cobalt API fails
      return new Response(
        JSON.stringify({ 
          error: 'Video processing service unavailable',
          details: 'The external video processing service is temporarily unavailable. Please try again later.',
          fallback: true
        }),
        { 
          status: 503,
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
