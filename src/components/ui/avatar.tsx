"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials, avatarColor } from "@/lib/utils";

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  name: string;
  className?: string;
}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ name, className, ...props }, ref) => {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      >
        <AvatarPrimitive.Fallback
          className={cn("flex h-full w-full items-center justify-center text-[11px] font-semibold", avatarColor(name))}
          delayMs={0}
        >
          {initials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
