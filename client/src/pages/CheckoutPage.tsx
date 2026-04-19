import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShoppingBag, Gift, Music2, Disc3, DollarSign, Copy, CheckCircle2,
  Smartphone, CreditCard, ArrowLeft, ArrowRight, Shield, User, Mail,
  MessageSquare, AlertCircle, Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PurchaseType = "song" | "album" | "gift_tip";
type PayMethod = "cashapp" | "zelle";
type Step = "select" | "details" | "pay" | "done";

interface PaymentResponse {
  id: number;
  token: string;
  paymentMethod: PayMethod;
  paymentHandle: string;
  grossAmount: number;
  muzeSplit: number;
  artistSplit: number;
  status: string;
  itemTitle: string;
  isGift: boolean;
}

interface AlbumOption {
  name: string;
  songs: Song[];
  totalPrice: number;
}

const TIP_AMOUNTS = [2, 5, 10, 20, 50];
const CASHAPP_HANDLE = "$MUZEmusic";
const ZELLE_HANDLE = "payments@muze.music";

// ─── Step indicators ───────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {["What", "Details", "Pay"].map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 transition-all ${
            i + 1 === current ? "opacity-100" : i + 1 < current ? "opacity-70" : "opacity-30"
          }`}>
            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
              i + 1 <= current ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
            }`}>{i + 1}</div>
            <span className="text-xs font-medium hidden sm:block">{label}</span>
          </div>
          {i < 2 && <div className={`w-8 h-0.5 rounded ${i + 1 < current ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Payment method button ─────────────────────────────────────────────────────
function PayMethodCard({ method, selected, onSelect }: {
  method: PayMethod; selected: boolean; onSelect: () => void;
}) {
  const isCash = method === "cashapp";
  return (
    <button
      onClick={onSelect}
      data-testid={`pay-method-${method}`}
      className={`rounded-2xl p-5 border-2 text-left transition-all w-full ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
          isCash ? "bg-[#00D632]" : "bg-[#6C1CDB]"
        }`}>
          {isCash ? "CA" : "Z"}
        </div>
        <div>
          <p className="font-semibold">{isCash ? "Cash App" : "Zelle"}</p>
          <p className="text-xs text-muted-foreground">{isCash ? CASHAPP_HANDLE : ZELLE_HANDLE}</p>
        </div>
        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-primary bg-primary" : "border-muted-foreground"
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {isCash
          ? "Open Cash App → Pay → search $MUZEmusic"
          : "Open your bank app → Zelle → send to payments@muze.music"}
      </p>
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState<Step>("select");

  // What to buy
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("song");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumOption | null>(null);
  const [tipAmount, setTipAmount] = useState(10);
  const [customTip, setCustomTip] = useState("");

  // Is it a gift?
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  // Buyer details
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  // Payment method
  const [payMethod, setPayMethod] = useState<PayMethod>("cashapp");

  // Payment result
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Load data
  const { data: songs = [] } = useQuery<Song[]>({ queryKey: ["/api/songs"] });
  const { data: albums = [] } = useQuery<{ name: string; songs: Song[] }[]>({ queryKey: ["/api/albums"] });

  const albumOptions: AlbumOption[] = albums.map(a => ({
    name: a.name,
    songs: a.songs,
    totalPrice: Math.round(a.songs.reduce((s, song) => s + song.price, 0) * 100) / 100,
  }));

  // Derive the amount based on purchase type
  const finalAmount = (() => {
    if (purchaseType === "song") return selectedSong?.price ?? 0;
    if (purchaseType === "album") return selectedAlbum?.totalPrice ?? 0;
    return customTip ? parseFloat(customTip) || 0 : tipAmount;
  })();

  const itemTitle = (() => {
    if (purchaseType === "song") return selectedSong?.title ?? "";
    if (purchaseType === "album") return selectedAlbum?.name ?? "";
    return "Fan Tip — General Support";
  })();

  const itemId = (() => {
    if (purchaseType === "song") return String(selectedSong?.id ?? "");
    if (purchaseType === "album") return selectedAlbum?.name ?? "";
    return undefined;
  })();

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/payments", body),
    onSuccess: async (res: any) => {
      const data: PaymentResponse = await res.json();
      setPayment(data);
      setStep("pay");
    },
    onError: async (err: any) => {
      let msg = "Something went wrong.";
      try { const d = await err.response?.json(); msg = d?.message || msg; } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handlePay = () => {
    if (!buyerName || !buyerEmail) return;
    createMutation.mutate({
      itemType: purchaseType,
      itemId,
      itemTitle,
      buyerName,
      buyerEmail,
      isGift,
      recipientName: isGift ? recipientName : undefined,
      recipientEmail: isGift ? recipientEmail : undefined,
      giftMessage: isGift ? giftMessage : undefined,
      grossAmount: finalAmount,
      paymentMethod: payMethod,
    });
  };

  const handleConfirm = async () => {
    if (!payment) return;
    setConfirming(true);
    try {
      await apiRequest("POST", `/api/payments/${payment.token}/confirm`, {});
      setStep("done");
    } catch {
      toast({ title: "Error", description: "Couldn't confirm. Please try again.", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const copyHandle = () => {
    const handle = payMethod === "cashapp" ? CASHAPP_HANDLE : ZELLE_HANDLE;
    navigator.clipboard.writeText(handle).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setStep("select"); setPayment(null); setSelectedSong(null); setSelectedAlbum(null);
    setBuyerName(""); setBuyerEmail(""); setIsGift(false); setRecipientName("");
    setRecipientEmail(""); setGiftMessage(""); setCustomTip("");
  };

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Support Artists</h1>
          <p className="text-sm text-muted-foreground">Tip artists, unlock music, and send gifts</p>
        </div>
      </div>

      {step !== "done" && <StepDots current={step === "select" ? 1 : step === "details" ? 2 : 3} />}

      {/* ═══════════════ STEP 1: SELECT ═══════════════ */}
      {step === "select" && (
        <div className="space-y-6">
          {/* Purchase type */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">What do you want?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "song" as const, label: "Unlock Song", icon: Music2 },
                { type: "album" as const, label: "Unlock Album", icon: Disc3 },
                { type: "gift_tip" as const, label: "Gift / Tip", icon: Gift },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  data-testid={`purchase-type-${type}`}
                  onClick={() => { setPurchaseType(type); setSelectedSong(null); setSelectedAlbum(null); }}
                  className={`rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all ${
                    purchaseType === type ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${purchaseType === type ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Song picker */}
          {purchaseType === "song" && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose a track</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {songs.map(song => (
                  <button
                    key={song.id}
                    data-testid={`pick-song-${song.id}`}
                    onClick={() => setSelectedSong(song)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedSong?.id === song.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Music2 className={`w-4 h-4 ${selectedSong?.id === song.id ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.genre}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">${song.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Album picker */}
          {purchaseType === "album" && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose an album</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {albumOptions.map(album => (
                  <button
                    key={album.name}
                    data-testid={`pick-album-${album.name}`}
                    onClick={() => setSelectedAlbum(album)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedAlbum?.name === album.name ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Disc3 className={`w-4 h-4 ${selectedAlbum?.name === album.name ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{album.name}</p>
                      <p className="text-xs text-muted-foreground">{album.songs.length} tracks</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">${album.totalPrice.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tip amount */}
          {purchaseType === "gift_tip" && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose an amount</p>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {TIP_AMOUNTS.map(a => (
                  <button
                    key={a}
                    data-testid={`tip-${a}`}
                    onClick={() => { setTipAmount(a); setCustomTip(""); }}
                    className={`rounded-xl py-3 text-sm font-bold border-2 transition-all ${
                      tipAmount === a && !customTip ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"
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
                  value={customTip}
                  data-testid="input-custom-tip"
                  onChange={e => { setCustomTip(e.target.value); setTipAmount(0); }}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  min="0.50" step="0.50"
                />
              </div>
            </div>
          )}

          {/* Gift toggle */}
          {purchaseType !== "gift_tip" && (
            <div>
              <button
                onClick={() => setIsGift(g => !g)}
                data-testid="toggle-gift"
                className={`flex items-center gap-3 p-4 rounded-xl border-2 w-full text-left transition-all ${
                  isGift ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <Gift className={`w-5 h-5 ${isGift ? "text-accent" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Send as a gift</p>
                  <p className="text-xs text-muted-foreground">Surprise a friend with music</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isGift ? "border-accent bg-accent" : "border-muted-foreground"
                }`}>
                  {isGift && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </button>
            </div>
          )}

          {/* Continue button */}
          <button
            data-testid="checkout-continue"
            onClick={() => setStep("details")}
            disabled={
              (purchaseType === "song" && !selectedSong) ||
              (purchaseType === "album" && !selectedAlbum) ||
              (purchaseType === "gift_tip" && finalAmount < 0.5)
            }
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════ STEP 2: DETAILS ═══════════════ */}
      {step === "details" && (
        <div className="space-y-5">
          <button onClick={() => setStep("select")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Order summary */}
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {purchaseType === "song" ? <Music2 className="w-4 h-4 text-primary" /> : purchaseType === "album" ? <Disc3 className="w-4 h-4 text-primary" /> : <Gift className="w-4 h-4 text-primary" />}
                <span className="text-sm font-medium truncate max-w-[200px]">{itemTitle}</span>
              </div>
              <span className="font-bold text-primary text-lg">${finalAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Artist tip: ${(finalAmount * 0.6).toFixed(2)} direct to artist · ${(finalAmount * 0.4).toFixed(2)} platform fee
            </p>
          </div>

          {/* Gift recipient fields */}
          {(isGift || purchaseType === "gift_tip") && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-4">
              <p className="text-sm font-semibold text-accent flex items-center gap-2">
                <Gift className="w-4 h-4" /> Gift Details
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Recipient Name</label>
                  <input
                    value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    data-testid="input-recipient-name"
                    placeholder="Friend's name"
                    className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Recipient Email</label>
                  <input
                    type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                    data-testid="input-recipient-email"
                    placeholder="friend@email.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Gift Message (optional)</label>
                <textarea
                  value={giftMessage} onChange={e => setGiftMessage(e.target.value)}
                  data-testid="input-gift-message"
                  placeholder="Enjoy this song, thinking of you!"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Buyer info */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Info</p>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)}
                data-testid="input-buyer-name"
                placeholder="Your name" required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)}
                data-testid="input-buyer-email"
                placeholder="your@email.com" required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pay With</p>
            <div className="space-y-3">
              <PayMethodCard method="cashapp" selected={payMethod === "cashapp"} onSelect={() => setPayMethod("cashapp")} />
              <PayMethodCard method="zelle" selected={payMethod === "zelle"} onSelect={() => setPayMethod("zelle")} />
            </div>
          </div>

          <button
            data-testid="submit-payment"
            onClick={handlePay}
            disabled={createMutation.isPending || !buyerName || !buyerEmail || finalAmount < 0.5}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Processing…" : (
              <>
                <Zap className="w-4 h-4" />
                Continue to Send — ${finalAmount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════ STEP 3: PAY ═══════════════ */}
      {step === "pay" && payment && (
        <div className="space-y-5">
          {/* Big instruction card */}
          <div className="rounded-2xl overflow-hidden border-2 border-primary/30">
            {/* Top bar */}
            <div className="bg-primary px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Step 3 — Send Payment</p>
              <p className="text-2xl font-bold">${payment.grossAmount.toFixed(2)}</p>
              <p className="text-sm opacity-80">{payment.itemTitle}</p>
            </div>

            <div className="p-5 bg-card space-y-4">
              {/* Handle to send to */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {payment.paymentMethod === "cashapp" ? "Send via Cash App to:" : "Send via Zelle to:"}
                </p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    payment.paymentMethod === "cashapp" ? "bg-[#00D632]" : "bg-[#6C1CDB]"
                  }`}>
                    {payment.paymentMethod === "cashapp" ? "CA" : "Z"}
                  </div>
                  <span className="font-mono font-bold text-lg text-foreground flex-1">
                    {payment.paymentHandle}
                  </span>
                  <button
                    onClick={copyHandle}
                    data-testid="copy-payment-handle"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Note field */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Add this note in your payment:</p>
                  <p className="font-mono bg-amber-500/10 px-2 py-1 rounded mt-1 inline-block">
                    MUZE-{payment.id}-{buyerEmail.split("@")[0]}
                  </p>
                </div>
              </div>

              {/* Split breakdown */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-lg font-bold text-primary">${payment.artistSplit.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Artist (60%)</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-lg font-bold">${payment.muzeSplit.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">MUZE Platform (40%)</p>
                </div>
              </div>

              {/* Instructions */}
              <ol className="space-y-2 text-sm">
                {(payment.paymentMethod === "cashapp"
                  ? [
                      "Open Cash App on your phone",
                      `Tap the $ icon — search "${CASHAPP_HANDLE}"`,
                      `Enter $${payment.grossAmount.toFixed(2)} and add the reference note above`,
                      "Tap Pay — then come back here and confirm",
                    ]
                  : [
                      "Open your bank app (Chase, BoA, Wells Fargo, etc.)",
                      "Go to Zelle — Send Money",
                      `Enter: ${ZELLE_HANDLE}`,
                      `Send $${payment.grossAmount.toFixed(2)} with the reference note above`,
                      "Come back here and confirm",
                    ]
                ).map((instruction, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0 mt-0.5">{i + 1}</span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Your payment reference is unique and encrypted
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            data-testid="confirm-payment-sent"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-600/90 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {confirming ? "Confirming…" : "I've Sent the Payment"}
          </button>

          <button
            onClick={() => { if (payment) apiRequest("POST", `/api/payments/${payment.token}/cancel`, {}); resetAll(); }}
            className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ═══════════════ STEP 4: DONE ═══════════════ */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Support Received!</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Thank you{buyerName ? `, ${buyerName}` : ""}! Your artist support of{" "}
              <span className="font-bold text-foreground">${finalAmount.toFixed(2)}</span> has been recorded.
            </p>
          </div>

          {payment && (
            <div className="rounded-2xl bg-card border border-border p-5 w-full text-left space-y-3">
              <p className="text-sm font-semibold">Support Receipt</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-medium truncate max-w-[180px]">{payment.itemTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">${payment.grossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{payment.paymentMethod === "cashapp" ? "Cash App" : "Zelle"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To artist</span>
                  <span className="text-green-400">${payment.artistSplit.toFixed(2)} (60%)</span>
                </div>
              </div>
            </div>
          )}

          {isGift && recipientEmail && (
            <p className="text-sm text-muted-foreground">
              A gift notification will be sent to <strong className="text-foreground">{recipientEmail}</strong>.
            </p>
          )}

          {/* Apple / App Store compliance disclosure */}
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Artist support payments are voluntary tips sent directly to independent creators via Cash App or Zelle. MUZE does not sell digital goods — we facilitate artist-to-fan connections.
          </p>

          <button
            onClick={resetAll}
            data-testid="checkout-again"
            className="px-8 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-all"
          >
            Support Another Artist
          </button>
        </div>
      )}
    </div>
  );
}
