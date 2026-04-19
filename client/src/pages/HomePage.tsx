import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Play, TrendingUp, Music2, Sparkles } from "lucide-react";
import type { Song } from "@shared/schema";
import { usePlayer } from "@/components/PlayerProvider";
import SongCard from "@/components/SongCard";
import VinylCover from "@/components/VinylCover";
import BuyModal from "@/components/BuyModal";
import ShareModal from "@/components/ShareModal";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [buyingSong, setBuyingSong] = useState<Song | null>(null);
  const [sharingSong, setSharingSong] = useState<Song | null>(null);

  const { data: featured, isLoading: loadingFeatured } = useQuery<Song[]>({
    queryKey: ["/api/songs", { featured: true }],
    queryFn: () => apiRequest("GET", "/api/songs?featured=true").then(r => r.json()),
  });

  const { data: allSongs, isLoading: loadingAll } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  const handlePlayAll = () => {
    if (allSongs && allSongs.length > 0) {
      if (currentSong && isPlaying) togglePlay();
      else playSong(allSongs[0], allSongs);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-10">

      {/* ── Hero ── */}
      <div className="muze-gradient rounded-3xl p-8 md:p-14 relative overflow-hidden">
        {/* Decorative vinyl — desktop */}
        <div className="absolute right-6 bottom-0 md:right-14 opacity-10 md:opacity-20 translate-y-8 pointer-events-none select-none">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/25 flex items-center justify-center">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* Sparkle dots */}
        <div className="absolute top-6 right-24 w-1.5 h-1.5 rounded-full bg-purple-300/50 pointer-events-none" />
        <div className="absolute top-14 right-36 w-1 h-1 rounded-full bg-pink-300/40 pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-2 h-2 rounded-full bg-purple-400/30 pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          <span className="section-pill mb-5 inline-flex">
            <Sparkles className="w-3 h-3" />
            Now Streaming
          </span>
          <h1
            className="text-4xl md:text-6xl font-black text-white leading-[1.08] mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Music You<br />
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Actually Feel
            </span>
          </h1>
          <p className="text-sm md:text-base text-white/65 max-w-sm mb-8 leading-relaxed">
            R&B, Trap, Gospel & more — crafted with soul.<br className="hidden md:block" />
            Stream free. Support your favorite artists.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePlayAll}
              data-testid="button-play-all"
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all glow-primary shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              Play All
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 text-white/90 font-semibold text-sm hover:bg-white/15 transition-all border border-white/15 backdrop-blur-sm"
            >
              <Music2 className="w-4 h-4" />
              {allSongs?.length ?? "—"} Tracks
            </button>
          </div>
        </div>
      </div>

      {/* ── Featured Tracks ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="section-pill mb-2">
              <TrendingUp className="w-3 h-3" />
              Featured
            </div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Top Tracks
            </h2>
          </div>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {featured?.map(song => (
              <SongCard key={song.id} song={song} queue={featured}
                onBuy={setBuyingSong} onShare={setSharingSong} />
            ))}
          </div>
        )}
      </section>

      {/* ── All Tracks ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="section-pill mb-2">
              <Music2 className="w-3 h-3" />
              Full Catalog
            </div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              All Tracks
            </h2>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            {allSongs?.length ?? 0} songs
          </span>
        </div>

        {loadingAll ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {allSongs?.map(song => (
              <SongCard key={song.id} song={song} queue={allSongs} variant="row"
                onBuy={setBuyingSong} onShare={setSharingSong} />
            ))}
          </div>
        )}
      </section>

      <BuyModal song={buyingSong} onClose={() => setBuyingSong(null)} />
      <ShareModal song={sharingSong} onClose={() => setSharingSong(null)} />
    </div>
  );
}
