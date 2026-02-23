/** CRT monitor effect — scanlines, flicker, turn-on animation, and AV-1 overlay */

"use client";

export default function CRTScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="crt">
      <div className="crt-screen">{children}</div>
      <div className="crt-overlay">AV-1</div>
    </div>
  );
}
