import type { Song } from "@shared/schema";

const GENRE_COLORS: Record<string, string> = {
  "R&B": "from-purple-900 via-purple-700 to-pink-700",
  "Trap": "from-red-900 via-red-700 to-orange-700",
  "Christian/Worship": "from-blue-900 via-indigo-700 to-sky-600",
};

const GENRE_ACCENTS: Record<string, string> = {
  "R&B": "#a855f7",
  "Trap": "#ef4444",
  "Christian/Worship": "#3b82f6",
};

const INITIALS_MAP: Record<number, string> = {
  1: "WH",
  2: "UE",
  3: "FJ",
  4: "AC",
  5: "MS",
  6: "MW",
};

interface Props {
  song: Song;
  size?: "sm" | "md" | "lg" | "xl";
  spinning?: boolean;
  showVinyl?: boolean;
}

export default function VinylCover({ song, size = "md", spinning = false, showVinyl = false }: Props) {
  const gradient = GENRE_COLORS[song.genre] || "from-gray-900 via-gray-700 to-gray-600";
  const accent = GENRE_ACCENTS[song.genre] || "#a855f7";

  const sizes = {
    sm: "w-10 h-10 rounded-lg",
    md: "w-14 h-14 rounded-xl",
    lg: "w-24 h-24 rounded-2xl",
    xl: "w-48 h-48 rounded-3xl md:w-56 md:h-56",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-3xl",
  };

  if (showVinyl) {
    return (
      <div className={`relative ${sizes[size]} ${spinning ? "vinyl-spin" : "vinyl-paused"}`}>
        {/* Vinyl disc */}
        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center shadow-xl border border-gray-700">
          {/* Grooves */}
          <div className="absolute inset-2 rounded-full border border-gray-700/30" />
          <div className="absolute inset-4 rounded-full border border-gray-700/30" />
          <div className="absolute inset-6 rounded-full border border-gray-700/30" />
          {/* Center label */}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">{(INITIALS_MAP[song.id] || song.title.slice(0,2).toUpperCase())}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 relative overflow-hidden`}>
      {/* Music note icon */}
      <svg viewBox="0 0 24 24" className={`${size === "sm" ? "w-5 h-5" : size === "md" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-16 h-16"} opacity-80`} fill="white">
        <path d="M9 18V5l12-2v13" strokeWidth="0" />
        <circle cx="6" cy="18" r="3" fill="white" />
        <circle cx="18" cy="16" r="3" fill="white" />
        <path d="M9 18V5l12-2v13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Subtle shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10 pointer-events-none" />
    </div>
  );
}
