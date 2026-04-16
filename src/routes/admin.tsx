import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Image, Music, Play, Eye, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin Dashboard — AmbassadorsCloud" }],
  }),
});

function AdminPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<(Content & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });

      if (data) {
        // Fetch profiles for uploaders
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const enriched = data.map((c) => ({
          ...c,
          profile: profiles?.find((p) => p.user_id === c.user_id),
        }));
        setContent(enriched);
      }
      setLoading(false);
    }
    fetch();
  }, [isAdmin, tab]);

  const handleApprove = async (id: string) => {
    await supabase.from("content").update({ status: "approved" }).eq("id", id);
    setContent((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReject = async (id: string) => {
    const reason = rejectionReason[id] || "";
    await supabase.from("content").update({ status: "rejected", rejection_reason: reason || null }).eq("id", id);
    setContent((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Permanently delete this content?")) return;
    await supabase.storage.from("media").remove([filePath]);
    await supabase.from("content").delete().eq("id", id);
    setContent((prev) => prev.filter((c) => c.id !== id));
  };

  if (isLoading || !isAdmin) return null;

  const tabs = [
    { key: "pending" as const, label: "Pending", icon: Clock, color: "text-warning" },
    { key: "approved" as const, label: "Approved", icon: CheckCircle, color: "text-success" },
    { key: "rejected" as const, label: "Rejected", icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage uploaded content.</p>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 rounded-lg border border-border bg-card p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content List */}
          {loading ? (
            <p className="mt-12 text-center text-muted-foreground">Loading…</p>
          ) : content.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">No {tab} content.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {content.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {item.content_type === "photo" ? (
                        <Image className="mt-0.5 h-5 w-5 text-primary" />
                      ) : item.content_type === "music" ? (
                        <Music className="mt-0.5 h-5 w-5 text-accent" />
                      ) : (
                        <Play className="mt-0.5 h-5 w-5 text-primary" />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{item.content_type}</span>
                          <span>·</span>
                          <span className="capitalize">{item.category}</span>
                          <span>·</span>
                          <span>{item.visibility === "public" ? "Public" : "Members Only"}</span>
                          <span>·</span>
                          <span>By {item.profile?.display_name || "Unknown"}</span>
                          <span>·</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.rejection_reason && (
                          <p className="mt-2 text-xs text-destructive">Reason: {item.rejection_reason}</p>
                        )}
                      </div>
                    </div>

                    {/* Preview link */}
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  {tab === "pending" && (
                    <div className="mt-4 flex items-end gap-3 border-t border-border pt-4">
                      <Button variant="success" size="sm" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                      <div className="flex flex-1 items-end gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Rejection reason (optional)"
                            value={rejectionReason[item.id] || ""}
                            onChange={(e) => setRejectionReason((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(item.id)}>
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {tab !== "pending" && (
                    <div className="mt-4 flex justify-end border-t border-border pt-4">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id, item.file_path)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  )}
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
