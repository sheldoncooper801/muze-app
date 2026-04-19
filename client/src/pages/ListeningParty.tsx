import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Link2, Play, Plus, Copy, CheckCircle, Radio } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { usePlayer } from "@/components/PlayerProvider";
import type { Song } from "@shared/schema";

interface PartyRoom {
  id: string;
  name: string;
  hostName: string;
  currentSongId: number | null;
  currentTime: number;
  isPlaying: boolean;
  queue: number[];
  listeners: string[];
  createdAt: number;
}

export default function ListeningParty() {
  const [view, setView] = useState<"lobby" | "create" | "join" | "room">("lobby");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [activeRoom, setActiveRoom] = useState<PartyRoom | null>(null);
  const [copied, setCopied] = useState(false);
  const { playSong } = usePlayer();

  const { data: songs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });
  const { data: rooms = [] } = useQuery<PartyRoom[]>({ queryKey: ["/api/party/rooms"] });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/party/rooms", data),
    onSuccess: async (res: any) => {
      const room = await res.json();
      setActiveRoom(room);
      setView("room");
      queryClient.invalidateQueries({ queryKey: ["/api/party/rooms"] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest("POST", `/api/party/rooms/${id}/join`, { name }),
    onSuccess: async (res: any) => {
      const room = await res.json();
      setActiveRoom(room);
      setView("room");
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiRequest("PATCH", `/api/party/rooms/${id}`, data),
    onSuccess: async (res: any) => {
      const room = await res.json();
      setActiveRoom(room);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !hostName) return;
    createMutation.mutate({ name: roomName, hostName });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !joinName) return;
    joinMutation.mutate({ id: joinCode.toUpperCase(), name: joinName });
  };

  const copyRoomLink = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playSongInRoom = (song: Song) => {
    if (!activeRoom) return;
    playSong(song, songs);
    updateRoomMutation.mutate({
      id: activeRoom.id,
      data: { currentSongId: song.id, isPlaying: true, currentTime: 0 },
    });
  };

  if (view === "room" && activeRoom) {
    const currentSong = activeRoom.currentSongId ? songs.find(s => s.id === activeRoom.currentSongId) : null;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Room header */}
        <div className="rounded-2xl bg-primary/10 border-2 border-primary/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-semibold">{activeRoom.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">LIVE</span>
            </div>
            <button
              onClick={copyRoomLink}
              data-testid="copy-room-code"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : `Code: ${activeRoom.id}`}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1.5 flex-wrap">
              {activeRoom.listeners.map(l => (
                <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground">{l}</span>
              ))}
            </div>
          </div>
          {currentSong && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Now:</span>
              <span className="font-medium">{currentSong.title}</span>
            </div>
          )}
        </div>

        {/* Song list */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pick a Song</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {songs.map(song => (
            <div
              key={song.id}
              data-testid={`party-song-${song.id}`}
              onClick={() => playSongInRoom(song)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                activeRoom.currentSongId === song.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                {activeRoom.currentSongId === song.id
                  ? <Radio className="w-4 h-4 text-primary animate-pulse" />
                  : <Play className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.genre}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setView("lobby"); setActiveRoom(null); }}
          className="mt-6 w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
        >
          Leave Party
        </button>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <button onClick={() => setView("lobby")} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Create a Party</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Party Name</label>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              data-testid="input-room-name"
              placeholder="Friday Night Vibes"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <input
              type="text"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              data-testid="input-host-name"
              placeholder="DJ Name"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            data-testid="button-create-room"
            disabled={createMutation.isPending}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create Party"}
          </button>
        </form>
      </div>
    );
  }

  if (view === "join") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <button onClick={() => setView("lobby")} className="text-sm text-muted-foreground hover:text-foreground mb-6">
          ← Back
        </button>
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Join a Party</h2>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              data-testid="input-join-code"
              placeholder="ABC123"
              required
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm font-mono uppercase focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <input
              type="text"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              data-testid="input-join-name"
              placeholder="Your name"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            data-testid="button-join-room"
            disabled={joinMutation.isPending}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {joinMutation.isPending ? "Joining…" : "Join Party"}
          </button>
          {joinMutation.isError && (
            <p className="text-sm text-red-400 text-center">Room not found. Check the code and try again.</p>
          )}
        </form>
      </div>
    );
  }

  // Lobby
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Listening Party</h1>
          <p className="text-sm text-muted-foreground">Listen together in real time</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setView("create")}
          data-testid="button-create-party"
          className="rounded-2xl p-6 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-left"
        >
          <Plus className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Create a Party</h3>
          <p className="text-sm text-muted-foreground">Start a room and invite friends with a code</p>
        </button>
        <button
          onClick={() => setView("join")}
          data-testid="button-join-party"
          className="rounded-2xl p-6 border-2 border-border bg-card hover:border-primary/40 transition-all text-left"
        >
          <Link2 className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Join a Party</h3>
          <p className="text-sm text-muted-foreground">Enter a room code to listen with friends</p>
        </button>
      </div>

      {rooms.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Active Rooms</h2>
          <div className="space-y-2">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <Radio className="w-4 h-4 text-primary animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.listeners.length} listening • Code: {room.id}</p>
                </div>
                <button
                  onClick={() => { setJoinCode(room.id); setView("join"); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
