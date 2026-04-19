import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getToken } from "@/lib/auth";
import {
  Upload, Music, Image, CheckCircle2, X, Play, Pause,
  Disc3, FileAudio, AlertCircle, Sparkles
} from "lucide-react";

const GENRES = [
  "R&B","Trap","Christian/Worship","Gospel","Neo Soul","Hip-Hop",
  "Pop","Drill","Soul","Afrobeats","Jazz","Reggae","Lo-Fi"
];

interface UploadedSong {
  id: number; title: string; artist: string; genre: string;
  audioUrl: string | null; coverUrl: string | null;
}

function FileDrop({
  accept, label, icon: Icon, file, onFile, onClear
}: {
  accept: string; label: string; icon: any;
  file: File | null; onFile: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onClick={() => !file && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-xl p-5 transition-all cursor-pointer
        ${drag ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50 hover:bg-primary/5"}
        ${file ? "cursor-default" : ""}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {file ? (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0"
            onClick={e => { e.stopPropagation(); onClear(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Drag & drop or tap to browse</p>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const { artist } = useAuth();
  const [, nav] = useLocation();
  const { toast } = useToast();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedSong | null>(null);

  const [form, setForm] = useState({
    title: "", artist: artist?.name || "MUZE", genre: "R&B",
    price: "1.99", album: "", bpm: "", description: "", lyrics: "", featured: "false",
  });

  // Auto-fill title from filename
  const handleAudioFile = (f: File) => {
    setAudioFile(f);
    if (!form.title) {
      setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") }));
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (!token) throw new Error("Sign in to upload songs.");
      if (!audioFile) throw new Error("Select an MP3 file first.");

      const fd = new FormData();
      fd.append("audio", audioFile);
      if (coverFile) fd.append("cover", coverFile);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });

      return new Promise<UploadedSong>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/song");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload = () => {
          setProgress(100);
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 201) resolve(data.song);
          else reject(new Error(data.error || "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });
    },
    onSuccess: (song) => {
      setUploaded(song);
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      toast({ title: `"${song.title}" uploaded to your artist section!` });
    },
    onError: (err: Error) => {
      setProgress(0);
      toast({ title: err.message, variant: "destructive" });
    },
  });

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Music className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Artist Account Required</p>
        <p className="text-muted-foreground text-sm text-center">Sign in to your artist account to upload music.</p>
        <Button onClick={() => nav("/login")}>Sign In</Button>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">"{ uploaded.title }" is Live!</h2>
          <p className="text-muted-foreground text-sm mt-1">Your track is now in the MUZE store under your artist name.</p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button className="w-full glow-primary" onClick={() => nav("/social-generator?songId=" + uploaded.id)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Create Social Media Posts
          </Button>
          <Button variant="outline" className="w-full" onClick={() => {
            setUploaded(null); setAudioFile(null); setCoverFile(null);
            setProgress(0); setForm({ title: "", artist: artist?.name || "MUZE", genre: "R&B", price: "1.99", album: "", bpm: "", description: "", lyrics: "", featured: "false" });
          }}>
            Upload Another Song
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => nav("/store")}>
            View in Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Upload Your Music
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Uploading as <span className="text-primary font-medium">{artist.name}</span>
        </p>
      </div>

      {/* File drops */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Audio File <span className="text-red-400">*</span></Label>
        <FileDrop
          accept="audio/mpeg,audio/mp3,audio/wav,.mp3,.wav"
          label="Drop your MP3 or WAV here"
          icon={FileAudio}
          file={audioFile}
          onFile={handleAudioFile}
          onClear={() => setAudioFile(null)}
        />

        <Label className="text-sm font-semibold">Cover Art <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <FileDrop
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          label="Drop your cover image here"
          icon={Image}
          file={coverFile}
          onFile={setCoverFile}
          onClear={() => setCoverFile(null)}
        />
      </div>

      {/* Metadata */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base">Song Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Song Title <span className="text-red-400">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter song title"
                data-testid="input-song-title"
              />
            </div>
            <div className="space-y-1">
              <Label>Artist Name</Label>
              <Input
                value={form.artist}
                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                data-testid="input-artist-name"
              />
            </div>
            <div className="space-y-1">
              <Label>Album</Label>
              <Input
                value={form.album}
                onChange={e => setForm(f => ({ ...f, album: e.target.value }))}
                placeholder="Optional"
                data-testid="input-album"
              />
            </div>
            <div className="space-y-1">
              <Label>Genre</Label>
              <Select value={form.genre} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
                <SelectTrigger data-testid="select-genre"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Price ($)</Label>
              <Input
                type="number" step="0.01" min="0.99"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                data-testid="input-price"
              />
            </div>
            <div className="space-y-1">
              <Label>BPM</Label>
              <Input
                type="number"
                value={form.bpm}
                onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))}
                placeholder="Optional"
                data-testid="input-bpm"
              />
            </div>
            <div className="space-y-1">
              <Label>Featured</Label>
              <Select value={form.featured} onValueChange={v => setForm(f => ({ ...f, featured: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Standard</SelectItem>
                  <SelectItem value="true">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell listeners about this song..."
                className="resize-none h-20"
                data-testid="textarea-description"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Lyrics</Label>
              <Textarea
                value={form.lyrics}
                onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))}
                placeholder="Paste your lyrics here (optional)..."
                className="resize-none h-28"
                data-testid="textarea-lyrics"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload progress */}
      {uploadMutation.isPending && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full glow-primary h-12 text-base font-semibold"
        onClick={() => uploadMutation.mutate()}
        disabled={uploadMutation.isPending || !audioFile || !form.title}
        data-testid="button-upload-song"
      >
        {uploadMutation.isPending ? (
          <><Disc3 className="h-5 w-5 mr-2 animate-spin" />Uploading…</>
        ) : (
          <><Upload className="h-5 w-5 mr-2" />Upload to MUZE</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By uploading, you confirm you own the rights to this music. MUZE takes 40% on sales, you keep 60%.
      </p>
    </div>
  );
}
