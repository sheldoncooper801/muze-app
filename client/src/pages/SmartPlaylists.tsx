import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListMusic, Play, Shuffle, ChevronLeft } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import VinylCover from "@/components/VinylCover";
import GenreBadge from "@/components/GenreBadge";
import type { Song } from "@shared/schema";

interface SmartPlaylist {
  id: string;
  name: string;
  description: string;
  emoji: string;
  songs: Song[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SmartPlaylists() {
  const [selected, setSelected] = useState<SmartPlaylist | null>(null);
  const { playSong } = usePlayer();

  const { data: playlists = [], isLoading } = useQuery<SmartPlaylist[]>({
    queryKey: ["/api/smart-playlists"],
  });

  if (selected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Smart Playlists
        </button>

        {/* Playlist header */}
        <div className="rounded-2xl bg-card border border-border p-6 mb-6">
          <div className="text-4xl mb-3">{selected.emoji}</div>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{selected.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <ListMusic className="w-3.5 h-3.5" />
            {selected.songs.length} tracks
          </div>
          <div className="flex gap-3">
            <button
              data-testid="play-smart-playlist"
              onClick={() => selected.songs.length && playSong(selected.songs[0], selected.songs)}
              disabled={selected.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4" />
              Play All
            </button>
            <button
              onClick={() => {
                const shuffled = [...selected.songs].sort(() => Math.random() - 0.5);
                if (shuffled.length) playSong(shuffled[0], shuffled);
              }}
              disabled={selected.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:border-primary/40 transition-all disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>

        {/* Songs */}
        {selected.songs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ListMusic className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No songs match this playlist yet.</p>
            <p className="text-xs mt-1">Play some music to fill it up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selected.songs.map((song, i) => (
              <div
                key={song.id}
                data-testid={`smart-song-${song.id}`}
                onClick={() => playSong(song, selected.songs)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
              >
                <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                <VinylCover song={song} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <GenreBadge genre={song.genre} />
                    {song.bpm && <span className="text-xs text-muted-foreground">{song.bpm} BPM</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <ListMusic className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Smart Playlists</h1>
          <p className="text-sm text-muted-foreground">Auto-generated by your listening patterns</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {playlists.map(pl => (
            <button
              key={pl.id}
              data-testid={`smart-playlist-${pl.id}`}
              onClick={() => setSelected(pl)}
              className="rounded-2xl bg-card border border-border p-5 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="text-3xl mb-3">{pl.emoji}</div>
              <h3 className="font-semibold mb-1">{pl.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pl.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListMusic className="w-3.5 h-3.5" />
                {pl.songs.length} {pl.songs.length === 1 ? "song" : "songs"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
