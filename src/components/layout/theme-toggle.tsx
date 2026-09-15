"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun, hint: "Bright surfaces" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Low-light comfort" },
  { value: "system", label: "System", icon: Monitor, hint: "Match your device" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted ? (theme ?? "system") : "system";
  const ActiveIcon = active === "dark" ? Moon : active === "system" ? Monitor : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <ActiveIcon className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {OPTIONS.map((opt) => {
          const isActive = active === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="gap-2.5"
            >
              <opt.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-[13px] font-medium">{opt.label}</span>
                <span className="block text-[10px] text-muted-foreground">{opt.hint}</span>
              </span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
