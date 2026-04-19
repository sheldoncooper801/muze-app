import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Download, Share2, Music2, Heart, Clock, Mic } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Song } from "@shared/schema";

interface Stats {
  totalPlays: number;
  totalMinutes: number;
  totalLikes: number;
  topSongs: (Song & { plays: number })[];
  topGenres: { genre: string; count: number }[];
  topLikedGenre: string | null;
  uniqueArtists: number;
}

const GENRE_COLORS: Record<string, string> = {
  "R&B": "#9b59b6",
  "Trap": "#e74c3c",
  "Christian/Worship": "#3498db",
  "Gospel": "#f39c12",
  "Neo Soul": "#27ae60",
  "Hip-Hop": "#e67e22",
  "Pop": "#e91e8c",
  "Drill": "#8b0000",
  "Soul": "#d4a017",
  "Afrobeats": "#f1c40f",
  "Jazz": "#4b0082",
  "Reggae": "#2ecc71",
  "Lo-Fi": "#607d8b",
};

function getBarWidth(count: number, max: number) {
  return max > 0 ? Math.max(8, (count / max) * 100) : 8;
}

export default function MuzeWrapped() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const { playSong } = usePlayer();

  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: allSongs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });

  const handleShare = async () => {
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, { backgroundColor: "#0a0010", scale: 2 });
        const link = document.createElement("a");
        link.download = "muze-wrapped.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (e) {
      // fallback: notify
    }
    setSharing(false);
  };

  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const maxGenreCount = stats?.topGenres?.[0]?.count || 1;

  if (isLoading) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="h-96 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  const noData = !stats || stats.totalPlays === 0;

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE Wrapped</h1>
            <p className="text-sm text-muted-foreground">{month}</p>
          </div>
        </div>
        <button
          onClick={handleShare}
          disabled={sharing || noData}
          data-testid="button-share-wrapped"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {sharing ? "Saving…" : "Save"}
        </button>
      </div>

      {noData ? (
        <div className="text-center py-20 text-muted-foreground">
          <Music2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium mb-2">No listening data yet</p>
          <p className="text-sm">Play some songs to generate your MUZE Wrapped.</p>
          {allSongs.length > 0 && (
            <button
              onClick={() => playSong(allSongs[0], allSongs)}
              className="mt-4 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Start Listening
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Shareable card */}
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ background: "linear-gradient(135deg, #0a0010 0%, #1a0030 50%, #0d001a 100%)" }}
          >
            {/* Card header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
                  <rect width="28" height="28" rx="7" fill="hsl(270,85%,65%)" />
                  <circle cx="14" cy="14" r="5.5" fill="none" stroke="white" strokeWidth="1.2"/>
                  <circle cx="14" cy="14" r="2" fill="white"/>
                  <line x1="14" y1="8.5" x2="14" y2="6" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE Wrapped</span>
                <span className="ml-auto text-xs text-white/50">{month}</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-center mb-1"><Clock className="w-4 h-4 text-purple-400" /></div>
                  <p className="text-xl font-bold text-white">{stats.totalMinutes}</p>
                  <p className="text-xs text-white/50">minutes</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-center mb-1"><Music2 className="w-4 h-4 text-pink-400" /></div>
                  <p className="text-xl font-bold text-white">{stats.totalPlays}</p>
                  <p className="text-xs text-white/50">plays</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-center mb-1"><Heart className="w-4 h-4 text-red-400" /></div>
                  <p className="text-xl font-bold text-white">{stats.totalLikes}</p>
                  <p className="text-xs text-white/50">liked</p>
                </div>
              </div>

              {/* Top songs */}
              {stats.topSongs.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Top Songs</p>
                  <div className="space-y-2">
                    {stats.topSongs.slice(0, 5).map((song, i) => (
                      <div key={song.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white/40 w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{song.title}</p>
                          <p className="text-xs text-white/40">{song.genre}</p>
                        </div>
                        <span className="text-xs text-white/60 shrink-0">{song.plays}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top genres */}
              {stats.topGenres.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Top Genres</p>
                  <div className="space-y-2">
                    {stats.topGenres.slice(0, 5).map(({ genre, count }) => (
                      <div key={genre} className="flex items-center gap-2">
                        <span className="text-xs text-white/70 w-24 truncate">{genre}</span>
                        <div className="flex-1 rounded-full h-2 bg-white/10">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${getBarWidth(count, maxGenreCount)}%`,
                              backgroundColor: GENRE_COLORS[genre] || "hsl(270,85%,65%)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-white/50 w-4 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-white/30">muze.music</p>
              {stats.topLikedGenre && (
                <p className="text-xs text-white/50">
                  <Heart className="w-3 h-3 inline mr-1 text-red-400" />
                  Loves {stats.topLikedGenre}
                </p>
              )}
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "TikTok", color: "#000", bg: "#1a1a1a" },
              { label: "Instagram", color: "#E1306C", bg: "#fce4ec" },
              { label: "Twitter", color: "#1DA1F2", bg: "#e3f2fd" },
            ].map(s => (
              <button
                key={s.label}
                data-testid={`share-wrapped-${s.label.toLowerCase()}`}
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-sm font-medium hover:border-primary/40 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
