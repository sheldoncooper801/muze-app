interface Props {
  genre: string;
  size?: "sm" | "md";
}

const GENRE_STYLES: Record<string, string> = {
  "R&B": "bg-purple-900/60 text-purple-300 border border-purple-700/40",
  "Trap": "bg-red-900/60 text-red-300 border border-red-700/40",
  "Christian/Worship": "bg-blue-900/60 text-blue-300 border border-blue-700/40",
};

export default function GenreBadge({ genre, size = "sm" }: Props) {
  const style = GENRE_STYLES[genre] || "bg-gray-800/60 text-gray-300 border border-gray-700/40";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${size === "sm" ? "text-xs" : "text-sm"} ${style}`}>
      {genre}
    </span>
  );
}
