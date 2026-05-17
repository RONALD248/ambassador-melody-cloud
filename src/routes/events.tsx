import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Plus, Trash2, Music, Users, Plane, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventType = Database["public"]["Enums"]["event_type"];

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: "Events Calendar — AmbassadorsCloud" },
      {
        name: "description",
        content:
          "Upcoming choir practices, performances, and tour dates for the JKUSDA Ambassadors Choir.",
      },
      { property: "og:title", content: "Events Calendar — AmbassadorsCloud" },
      {
        property: "og:description",
        content:
          "Upcoming choir practices, performances, and tour dates for the JKUSDA Ambassadors Choir.",
      },
      { property: "og:url", content: "https://ambassador-melody-cloud.lovable.app/events" },
    ],
    links: [{ rel: "canonical", href: "https://ambassador-melody-cloud.lovable.app/events" }],
  }),
});

const TYPE_META: Record<EventType, { icon: typeof Music; label: string; color: string }> = {
  practice: { icon: Music, label: "Practice", color: "bg-primary/10 text-primary" },
  performance: { icon: Mic, label: "Performance", color: "bg-accent/10 text-accent" },
  tour: { icon: Plane, label: "Tour", color: "bg-success/10 text-success" },
  meeting: { icon: Users, label: "Meeting", color: "bg-warning/10 text-warning" },
  other: { icon: Calendar, label: "Other", color: "bg-muted text-muted-foreground" },
};

function EventsPage() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_type: "practice" as EventType,
  });

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      event_date: new Date(form.event_date).toISOString(),
      event_type: form.event_type,
      created_by: user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event created");
    setOpen(false);
    setForm({ title: "", description: "", location: "", event_date: "", event_type: "practice" });
    fetchEvents();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event deleted");
    fetchEvents();
  }

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.event_date) >= now);
  const past = events.filter((e) => new Date(e.event_date) < now);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Events Calendar
              </h1>
              <p className="mt-2 text-muted-foreground">
                Upcoming practices, performances, and tour dates.
              </p>
            </div>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create new event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_date">Date & Time</Label>
                      <Input
                        id="event_date"
                        type="datetime-local"
                        required
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_type">Type</Label>
                      <Select
                        value={form.event_type}
                        onValueChange={(v) => setForm({ ...form, event_type: v as EventType })}
                      >
                        <SelectTrigger id="event_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TYPE_META) as EventType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_META[t].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create event
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <p className="mt-8 text-muted-foreground">Loading…</p>
          ) : (
            <>
              <section className="mt-8">
                <h2 className="font-display text-xl font-semibold text-foreground">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No upcoming events.</p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {upcoming.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        canDelete={isAdmin}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </section>

              {past.length > 0 && (
                <section className="mt-10">
                  <h2 className="font-display text-xl font-semibold text-muted-foreground">Past</h2>
                  <div className="mt-4 grid gap-3 opacity-70">
                    {past.slice(0, 10).map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        canDelete={isAdmin}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EventCard({
  event,
  canDelete,
  onDelete,
}: {
  event: Event;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[event.event_type];
  const Icon = meta.icon;
  const date = new Date(event.event_date);
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-xs font-medium uppercase">
          {date.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="font-display text-xl font-bold leading-none">{date.getDate()}</span>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
          >
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleString("en-US", {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <h3 className="mt-1.5 font-display font-semibold text-foreground">{event.title}</h3>
        {event.description && (
          <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
        )}
        {event.location && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {event.location}
          </p>
        )}
      </div>
      {canDelete && (
        <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
