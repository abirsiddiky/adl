import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Download className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">ADL</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#downloader" className="text-foreground hover:text-primary transition-colors font-medium">
              Video Downloader
            </a>
            <a href="#how-to" className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact Us
            </a>
          </nav>

          <Button variant="ghost" className="md:hidden">
            Menu
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
