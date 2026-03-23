// CRTScreen — wraps children with CSS scanlines, flicker, turn-on animation, and Samsung CRT "AV1" overlay.

"use client";

type CRTScreenProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

export default function CRTScreen({ children, enabled = true }: CRTScreenProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="crt">
      <div className="crt-screen">{children}</div>
      <div className="crt-overlay">AV1</div>
    </div>
  );
}
