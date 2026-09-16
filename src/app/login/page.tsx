"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/switch";
import { authService } from "@/services";
import {
  SocialLoginButtons,
  SOCIAL_PROVIDER_LABELS,
  type SocialProvider,
} from "@/components/auth/social-login-buttons";
import { useAuthStore, useIsAuthenticated } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const authed = useIsAuthenticated();
  const hydrated = useAuthStore((s) => s.hydrated);

  // Already signed in (e.g. session persisted) — skip the form.
  // Belt-and-braces: onRehydrateStorage is not guaranteed to fire, so flip the
  // hydration flag on mount like the dashboard shell does.
  useEffect(() => {
    if (!useAuthStore.getState().hydrated) useAuthStore.setState({ hydrated: true });
  }, []);
  useEffect(() => {
    if (hydrated && authed) router.replace("/dashboard/overview");
  }, [hydrated, authed, router]);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "manager@shifttrack.io", password: "shifttrack2026" },
  });
  void remember;

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      const session = await authService.login(values.email, values.password);
      login(session);
      setSuccess(true);
      toast.success("Welcome back, " + session.user.name.split(" ")[0] + " 👋");
      router.push("/dashboard/overview");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to sign in. Check your credentials and try again."));
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setServerError(null);
    const email = (getValues("email") ?? "").trim();
    if (!email) {
      setError(
        "email",
        { message: "Enter your work email first so we can match your social account." },
        { shouldFocus: true },
      );
      return;
    }
    setSocialLoading(provider);
    try {
      const session = await authService.socialLogin(provider, email);
      login(session);
      setSuccess(true);
      toast.success(`Signed in with ${SOCIAL_PROVIDER_LABELS[provider]} 👋`);
      router.push("/dashboard/overview");
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, `Unable to sign in with ${SOCIAL_PROVIDER_LABELS[provider]}. Please try again.`),
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left — brand panel */}
      {/* Signed-in users are redirected to the dashboard via the effect above. */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(600px circle at 20% 20%, hsl(221 83% 53% / 0.35), transparent 45%), radial-gradient(700px circle at 80% 75%, hsl(262 83% 58% / 0.25), transparent 50%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow">
              <LogIn className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">ShiftTrack</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Workforce Operations</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl font-bold leading-tight text-white"
          >
            Every shift, every person, <span className="text-blue-400">perfectly in sync.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm leading-relaxed text-slate-400"
          >
            Real-time attendance, intelligent scheduling, and leave workflows your managers actually enjoy using.
          </motion.p>

          <div className="mt-8 space-y-3">
            {[
              { title: "Live attendance streaming", desc: "Clock-ins land on every dashboard in under a second." },
              { title: "Approval workflows", desc: "One-click decisions with full audit trails." },
              { title: "Enterprise-grade reporting", desc: "CSV, Excel and PDF exports your finance team will love." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[13px] font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-500">© 2026 ShiftTrack Inc. — SOC2 · GDPR ready</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <LogIn className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="font-display text-lg font-bold">ShiftTrack</p>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight">Sign in to your workspace</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your credentials to access the operations dashboard.
          </p>

          {serverError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3.5 py-3">
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">!</span>
              <p className="text-[13px] text-destructive">{serverError}</p>
            </div>
          )}
          {success && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/[0.06] px-3.5 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
              <p className="text-[13px] text-success">Signed in — taking you to your dashboard…</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-10 pl-9"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-10 pl-9 pr-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              Keep me signed in on this device
            </label>

            <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isSubmitting || success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in…
                </>
              ) : success ? (
                <>
                  <ShieldCheck /> Success — redirecting
                </>
              ) : (
                <>
                  <LogIn /> Sign in
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 py-1" role="separator" aria-label="Or continue with">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                or continue with
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <SocialLoginButtons
              loading={socialLoading}
              disabled={isSubmitting || success}
              onLogin={handleSocialLogin}
 />

            <p className="text-center text-xs text-muted-foreground">
              Demo hint: <span className="font-medium text-foreground">manager@shifttrack.io</span> +
              <span className="font-medium text-foreground"> shifttrack2026</span> — or use any email + 8-char password.
            </p>

            <p className="text-center text-sm text-muted-foreground">
              New to ShiftTrack?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
