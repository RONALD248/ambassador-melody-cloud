import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { FileText, Download, Search, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

function getExt(path: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return m ? m[1] : "";
}

type PreviewKind = "pdf" | "image" | "text" | "office" | "unsupported";

function getPreviewKind(path: string): PreviewKind {
  const ext = getExt(path);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["txt", "md", "csv", "log", "json", "xml"].includes(ext)) return "text";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
  return "unsupported";
}

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
  head: () => ({
    meta: [{ title: "Documents — AmbassadorsCloud" }],
  }),
});

function DocumentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Content | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (!previewDoc) {
      setTextContent(null);
      return;
    }
    const kind = getPreviewKind(previewDoc.file_path || previewDoc.file_url || "");
    if (kind === "text" && previewDoc.file_url) {
      setTextLoading(true);
      fetch(previewDoc.file_url)
        .then((r) => r.text())
        .then((t) => setTextContent(t.slice(0, 200_000)))
        .catch(() => setTextContent("Failed to load preview."))
        .finally(() => setTextLoading(false));
    }
  }, [previewDoc]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetch() {
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "document" as any)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setDocs(data || []);
      setLoading(false);
    }
    fetch();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  const qq = search.trim().toLowerCase();
  const filtered = qq
    ? docs.filter((d) => d.title.toLowerCase().includes(qq) || (d.description?.toLowerCase().includes(qq) ?? false))
    : docs;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Documents</h1>
          <p className="mt-1 text-muted-foreground">Files shared within the choir community.</p>

          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
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

          {loading ? (
            <p className="mt-12 text-center text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="mt-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                {qq ? "No documents match your search." : "No documents available yet."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{d.title}</p>
                      {d.description && (
                        <p className="text-xs text-muted-foreground">{d.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground capitalize">
                        {d.category} · {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={d.file_url || ""}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
