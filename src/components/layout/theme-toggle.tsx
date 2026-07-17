"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton onClick={toggle} aria-label="Temayı değiştir">
      {theme === "dark" ? (
        <Sun className="h-[22px] w-[22px]" strokeWidth={1.8} />
      ) : (
        <Moon className="h-[22px] w-[22px]" strokeWidth={1.8} />
      )}
    </IconButton>
  );
}
