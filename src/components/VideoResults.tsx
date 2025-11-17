import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Music, Video } from "lucide-react";
import { toast } from "sonner";

interface VideoFormat {
  quality: string;
  format: string;
  size: string;
  downloadUrl: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  formats: VideoFormat[];
  audioFormats: VideoFormat[];
}

interface VideoResultsProps {
  videoInfo: VideoInfo;
  onBack: () => void;
}

const VideoResults = ({ videoInfo, onBack }: VideoResultsProps) => {
  const handleDownload = (url: string, quality: string) => {
    console.log("Downloading:", url, quality);
    
    // Check if it's a placeholder URL
    if (url.startsWith('#')) {
      toast.error("Download link not available");
      return;
    }
    
    // For real URLs, open in new tab to trigger download
    window.open(url, '_blank');
    toast.success(`Starting download: ${quality}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6 hover:bg-muted"
      >
        ← Back to search
      </Button>

      <Card className="overflow-hidden border-border">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Thumbnail */}
          <div className="relative bg-muted">
            <img 
              src={videoInfo.thumbnail} 
              alt={videoInfo.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/640x360/FF385C/FFFFFF?text=Video';
              }}
            />
            <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium">
              {videoInfo.duration}
            </div>
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">
              {videoInfo.platform}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              {videoInfo.title}
            </h2>

            <Tabs defaultValue="video" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="video" className="gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="audio" className="gap-2">
                  <Music className="h-4 w-4" />
                  Audio Only
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-2">
                {videoInfo.formats.map((format, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {format.quality} • {format.format}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format.size}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(format.downloadUrl, format.quality)}
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="audio" className="space-y-2">
                {videoInfo.audioFormats.map((format, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {format.quality} • {format.format}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format.size}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(format.downloadUrl, format.quality)}
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground">
                ✅ <strong>Powered by yt-dlp:</strong> Real download links extracted using yt-dlp technology via Cobalt API.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoResults;
