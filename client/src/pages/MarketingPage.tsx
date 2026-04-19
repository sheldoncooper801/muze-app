import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2, TrendingUp, Download, ExternalLink, Copy, Check } from "lucide-react";
import type { Song } from "@shared/schema";
import ShareModal from "@/components/ShareModal";
import VinylCover from "@/components/VinylCover";
import GenreBadge from "@/components/GenreBadge";
import { Skeleton } from "@/components/ui/skeleton";

const PLATFORMS = [
  {
    name: "TikTok",
    desc: "Reach millions through short-form videos. Share snippets of your music to go viral.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z"/>
      </svg>
    ),
    color: "from-gray-900 to-gray-800",
    accent: "text-white",
    bg: "bg-black",
    url: "https://tiktok.com",
    tips: ["Use trending sounds", "Show your creative process", "Post 3-5x/week for growth"],
  },
  {
    name: "Instagram",
    desc: "Build your brand with Reels, Stories, and visual content that showcases your artistry.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "from-purple-600 via-pink-500 to-orange-400",
    accent: "text-white",
    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    url: "https://instagram.com",
    tips: ["Share lyrics as Stories", "Use Reels for music previews", "Engage in DMs with fans"],
  },
  {
    name: "Facebook",
    desc: "Connect with a broad audience and use Facebook's music tools and Fan Pages.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
    color: "from-blue-700 to-blue-600",
    accent: "text-white",
    bg: "bg-[#1877f2]",
    url: "https://facebook.com",
    tips: ["Create a Music Fan Page", "Go live for Q&A sessions", "Join music community groups"],
  },
  {
    name: "YouTube",
    desc: "The world's biggest music platform. Post music videos, lyric videos, and behind-the-scenes.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="black"/>
      </svg>
    ),
    color: "from-red-700 to-red-600",
    accent: "text-white",
    bg: "bg-[#ff0000]",
    url: "https://youtube.com",
    tips: ["Upload music videos with lyrics", "Create a channel trailer", "Consistent thumbnail style"],
  },
];

const CAPTION_TEMPLATES = [
  (song: Song) => `🎵 New music just dropped — "${song.title}" by MUZE. Stream it now and let me know what you think! #MUZE #${song.genre.replace(/\s|\//, "")} #NewMusic`,
  (song: Song) => `Real music for real feelings. "${song.title}" — available now 🔥 Link in bio. #${song.genre.replace(/\s|\//, "")} #MUZE`,
  (song: Song) => `I made this track with every emotion I had. "${song.title}" by MUZE. Go listen. You won't regret it 🎶 #MusicRelease #MUZE`,
  (song: Song) => `"${song.title}" is out! ${song.genre} vibes from MUZE. Download it, share it, play it loud 🎧 #MUZE`,
];

export default function MarketingPage() {
  const [sharingSong, setSharingSong] = useState<Song | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const { data: songs, isLoading } = useQuery<Song[]>({ queryKey: ["/api/songs"] });

  const activeSong = selectedSong || songs?.[0] || null;
  const caption = activeSong ? CAPTION_TEMPLATES[captionIdx % CAPTION_TEMPLATES.length](activeSong) : "";

  const copyCaption = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    });
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Market Your Music</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Share your tracks across TikTok, Instagram, Facebook & YouTube to grow your fanbase.</p>

      {/* Platform Cards */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          <TrendingUp className="w-5 h-5 text-primary inline mr-2" />
          Platforms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map(p => (
            <div key={p.name} data-testid={`platform-card-${p.name.toLowerCase()}`}
              className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all">
              <div className={`p-4 flex items-center gap-3 bg-gradient-to-r ${p.color}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.accent} shrink-0`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${p.accent}`}>{p.name}</h3>
                  <p className={`text-xs ${p.accent} opacity-80`}>{p.desc}</p>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-1.5 mb-4">
                  {p.tips.map(tip => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary shrink-0 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  data-testid={`open-${p.name.toLowerCase()}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  Open {p.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Caption Generator */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Caption Generator
        </h2>

        {/* Song selector */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Choose a track:</p>
          {isLoading ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {songs?.map(song => (
                <button key={song.id}
                  onClick={() => setSelectedSong(song)}
                  data-testid={`select-song-${song.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeSong?.id === song.id
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  <VinylCover song={song} size="sm" />
                  {song.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeSong && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <VinylCover song={activeSong} size="md" />
              <div>
                <p className="font-semibold text-sm">{activeSong.title}</p>
                <GenreBadge genre={activeSong.genre} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/60 border border-border text-sm text-foreground leading-relaxed mb-4">
              {caption}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={copyCaption} data-testid="button-copy-caption"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors">
                {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCaption ? "Copied!" : "Copy Caption"}
              </button>
              <button onClick={() => setCaptionIdx(i => i + 1)} data-testid="button-next-caption"
                className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                Next Variation
              </button>
              <button onClick={() => setSharingSong(activeSong)} data-testid="button-share-track"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 transition-colors">
                <Share2 className="w-4 h-4" />
                Share Track
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quick Share All */}
      <section>
        <h2 className="text-lg font-bold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Download className="w-5 h-5 text-primary inline mr-2" />
          Quick Share
        </h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {songs?.map(song => (
              <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <VinylCover song={song} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{song.title}</p>
                  <GenreBadge genre={song.genre} />
                </div>
                <button onClick={() => setSharingSong(song)} data-testid={`quick-share-${song.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shrink-0">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ShareModal song={sharingSong} onClose={() => setSharingSong(null)} />
    </div>
  );
}
