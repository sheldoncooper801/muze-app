import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Song } from "@shared/schema";
import VinylCover from "./VinylCover";

const SHARE_URL = "https://muze.music";

interface Props {
  song: Song | null;
  onClose: () => void;
}

function buildShareText(song: Song) {
  return encodeURIComponent(`🎵 Check out "${song.title}" by ${song.artist} on MUZE — ${SHARE_URL}`);
}

export default function ShareModal({ song, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  if (!song) return null;

  const shareText = buildShareText(song);
  const shareUrl = encodeURIComponent(SHARE_URL);

  const socials = [
    {
      name: "TikTok",
      color: "bg-black hover:bg-gray-900 text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z"/>
        </svg>
      ),
      url: `https://www.tiktok.com/share?url=${shareUrl}&text=${shareText}`,
    },
    {
      name: "Instagram",
      color: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      url: `https://www.instagram.com/`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877f2] hover:bg-[#166fe5] text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
    },
    {
      name: "YouTube",
      color: "bg-[#ff0000] hover:bg-[#cc0000] text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="black"/>
        </svg>
      ),
      url: `https://www.youtube.com/`,
    },
    {
      name: "X / Twitter",
      color: "bg-black hover:bg-gray-900 text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(`${SHARE_URL} - "${song.title}" by ${song.artist}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={!!song} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Share This Track</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <VinylCover song={song} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground">{song.artist}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {socials.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              data-testid={`share-${s.name.toLowerCase().replace(/\s|\//g, "-")}`}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${s.color}`}>
              {s.icon}
              {s.name}
            </a>
          ))}
        </div>

        <Button variant="outline" onClick={handleCopy} data-testid="button-copy-link"
          className="w-full flex items-center gap-2 border-border">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
