import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, CheckCircle2, XCircle, Music, ArrowLeft, ArrowRight, User, Mail, Phone, Lock, ShieldCheck } from "lucide-react";

const SECURITY_QUESTIONS = [
  "What was the name of your childhood pet?",
  "What was the name of your first school?",
  "What city did you grow up in?",
  "What is your mother's maiden name?",
  "What was your first car?",
  "What was the street name you grew up on?",
  "What is the middle name of your oldest sibling?",
  "What was the name of your first employer?",
  "What was your childhood nickname?",
  "In what city were you born?",
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special character", ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <Progress value={score * 25} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground w-12">{password ? labels[score] : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1">
            {c.ok
              ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
              : <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span className={`text-xs ${c.ok ? "text-green-400" : "text-muted-foreground"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: account, 2: security questions, 3: done
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 security questions
  const [sq1, setSq1] = useState(SECURITY_QUESTIONS[0]);
  const [sa1, setSa1] = useState("");
  const [sq2, setSq2] = useState(SECURITY_QUESTIONS[1]);
  const [sa2, setSa2] = useState("");
  const [sq3, setSq3] = useState(SECURITY_QUESTIONS[2]);
  const [sa3, setSa3] = useState("");

  const passwordValid = /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) && password.length >= 8;

  function validateStep1() {
    if (!name.trim() || name.trim().length < 2) { toast({ title: "Name too short", variant: "destructive" }); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast({ title: "Invalid email", variant: "destructive" }); return false; }
    if (!phone.trim() || phone.trim().length < 7) { toast({ title: "Enter a valid phone number", variant: "destructive" }); return false; }
    if (!passwordValid) { toast({ title: "Password doesn't meet requirements", variant: "destructive" }); return false; }
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return false; }
    return true;
  }

  function validateStep2() {
    if (!sa1.trim() || !sa2.trim() || !sa3.trim()) { toast({ title: "Answer all 3 security questions", variant: "destructive" }); return false; }
    if (sa1.trim().length < 2 || sa2.trim().length < 2 || sa3.trim().length < 2) { toast({ title: "Answers must be at least 2 characters", variant: "destructive" }); return false; }
    const sqs = [sq1, sq2, sq3];
    if (new Set(sqs).size < 3) { toast({ title: "Choose 3 different security questions", variant: "destructive" }); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        name: name.trim(), email: email.trim().toLowerCase(),
        password, phone: phone.trim(),
        sq1, sa1: sa1.trim(),
        sq2, sa2: sa2.trim(),
        sq3, sa3: sa3.trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStep(3);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4">
            <Music className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Join MUZE</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your artist account</p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        )}

        {/* Step 1: Account Info */}
        {step === 1 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Your Info
              </CardTitle>
              <CardDescription>Set up your artist profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-name" data-testid="input-name" placeholder="Your full name" className="pl-9"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-email" data-testid="input-email" type="email" placeholder="artist@email.com" className="pl-9"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-phone" data-testid="input-phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-9"
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-pw">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-pw" data-testid="input-password" type={showPw ? "text" : "password"} placeholder="Create a strong password" className="pl-9 pr-10"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && <PasswordStrength password={password} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-confirm" data-testid="input-confirm-password" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" className="pl-9 pr-10"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> Passwords don't match</p>
                )}
                {confirmPassword && password === confirmPassword && password.length > 0 && (
                  <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Passwords match</p>
                )}
              </div>
              <Button data-testid="button-next-step1" className="w-full" onClick={() => { if (validateStep1()) setStep(2); }}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => nav("/login")} className="text-primary hover:underline">Sign in</button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Security Questions */}
        {step === 2 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Security Questions
              </CardTitle>
              <CardDescription>These protect your account if you ever forget your password. Answers are encrypted and never stored in plain text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {([
                { label: "Question 1", q: sq1, setQ: setSq1, a: sa1, setA: setSa1, testId: "1" },
                { label: "Question 2", q: sq2, setQ: setSq2, a: sa2, setA: setSa2, testId: "2" },
                { label: "Question 3", q: sq3, setQ: setSq3, a: sa3, setA: setSa3, testId: "3" },
              ] as const).map(({ label, q, setQ, a, setA, testId }) => (
                <div key={label} className="space-y-2">
                  <Label>{label}</Label>
                  <Select value={q} onValueChange={setQ}>
                    <SelectTrigger data-testid={`select-sq-${testId}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTIONS.map(sq => (
                        <SelectItem key={sq} value={sq}>{sq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    data-testid={`input-sa-${testId}`}
                    placeholder="Your answer (case-insensitive)"
                    value={a}
                    onChange={e => setA(e.target.value)}
                  />
                </div>
              ))}
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="inline h-3.5 w-3.5 text-primary mr-1" />
                You'll need to correctly answer <strong className="text-foreground">2 out of 3</strong> questions to reset your password. Answers are not case-sensitive.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button data-testid="button-create-account" className="flex-1" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <Card className="border-border bg-card text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">Account Created!</h2>
              <p className="text-muted-foreground text-sm">
                We sent a verification email to <strong className="text-foreground">{email}</strong>. Click the link inside to activate your account.
              </p>
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-muted-foreground text-left space-y-1">
                <p className="font-medium text-foreground">Didn't get the email?</p>
                <p>Check your spam folder. The link expires in 24 hours.</p>
              </div>
              <Button className="w-full" onClick={() => nav("/login")}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
