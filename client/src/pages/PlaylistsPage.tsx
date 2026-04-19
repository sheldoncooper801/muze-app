import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ListMusic, Play, ChevronRight, Music2 } from "lucide-react";
import type { Playlist, Song } from "@shared/schema";
import { usePlayer } from "@/components/PlayerProvider";
import SongCard from "@/components/SongCard";
import BuyModal from "@/components/BuyModal";
import ShareModal from "@/components/ShareModal";
import { Skeleton } from "@/components/ui/skeleton";
import GenreBadge from "@/components/GenreBadge";
import VinylCover from "@/components/VinylCover";

interface PlaylistWithSongs extends Playlist { songs?: Song[]; }

function PlaylistCard({ playlist, onSelect }: { playlist: PlaylistWithSongs; onSelect: () => void }) {
  const { playSong } = usePlayer();
  const songs: Song[] = playlist.songs || [];

  const genreCounts = songs.reduce<Record<string, number>>((acc, s) => {
    acc[s.genre] = (acc[s.genre] || 0) + 1;
    return acc;
  }, {});
  const topGenre = Object.entries(genreCounts).sort((a,b) => b[1]-a[1])[0]?.[0];

  return (
    <div data-testid={`playlist-card-${playlist.id}`}
      className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
      onClick={onSelect}>
      {/* Cover mosaic */}
      <div className="relative h-36 bg-secondary overflow-hidden">
        {songs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            {songs.slice(0, 4).map(s => (
              <VinylCover key={s.id} song={s} size="md" />
            ))}
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); songs[0] && playSong(songs[0], songs); }}
            data-testid={`play-playlist-${playlist.id}`}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm mb-1 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{playlist.name}</h3>
        <p className="text-xs text-muted-foreground mb-2 truncate">{playlist.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {topGenre && <GenreBadge genre={topGenre} />}
            <span className="text-xs text-muted-foreground">{songs.length} tracks</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [buyingSong, setBuyingSong] = useState<Song | null>(null);
  const [sharingSong, setSharingSong] = useState<Song | null>(null);
  const { playSong } = usePlayer();

  const { data: playlists, isLoading } = useQuery<PlaylistWithSongs[]>({
    queryKey: ["/api/playlists"],
    queryFn: async () => {
      const list = await apiRequest("GET", "/api/playlists").then(r => r.json()) as Playlist[];
      // Fetch each playlist with songs
      return Promise.all(list.map(p =>
        apiRequest("GET", `/api/playlists/${p.id}`).then(r => r.json())
      ));
    },
  });

  const selectedPlaylist = playlists?.find(p => p.id === selectedId);

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <ListMusic className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {selectedPlaylist ? (
            <span className="flex items-center gap-2">
              <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground text-lg">Playlists</button>
              <span className="text-muted-foreground">/</span>
              {selectedPlaylist.name}
            </span>
          ) : "Playlists"}
        </h1>
      </div>

      {selectedPlaylist ? (
        /* Playlist detail */
        <div>
          <div className="flex items-start gap-5 mb-8 p-5 rounded-2xl bg-card border border-border">
            <div className="w-24 h-24 rounded-xl bg-secondary overflow-hidden grid grid-cols-2 gap-0.5 shrink-0">
              {(selectedPlaylist.songs || []).slice(0,4).map(s => (
                <VinylCover key={s.id} song={s} size="sm" />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{selectedPlaylist.name}</h2>
              <p className="text-sm text-muted-foreground mb-3">{selectedPlaylist.description}</p>
              <p className="text-xs text-muted-foreground mb-3">{(selectedPlaylist.songs || []).length} tracks by MUZE</p>
              <button
                onClick={() => { const songs = selectedPlaylist.songs || []; songs[0] && playSong(songs[0], songs); }}
                data-testid="button-play-playlist"
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md">
                <Play className="w-4 h-4 fill-current" />
                Play All
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {(selectedPlaylist.songs || []).map(song => (
              <SongCard key={song.id} song={song} queue={selectedPlaylist.songs}
                variant="row"
                onBuy={setBuyingSong}
                onShare={setSharingSong} />
            ))}
          </div>
        </div>
      ) : (
        /* Playlists grid */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {playlists?.map(p => (
            <PlaylistCard key={p.id} playlist={p} onSelect={() => setSelectedId(p.id)} />
          ))}
        </div>
      )}

      <BuyModal song={buyingSong} onClose={() => setBuyingSong(null)} />
      <ShareModal song={sharingSong} onClose={() => setSharingSong(null)} />
    </div>
  );
}
