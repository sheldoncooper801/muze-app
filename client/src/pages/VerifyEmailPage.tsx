import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Loader2, Music } from "lucide-react";

export default function VerifyEmailPage() {
  const [, nav] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf("?");
    let token = "";
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      token = params.get("token") || "";
    }
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }
    apiRequest("GET", `/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4">
            <Music className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Email Verification</h1>
        </div>

        <Card className="border-border bg-card text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Verifying your email…</p>
              </>
            )}
            {status === "success" && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Email Verified!</h2>
                <p className="text-muted-foreground text-sm">{message}</p>
                <Button className="w-full" onClick={() => nav("/login")} data-testid="button-go-login">
                  Sign In to MUZE
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold">Verification Failed</h2>
                <p className="text-muted-foreground text-sm">{message}</p>
                <Button className="w-full" onClick={() => nav("/register")} data-testid="button-try-again">
                  Try Registering Again
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => nav("/login")}>
                  Go to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
