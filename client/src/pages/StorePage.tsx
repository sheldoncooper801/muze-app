import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Search, Music2 } from "lucide-react";
import type { Song } from "@shared/schema";
import SongCard from "@/components/SongCard";
import BuyModal from "@/components/BuyModal";
import ShareModal from "@/components/ShareModal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const GENRES = ["All", "R&B", "Trap", "Christian/Worship", "Gospel", "Neo Soul",
  "Hip-Hop", "Pop", "Drill", "Soul", "Afrobeats", "Jazz", "Reggae", "Lo-Fi"];

export default function StorePage() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [buyingSong, setBuyingSong] = useState<Song | null>(null);
  const [sharingSong, setSharingSong] = useState<Song | null>(null);

  const { data: songs, isLoading } = useQuery<Song[]>({ queryKey: ["/api/songs"] });

  const filtered = songs?.filter(s => {
    const matchGenre = selectedGenre === "All" || s.genre === selectedGenre;
    const matchSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="section-pill mb-3">
          <ShoppingBag className="w-3 h-3" />
          MUZE Store
        </div>
        <h1 className="text-2xl font-black text-foreground mb-1.5"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Music Store
        </h1>
        <p className="text-sm text-muted-foreground">
          Support your favorite artists and unlock exclusive music
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          data-testid="store-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tracks, artists, genres…"
          className="pl-10 bg-secondary/60 border-border/60 rounded-xl h-11 focus:border-primary/50"
        />
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            data-testid={`filter-${g.toLowerCase()}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedGenre === g
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-7 px-5 py-3.5 rounded-2xl bg-secondary/40 border border-border/50">
        <div>
          <p className="text-base font-bold text-primary">{songs?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Tracks</p>
        </div>
        <div className="w-px h-7 bg-border/60" />
        <div>
          <p className="text-base font-bold text-accent">{filtered?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Showing</p>
        </div>
        <div className="w-px h-7 bg-border/60" />
        <div>
          <p className="text-base font-bold text-foreground">$0.99+</p>
          <p className="text-xs text-muted-foreground">Starting at</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Music2 className="w-3.5 h-3.5 text-primary" />
          {selectedGenre !== "All" ? selectedGenre : "All Genres"}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/60 flex items-center justify-center mb-2">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground">No tracks found</p>
          <p className="text-sm text-muted-foreground">Try a different search or genre filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filtered?.map(song => (
            <SongCard key={song.id} song={song} queue={filtered ?? []}
              onBuy={setBuyingSong} onShare={setSharingSong} />
          ))}
        </div>
      )}

      <BuyModal song={buyingSong} onClose={() => setBuyingSong(null)} />
      <ShareModal song={sharingSong} onClose={() => setSharingSong(null)} />
    </div>
  );
}
