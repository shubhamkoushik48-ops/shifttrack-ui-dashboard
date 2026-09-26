"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/switch";
import { Timer } from "lucide-react";
import { authService } from "@/services";
import {
  SocialLoginButtons,
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

  // Already signed in — skip the form. Belt-and-braces hydration flip like the dashboard shell.
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
    defaultValues: { email: "", password: "" },
  });
  void remember;

  const finish = (session: Awaited<ReturnType<typeof authService.login>>) => {
    login(session);
    setSuccess(true);
    toast.success("Signed in as " + session.user.name);
    router.push("/dashboard/overview");
  };

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      const session = await authService.login(values.email, values.password);
      finish(session);
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
        { message: "Enter your email first so we can match your social account." },
        { shouldFocus: true },
      );
      return;
    }
    setSocialLoading(provider);
    try {
      const session = await authService.socialLogin(provider, email);
      finish(session);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to sign in. Please try again."));
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — dark panel (desktop only) */}
      <div className="hidden w-[42%] flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Timer className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
          </div>
          <p className="text-[15px] font-semibold text-white">ShiftTrack</p>
        </div>

        <div className="max-w-sm">
          <h2 className="text-2xl font-semibold leading-snug text-white">
            Attendance, shifts and leave for your whole team.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Clock-ins, schedules, approvals and reports in one place.
          </p>
        </div>

        <div className="space-y-2 text-[13px] text-slate-400">
          <p>Need help? support@shifttrack.io</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Timer className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
            </div>
            <p className="text-[15px] font-semibold">ShiftTrack</p>
          </div>

          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your details to continue.
          </p>

          {serverError && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3.5 py-2.5">
              <p className="text-[13px] text-destructive">{serverError}</p>
            </div>
          )}
          {success && (
            <div className="mt-5 rounded-lg border border-success/30 bg-success/[0.06] px-3.5 py-2.5">
              <p className="text-[13px] text-success">Signed in — redirecting…</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
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
              Keep me signed in
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in…
                </>
              ) : success ? (
                "Redirecting…"
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="flex items-center gap-3" role="separator" aria-label="Or continue with">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <SocialLoginButtons
              loading={socialLoading}
              disabled={isSubmitting || success}
              onLogin={handleSocialLogin}
            />

            <p className="pt-1 text-center text-[13px] text-muted-foreground">
              New here?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
