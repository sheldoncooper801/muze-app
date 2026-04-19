import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Song } from "@shared/schema";
import {
  Share2, Copy, CheckCheck, Music, Sparkles, Hash,
  Instagram, Youtube, Twitter, Facebook
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

// ── Platform config ────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: SiTiktok,
    color: "text-white",
    bg: "bg-black",
    charLimit: 2200,
    hashtagLimit: 5,
    tone: "hype, trending, viral",
    cta: "🎵 Stream now on MUZE →",
    shareUrl: (text: string) => `https://www.tiktok.com/upload?caption=${encodeURIComponent(text.slice(0, 150))}`,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-white",
    bg: "bg-gradient-to-br from-purple-600 to-pink-500",
    charLimit: 2200,
    hashtagLimit: 30,
    tone: "aesthetic, emotional, visual",
    cta: "🎧 Listen on MUZE — link in bio",
    shareUrl: (text: string) => `https://www.instagram.com/`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-white",
    bg: "bg-[#1877F2]",
    charLimit: 63206,
    hashtagLimit: 3,
    tone: "conversational, community, relatable",
    cta: "🎶 Support the music on MUZE:",
    shareUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text.slice(0, 200))}`,
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    color: "text-white",
    bg: "bg-black",
    charLimit: 280,
    hashtagLimit: 2,
    tone: "punchy, bold, short",
    cta: "🔥 Stream on MUZE:",
    shareUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-white",
    bg: "bg-red-600",
    charLimit: 5000,
    hashtagLimit: 15,
    tone: "descriptive, engaging, story-driven",
    cta: "🎵 Stream & support on MUZE:",
    shareUrl: (text: string) => `https://studio.youtube.com/`,
  },
];

const VIBES = ["Hype", "Emotional", "Motivational", "Laid-back", "Spiritual", "Trap", "Love", "Party"];
const MUZE_URL = "https://www.perplexity.ai/computer/a/muze-music-app-v1ZNbSQrSzyIEeRC2nXzWw";

// ── Caption generator (no AI key needed) ──────────────────────────────────────
function generateCaption(
  platform: typeof PLATFORMS[0],
  song: Song,
  vibe: string,
  customMsg: string,
  includeLink: boolean,
  includeHashtags: boolean,
  includeEmoji: boolean,
): string {
  const emoji = includeEmoji;
  const title = song.title;
  const artist = song.artist;
  const genre = song.genre;

  const vibeLines: Record<string, string[]> = {
    Hype: [
      `NEW MUSIC ALERT ${emoji ? "🚨" : ""}`,
      `${title} just dropped and it's DIFFERENT ${emoji ? "🔥" : ""}`,
      `You are NOT ready for this one.`,
    ],
    Emotional: [
      `This one came from the heart ${emoji ? "💜" : ""}`,
      `"${title}" — sometimes music says what words can't.`,
      `Hit play. Feel everything.`,
    ],
    Motivational: [
      `Built for those who never give up ${emoji ? "💪" : ""}`,
      `"${title}" is the soundtrack to your grind.`,
      `Turn it up and keep moving.`,
    ],
    "Laid-back": [
      `Smooth vibes only ${emoji ? "🌊" : ""}`,
      `"${title}" — perfect for the moment you're in right now.`,
      `Sit back. Press play. Repeat.`,
    ],
    Spiritual: [
      `Music that feeds the soul ${emoji ? "🙏" : ""}`,
      `"${title}" — let the music move you from the inside.`,
      `God-given sound. Real talk.`,
    ],
    Trap: [
      `${emoji ? "💎" : ""} Streets know ${emoji ? "💎" : ""}`,
      `"${title}" — no skips, no fillers. Just heat.`,
      `Turn it up where they can hear it.`,
    ],
    Love: [
      `For the one who has your heart ${emoji ? "❤️" : ""}`,
      `"${title}" — every word I couldn't say out loud.`,
      `Share this with someone special.`,
    ],
    Party: [
      `IT'S GIVING PARTY ${emoji ? "🎉" : ""}`,
      `"${title}" — the song that runs the aux tonight.`,
      `DJ, play this back!`,
    ],
  };

  const lines = vibeLines[vibe] || vibeLines["Hype"];

  const hashtags = includeHashtags ? generateHashtags(platform, song) : "";

  let caption = lines.join("\n");
  if (customMsg) caption += `\n\n${customMsg}`;
  caption += `\n\n— ${artist} on MUZE ${emoji ? "🎵" : ""}`;
  caption += `\n\n${platform.cta}`;
  if (includeLink) caption += `\n${MUZE_URL}`;
  if (hashtags) caption += `\n\n${hashtags}`;

  // Truncate to platform limit
  if (caption.length > platform.charLimit) {
    caption = caption.slice(0, platform.charLimit - 3) + "...";
  }

  return caption;
}

function generateHashtags(platform: typeof PLATFORMS[0], song: Song): string {
  const genreMap: Record<string, string[]> = {
    "R&B": ["#RnB", "#RnBMusic", "#NewRnB", "#SoulMusic"],
    "Trap": ["#Trap", "#TrapMusic", "#NewTrap", "#HipHop"],
    "Christian/Worship": ["#ChristianMusic", "#Worship", "#GospelMusic", "#Faith"],
    "Gospel": ["#Gospel", "#GospelMusic", "#Praise", "#Worship"],
    "Neo Soul": ["#NeoSoul", "#SoulMusic", "#RnB", "#NeoSoulVibes"],
    "Hip-Hop": ["#HipHop", "#Rap", "#NewHipHop", "#HipHopMusic"],
    "Pop": ["#Pop", "#PopMusic", "#NewMusic", "#PopVibes"],
    "Drill": ["#Drill", "#DrillMusic", "#UKDrill", "#Rap"],
    "Soul": ["#Soul", "#SoulMusic", "#RnB", "#ClassicSoul"],
    "Afrobeats": ["#Afrobeats", "#Afro", "#AfroVibes", "#AfrobeatMusic"],
    "Jazz": ["#Jazz", "#JazzMusic", "#SmoothJazz", "#LiveJazz"],
    "Reggae": ["#Reggae", "#ReggaeMusic", "#Vibes", "#RastaVibes"],
    "Lo-Fi": ["#LoFi", "#LoFiMusic", "#ChillVibes", "#StudyMusic"],
  };

  const base = ["#MUZE", "#MUZEmusic", "#NewMusic", "#IndependentArtist", "#StreamNow"];
  const genreTags = genreMap[song.genre] || ["#Music", "#NewRelease"];
  const artistTag = `#${song.artist.replace(/\s+/g, "")}`;

  const all = [artistTag, ...genreTags, ...base];
  return all.slice(0, platform.hashtagLimit).join(" ");
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button size="sm" variant="outline" onClick={copy} className="shrink-0 h-8 text-xs">
      {copied ? <><CheckCheck className="h-3.5 w-3.5 mr-1 text-green-400" />Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1" />Copy</>}
    </Button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SocialGeneratorPage() {
  const { artist } = useAuth();
  const { toast } = useToast();

  const [selectedSongId, setSelectedSongId] = useState<string>("");
  const [vibe, setVibe] = useState("Hype");
  const [customMsg, setCustomMsg] = useState("");
  const [includeLink, setIncludeLink] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [generated, setGenerated] = useState(false);

  const songsQ = useQuery<Song[]>({
    queryKey: ["/api/songs"],
    queryFn: () => apiRequest("GET", "/api/songs").then(r => r.json()),
  });

  const songs = songsQ.data || [];
  const selectedSong = songs.find(s => String(s.id) === selectedSongId);

  const handleGenerate = () => {
    if (!selectedSong) {
      toast({ title: "Select a song first", variant: "destructive" });
      return;
    }
    setGenerated(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Social Media Generator
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate ready-to-post captions for every platform — instantly.
        </p>
      </div>

      {/* Settings */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base">Post Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Song selector */}
          <div className="space-y-1">
            <Label>Select Song</Label>
            <Select value={selectedSongId} onValueChange={setSelectedSongId}>
              <SelectTrigger data-testid="select-song">
                <SelectValue placeholder={songsQ.isLoading ? "Loading songs…" : "Choose a song"} />
              </SelectTrigger>
              <SelectContent>
                {songs.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.title} — {s.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vibe */}
          <div className="space-y-2">
            <Label>Vibe / Mood</Label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map(v => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    vibe === v
                      ? "bg-primary text-white border-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div className="space-y-1">
            <Label>Personal Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              placeholder="Add a personal note to include in every post…"
              className="resize-none h-16"
              data-testid="textarea-custom-msg"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Include Link", state: includeLink, set: setIncludeLink },
              { label: "Hashtags", state: includeHashtags, set: setIncludeHashtags },
              { label: "Emojis", state: includeEmoji, set: setIncludeEmoji },
            ].map(({ label, state, set }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/40 border border-border/30">
                <Switch checked={state} onCheckedChange={set} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full glow-primary"
            onClick={handleGenerate}
            disabled={!selectedSongId}
            data-testid="button-generate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Posts for All Platforms
          </Button>
        </CardContent>
      </Card>

      {/* Generated Posts */}
      {generated && selectedSong && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Posts for "{selectedSong.title}"</p>
            <Badge variant="secondary">{PLATFORMS.length} platforms</Badge>
          </div>

          <Tabs defaultValue="tiktok">
            <TabsList className="grid grid-cols-5 w-full h-auto gap-1 bg-background/50 p-1">
              {PLATFORMS.map(p => (
                <TabsTrigger key={p.id} value={p.id} className="flex flex-col items-center gap-0.5 py-2 text-xs h-auto">
                  <p.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{p.name.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {PLATFORMS.map(p => {
              const caption = generateCaption(p, selectedSong, vibe, customMsg, includeLink, includeHashtags, includeEmoji);
              const charCount = caption.length;
              const isOver = charCount > p.charLimit;

              return (
                <TabsContent key={p.id} value={p.id} className="space-y-3 pt-2">
                  {/* Platform header */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${p.bg}`}>
                    <p.icon className={`h-5 w-5 ${p.color}`} />
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${p.color}`}>{p.name}</p>
                      <p className={`text-xs opacity-70 ${p.color}`}>
                        {p.charLimit.toLocaleString()} char limit · {p.hashtagLimit} hashtags
                      </p>
                    </div>
                    <CopyButton text={caption} />
                  </div>

                  {/* Caption preview */}
                  <div className="relative">
                    <pre className="whitespace-pre-wrap text-sm bg-background/60 border border-border/40 rounded-xl p-4 font-sans leading-relaxed">
                      {caption}
                    </pre>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant={isOver ? "destructive" : "secondary"} className="text-xs">
                        {charCount}/{p.charLimit}
                      </Badge>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => window.open(p.shareUrl(caption), "_blank")}
                      data-testid={`button-open-${p.id}`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Open {p.name}
                    </Button>
                    <CopyButton text={caption} />
                  </div>

                  {/* Hashtag preview */}
                  {includeHashtags && (
                    <div className="flex flex-wrap gap-1.5">
                      {generateHashtags(p, selectedSong).split(" ").map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs text-primary border-primary/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Copy all button */}
          <Card className="bg-card/60 border-border/40">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium mb-3">Copy all posts at once</p>
              <div className="space-y-2">
                {PLATFORMS.map(p => {
                  const caption = generateCaption(p, selectedSong, vibe, customMsg, includeLink, includeHashtags, includeEmoji);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2">
                        <p.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{p.name}</span>
                      </div>
                      <CopyButton text={caption} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
