'use client';

import { useState } from 'react';
import { DeleteConfirmation } from '@/components/ui/confirmation-dialogs';

export function PrintAlertDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    // Placeholder for delete logic
    // setLoading(true);
    // try {
    //   const response = await axios.delete(`/api/product/${data.product.id}`);
    //   console.log("Product deleted:", response.data);
    // } catch (error: unknown) {
    //   if (axios.isAxiosError(error)) {
    //     console.error("Server Error:", error.response?.data);
    //   } else if (error instanceof Error) {
    //     console.error("Error:", error.message);
    //   } else {
    //     console.error("Unknown error:", error);
    //   }
    // } finally {
    //   setLoading(false);
    //   onClose();
    // }
  };

  return (
    <DeleteConfirmation
      open={open}
      title="Delete Item"
      description="This action cannot be undone. This will permanently delete the data from the server."
      loading={loading}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  );
}
