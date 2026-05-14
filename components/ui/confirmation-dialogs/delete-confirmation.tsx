'use client';

import * as React from 'react';
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
import { ReloadIcon } from '@radix-ui/react-icons';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmationProps {
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

export function DeleteConfirmation({
  open,
  title = 'Delete Item',
  description = 'This action cannot be undone. This will permanently delete the data from the server.',
  itemName,
  loading = false,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmationProps) {
  /** When true, dialog is closing because the user confirmed — do not run onCancel (avoids clearing parent ids before async delete starts). */
  const confirmClickedRef = React.useRef(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (!loading && !confirmClickedRef.current) {
            onCancel();
          }
          confirmClickedRef.current = false;
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {itemName ? `${title} "${itemName}"?` : title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirmClickedRef.current = true;
              onConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
