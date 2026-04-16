import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({
    meta: [{ title: "Upload Content — AmbassadorsCloud" }],
  }),
});

function UploadPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [contentType, setContentType] = useState<string>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) return null;

  // Auto-set visibility based on content type
  const visibility = contentType === "photo" ? "members_only" : "public";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError("");

    try {
      // Upload file to storage
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

      // Insert content record
      const { error: insertError } = await supabase.from("content").insert({
        user_id: user.id,
        title,
        description: description || null,
        category: category as any,
        content_type: contentType as any,
        visibility: visibility as any,
        file_path: filePath,
        file_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Upload Successful!</h1>
            <p className="mt-2 text-muted-foreground">Your content is pending admin approval.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={() => { setSuccess(false); setTitle(""); setDescription(""); setFile(null); }}>
                Upload Another
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/my-uploads" })}>
                View My Uploads
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categories = [
    { value: "event", label: "Event" },
    { value: "practice", label: "Practice" },
    { value: "performance", label: "Performance" },
    { value: "tour", label: "Tour" },
    { value: "other", label: "Other" },
  ];

  const contentTypes = [
    { value: "photo", label: "Photo", accept: "image/*" },
    { value: "music", label: "Music", accept: "audio/*" },
    { value: "video", label: "Video", accept: "video/*" },
  ];

  const currentAccept = contentTypes.find((t) => t.value === contentType)?.accept || "*/*";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-bold text-foreground">Upload Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share photos, music, or videos with the choir community.
            {contentType === "photo" ? " Photos are visible to members only." : " Music and videos are shared publicly after approval."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex gap-2">
                {contentTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setContentType(t.value); setFile(null); }}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      contentType === t.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Give your upload a title" maxLength={100} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description…" maxLength={500} rows={3} />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      category === c.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>File</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:border-accent/50">
                <UploadIcon className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium text-muted-foreground">
                  {file ? file.name : "Click to select a file"}
                </span>
                {file && <span className="mt-1 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
                <input
                  type="file"
                  className="hidden"
                  accept={currentAccept}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </label>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={uploading || !file}>
              <UploadIcon className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload Content"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
