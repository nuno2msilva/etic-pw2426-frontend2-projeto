/**
 * TableQRModal.tsx
 * ---------------------------------------------------------------------------
 * Displays a QR code for a table that auto-authenticates customers.
 * The QR encodes a URL like: https://host/table/<id>?pin=<pin>
 *
 * The /table/:tableId page reads the `pin` query param and auto-submits it.
 *
 * Props:
 * @prop {boolean}      isOpen   — Controls dialog visibility.
 * @prop {Function}     onClose  — Called when dialog should close.
 * @prop {Table | null} table    — The table to generate a QR for.
 * @prop {string | null} pin     — The table's current PIN.
 * ---------------------------------------------------------------------------
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import type { Table } from "@/types/sushi";

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  pin: string | null;
}

export const TableQRModal = ({ isOpen, onClose, table, pin }: TableQRModalProps) => {
  if (!table || !pin) return null;

  // Build the full URL — use current origin so it works in any environment
  const url = `${window.location.origin}/table/${table.id}?pin=${pin}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">
            📱 {table.label} — QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={url} size={200} level="M" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            Scan to auto-login to <span className="font-semibold">{table.label}</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono break-all text-center">
            {url}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableQRModal;
