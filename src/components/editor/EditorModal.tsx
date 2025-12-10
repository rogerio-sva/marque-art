import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { VisualEditor } from "./VisualEditor";

interface EditorModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function EditorModal({ open, onClose, imageUrl }: EditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <h2 className="font-display text-lg font-semibold">Editor Visual</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden h-[calc(95vh-60px)]">
          <VisualEditor initialImage={imageUrl} isModal />
        </div>
      </DialogContent>
    </Dialog>
  );
}
