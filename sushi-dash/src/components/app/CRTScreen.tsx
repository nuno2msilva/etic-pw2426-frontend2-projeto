// CRTScreen — wraps children with CSS scanlines, flicker, turn-on animation, and Samsung CRT "AV1" overlay.

"use client";

export default function CRTScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="crt">
      <div className="crt-screen">{children}</div>
      <div className="crt-overlay">AV1</div>
    </div>
  );
}
