import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Music, Upload, Image, Play, Users, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-choir.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AmbassadorsCloud — JKUSDA Ambassadors Choir" },
      { name: "description", content: "The digital home of the JKUSDA Ambassadors Choir. Share music, photos, and videos with the community." },
      { property: "og:title", content: "AmbassadorsCloud — JKUSDA Ambassadors Choir" },
      { property: "og:description", content: "The digital home of the JKUSDA Ambassadors Choir. Share music, photos, and videos with the community." },
      { property: "og:url", content: "https://ambassador-melody-cloud.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://ambassador-melody-cloud.lovable.app/" }],
  }),
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary px-4 py-24 sm:py-32">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/90 to-primary" />
      </div>
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        {/* Musical note pattern */}
        <div className="absolute right-10 top-10 text-primary-foreground/5">
          <Music className="h-40 w-40" />
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80">
            <Music className="h-4 w-4 text-accent" />
            JKUSDA Ambassadors Choir
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
            Where Harmony{" "}
            <span className="text-accent">Comes Alive</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/70">
            Join our digital community. Upload and share choir performances, practice sessions, and memorable moments with the world.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg" className="gap-2 px-8 text-base">
                Join the Choir <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="heroOutline" size="lg" className="gap-2 px-8 text-base">
                <Play className="h-4 w-4" /> Explore Media
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: "Upload & Share",
      description: "Members can upload photos, music, and videos from choir events and performances.",
    },
    {
      icon: Shield,
      title: "Admin Approval",
      description: "All content is reviewed by admins before going live, ensuring quality and appropriateness.",
    },
    {
      icon: Image,
      title: "Private Gallery",
      description: "Member-only photo gallery for private moments and behind-the-scenes content.",
    },
    {
      icon: Play,
      title: "Public Performances",
      description: "Approved music and video performances are shared publicly for the world to enjoy.",
    },
    {
      icon: Users,
      title: "Community Hub",
      description: "A central place for choir members to connect, share, and celebrate together.",
    },
    {
      icon: Music,
      title: "Organized Content",
      description: "Filter content by events, practices, performances, tours, and more.",
    },
  ];

  return (
    <section className="bg-background px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything Your Choir Needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A complete platform for managing and sharing your choir's media content.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-secondary px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to Join the Choir Community?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Sign up today to start sharing your choir moments and enjoy exclusive member content.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/register">
            <Button variant="default" size="lg" className="px-8">
              Create Account
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
