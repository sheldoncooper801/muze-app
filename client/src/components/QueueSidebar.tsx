import { X, ListMusic, Trash2, Play, GripVertical } from "lucide-react";
import { usePlayer } from "./PlayerProvider";
import GenreBadge from "./GenreBadge";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function QueueSidebar() {
  const {
    queue, queueIndex, currentSong, showQueue,
    setShowQueue, removeFromQueue, playSong,
  } = usePlayer();

  if (!showQueue) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setShowQueue(false)}
      />

      {/* Sidebar panel */}
      <div className="fixed right-0 top-0 h-full w-80 max-w-full z-50 flex flex-col bg-card border-l border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            <span className="font-semibold">Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{queue.length}</span>
          </div>
          <button
            onClick={() => setShowQueue(false)}
            data-testid="close-queue"
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto py-2">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <ListMusic className="w-10 h-10 opacity-30" />
              <p className="text-sm">Queue is empty</p>
              <p className="text-xs">Play a song to start the queue</p>
            </div>
          ) : (
            <div>
              {queue.map((song, i) => {
                const isCurrent = i === queueIndex;
                return (
                  <div
                    key={`${song.id}-${i}`}
                    data-testid={`queue-item-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-all ${
                      isCurrent ? "bg-primary/10" : "hover:bg-secondary/50"
                    }`}
                  >
                    {/* Drag handle (visual only) */}
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />

                    {/* Track info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => playSong(song, queue)}
                    >
                      <p className={`text-sm truncate font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <GenreBadge genre={song.genre} />
                        <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
                      </div>
                    </div>

                    {/* Playing indicator or remove button */}
                    {isCurrent ? (
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3].map(j => (
                          <span key={j} className="w-0.5 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => removeFromQueue(i)}
                        data-testid={`remove-queue-${i}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0 opacity-0 group-hover:opacity-100"
                        style={{ opacity: 0.6 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground text-center">
              {queueIndex + 1} of {queue.length} • {Math.round(queue.reduce((a, s) => a + s.duration, 0) / 60)} min total
            </p>
          </div>
        )}
      </div>
    </>
  );
}
