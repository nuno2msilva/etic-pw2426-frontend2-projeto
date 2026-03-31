// StaffLoginModal — wraps StaffLoginForm in a Radix dialog for kitchen/manager login

import { StaffLoginForm } from "./StaffLoginForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetRequired?: () => void;
}

export const StaffLoginModal = ({ isOpen, onClose, onPasswordResetRequired }: StaffLoginModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Staff Login</DialogTitle>
          <DialogDescription>Enter your staff email and password to continue.</DialogDescription>
        </DialogHeader>
        <StaffLoginForm onSuccess={onClose} onPasswordResetRequired={onPasswordResetRequired} />
      </DialogContent>
    </Dialog>
  );
};

export default StaffLoginModal;
