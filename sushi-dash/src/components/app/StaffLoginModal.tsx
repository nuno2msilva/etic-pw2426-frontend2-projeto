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
}

export const StaffLoginModal = ({ isOpen, onClose }: StaffLoginModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Staff Login</DialogTitle>
          <DialogDescription>Enter your staff password to access kitchen or manager features.</DialogDescription>
        </DialogHeader>
        <StaffLoginForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default StaffLoginModal;
