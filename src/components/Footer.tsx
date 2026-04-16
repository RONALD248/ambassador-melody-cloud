import { Music } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary py-12 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-accent" />
            <span className="font-display text-lg font-bold">JKUSDA Ambassadors Choir</span>
          </div>
          <p className="max-w-md text-sm text-primary-foreground/70">
            Praising God through harmony. Sharing music, memories, and moments with the world.
          </p>
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} AmbassadorsCloud. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
