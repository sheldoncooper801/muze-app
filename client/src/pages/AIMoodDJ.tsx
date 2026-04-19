import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Moon, Sun, Sunset, Clock, Music2, Play, Shuffle } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Song } from "@shared/schema";

const MOODS = [
  { id: "happy", label: "Happy & Upbeat", emoji: "😊", bpmMin: 100, bpmMax: 200, genres: ["Pop", "Afrobeats", "Reggae"] },
  { id: "chill", label: "Chill & Relaxed", emoji: "😌", bpmMin: 0, bpmMax: 85, genres: ["Lo-Fi", "Jazz", "Neo Soul"] },
  { id: "hype", label: "Hyped Up", emoji: "🔥", bpmMin: 120, bpmMax: 200, genres: ["Trap", "Hip-Hop", "Drill"] },
  { id: "romantic", label: "Romantic", emoji: "💜", bpmMin: 60, bpmMax: 90, genres: ["R&B", "Soul", "Neo Soul"] },
  { id: "spiritual", label: "Spiritual", emoji: "🙏", bpmMin: 0, bpmMax: 200, genres: ["Gospel", "Christian/Worship"] },
  { id: "sad", label: "Melancholy", emoji: "😔", bpmMin: 60, bpmMax: 90, genres: ["R&B", "Soul", "Lo-Fi"] },
];

function getTimeOfDay(): { label: string; icon: typeof Sun; suggestion: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { label: "Morning", icon: Sun, suggestion: "Start your day with uplifting energy" };
  if (h >= 12 && h < 17) return { label: "Afternoon", icon: Sunset, suggestion: "Keep the momentum going" };
  if (h >= 17 && h < 21) return { label: "Evening", icon: Sunset, suggestion: "Wind down with smooth vibes" };
  return { label: "Late Night", icon: Moon, suggestion: "Late-night feels and deep cuts" };
}

function getTimeGenres(): string[] {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return ["Gospel", "Christian/Worship", "Pop", "Afrobeats"];
  if (h >= 12 && h < 17) return ["Hip-Hop", "Trap", "Afrobeats", "Pop"];
  if (h >= 17 && h < 21) return ["R&B", "Neo Soul", "Soul", "Jazz"];
  return ["Lo-Fi", "R&B", "Jazz", "Neo Soul"];
}

export default function AIMoodDJ() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [useTimeMode, setUseTimeMode] = useState(true);
  const { playSong } = usePlayer();
  const timeInfo = getTimeOfDay();
  const TimeIcon = timeInfo.icon;

  const { data: allSongs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });

  const filteredSongs = useMemo(() => {
    if (!allSongs.length) return [];
    if (useTimeMode) {
      const timeGenres = getTimeGenres();
      let filtered = allSongs.filter(s => timeGenres.includes(s.genre));
      if (filtered.length < 3) filtered = allSongs;
      return filtered.sort(() => Math.random() - 0.5).slice(0, 8);
    }
    if (!selectedMood) return [];
    const mood = MOODS.find(m => m.id === selectedMood);
    if (!mood) return [];
    let filtered = allSongs.filter(s => {
      const bpmMatch = !s.bpm || (s.bpm >= mood.bpmMin && s.bpm <= mood.bpmMax);
      const genreMatch = mood.genres.includes(s.genre);
      return bpmMatch || genreMatch;
    });
    if (filtered.length < 3) filtered = allSongs;
    return filtered.sort(() => Math.random() - 0.5).slice(0, 8);
  }, [allSongs, selectedMood, useTimeMode]);

  const playAll = () => {
    if (filteredSongs.length > 0) playSong(filteredSongs[0], filteredSongs);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>AI Mood DJ</h1>
            <p className="text-sm text-muted-foreground">Songs picked for your moment</p>
          </div>
        </div>
      </div>

      {/* Time of Day Card */}
      <div
        onClick={() => setUseTimeMode(true)}
        data-testid="time-mode-card"
        className={`rounded-2xl p-5 mb-6 cursor-pointer border-2 transition-all ${
          useTimeMode ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TimeIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{timeInfo.label} Mix</p>
              <p className="text-sm text-muted-foreground">{timeInfo.suggestion}</p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            useTimeMode ? "border-primary bg-primary" : "border-muted-foreground"
          }`}>
            {useTimeMode && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {getTimeGenres().map(g => (
            <span key={g} className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">{g}</span>
          ))}
        </div>
      </div>

      {/* Mood Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Or choose a mood</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOODS.map(mood => (
            <button
              key={mood.id}
              data-testid={`mood-${mood.id}`}
              onClick={() => { setSelectedMood(mood.id); setUseTimeMode(false); }}
              className={`rounded-xl p-4 text-left border-2 transition-all ${
                !useTimeMode && selectedMood === mood.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <div className="text-sm font-medium leading-tight">{mood.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{mood.genres.slice(0, 2).join(", ")}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Queue */}
      {filteredSongs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">
              {filteredSongs.length} songs queued
            </p>
            <button
              data-testid="play-all-mood"
              onClick={playAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              Play All
            </button>
          </div>
          <div className="space-y-2">
            {filteredSongs.map((song, i) => (
              <div
                key={song.id}
                data-testid={`mood-song-${song.id}`}
                onClick={() => playSong(song, filteredSongs)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.genre} {song.bpm ? `• ${song.bpm} BPM` : ""}</p>
                </div>
                <Play className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!useTimeMode && !selectedMood && (
        <div className="text-center py-12 text-muted-foreground">
          <Music2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Pick a mood to get your personalized queue</p>
        </div>
      )}
    </div>
  );
}
