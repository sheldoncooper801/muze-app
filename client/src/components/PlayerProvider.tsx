import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import type { Song } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffled: boolean;
  looping: boolean;
  showNowPlaying: boolean;
  showQueue: boolean;
  likedIds: Set<number>;
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  setShowNowPlaying: (v: boolean) => void;
  setShowQueue: (v: boolean) => void;
  toggleLike: (song: Song) => void;
  isSongLiked: (id: number) => boolean;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  playNext: (song: Song) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [shuffled, setShuffled] = useState(false);
  const [looping, setLooping] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load liked songs on mount
  useEffect(() => {
    apiRequest("GET", "/api/likes").then(r => r.json()).then((liked: any[]) => {
      setLikedIds(new Set(Array.isArray(liked) ? liked.map((s: any) => s.id).filter(Boolean) : []));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = 0.8;
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration || 0));
    audio.addEventListener("ended", () => {
      if (looping) { audio.currentTime = 0; audio.play().catch(() => {}); }
      else { handleNext(); }
    });
    return () => { audio.pause(); };
  }, []);

  const handleNext = useCallback(() => {
    setQueueIndex(i => {
      const next = i + 1;
      if (next < queue.length) return next;
      setIsPlaying(false);
      return i;
    });
  }, [queue.length]);

  // Tick simulation for songs without real audio
  const startTick = useCallback((dur: number) => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setCurrentTime(t => {
        if (t >= dur) { clearInterval(tickerRef.current!); setIsPlaying(false); return 0; }
        return t + 1;
      });
    }, 1000);
  }, []);

  const stopTick = useCallback(() => {
    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
  }, []);

  useEffect(() => {
    if (queue.length === 0 || queueIndex >= queue.length) return;
    const song = queue[queueIndex];
    setCurrentSong(song);
    setCurrentTime(0);
    const audio = audioRef.current!;
    if (song.audioUrl) {
      audio.src = song.audioUrl;
      setDuration(0);
      if (isPlaying) audio.play().catch(() => {});
    } else {
      audio.src = "";
      setDuration(song.duration || 180);
      if (isPlaying) startTick(song.duration || 180);
    }
    apiRequest("POST", `/api/songs/${song.id}/play`).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    }).catch(() => {});
  }, [queueIndex, queue]);

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    const q = newQueue || [song];
    const idx = q.findIndex(s => s.id === song.id);
    stopTick();
    setQueue(q);
    setQueueIndex(idx >= 0 ? idx : 0);
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    const audio = audioRef.current!;
    if (song.audioUrl) {
      audio.src = song.audioUrl;
      audio.play().catch(() => {});
    } else {
      audio.src = "";
      setDuration(song.duration || 180);
      startTick(song.duration || 180);
    }
    apiRequest("POST", `/api/songs/${song.id}/play`).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    }).catch(() => {});
  }, [startTick, stopTick]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current!;
    if (isPlaying) {
      audio.pause();
      stopTick();
      setIsPlaying(false);
    } else {
      if (audio.src) audio.play().catch(() => {});
      else if (currentSong) startTick(currentSong.duration || 180);
      setIsPlaying(true);
    }
  }, [isPlaying, currentSong, startTick, stopTick]);

  const nextSong = useCallback(() => {
    stopTick();
    setCurrentTime(0);
    if (shuffled) {
      const next = Math.floor(Math.random() * queue.length);
      setQueueIndex(next);
    } else {
      setQueueIndex(i => Math.min(i + 1, queue.length - 1));
    }
  }, [queue.length, shuffled, stopTick]);

  const prevSong = useCallback(() => {
    stopTick();
    if (currentTime > 3) { audioRef.current!.currentTime = 0; setCurrentTime(0); return; }
    setCurrentTime(0);
    setQueueIndex(i => Math.max(i - 1, 0));
  }, [currentTime, stopTick]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current!;
    if (audio.src) audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    audioRef.current!.volume = v;
    setVolumeState(v);
  }, []);

  const toggleShuffle = useCallback(() => setShuffled(s => !s), []);
  const toggleLoop = useCallback(() => setLooping(l => !l), []);

  const toggleLike = useCallback((song: Song) => {
    const isLiked = likedIds.has(song.id);
    if (isLiked) {
      apiRequest("DELETE", `/api/likes/${song.id}`).catch(() => {});
      setLikedIds(s => { const n = new Set(s); n.delete(song.id); return n; });
    } else {
      apiRequest("POST", `/api/likes/${song.id}`).catch(() => {});
      setLikedIds(s => new Set(s).add(song.id));
    }
    queryClient.invalidateQueries({ queryKey: ["/api/likes"] });
  }, [likedIds]);

  const isSongLiked = useCallback((id: number) => likedIds.has(id), [likedIds]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(q => [...q, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(q => q.filter((_, i) => i !== index));
  }, []);

  const playNext = useCallback((song: Song) => {
    setQueue(q => {
      const newQ = [...q];
      newQ.splice(queueIndex + 1, 0, song);
      return newQ;
    });
  }, [queueIndex]);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, queueIndex, isPlaying, currentTime, duration,
      volume, shuffled, looping, showNowPlaying, showQueue, likedIds,
      playSong, togglePlay, nextSong, prevSong, seek, setVolume,
      toggleShuffle, toggleLoop, setShowNowPlaying, setShowQueue,
      toggleLike, isSongLiked, addToQueue, removeFromQueue, playNext,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
