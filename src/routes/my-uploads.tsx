import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Image, Music, Play, Clock, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

export const Route = createFileRoute("/my-uploads")({
  component: MyUploadsPage,
  head: () => ({
    meta: [{ title: "My Uploads — AmbassadorsCloud" }],
  }),
});

function MyUploadsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setContent(data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Delete this upload?")) return;
    await supabase.storage.from("media").remove([filePath]);
    await supabase.from("content").delete().eq("id", id);
    setContent((prev) => prev.filter((c) => c.id !== id));
  };

  if (isLoading || !isAuthenticated) return null;

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold text-foreground">My Uploads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track the status of your uploaded content.</p>

          {loading ? (
            <p className="mt-12 text-center text-muted-foreground">Loading…</p>
          ) : content.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">You haven't uploaded anything yet.</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/upload" })}>Upload Content</Button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {content.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    {item.content_type === "photo" ? (
                      <Image className="h-5 w-5 text-primary" />
                    ) : item.content_type === "music" ? (
                      <Music className="h-5 w-5 text-accent" />
                    ) : item.content_type === "video" ? (
                      <Play className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category} · {item.content_type} · {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      {item.status === "rejected" && item.rejection_reason && (
                        <p className="mt-1 text-xs text-destructive">Reason: {item.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(item.status)}
                      <span className={`text-xs font-medium capitalize ${
                        item.status === "approved" ? "text-success" : item.status === "rejected" ? "text-destructive" : "text-warning"
                      }`}>{item.status}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id, item.file_path)} aria-label={`Delete ${item.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
