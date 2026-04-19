import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

function PasswordCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {ok ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" /> : <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />}
      <span className={`text-xs ${ok ? "text-green-400" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Extract token from hash query: /#/reset-password?token=XXX
    const hash = window.location.hash; // e.g. #/reset-password?token=abc
    const qIndex = hash.indexOf("?");
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      setToken(params.get("token") || "");
    }
  }, []);

  const checks = [
    { label: "8+ characters", ok: newPw.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(newPw) },
    { label: "Number", ok: /[0-9]/.test(newPw) },
    { label: "Special character", ok: /[^a-zA-Z0-9]/.test(newPw) },
  ];
  const passwordValid = checks.every(c => c.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) { toast({ title: "Password doesn't meet all requirements", variant: "destructive" }); return; }
    if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (!token) { toast({ title: "Invalid reset link — no token found", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, newPassword: newPw });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a strong password for your account</p>
        </div>

        {done ? (
          <Card className="border-border bg-card text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">Password Updated</h2>
              <p className="text-muted-foreground text-sm">Your password has been changed. You can now sign in.</p>
              <Button className="w-full" onClick={() => nav("/login")}>Go to Login</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">New Password</CardTitle>
              <CardDescription>Must meet all requirements below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-pw"
                      data-testid="input-new-password"
                      type={showPw ? "text" : "password"}
                      placeholder="New password"
                      className="pl-9 pr-10"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPw && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {checks.map(c => <PasswordCheck key={c.label} label={c.label} ok={c.ok} />)}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-pw"
                      data-testid="input-confirm-new-password"
                      type="password"
                      placeholder="Repeat new password"
                      className="pl-9"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      required
                    />
                  </div>
                  {confirmPw && (
                    <p className={`text-xs flex items-center gap-1 ${newPw === confirmPw ? "text-green-400" : "text-red-400"}`}>
                      {newPw === confirmPw
                        ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                        : <><XCircle className="h-3 w-3" /> Passwords don't match</>}
                    </p>
                  )}
                </div>
                <Button type="submit" data-testid="button-reset-password" className="w-full" disabled={loading || !token}>
                  {loading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
