import { useState, useRef, useEffect, useCallback } from "react";
import { Sliders, Volume2, RotateCcw, Zap } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";

interface Band {
  frequency: number;
  label: string;
  gain: number;
}

const DEFAULT_BANDS: Band[] = [
  { frequency: 32, label: "32Hz", gain: 0 },
  { frequency: 64, label: "64Hz", gain: 0 },
  { frequency: 125, label: "125Hz", gain: 0 },
  { frequency: 250, label: "250Hz", gain: 0 },
  { frequency: 500, label: "500Hz", gain: 0 },
  { frequency: 1000, label: "1kHz", gain: 0 },
  { frequency: 2000, label: "2kHz", gain: 0 },
  { frequency: 4000, label: "4kHz", gain: 0 },
  { frequency: 8000, label: "8kHz", gain: 0 },
  { frequency: 16000, label: "16kHz", gain: 0 },
];

const PRESETS: Record<string, number[]> = {
  Flat:       [0,   0,   0,   0,   0,   0,   0,   0,   0,   0],
  Bass:       [8,   6,   4,   2,   0,   0,   0,   0,   0,   0],
  Treble:     [0,   0,   0,   0,   0,   2,   4,   6,   8,   6],
  Vocal:      [-2,  -2,  0,   4,   6,   6,   4,   2,   0,  -2],
  "Hip-Hop":  [6,   8,   4,   0,  -2,  -2,   0,   2,   2,   2],
  Gospel:     [4,   2,   0,   2,   4,   6,   6,   4,   2,   2],
  Jazz:       [4,   3,   1,   2,  -1,  -1,   0,   1,   2,   3],
  "Lo-Fi":    [4,   2,   0,  -2,  -4,  -4,  -2,   0,   2,   4],
  "R&B":      [6,   4,   2,   0,  -2,   2,   4,   4,   2,   0],
  Pop:        [-1,  0,   2,   4,   5,   4,   2,   0,  -1,  -1],
};

export default function EqualizerPage() {
  const [bands, setBands] = useState<Band[]>(DEFAULT_BANDS.map(b => ({ ...b })));
  const [selectedPreset, setSelectedPreset] = useState("Flat");
  const [eqEnabled, setEqEnabled] = useState(true);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { currentSong, isPlaying } = usePlayer();

  // Initialize Web Audio API filters
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const filters: BiquadFilterNode[] = DEFAULT_BANDS.map((band, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? "lowshelf" : i === DEFAULT_BANDS.length - 1 ? "highshelf" : "peaking";
        filter.frequency.value = band.frequency;
        filter.gain.value = 0;
        filter.Q.value = 1;
        return filter;
      });
      // Chain filters
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filtersRef.current = filters;
    } catch (e) {
      // AudioContext not available
    }
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const applyBands = useCallback((newBands: Band[]) => {
    filtersRef.current.forEach((filter, i) => {
      if (filter && eqEnabled) filter.gain.value = newBands[i]?.gain ?? 0;
      else if (filter) filter.gain.value = 0;
    });
  }, [eqEnabled]);

  const updateBand = (index: number, gain: number) => {
    const newBands = bands.map((b, i) => i === index ? { ...b, gain } : b);
    setBands(newBands);
    applyBands(newBands);
  };

  const applyPreset = (name: string) => {
    const gains = PRESETS[name];
    if (!gains) return;
    setSelectedPreset(name);
    const newBands = bands.map((b, i) => ({ ...b, gain: gains[i] ?? 0 }));
    setBands(newBands);
    applyBands(newBands);
  };

  const resetEQ = () => applyPreset("Flat");

  const toggleEQ = () => {
    const enabled = !eqEnabled;
    setEqEnabled(enabled);
    filtersRef.current.forEach((filter, i) => {
      if (filter) filter.gain.value = enabled ? bands[i]?.gain ?? 0 : 0;
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Equalizer</h1>
            <p className="text-sm text-muted-foreground">10-band EQ — shape your sound</p>
          </div>
        </div>
        <button
          onClick={toggleEQ}
          data-testid="toggle-eq"
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
            eqEnabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          <Zap className="w-4 h-4" />
          {eqEnabled ? "On" : "Off"}
        </button>
      </div>

      {/* Now Playing */}
      {currentSong && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border mb-6">
          <Volume2 className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm"><span className="font-medium">{currentSong.title}</span> <span className="text-muted-foreground">— {currentSong.genre}</span></p>
          {isPlaying && <span className="ml-auto flex gap-0.5">
            {[1,2,3].map(i => (
              <span key={i} className="w-0.5 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>}
        </div>
      )}

      {/* EQ Bands */}
      <div className={`rounded-2xl bg-card border border-border p-6 mb-6 transition-opacity ${eqEnabled ? "opacity-100" : "opacity-40"}`}>
        <div className="flex items-end justify-between gap-2 h-52">
          {bands.map((band, i) => {
            const pct = ((band.gain + 12) / 24) * 100;
            return (
              <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1">
                {/* Gain display */}
                <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                  {band.gain > 0 ? `+${band.gain}` : band.gain}
                </span>
                {/* Vertical slider */}
                <div className="relative flex-1 w-full flex justify-center">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={band.gain}
                    onChange={e => updateBand(i, Number(e.target.value))}
                    disabled={!eqEnabled}
                    data-testid={`eq-band-${band.frequency}`}
                    className="eq-slider"
                    style={{
                      writingMode: "vertical-lr",
                      direction: "rtl",
                      WebkitAppearance: "slider-vertical",
                      appearance: "slider-vertical",
                      height: "120px",
                      width: "28px",
                      cursor: eqEnabled ? "pointer" : "not-allowed",
                      accentColor: "hsl(270, 85%, 65%)",
                    }}
                  />
                </div>
                {/* Label */}
                <span className="text-xs text-muted-foreground" style={{ fontSize: "10px" }}>{band.label}</span>
              </div>
            );
          })}
        </div>
        {/* Zero line indicator */}
        <p className="text-center text-xs text-muted-foreground mt-2">0 dB center — drag up to boost, down to cut</p>
      </div>

      {/* Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Presets</p>
          <button onClick={resetEQ} data-testid="reset-eq" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map(name => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              data-testid={`preset-${name.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                selectedPreset === name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        EQ shapes audio via Web Audio API. Start playing a song to hear the effect.
      </p>
    </div>
  );
}
