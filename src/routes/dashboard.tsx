import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Upload, Image, Play, Music, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["content"]["Row"];

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — AmbassadorsCloud" }],
  }),
});

function DashboardPage() {
  const { isAuthenticated, isLoading, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentUploads, setRecentUploads] = useState<Content[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchStats() {
      const { data } = await supabase
        .from("content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setRecentUploads(data);
        setStats({
          total: data.length,
          pending: data.filter((c) => c.status === "pending").length,
          approved: data.filter((c) => c.status === "approved").length,
          rejected: data.filter((c) => c.status === "rejected").length,
        });
      }
    }
    fetchStats();
  }, [isAuthenticated]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!isAuthenticated) return null;

  const statCards = [
    { label: "Total Uploads", value: stats.total, icon: Upload, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-success" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Welcome, {profile?.display_name || "Member"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {isAdmin ? "Admin Dashboard" : "Member Dashboard"}
              </p>
            </div>
            <Link to="/upload">
              <Button variant="hero" className="gap-2">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <h2 className="sr-only">Upload statistics</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="mt-8 font-display text-xl font-semibold text-foreground">Quick actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Link to="/upload" className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-md">
              <Upload className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display font-semibold text-foreground">Upload Content</h3>
              <p className="mt-1 text-sm text-muted-foreground">Share photos, music, or videos</p>
            </Link>
            <Link to="/private-gallery" className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-md">
              <Image className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display font-semibold text-foreground">Photo Gallery</h3>
              <p className="mt-1 text-sm text-muted-foreground">Members-only photo collection</p>
            </Link>
            <Link to="/gallery" className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-md">
              <Play className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display font-semibold text-foreground">Public Media</h3>
              <p className="mt-1 text-sm text-muted-foreground">Browse music and videos</p>
            </Link>
          </div>

          {/* Recent Uploads */}
          {recentUploads.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Recent Uploads</h2>
                <Link to="/my-uploads" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {recentUploads.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.content_type === "photo" ? (
                        <Image className="h-5 w-5 text-primary" />
                      ) : item.content_type === "music" ? (
                        <Music className="h-5 w-5 text-accent" />
                      ) : (
                        <Play className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.category} · {item.content_type}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === "approved"
                        ? "bg-success/10 text-success"
                        : item.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
