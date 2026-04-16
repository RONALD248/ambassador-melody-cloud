import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Image, Download } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

export const Route = createFileRoute("/private-gallery")({
  component: PrivateGalleryPage,
  head: () => ({
    meta: [{ title: "Photo Gallery — AmbassadorsCloud" }],
  }),
});

function PrivateGalleryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Content | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetch() {
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "photo")
        .eq("status", "approved")
        .eq("visibility", "members_only")
        .order("created_at", { ascending: false });
      setPhotos(data || []);
      setLoading(false);
    }
    fetch();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Members Photo Gallery</h1>
          <p className="mt-1 text-muted-foreground">Private photos shared within the choir community.</p>

          {loading ? (
            <p className="mt-12 text-center text-muted-foreground">Loading…</p>
          ) : photos.length === 0 ? (
            <div className="mt-12 text-center">
              <Image className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No photos available yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.file_url || ""}
                      alt={photo.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="bg-card p-3">
                    <p className="text-sm font-medium text-foreground">{photo.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{photo.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.file_url || ""} alt={selectedPhoto.title} className="max-h-[70vh] w-full object-contain" />
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-display font-semibold text-foreground">{selectedPhoto.title}</p>
                {selectedPhoto.description && <p className="mt-1 text-sm text-muted-foreground">{selectedPhoto.description}</p>}
              </div>
              <a
                href={selectedPhoto.file_url || ""}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
