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
import { FolderPlus, Loader2, Plus, X } from 'lucide-react';

interface AddCategoryConfirmationProps {
  open: boolean;
  categoryName: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function AddCategoryConfirmation({
  open,
  categoryName,
  loading = false,
  onConfirm,
  onCancel,
  title = 'Add category',
  description = 'This will create a new menu category. You can add products to it afterward.',
  confirmText = 'Add category',
  cancelText = 'Cancel',
}: AddCategoryConfirmationProps) {
  const confirmClickedRef = React.useRef(false);
  const trimmed = categoryName.trim();

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
          <div className="flex items-start gap-3">
            <div className="space-y-2 text-left">
              <AlertDialogTitle>
                {trimmed ? `${title} "${trimmed}"?` : title}
              </AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={onCancel} disabled={loading}>
            <X className="mr-2 h-4 w-4" aria-hidden />
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={loading || !trimmed}
            onClick={() => {
              confirmClickedRef.current = true;
              void onConfirm();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                <span>Adding…</span>
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                <span>{confirmText}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
