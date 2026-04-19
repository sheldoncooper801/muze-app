import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Users, Music, CreditCard, Download, Shield,
  CheckCircle2, XCircle, Clock, Trash2, Lock, UserCheck,
  TrendingUp, DollarSign, Play, Disc3, AlertTriangle, Plus, Pencil
} from "lucide-react";
import { getToken } from "@/lib/auth";

// Helper: authenticated admin fetch
async function adminFetch(method: string, path: string, body?: unknown) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ──────────────── Types ────────────────────────────────────────────────────────
interface DashboardData {
  totalSongs: number;
  totalArtists: number;
  totalPlays: number;
  totalRevenue: number;
  muzeSplit: number;
  artistSplit: number;
  pendingPayments: number;
  confirmedPayments: number;
  topGenres: { genre: string; count: number }[];
  topSongs: { id: number; title: string; artist: string; playCount: number }[];
}

interface ArtistAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  loginAttempts: number;
  lockedUntil: number | null;
  lastLogin: number | null;
  createdAt: number | null;
}

interface PaymentRow {
  id: number;
  itemTitle: string;
  itemType: string;
  buyerName: string;
  buyerEmail: string;
  grossAmount: number;
  muzeSplit: number;
  artistSplit: number;
  paymentMethod: string;
  status: string;
  isGift: boolean;
  createdAt: number | null;
  confirmedAt: number | null;
}

interface SongRow {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  genre: string;
  duration: number;
  price: number;
  featured: boolean;
  playCount: number | null;
  bpm: number | null;
}

// ──────────────── Helpers ──────────────────────────────────────────────────────
function fmt$(n: number) {
  return `$${n.toFixed(2)}`;
}
function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function statusBadge(status: string) {
  if (status === "confirmed") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmed</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
  return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
}

// ──────────────── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent?: string }) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent || "bg-primary/20"}`}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────── Add/Edit Song Dialog ─────────────────────────────────────────
const GENRES = ["R&B","Trap","Christian/Worship","Gospel","Neo Soul","Hip-Hop","Pop","Drill","Soul","Afrobeats","Jazz","Reggae","Lo-Fi"];

function SongFormDialog({ song, onDone }: { song?: SongRow | null; onDone: () => void }) {
  const { toast } = useToast();
  const isEdit = !!song;
  const [form, setForm] = useState({
    title: song?.title ?? "",
    artist: song?.artist ?? "MUZE",
    album: song?.album ?? "",
    genre: song?.genre ?? "R&B",
    duration: String(song?.duration ?? 180),
    price: String(song?.price ?? "1.99"),
    bpm: String(song?.bpm ?? ""),
    audioUrl: "",
    coverUrl: "",
    featured: song?.featured ? "true" : "false",
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: form.title,
        artist: form.artist,
        album: form.album || null,
        genre: form.genre,
        duration: Number(form.duration),
        price: Number(form.price),
        bpm: form.bpm ? Number(form.bpm) : null,
        audioUrl: form.audioUrl || null,
        coverUrl: form.coverUrl || null,
        featured: form.featured === "true",
      };
      if (isEdit) {
        return adminFetch("PATCH", `/api/admin/songs/${song!.id}`, body);
      }
      return adminFetch("POST", "/api/admin/songs", body);
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Song updated" : "Song added" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      onDone();
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Title</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Song title" />
        </div>
        <div className="space-y-1">
          <Label>Artist</Label>
          <Input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Album</Label>
          <Input value={form.album} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <Label>Genre</Label>
          <Select value={form.genre} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Duration (sec)</Label>
          <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>BPM</Label>
          <Input type="number" value={form.bpm} onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))} placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <Label>Featured</Label>
          <Select value={form.featured} onValueChange={v => setForm(f => ({ ...f, featured: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Audio URL</Label>
          <Input value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://... (optional)" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Cover Image URL</Label>
          <Input value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} placeholder="https://... (optional)" />
        </div>
      </div>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !form.title}>
        {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Song"}
      </Button>
    </div>
  );
}

// ──────────────── Main Admin Page ──────────────────────────────────────────────
export default function AdminPage() {
  const { artist, isAdmin } = useAuth();
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [editSong, setEditSong] = useState<SongRow | null>(null);
  const [songDialogOpen, setSongDialogOpen] = useState(false);

  // Redirect if not admin
  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Sign in to access admin panel.</p>
        <Button onClick={() => nav("/login")}>Sign In</Button>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-lg font-semibold">Admin Access Only</p>
        <p className="text-muted-foreground text-sm">Your account does not have admin privileges.</p>
        <Button variant="outline" onClick={() => nav("/")}>Go Home</Button>
      </div>
    );
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const dashboard = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: () => adminFetch("GET", "/api/admin/dashboard"),
  });

  const artistsQ = useQuery<ArtistAccount[]>({
    queryKey: ["/api/admin/artists"],
    queryFn: () => adminFetch("GET", "/api/admin/artists"),
  });

  const paymentsQ = useQuery<PaymentRow[]>({
    queryKey: ["/api/admin/payments"],
    queryFn: () => adminFetch("GET", "/api/admin/payments"),
  });

  const songsQ = useQuery<SongRow[]>({
    queryKey: ["/api/admin/songs"],
    queryFn: () => adminFetch("GET", "/api/admin/songs"),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const artistAction = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      adminFetch("PATCH", `/api/admin/artists/${id}`, { action }),
    onSuccess: (_, { action }) => {
      toast({ title: action === "verify" ? "Account verified" : action === "unlock" ? "Account unlocked" : "Account deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artists"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const paymentAction = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminFetch("PATCH", `/api/admin/payments/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Payment updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteSong = useMutation({
    mutationFn: (id: number) => adminFetch("DELETE", `/api/admin/songs/${id}`),
    onSuccess: () => {
      toast({ title: "Song deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const handleExport = async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `muze-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const d = dashboard.data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            MUZE Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Signed in as {artist.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Artists</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-1.5" />Payments</TabsTrigger>
          <TabsTrigger value="songs"><Music className="h-4 w-4 mr-1.5" />Songs</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 pt-4">
          {dashboard.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading dashboard…</p>
          ) : d ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Songs" value={d.totalSongs} icon={Disc3} />
                <StatCard label="Artist Accounts" value={d.totalArtists} icon={Users} />
                <StatCard label="Total Plays" value={d.totalPlays.toLocaleString()} icon={Play} />
                <StatCard label="Revenue" value={fmt$(d.totalRevenue)} icon={DollarSign} accent="bg-green-500/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard label="MUZE Earnings (40%)" value={fmt$(d.muzeSplit)} icon={TrendingUp} accent="bg-violet-500/20" />
                <StatCard label="Artist Payouts (60%)" value={fmt$(d.artistSplit)} icon={DollarSign} accent="bg-blue-500/20" />
                <StatCard label="Pending Payments" value={d.pendingPayments} icon={Clock} accent="bg-amber-500/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Genres */}
                <Card className="bg-card/60 border-border/40">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Top Genres by Plays</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {d.topGenres.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No plays yet.</p>
                    ) : d.topGenres.map((g, i) => (
                      <div key={g.genre} className="flex items-center justify-between">
                        <span className="text-sm">{i + 1}. {g.genre}</span>
                        <Badge variant="secondary">{g.count} plays</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Top Songs */}
                <Card className="bg-card/60 border-border/40">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Top Songs by Play Count</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {d.topSongs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No plays recorded yet.</p>
                    ) : d.topSongs.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{i + 1}. {s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.artist}</p>
                        </div>
                        <Badge variant="secondary">{s.playCount ?? 0} plays</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Could not load dashboard data.</p>
          )}
        </TabsContent>

        {/* ── ARTISTS TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="users" className="pt-4">
          <Card className="bg-card/60 border-border/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Artist Accounts</CardTitle>
              <Badge variant="secondary">{artistsQ.data?.length ?? 0} total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {artistsQ.isLoading ? (
                <p className="text-muted-foreground text-sm p-4">Loading…</p>
              ) : (artistsQ.data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm p-4">No artists registered yet.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {artistsQ.data!.map(a => (
                    <div key={a.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{a.name}</span>
                          {a.isVerified
                            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Verified</Badge>
                            : <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Unverified</Badge>
                          }
                          {a.lockedUntil && Date.now() < a.lockedUntil && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Locked</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{a.email} · {a.phone}</p>
                        <p className="text-xs text-muted-foreground">Joined {fmtDate(a.createdAt)} · Last login {fmtDate(a.lastLogin)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {!a.isVerified && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => artistAction.mutate({ id: a.id, action: "verify" })}
                            data-testid={`button-verify-${a.id}`}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />Verify
                          </Button>
                        )}
                        {a.lockedUntil && Date.now() < a.lockedUntil && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => artistAction.mutate({ id: a.id, action: "unlock" })}
                            data-testid={`button-unlock-${a.id}`}
                          >
                            <Lock className="h-3 w-3 mr-1" />Unlock
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => { if (confirm(`Delete ${a.name}?`)) artistAction.mutate({ id: a.id, action: "delete" }); }}
                          data-testid={`button-delete-artist-${a.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PAYMENTS TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="payments" className="pt-4">
          <Card className="bg-card/60 border-border/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Payments</CardTitle>
              <Badge variant="secondary">{paymentsQ.data?.length ?? 0} total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsQ.isLoading ? (
                <p className="text-muted-foreground text-sm p-4">Loading…</p>
              ) : (paymentsQ.data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm p-4">No payments yet.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {paymentsQ.data!.map(p => (
                    <div key={p.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm line-clamp-1">{p.itemTitle}</span>
                          {statusBadge(p.status)}
                          {p.isGift && <Badge variant="outline" className="text-xs">Gift</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.buyerName} · {p.buyerEmail} · {p.paymentMethod.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Gross: {fmt$(p.grossAmount)} · MUZE: {fmt$(p.muzeSplit)} · Artist: {fmt$(p.artistSplit)} · {fmtDate(p.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {p.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => paymentAction.mutate({ id: p.id, status: "confirmed" })}
                              data-testid={`button-confirm-payment-${p.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />Confirm
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => paymentAction.mutate({ id: p.id, status: "rejected" })}
                              data-testid={`button-reject-payment-${p.id}`}
                            >
                              <XCircle className="h-3 w-3 mr-1" />Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SONGS TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="songs" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">{songsQ.data?.length ?? 0} songs in catalog</p>
            <Dialog open={songDialogOpen} onOpenChange={open => { setSongDialogOpen(open); if (!open) setEditSong(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditSong(null)} data-testid="button-add-song">
                  <Plus className="h-4 w-4 mr-1.5" />Add Song
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editSong ? "Edit Song" : "Add New Song"}</DialogTitle>
                </DialogHeader>
                <SongFormDialog song={editSong} onDone={() => setSongDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              {songsQ.isLoading ? (
                <p className="text-muted-foreground text-sm p-4">Loading…</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {songsQ.data?.map(s => (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm line-clamp-1">{s.title}</span>
                          {s.featured && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Featured</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {s.artist} · {s.genre} · {fmt$(s.price)} · {(s.playCount ?? 0)} plays
                          {s.bpm ? ` · ${s.bpm} BPM` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => { setEditSong(s); setSongDialogOpen(true); }}
                          data-testid={`button-edit-song-${s.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => { if (confirm(`Delete "${s.title}"?`)) deleteSong.mutate(s.id); }}
                          data-testid={`button-delete-song-${s.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
