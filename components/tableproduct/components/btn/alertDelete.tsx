'use client';

import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { DeleteConfirmation } from '@/components/ui/confirmation-dialogs';

type Data = {
  id: string;
  productstock: {
    id: string;
    name: string;
  };
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
    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.delete(
        `/api/product/${data.productstock.id}`
      );
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
      title="Delete Product"
      description="This action cannot be undone. This will permanently delete the data from the server."
      itemName={data.productstock.name}
      loading={loading}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  );
}
