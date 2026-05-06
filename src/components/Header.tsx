import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Music, Menu, X, Shield, Upload, Image, User, LogOut, Calendar, FileText } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { isAuthenticated, isAdmin, profile, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/" as const, label: "Home" },
    { to: "/gallery" as const, label: "Media Gallery" },
    { to: "/events" as const, label: "Events", icon: Calendar },
  ];

  const authLinks = isAuthenticated
    ? [
        { to: "/dashboard" as const, label: "Dashboard" },
        { to: "/upload" as const, label: "Upload", icon: Upload },
        { to: "/private-gallery" as const, label: "Photos", icon: Image },
        { to: "/documents" as const, label: "Documents", icon: FileText },
        ...(isAdmin ? [{ to: "/admin" as const, label: "Admin", icon: Shield }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            AmbassadorsCloud
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {[...navLinks, ...authLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <User className="h-4 w-4" />
                <span>{profile?.display_name || "Member"}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">Join Choir</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {[...navLinks, ...authLinks].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-muted"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-muted">
                  Join Choir
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
