import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Youtube, Facebook, Instagram, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  formats: Array<{
    quality: string;
    format: string;
    size: string;
    downloadUrl: string;
  }>;
  audioFormats: Array<{
    quality: string;
    format: string;
    size: string;
    downloadUrl: string;
  }>;
}

interface HeroProps {
  onVideoProcessed: (videoInfo: VideoInfo) => void;
}

const Hero = ({ onVideoProcessed }: HeroProps) => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error("Please paste a video URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: { url }
      });

      if (error) {
        console.error('Error processing video:', error);
        toast.error("Failed to process video. Please try again.");
        return;
      }

      if (data?.success && data?.videoInfo) {
        toast.success("Video processed successfully!");
        onVideoProcessed(data.videoInfo);
      } else {
        toast.error("Failed to extract video information");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center px-6 py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            ADL Online Video Downloader
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download videos from YouTube, Facebook, Instagram and more - fast, free, and easy
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-card rounded-xl shadow-lg border border-border">
            <Input
              type="url"
              placeholder="Paste a link here to download a video"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              onClick={handleDownload}
              disabled={isProcessing}
              size="lg"
              className="h-14 px-8 text-lg gap-2 bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="text-sm text-muted-foreground">Supported platforms:</span>
            <div className="flex gap-3">
              <Youtube className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
              <Facebook className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
              <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
