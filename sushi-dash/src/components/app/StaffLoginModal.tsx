/**
 * StaffLoginModal.tsx
 * ---------------------------------------------------------------------------
 * Modal dialog for staff login (kitchen / manager). Wraps the shared
 * StaffLoginForm in a Dialog.
 *
 * Props:
 * @prop {boolean}  isOpen   — Controls dialog visibility.
 * @prop {Function} onClose  — Called when the dialog should close.
 * ---------------------------------------------------------------------------
 */

import { StaffLoginForm } from "./StaffLoginForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffLoginModal = ({ isOpen, onClose }: StaffLoginModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Staff Login</DialogTitle>
        </DialogHeader>
        <StaffLoginForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default StaffLoginModal;
