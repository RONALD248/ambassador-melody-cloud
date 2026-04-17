import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, Mail } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile — AmbassadorsCloud" }] }),
});

function ProfilePage() {
  const { user, profile, isAdmin, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-foreground">
                {profile?.display_name || "Member"}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              {isAdmin && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSave}
            className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-lg font-semibold text-foreground">Edit details</h2>
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of your AmbassadorsCloud account.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={async () => {
                await logout();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
