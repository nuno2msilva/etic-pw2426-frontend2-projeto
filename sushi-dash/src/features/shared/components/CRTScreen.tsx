// CRTScreen — wraps children with CSS scanlines, flicker, turn-on animation, and Samsung CRT "AV1" overlay.
// Boot animation only plays on first load, not on route changes.

"use client";

import { useEffect, useRef, useState } from "react";
import "./crt.css";

type CRTScreenProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

export default function CRTScreen({ children, enabled = true }: CRTScreenProps) {
  const [isInitialMount, setIsInitialMount] = useState(true);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Mark that we've completed the initial mount after animation completes (5s for overlay)
    const timer = setTimeout(() => {
      hasPlayedRef.current = true;
      setIsInitialMount(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`crt ${isInitialMount ? "crt-boot" : ""}`}>
      <div className="crt-screen">
        {children}
      </div>
      <div className="crt-overlay">AV1</div>
    </div>
  );
}
