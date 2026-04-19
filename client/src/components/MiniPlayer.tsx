import { usePlayer } from "./PlayerProvider";
import { Play, Pause, SkipForward, SkipBack, Volume2, Repeat, Shuffle, ListMusic, ChevronUp, Heart } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import VinylCover from "./VinylCover";

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration, volume, shuffled, looping,
    togglePlay, nextSong, prevSong, seek, setVolume, toggleShuffle, toggleLoop,
    setShowNowPlaying, setShowQueue, isSongLiked, toggleLike,
  } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isSongLiked(currentSong.id);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-64 glass-card border-t border-border/60">

      {/* Seek bar — full width, clickable */}
      <div className="relative w-full h-1 bg-secondary/80 cursor-pointer group/seek">
        <div
          className="absolute h-full bg-primary transition-all duration-300 rounded-r"
          style={{ width: `${progress}%` }}
        />
        {/* Thumb dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-primary-sm opacity-0 group-hover/seek:opacity-100 transition-opacity -translate-x-1/2"
          style={{ left: `${progress}%` }}
        />
        <input
          type="range" min={0} max={duration || 0} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="player-seek"
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 md:py-3.5">

        {/* Song info */}
        <div
          className="flex items-center gap-3 w-44 md:w-64 shrink-0 min-w-0 cursor-pointer"
          onClick={() => setShowNowPlaying(true)}
        >
          <VinylCover song={currentSong} size="sm" spinning={isPlaying} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-foreground" data-testid="player-song-title">
              {currentSong.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Like button — desktop */}
        <button
          onClick={() => toggleLike(currentSong)}
          className={`hidden md:flex p-1.5 rounded-md transition-colors shrink-0 ${
            liked ? "text-accent" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </button>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={toggleShuffle} data-testid="player-shuffle"
              className={`p-1.5 rounded-md transition-colors hidden md:block ${shuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prevSong} data-testid="player-prev"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              data-testid="player-play-pause"
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all glow-primary-sm"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 text-white fill-current" />
                : <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />}
            </button>
            <button onClick={nextSong} data-testid="player-next"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={toggleLoop} data-testid="player-loop"
              className={`p-1.5 rounded-md transition-colors hidden md:block ${looping ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          {/* Timestamps — desktop */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span className="text-muted-foreground/40">/</span>
            <span>{formatTime(duration || currentSong.duration)}</span>
          </div>
        </div>

        {/* Volume + actions — desktop */}
        <div className="hidden md:flex items-center gap-2 w-44 shrink-0 justify-end">
          <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            min={0} max={1} step={0.01}
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            className="w-20"
            data-testid="player-volume"
          />
          <button onClick={() => setShowQueue(true)} data-testid="open-queue"
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Queue">
            <ListMusic className="w-4 h-4" />
          </button>
          <button onClick={() => setShowNowPlaying(true)} data-testid="open-now-playing"
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Expand">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
