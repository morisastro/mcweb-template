// Applies accent color CSS variable on client navigation, in case settings change.
"use client";

import { useEffect } from "react";

export function AccentBootstrap({ accent }: { accent: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", accent);
  }, [accent]);
  return null;
}
