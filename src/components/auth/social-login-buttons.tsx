"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SocialProvider = "google" | "facebook" | "twitter";

export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  twitter: "Twitter",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#1DA1F2"
        d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
      />
    </svg>
  );
}

const PROVIDERS: Array<{
  id: SocialProvider;
  Icon: (props: { className?: string }) => React.JSX.Element;
  hover: string;
}> = [
  { id: "google", Icon: GoogleIcon, hover: "hover:border-[#4285F4]/60 hover:bg-[#4285F4]/[0.07]" },
  { id: "facebook", Icon: FacebookIcon, hover: "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/[0.07]" },
  { id: "twitter", Icon: TwitterIcon, hover: "hover:border-[#1DA1F2]/60 hover:bg-[#1DA1F2]/[0.07]" },
];

interface SocialLoginButtonsProps {
  /** Provider currently mid-handshake — shows a spinner on that button. */
  loading?: SocialProvider | null;
  disabled?: boolean;
  onLogin: (provider: SocialProvider) => void;
  className?: string;
}

/**
 * App-style icon row for social sign-in (Google / Facebook / Twitter).
 * The mock backend resolves the session; a real deployment swaps this for
 * the provider OAuth redirect without touching the calling page.
 */
export function SocialLoginButtons({ loading = null, disabled, onLogin, className }: SocialLoginButtonsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)} role="group" aria-label="Sign in with a social account">
      {PROVIDERS.map(({ id, Icon, hover }) => {
        const busy = loading === id;
        return (
          <Button
            key={id}
            type="button"
            variant="outline"
            className={cn("h-11 w-full", hover)}
            disabled={disabled || !!loading}
            aria-label={`Continue with ${SOCIAL_PROVIDER_LABELS[id]}`}
            title={`Continue with ${SOCIAL_PROVIDER_LABELS[id]}`}
            onClick={() => onLogin(id)}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Icon className="h-[18px] w-[18px]" />}
          </Button>
        );
      })}
    </div>
  );
}
