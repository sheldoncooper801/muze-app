import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, DollarSign, Send, CheckCircle, Music2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Song } from "@shared/schema";

const TIP_AMOUNTS = [1, 3, 5, 10, 20, 50];

interface FanTip {
  id: number;
  songId: number | null;
  fromName: string;
  fromEmail: string;
  amount: number;
  message: string;
  createdAt: number;
}

export default function FanTipPage() {
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  const { data: songs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });
  const { data: tips = [] } = useQuery<FanTip[]>({ queryKey: ["/api/tips"] });

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const tipMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/tips", data),
    onSuccess: () => {
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromName || !fromEmail || finalAmount <= 0) return;
    tipMutation.mutate({ fromName, fromEmail, amount: finalAmount, message, songId: selectedSong });
  };

  const totalTipped = tips.reduce((acc, t) => acc + t.amount, 0);

  if (sent) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Thank You!</h2>
        <p className="text-muted-foreground mb-2">Your tip of <span className="text-foreground font-semibold">${finalAmount}</span> has been sent to MUZE.</p>
        <p className="text-sm text-muted-foreground mb-8">Your support helps create more music you love.</p>
        <button
          onClick={() => { setSent(false); setFromName(""); setFromEmail(""); setMessage(""); setCustomAmount(""); setAmount(5); }}
          className="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-all"
        >
          Send Another Tip
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Support MUZE</h1>
            <p className="text-sm text-muted-foreground">Send a tip directly to the artist — no middleman</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-xl font-bold text-primary">${totalTipped.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Tipped</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-xl font-bold text-primary">{tips.length}</p>
          <p className="text-xs text-muted-foreground">Supporters</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-xl font-bold text-primary">{songs.length}</p>
          <p className="text-xs text-muted-foreground">Songs</p>
        </div>
      </div>

      {/* Tip form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Song selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tip for a specific song (optional)</label>
          <select
            value={selectedSong ?? ""}
            onChange={e => setSelectedSong(e.target.value ? Number(e.target.value) : null)}
            data-testid="select-tip-song"
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">General support for MUZE</option>
            {songs.map(s => (
              <option key={s.id} value={s.id}>{s.title} — {s.genre}</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium mb-2 block">Choose an amount</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {TIP_AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                data-testid={`tip-amount-${a}`}
                onClick={() => { setAmount(a); setCustomAmount(""); }}
                className={`rounded-xl py-3 text-sm font-semibold border-2 transition-all ${
                  amount === a && !customAmount
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
              data-testid="input-custom-amount"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              min="0.50"
              step="0.50"
            />
          </div>
        </div>

        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <input
              type="text"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              data-testid="input-tip-name"
              placeholder="First name"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              data-testid="input-tip-email"
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-2 block">Message (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            data-testid="input-tip-message"
            placeholder="Leave a note for MUZE..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          data-testid="button-send-tip"
          disabled={tipMutation.isPending || !fromName || !fromEmail || finalAmount <= 0}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {tipMutation.isPending ? "Sending…" : `Send $${finalAmount.toFixed(2)} Tip`}
        </button>
      </form>

      {/* Recent tips */}
      {tips.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Support</h2>
          <div className="space-y-3">
            {[...tips].reverse().slice(0, 5).map(tip => (
              <div key={tip.id} data-testid={`tip-item-${tip.id}`} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{tip.fromName}</p>
                    <p className="text-sm font-bold text-primary">${tip.amount}</p>
                  </div>
                  {tip.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tip.message}</p>}
                  {tip.songId && <p className="text-xs text-muted-foreground mt-0.5">
                    <Music2 className="w-3 h-3 inline mr-1" />
                    {songs.find(s => s.id === tip.songId)?.title || "a song"}
                  </p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
