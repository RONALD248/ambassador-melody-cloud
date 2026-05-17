import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Music, Search, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

const gallerySearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.enum(["all", "music", "video"]), "all").default("all"),
  category: fallback(
    z.enum(["all", "event", "practice", "performance", "tour", "other"]),
    "all",
  ).default("all"),
});

export const Route = createFileRoute("/gallery")({
  validateSearch: zodValidator(gallerySearchSchema),
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Media Gallery — AmbassadorsCloud" },
      { name: "description", content: "Listen to music and watch videos from the JKUSDA Ambassadors Choir." },
      { property: "og:title", content: "Media Gallery — AmbassadorsCloud" },
      { property: "og:description", content: "Listen to music and watch videos from the JKUSDA Ambassadors Choir." },
      { property: "og:url", content: "https://ambassador-melody-cloud.lovable.app/gallery" },
    ],
    links: [{ rel: "canonical", href: "https://ambassador-melody-cloud.lovable.app/gallery" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Media Gallery — AmbassadorsCloud",
          description: "Approved music and video performances from the JKUSDA Ambassadors Choir.",
          url: "https://ambassador-melody-cloud.lovable.app/gallery",
        }),
      },
    ],
  }),
});

function GalleryPage() {
  const { q: search, type: filter, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/gallery" });
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      let query = supabase
        .from("content")
        .select("*")
        .eq("status", "approved")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("content_type", filter);
      }
      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data } = await query;
      setContent(data || []);
      setLoading(false);
    }
    fetchContent();
  }, [filter, category]);

  const categories = ["all", "event", "performance", "practice", "tour", "other"] as const;

  type GallerySearch = z.infer<typeof gallerySearchSchema>;
  const setSearch = (v: string) =>
    navigate({ to: "/gallery", search: (prev: GallerySearch) => ({ ...prev, q: v }), replace: true });
  const setFilter = (v: "all" | "music" | "video") =>
    navigate({ to: "/gallery", search: (prev: GallerySearch) => ({ ...prev, type: v }) });
  const setCategory = (v: typeof category) =>
    navigate({ to: "/gallery", search: (prev: GallerySearch) => ({ ...prev, category: v }) });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Media Gallery</h1>
            <p className="mt-2 text-muted-foreground">
              Explore music and videos from the JKUSDA Ambassadors Choir
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
                aria-label="Search media"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {(["all", "music", "video"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "music" ? "Music" : "Videos"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    category === c ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <h2 className="sr-only">Performances</h2>
          {/* Content Grid */}
          {(() => {
            const qq = search.trim().toLowerCase();
            const filtered = qq
              ? content.filter(
                  (i) =>
                    i.title.toLowerCase().includes(qq) ||
                    (i.description?.toLowerCase().includes(qq) ?? false),
                )
              : content;

            if (loading) {
              return <div className="mt-16 text-center text-muted-foreground">Loading…</div>;
            }
            if (filtered.length === 0) {
              return (
                <div className="mt-16 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    {qq || filter !== "all" || category !== "all"
                      ? "No results match your filters."
                      : "No content available yet. Check back soon!"}
                  </p>
                </div>
              );
            }
            return (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            );
          })()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ContentCard({ item }: { item: Content }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {item.content_type === "music" ? (
          <div className="flex flex-col items-center gap-2 text-accent">
            <Music className="h-10 w-10" />
            <audio controls className="w-full max-w-[200px]" src={item.file_url || ""}>
              Your browser does not support audio.
            </audio>
          </div>
        ) : (
          <video
            controls
            className="h-full w-full object-cover"
            src={item.file_url || ""}
            preload="metadata"
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            item.content_type === "music"
              ? "bg-accent/10 text-accent"
              : "bg-primary/10 text-primary"
          }`}>
            {item.content_type}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
            {item.category}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{item.title}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString()}
          </p>
          <a
            href={item.file_url || ""}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}
