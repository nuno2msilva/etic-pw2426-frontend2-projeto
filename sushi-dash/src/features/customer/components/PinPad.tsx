// PinPad — Modal numpad for entering a 4-digit table PIN with shuffle, auto-submit, and visual feedback.

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/features/shared/lib/utils";

interface PinPadProps {
  isOpen: boolean;
  tableLabel: string;
  onSubmit: (pin: string) => Promise<boolean>;
  onClose: () => void;
}

type PadState = "idle" | "verifying" | "success" | "error";

/** Fisher-Yates shuffle (returns a new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the initial pad layout: 9 shuffled digits for the 3×3 grid + 1 for the bottom center */
function buildLayout(): { grid: number[]; bottom: number } {
  const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return { grid: digits.slice(0, 9), bottom: digits[9] };
}

export function PinPad({ isOpen, tableLabel, onSubmit, onClose }: PinPadProps) {
  const [digits, setDigits] = useState<number[]>([]);
  const [layout, setLayout] = useState<{ grid: number[]; bottom: number }>(buildLayout);
  const [state, setState] = useState<PadState>("idle");
  const submitRef = useRef(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setDigits([]);
      setLayout(buildLayout());
      setState("idle");
      submitRef.current = false;
    }
  }, [isOpen]);

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (digits.length === 4 && !submitRef.current) {
      submitRef.current = true;
      const pin = digits.join("");
      setState("verifying");

      onSubmit(pin).then((ok) => {
        if (ok) {
          setState("success");
          // Dialog will close via parent after success
        } else {
          setState("error");
          // Reset after a brief flash
          setTimeout(() => {
            setDigits([]);
            setLayout(buildLayout());
            setState("idle");
            submitRef.current = false;
          }, 800);
        }
      });
    }
  }, [digits, onSubmit]);

  const handleDigit = useCallback(
    (d: number) => {
      if (state !== "idle" || digits.length >= 4) return;
      setDigits((prev) => [...prev, d]);
      // Shuffle layout after each input
      setLayout(buildLayout());
    },
    [state, digits.length],
  );

  /** Colour of the progress dots */
  const dotColor =
    state === "success"
      ? "bg-green-500"
      : state === "error"
        ? "bg-destructive"
        : "bg-primary";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            {state === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : state === "error" ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Lock className="h-5 w-5 text-orange-500" />
            )}
            {tableLabel}
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter the 4-digit PIN
          </DialogDescription>
        </DialogHeader>

        {/* PIN progress dots */}
        <div className="flex justify-center gap-3 my-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-transform transition-colors duration-150",
                i < digits.length
                  ? `${dotColor} border-transparent scale-110`
                  : "border-muted-foreground/40",
              )}
            />
          ))}
        </div>

        {/* Numpad: 3×3 grid + centered bottom button */}
        <div className="mx-auto max-w-[16rem] space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {layout.grid.map((digit, idx) => (
              <Button
                key={`${idx}-${digit}`}
                variant="outline"
                size="lg"
                className="text-xl font-bold h-14 select-none"
                onClick={() => handleDigit(digit)}
                disabled={state !== "idle"}
              >
                {digit}
              </Button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="text-xl font-bold h-14 w-[calc(33.333%-0.17rem)] select-none"
              onClick={() => handleDigit(layout.bottom)}
              disabled={state !== "idle"}
            >
              {layout.bottom}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
