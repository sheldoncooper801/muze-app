import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Gift, Smartphone } from "lucide-react";
import type { Song } from "@shared/schema";
import VinylCover from "./VinylCover";
import { useLocation } from "wouter";

interface Props {
  song: Song | null;
  onClose: () => void;
}

export default function BuyModal({ song, onClose }: Props) {
  const [, navigate] = useLocation();

  if (!song) return null;

  const goToCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <Dialog open={!!song} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <ShoppingCart className="w-5 h-5 text-primary" /> Support This Artist
          </DialogTitle>
          <DialogDescription>
            Send a tip to the artist directly via Cash App or Zelle to unlock this track.
          </DialogDescription>
        </DialogHeader>

        {/* Song preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
          <VinylCover song={song} size="md" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-sm truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground">{song.artist} · {song.genre}</p>
          </div>
          <span className="ml-auto font-bold text-primary text-lg shrink-0">${song.price.toFixed(2)}</span>
        </div>

        {/* Payment method pills */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00D632]/10 border border-[#00D632]/20">
            <div className="w-7 h-7 rounded bg-[#00D632] flex items-center justify-center text-white text-xs font-bold">CA</div>
            <span className="text-xs font-medium">Cash App</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#6C1CDB]/10 border border-[#6C1CDB]/20">
            <div className="w-7 h-7 rounded bg-[#6C1CDB] flex items-center justify-center text-white text-xs font-bold">Z</div>
            <span className="text-xs font-medium">Zelle</span>
          </div>
        </div>

        {/* Split info */}
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Artist-First Support</p>
          <p><span className="text-green-400 font-semibold">${(song.price * 0.6).toFixed(2)} (60%)</span> goes directly to the artist · <span className="text-primary font-semibold">${(song.price * 0.4).toFixed(2)} (40%)</span> MUZE platform fee</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={goToCheckout} className="flex-1" data-testid="go-to-checkout">
            <CreditCard className="w-4 h-4 mr-2" />
            Support & Unlock
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          <Gift className="w-3 h-3 inline mr-1" />
          Want to gift this to a friend? Use the full support flow.
        </p>
      </DialogContent>
    </Dialog>
  );
}
