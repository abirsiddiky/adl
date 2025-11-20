import { Zap, Shield, Clock, Smartphone, Globe, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Download videos at incredible speeds with our optimized servers",
  },
  {
    icon: Shield,
    title: "100% Safe",
    description: "No malware, no ads, no tracking - your privacy is our priority",
  },
  {
    icon: Clock,
    title: "No Registration",
    description: "Start downloading immediately without creating an account",
  },
  {
    icon: Smartphone,
    title: "All Devices",
    description: "Works perfectly on desktop, mobile, and tablet browsers",
  },
  {
    icon: Globe,
    title: "Multiple Platforms",
    description: "Support for YouTube, Facebook, Instagram, and many more",
  },
  {
    icon: Sparkles,
    title: "HD Quality",
    description: "Download videos in original quality up to 4K resolution",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Why Choose ADL?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The most reliable and feature-rich video downloader available online
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md group"
            >
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
