'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, X } from 'lucide-react';

interface SaveConfirmationProps {
  open: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function SaveConfirmation({
  open,
  title = 'Save Changes',
  description = 'Are you sure you want to save these changes?',
  itemName,
  loading = false,
  onConfirm,
  onCancel,
  confirmText = 'Save',
  cancelText = 'Cancel',
}: SaveConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {itemName ? `${title} for "${itemName}"?` : title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            <span>{cancelText}</span>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> <span>Saving...</span></>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>{confirmText}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
