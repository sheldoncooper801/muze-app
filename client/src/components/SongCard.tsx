import { Play, Pause, ShoppingCart, Share2, Heart } from "lucide-react";
import type { Song } from "@shared/schema";
import { usePlayer } from "./PlayerProvider";
import GenreBadge from "./GenreBadge";
import VinylCover from "./VinylCover";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface Props {
  song: Song;
  queue?: Song[];
  variant?: "card" | "row";
  onBuy?: (song: Song) => void;
  onShare?: (song: Song) => void;
}

export default function SongCard({ song, queue, variant = "card", onBuy, onShare }: Props) {
  const { currentSong, isPlaying, playSong, togglePlay, isSongLiked, toggleLike } = usePlayer();
  const isActive = currentSong?.id === song.id;
  const isCurrentlyPlaying = isActive && isPlaying;
  const liked = isSongLiked(song.id);

  const handlePlay = () => {
    if (isActive) togglePlay();
    else playSong(song, queue);
  };

  // ── Row variant ──────────────────────────────────────────────────────────────
  if (variant === "row") {
    return (
      <div
        data-testid={`song-row-${song.id}`}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
          isActive
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-secondary/60 border border-transparent"
        }`}
        onClick={handlePlay}
      >
        {/* Cover */}
        <div className="relative shrink-0">
          <VinylCover song={song} size="sm" spinning={isCurrentlyPlaying} />
          <div className={`absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}>
            {isCurrentlyPlaying
              ? <Pause className="w-4 h-4 text-white fill-current" />
              : <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{song.artist} · {song.album}</p>
        </div>

        {/* Waveform when playing */}
        {isCurrentlyPlaying && (
          <div className="flex items-center gap-0.5 h-4 shrink-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="waveform-bar w-0.5 bg-primary rounded-full h-full" />
            ))}
          </div>
        )}

        <GenreBadge genre={song.genre} />
        <span className="text-xs text-muted-foreground w-10 text-right shrink-0 hidden sm:block">
          {formatDuration(song.duration)}
        </span>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
          {onBuy && (
            <button onClick={() => onBuy(song)} data-testid={`buy-song-${song.id}`}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
          {onShare && (
            <button onClick={() => onShare(song)} data-testid={`share-song-${song.id}`}
              className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Card variant ─────────────────────────────────────────────────────────────
  return (
    <div
      data-testid={`song-card-${song.id}`}
      className={`group relative rounded-2xl overflow-hidden song-card-hover cursor-pointer ${
        isActive ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
      }`}
      style={{ background: "hsl(260 20% 8%)" }}
    >
      {/* Cover area */}
      <div className="relative" onClick={handlePlay}>
        <VinylCover song={song} size="xl" spinning={isCurrentlyPlaying} />

        {/* Gradient scrim from bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}>
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center glow-primary shadow-2xl">
            {isCurrentlyPlaying
              ? <Pause className="w-6 h-6 text-white fill-current" />
              : <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />}
          </div>
        </div>

        {/* Featured badge */}
        {song.featured && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-lg">
            Featured
          </div>
        )}

        {/* Like button — top right */}
        <button
          onClick={e => { e.stopPropagation(); toggleLike(song); }}
          data-testid={`like-song-${song.id}`}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            liked ? "bg-accent/90 opacity-100" : "bg-black/40 hover:bg-black/60"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "text-white fill-current" : "text-white"}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 pt-3.5">
        <GenreBadge genre={song.genre} />
        <h3
          className="mt-2 font-bold text-foreground text-sm leading-snug line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {song.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{song.artist} · {formatDuration(song.duration)}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-primary font-bold text-sm">${song.price.toFixed(2)}</span>
          <div className="flex gap-1.5">
            {onShare && (
              <button
                onClick={e => { e.stopPropagation(); onShare(song); }}
                data-testid={`card-share-${song.id}`}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onBuy && (
              <button
                onClick={e => { e.stopPropagation(); onBuy(song); }}
                data-testid={`card-buy-${song.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
              >
                <ShoppingCart className="w-3 h-3" />
                Support
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
