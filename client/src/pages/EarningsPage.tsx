import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Music2, Gift, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface PaymentRecord {
  id: number;
  itemTitle: string;
  itemType: string;
  buyerName: string;
  buyerEmail: string;
  grossAmount: number;
  muzeSplit: number;
  artistSplit: number;
  paymentMethod: string;
  status: string;
  isGift: boolean;
  createdAt: string | null;
}

interface Stats {
  totalRevenue: number;
  muzeTake: number;
  artistTake: number;
  totalCount: number;
  pendingCount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "text-green-400", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-amber-400", icon: AlertCircle },
  failed: { label: "Cancelled", color: "text-red-400", icon: XCircle },
};

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string; icon: typeof DollarSign; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "border-primary/30 bg-primary/10" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-primary/20" : "bg-secondary"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function EarningsPage() {
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/payments/stats"] });
  const { data: payments = [] } = useQuery<PaymentRecord[]>({ queryKey: ["/api/payments"] });

  const confirmedPayments = payments.filter(p => p.status === "confirmed");
  const pendingPayments = payments.filter(p => p.status === "pending");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>MUZE Earnings</h1>
          <p className="text-sm text-muted-foreground">40/60 split — platform vs artist</p>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} accent />
          <StatCard label="Artist Payouts" value={`$${stats.artistTake.toFixed(2)}`} sub="60% share" icon={Music2} />
          <StatCard label="MUZE Platform" value={`$${stats.muzeTake.toFixed(2)}`} sub="40% share" icon={TrendingUp} />
          <StatCard label="Transactions" value={String(stats.totalCount)} sub={`${stats.pendingCount} pending`} icon={Clock} />
        </div>
      )}

      {/* Split bar */}
      {stats && stats.totalRevenue > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5 mb-8">
          <p className="text-sm font-semibold mb-3">Revenue Split</p>
          <div className="flex rounded-full overflow-hidden h-4 mb-2">
            <div
              className="bg-primary flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: "40%" }}
            >40%</div>
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: "60%" }}
            >60%</div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>MUZE: ${stats.muzeTake.toFixed(2)}</span>
            <span>Artists: ${stats.artistTake.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Pending payments alert */}
      {pendingPayments.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">{pendingPayments.length} payment{pendingPayments.length > 1 ? "s" : ""} awaiting confirmation</p>
            <p className="text-xs text-muted-foreground">These will auto-confirm once the user clicks "I've Sent the Payment"</p>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">All Transactions</h2>
        {payments.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No payments yet.</p>
            <p className="text-xs mt-1">Share MUZE to start earning.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(p => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={p.id} data-testid={`payment-row-${p.id}`} className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      p.itemType === "gift_tip" ? "bg-accent/20" : "bg-primary/20"
                    }`}>
                      {p.itemType === "gift_tip" ? <Gift className="w-4 h-4 text-accent" /> : <Music2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{p.itemTitle}</p>
                        <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        {p.isGift && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent">Gift</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.buyerName} · {p.buyerEmail} · {p.paymentMethod === "cashapp" ? "Cash App" : "Zelle"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">${p.grossAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">→ ${p.artistSplit.toFixed(2)} artist</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
