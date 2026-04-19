import { Link, useLocation } from "wouter";
import {
  Home, ShoppingBag, ListMusic, Share2, Music2, Zap, Heart, Users,
  Sliders, Quote, BarChart2, Ticket, CreditCard, TrendingUp, LogIn,
  UserCircle, LogOut, Shield,
} from "lucide-react";
import MiniPlayer from "./MiniPlayer";
import { useAuth } from "@/context/AuthContext";

// Nav grouped into sections
const navSections = [
  {
    label: "Discover",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/store", label: "Store", icon: ShoppingBag },
      { href: "/playlists", label: "Playlists", icon: ListMusic },
      { href: "/smart-playlists", label: "Smart Lists", icon: Music2 },
    ],
  },
  {
    label: "Features",
    items: [
      { href: "/mood-dj", label: "Mood DJ", icon: Zap },
      { href: "/lyrics-search", label: "Lyrics", icon: Quote },
      { href: "/equalizer", label: "Equalizer", icon: Sliders },
      { href: "/party", label: "Listen Party", icon: Users },
      { href: "/wrapped", label: "Wrapped", icon: BarChart2 },
      { href: "/events", label: "Live Events", icon: Ticket },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/checkout", label: "Support / Gift", icon: CreditCard },
      { href: "/tip", label: "Support MUZE", icon: Heart },
      { href: "/earnings", label: "Earnings", icon: TrendingUp },
      { href: "/marketing", label: "Share", icon: Share2 },
    ],
  },
];

// Mobile bottom nav — top 5 only
const mobileNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/mood-dj", label: "Mood DJ", icon: Zap },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/events", label: "Events", icon: Ticket },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { artist, isAdmin, logout } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar — desktop ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/60 bg-card/80 shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <svg aria-label="MUZE logo" viewBox="0 0 40 40" className="w-9 h-9 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="hsl(270, 85%, 65%)"/>
              <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="3" fill="white"/>
              <line x1="20" y1="12" x2="20" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="26" y1="14" x2="28.5" y2="11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="28" y1="20" x2="32" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <span className="text-lg font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE</span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Music You Feel</p>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-1">
              <p className="px-5 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
              <div className="px-3 space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = location === href;
                  return (
                    <Link key={href} href={href}>
                      <a
                        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-primary/15 text-primary glow-primary-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} />
                        {label}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin shortcut — only visible to admin accounts */}
        {isAdmin && (
          <div className="px-3 pb-1">
            <Link href="/admin">
              <a
                data-testid="nav-admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  location === "/admin"
                    ? "bg-violet-500/20 text-violet-300 shadow-[0_0_10px_hsl(270,85%,65%,0.2)]"
                    : "text-violet-400 hover:text-violet-200 hover:bg-violet-500/10 border border-violet-500/20"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                Admin Panel
                {location === "/admin" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                )}
              </a>
            </Link>
          </div>
        )}

        {/* Artist session bar */}
        <div className="px-4 pb-3">
          {artist ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/25 flex items-center justify-center shrink-0">
                <UserCircle className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{artist.name}</p>
                <p className="text-xs text-muted-foreground truncate">{artist.email}</p>
              </div>
              <button onClick={logout} title="Sign out"
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 rounded-md hover:bg-secondary">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <a className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all text-sm font-medium border border-border/40">
                <LogIn className="w-4 h-4" />
                Artist Sign In
              </a>
            </Link>
          )}
        </div>

        {/* Social links */}
        <div className="px-5 py-4 border-t border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground/60 mb-2.5 uppercase tracking-widest">Follow MUZE</p>
          <div className="flex gap-2">
            {[
              {
                href: "https://tiktok.com", title: "TikTok",
                svg: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z"/>,
              },
              {
                href: "https://instagram.com", title: "Instagram",
                svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
              },
              {
                href: "https://facebook.com", title: "Facebook",
                svg: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>,
              },
              {
                href: "https://youtube.com", title: "YouTube",
                svg: <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="hsl(260,20%,6%)"/></>,
              },
            ].map(({ href, title, svg }) => (
              <a key={title} href={href} target="_blank" rel="noopener noreferrer" title={title}
                className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:scale-105">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">{svg}</svg>
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <svg aria-label="MUZE logo" viewBox="0 0 32 32" className="w-8 h-8" fill="none">
              <rect width="32" height="32" rx="8" fill="hsl(270, 85%, 65%)"/>
              <circle cx="16" cy="16" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="10" x2="16" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE</span>
          </div>
          <div className="flex items-center gap-2">
            {artist ? (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="w-4 h-4 text-primary" />
              </div>
            ) : (
              <Link href="/login">
                <a className="text-xs text-primary font-semibold">Sign In</a>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-36 md:pb-24">
          {children}
        </main>

        {/* Mini player */}
        <MiniPlayer />

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-border/60 bg-card/95 backdrop-blur-sm">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <a
                  data-testid={`mobile-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-xs transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_6px_hsl(270,85%,65%)]" : ""}`} />
                  <span className="text-[10px] font-medium">{label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
