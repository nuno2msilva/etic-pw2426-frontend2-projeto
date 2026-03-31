// CRTScreen — wraps children with CSS scanlines, flicker, turn-on animation, and Samsung CRT "AV1" overlay.
// Boot animation only plays on first load, not on route changes.

"use client";

import { useEffect, useState } from "react";
import "./crt.css";

type CRTScreenProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

const CRT_BOOT_STORAGE_KEY = "sushi-dash-crt-boot-played";

export default function CRTScreen({ children, enabled = true }: CRTScreenProps) {
  const [isBootSequence, setIsBootSequence] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const hasPlayed = window.sessionStorage.getItem(CRT_BOOT_STORAGE_KEY) === "1";
    if (hasPlayed) {
      setIsBootSequence(false);
      return;
    }

    // Mark immediately so route remounts in the same session don't replay boot effects.
    window.sessionStorage.setItem(CRT_BOOT_STORAGE_KEY, "1");
    setIsBootSequence(true);

    const timer = window.setTimeout(() => {
      setIsBootSequence(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`crt ${isBootSequence ? "crt-boot" : ""}`}>
      <div className="crt-screen">
        {children}
      </div>
      <div className="crt-overlay">AV1</div>
    </div>
  );
}
