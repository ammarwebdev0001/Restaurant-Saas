'use client';

import { useRef } from 'react';
import { Check, Loader2, X } from 'lucide-react';

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
import { cn } from '@/lib/utils';

export type KdsOrderActionKind = 'proceed' | 'complete' | 'cancel';

const ACTION_COPY: Record<
  KdsOrderActionKind,
  { title: string; description: string; confirm: string; loading: string }
> = {
  proceed: {
    title: 'Send to kitchen?',
    description:
      'This order will move to the kitchen display with the selected prep time.',
    confirm: 'Proceed',
    loading: 'Proceeding...',
  },
  complete: {
    title: 'Mark order complete?',
    description:
      'This order will be marked complete and removed from the active kitchen queue.',
    confirm: 'Complete',
    loading: 'Completing...',
  },
  cancel: {
    title: 'Cancel order?',
    description:
      'This order will be canceled. This action cannot be undone.',
    confirm: 'Cancel order',
    loading: 'Canceling...',
  },
};

type Props = {
  open: boolean;
  kind: KdsOrderActionKind;
  itemName?: string;
  detail?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  iconCancel?: React.ReactNode;
  iconConfirm?: React.ReactNode;
  iconLoading?: React.ReactNode;
};

export function KdsOrderActionDialog({
  open,
  kind,
  itemName,
  detail,
  loading = false,
  onConfirm,
  onCancel,
  iconCancel = <X className="mr-2 h-4 w-4" />,
  iconConfirm = <Check className="mr-2 h-4 w-4" />,
  iconLoading = <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
}: Props) {
  const confirmClickedRef = useRef(false);
  const copy = ACTION_COPY[kind];
  const isDestructive = kind === 'cancel';

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (!loading && !confirmClickedRef.current) onCancel();
          confirmClickedRef.current = false;
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {itemName
              ? kind === 'proceed'
                ? `Send order ${itemName} to kitchen?`
                : kind === 'complete'
                  ? `Mark order ${itemName} complete?`
                  : `Cancel order ${itemName}?`
              : copy.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {copy.description}
            {detail ? (
              <>
                <br />
                <span className="mt-2 block font-medium text-foreground">
                  {detail}
                </span>
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={onCancel} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={loading}
            className={cn(
              isDestructive &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
            onClick={() => {
              confirmClickedRef.current = true;
              void onConfirm();
            }}
          >
            {loading ? (
              <>
                {iconLoading}
                {copy.loading}
              </>
            ) : (
              <>
                {iconConfirm}
                {copy.confirm}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
