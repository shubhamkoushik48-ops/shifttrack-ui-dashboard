"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Timer,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/index";
import { authService } from "@/services";
import { useAuthStore, useIsAuthenticated } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api-client";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Enter your full name")
      .max(60, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw) && /[0-9]/.test(pw)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as 0 | 1 | 2 | 3, label: labels[score] };
}

const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-success",
];

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const authed = useIsAuthenticated();
  const hydrated = useAuthStore((s) => s.hydrated);

  // Already signed in — skip the form (same guard as login).
  useEffect(() => {
    if (!useAuthStore.getState().hydrated) useAuthStore.setState({ hydrated: true });
  }, []);
  useEffect(() => {
    if (hydrated && authed) router.replace("/dashboard/overview");
  }, [hydrated, authed, router]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [department, setDepartment] = useState<string>("Operations");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");
  const strength = passwordStrength(password ?? "");

  const onSubmit = async (values: RegisterForm) => {
    if (!acceptedTerms) {
      setServerError("Please accept the Terms of Service to continue.");
      return;
    }
    setServerError(null);
    try {
      const session = await authService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        department,
      });
      login(session);
      setSuccess(true);
      toast.success("Account created");
      router.push("/dashboard/overview");
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, "Unable to create your account. Please try again."),
      );
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
            Run your team's attendance, shifts and leave from one place.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Create a manager account to get started.
          </p>
        </div>

        <div className="space-y-2 text-[13px] text-slate-400">
          <p>Trusted by operations teams in 40+ companies.</p>
          <p>Need help? support@shifttrack.io</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Timer className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
            </div>
            <p className="text-[15px] font-semibold">ShiftTrack</p>
          </div>

          <h1 className="text-xl font-semibold tracking-tight">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a manager account for your workspace.
          </p>

          {serverError && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3.5 py-2.5">
              <p className="text-[13px] text-destructive">{serverError}</p>
            </div>
          )}
          {success && (
            <div className="mt-5 rounded-lg border border-success/30 bg-success/[0.06] px-3.5 py-2.5">
              <p className="text-[13px] text-success">Account created — redirecting…</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  className="h-10 pl-9"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

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
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department" className="h-10 w-full">
                  <SelectValue placeholder="Choose your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
              {password && (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.score && strength.score > 0
                            ? STRENGTH_COLORS[strength.score]
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="h-10 pl-9 pr-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-[13px] text-muted-foreground">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <span>
                I agree to the <span className="font-medium text-foreground">Terms of Service</span> and{" "}
                <span className="font-medium text-foreground">Privacy Policy</span>.
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Creating account…
                </>
              ) : success ? (
                "Redirecting…"
              ) : (
                "Create account"
              )}
            </Button>

            <p className="pt-1 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
