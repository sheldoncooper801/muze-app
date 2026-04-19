import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "questions" | "done">("email");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState(["", "", ""]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email: email.trim().toLowerCase() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setQuestions(data.questions || []);
      setStep("questions");
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswersSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answers.some(a => a.trim().length < 1)) {
      toast({ title: "Answer all 3 questions", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-security", {
        email: email.trim().toLowerCase(),
        sa1: answers[0].trim(),
        sa2: answers[1].trim(),
        sa3: answers[2].trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setStep("done");
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
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground text-sm mt-1">We'll verify your identity before resetting</p>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1.5 rounded-full ${step === "email" || step === "questions" ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step === "questions" ? "bg-primary" : "bg-muted"}`} />
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Enter your email
              </CardTitle>
              <CardDescription>We'll look up your security questions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fp-email"
                      data-testid="input-fp-email"
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
                <Button type="submit" data-testid="button-fp-next" className="w-full" disabled={loading}>
                  {loading ? "Looking up…" : "Continue"}
                </Button>
                <Button variant="ghost" type="button" className="w-full text-muted-foreground" onClick={() => nav("/login")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Security Questions */}
        {step === "questions" && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Security Questions
              </CardTitle>
              <CardDescription>Answer at least 2 of 3 questions correctly to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnswersSubmit} className="space-y-4">
                {questions.map((q, i) => (
                  <div key={i} className="space-y-1.5">
                    <Label className="text-sm">{q}</Label>
                    <Input
                      data-testid={`input-sq-answer-${i + 1}`}
                      placeholder="Your answer"
                      value={answers[i]}
                      onChange={e => {
                        const next = [...answers];
                        next[i] = e.target.value;
                        setAnswers(next);
                      }}
                    />
                  </div>
                ))}
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Answers are not case-sensitive. You need to pass <strong className="text-foreground">2 of 3</strong> questions.
                </div>
                <Button type="submit" data-testid="button-verify-security" className="w-full" disabled={loading}>
                  {loading ? "Verifying…" : "Verify My Identity"}
                </Button>
                <Button variant="ghost" type="button" className="w-full text-muted-foreground" onClick={() => setStep("email")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Email sent */}
        {step === "done" && (
          <Card className="border-border bg-card text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">Check your inbox</h2>
              <p className="text-muted-foreground text-sm">
                A password reset link was sent to <strong className="text-foreground">{email}</strong>. It expires in 1 hour.
              </p>
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground text-left">
                <p className="font-medium text-foreground mb-1">Didn't receive it?</p>
                <p>Check your spam folder, or{" "}
                  <button className="text-primary hover:underline" onClick={() => { setStep("email"); setAnswers(["","",""]); }}>
                    try again
                  </button>.
                </p>
              </div>
              <Button className="w-full" onClick={() => nav("/login")}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
