'use client';

import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmation } from '@/components/ui/confirmation-dialogs';

type Data = {
  id: string;
};
export function DeleteAlertDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Data;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`/api/transactions/${data.id}`);
      onClose();
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Server Error:', error.response?.data);
      } else if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeleteConfirmation
      open={open}
      title="Delete Transaction"
      description={`This action cannot be undone. This will permanently delete the transaction with ID: ${data.id} from the server.`}
      loading={loading}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  );
}
