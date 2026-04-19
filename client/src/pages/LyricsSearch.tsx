import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Music2, Play, Quote } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import GenreBadge from "@/components/GenreBadge";
import type { Song } from "@shared/schema";

interface LyricsResult extends Song {
  matchSnippet: string;
}

export default function LyricsSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { playSong } = usePlayer();
  let debounceTimer: ReturnType<typeof setTimeout>;

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setDebouncedQuery(val), 350);
  };

  const { data: results = [], isLoading } = useQuery<LyricsResult[]>({
    queryKey: ["/api/lyrics-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await apiRequest("GET", `/api/lyrics-search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: allSongs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });

  const highlightMatch = (snippet: string, q: string) => {
    if (!q) return snippet;
    const parts = snippet.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Quote className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Lyrics Search</h1>
          <p className="text-sm text-muted-foreground">Can't remember a song? Search by lyric.</p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          data-testid="input-lyrics-search"
          placeholder="Type any lyric you remember…"
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border-2 border-border focus:border-primary focus:outline-none text-base transition-colors"
          autoFocus
        />
      </div>

      {/* Results */}
      {debouncedQuery.length >= 2 && (
        <div>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Music2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No songs found with those lyrics.</p>
              <p className="text-xs mt-1">Try a different phrase.</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">{results.length} song{results.length !== 1 ? "s" : ""} found</p>
              <div className="space-y-3">
                {results.map(result => (
                  <div
                    key={result.id}
                    data-testid={`lyrics-result-${result.id}`}
                    className="rounded-2xl bg-card border border-border p-4 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{result.title}</h3>
                          <GenreBadge genre={result.genre} />
                        </div>
                        {/* Lyric snippet */}
                        <div className="text-sm text-muted-foreground bg-background/50 rounded-xl p-3 mt-2 italic leading-relaxed border border-border/50">
                          <Quote className="w-3 h-3 inline mr-1 opacity-60" />
                          {highlightMatch(result.matchSnippet, debouncedQuery)}
                        </div>
                      </div>
                      <button
                        data-testid={`play-lyric-result-${result.id}`}
                        onClick={() => playSong(result, results)}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all shrink-0 mt-0.5"
                      >
                        <Play className="w-4 h-4 text-primary ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state with hints */}
      {debouncedQuery.length < 2 && (
        <div className="text-center py-8">
          <Quote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-6">Start typing a lyric snippet to find the song</p>
          <div className="text-left max-w-sm mx-auto space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Try searching for:</p>
            {[
              "if we never happened",
              "hallelujah anyway",
              "unrealistic expectations",
              "king's monologue",
              "brown sugar rain",
              "falling in love with jesus",
            ].map(hint => (
              <button
                key={hint}
                onClick={() => handleChange(hint)}
                className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all italic text-muted-foreground hover:text-foreground"
              >
                "{hint}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
