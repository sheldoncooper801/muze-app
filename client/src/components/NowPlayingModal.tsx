import { X, Heart, SkipBack, SkipForward, Play, Pause, Repeat, Shuffle, Plus, ListMusic } from "lucide-react";
import { usePlayer } from "./PlayerProvider";
import GenreBadge from "./GenreBadge";
import VinylCover from "./VinylCover";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function NowPlayingModal() {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    shuffled, looping, showNowPlaying, likedIds,
    togglePlay, nextSong, prevSong, seek, setVolume,
    toggleShuffle, toggleLoop, setShowNowPlaying, setShowQueue,
    toggleLike, addToQueue,
  } = usePlayer();

  if (!showNowPlaying || !currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = likedIds.has(currentSong.id);

  const lyricsLines = currentSong.lyrics
    ? currentSong.lyrics.split("\n").filter(l => l.trim())
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) setShowNowPlaying(false); }}
    >
      <div className="w-full max-w-sm sm:rounded-3xl bg-card border border-border overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <button
            onClick={() => { setShowNowPlaying(false); setShowQueue(true); }}
            data-testid="open-queue-from-now-playing"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ListMusic className="w-4 h-4" />
            Queue
          </button>
          <button
            onClick={() => setShowNowPlaying(false)}
            data-testid="close-now-playing"
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Art */}
        <div className="px-8 py-4 flex justify-center">
          <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-xl">
            <VinylCover song={currentSong} size="lg" />
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-2 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {currentSong.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <GenreBadge genre={currentSong.genre} />
              {currentSong.bpm && <span className="text-xs text-muted-foreground">{currentSong.bpm} BPM</span>}
            </div>
          </div>
          <button
            onClick={() => toggleLike(currentSong)}
            data-testid="now-playing-like"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ml-2 ${
              isLiked ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground hover:text-accent"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pb-3">
          <div
            className="h-2 rounded-full bg-secondary overflow-hidden cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            data-testid="np-shuffle"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              shuffled ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={prevSong} data-testid="np-prev" className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-all">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            data-testid="np-play-pause"
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
          </button>
          <button onClick={nextSong} data-testid="np-next" className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-all">
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLoop}
            data-testid="np-loop"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              looping ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            data-testid="np-volume"
            className="flex-1 h-1 accent-primary cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
        </div>

        {/* Lyrics */}
        {lyricsLines.length > 0 && (
          <div className="px-6 pb-6 border-t border-border pt-4 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Lyrics</p>
            <div className="space-y-1.5 text-sm leading-relaxed">
              {lyricsLines.map((line, i) => {
                const isSection = line.startsWith("[") && line.endsWith("]");
                return (
                  <p
                    key={i}
                    className={isSection
                      ? "text-xs text-primary font-semibold mt-3 first:mt-0"
                      : "text-foreground/80"
                    }
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
