import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Play, Music, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Media Gallery — AmbassadorsCloud" },
      { name: "description", content: "Listen to music and watch videos from the JKUSDA Ambassadors Choir." },
    ],
  }),
});

function GalleryPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "music" | "video">("all");
  const [category, setCategory] = useState<"all" | "event" | "practice" | "performance" | "tour" | "other">("all");

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

  const categories = ["all", "event", "practice", "performance", "tour", "other"];

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

          {/* Filters */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
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

          {/* Content Grid */}
          {loading ? (
            <div className="mt-16 text-center text-muted-foreground">Loading…</div>
          ) : content.length === 0 ? (
            <div className="mt-16 text-center">
              <Music className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No content available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
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
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
