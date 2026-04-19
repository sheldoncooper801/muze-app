import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, LoginError } from "@/context/AuthContext";
import { Eye, EyeOff, Music, Mail, Lock, AlertTriangle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setNeedsVerification(false);
    try {
      await login(email.trim().toLowerCase(), password);
      toast({ title: "Welcome back to MUZE!" });
      nav("/");
    } catch (err: unknown) {
      if (err instanceof LoginError && err.needsVerification) {
        setNeedsVerification(true);
        toast({ title: "Email not verified", description: "Check the banner below to activate your account.", variant: "destructive" });
      } else {
        const msg = err instanceof Error ? err.message : "Login failed";
        toast({ title: msg, variant: "destructive" });
      }
    }
  }

  async function handleResendVerification() {
    if (!email) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNeedsVerification(false);
        toast({ title: "Account activated!", description: data.message || "You can now sign in." });
      } else {
        toast({ title: data.error || "Could not resend", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4">
            <Music className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Sign In to MUZE</h1>
          <p className="text-muted-foreground text-sm mt-1">Artist portal</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    data-testid="input-login-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-pw">Password</Label>
                  <button
                    type="button"
                    onClick={() => nav("/forgot-password")}
                    className="text-xs text-primary hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-pw"
                    data-testid="input-login-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Your password"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {needsVerification && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex flex-col gap-2 text-sm">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300">Your account hasn't been verified yet. Tap below to activate it instantly.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 w-full"
                    onClick={handleResendVerification}
                    disabled={resending}
                    data-testid="button-activate-account"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-2 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? "Activating…" : "Activate My Account"}
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                data-testid="button-login"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={() => nav("/register")}
                  className="text-primary hover:underline"
                  data-testid="link-register"
                >
                  Create one
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your account is protected with bcrypt password hashing, JWT sessions, and account lockout after 5 failed attempts.
        </p>
      </div>
    </div>
  );
}
