'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { shopnameSchema } from '@/schema';
import { ZodError } from 'zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import eventBus from '@/lib/even';
import { SaveConfirmation } from '@/components/ui/confirmation-dialogs';
interface ShopnameCardProps {
  storeName: string | null;
  storeId: string | null;
}

const ShopnameCard: React.FC<ShopnameCardProps> = ({ storeName, storeId }) => {
  const [editableStoreName, setEditableStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setEditableStoreName(storeName ?? '');
  }, [storeName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableStoreName(e.target.value);
  };

  const handleSaveClick = () => {
    if (editableStoreName === storeName) {
      toast.info('No changes to save.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    if (!storeId) {
      toast.error('Store ID is required to save the store name.');
      return;
    }

    setIsLoading(true);

    try {
      const validatedData = shopnameSchema.parse({
        storeName: editableStoreName,
      });

      await axios.patch(`/api/shopdata/${storeId}`, validatedData);

      toast.success('Store name updated successfully.');
      setShowConfirmation(false);
      eventBus.emit('fetchStoreData');
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle ZodError
        const fieldErrors = error.errors.map((err) => err.message);
        toast.error(`${fieldErrors.join(', ')}`);
      } else {
        toast.error('Failed to update store name.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="my-5">
      <CardHeader>
        <CardTitle>Store Name</CardTitle>
        <CardDescription>Used to identify your store.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <Input value={editableStoreName} onChange={handleInputChange} />
        </form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button
          className="text-white"
          onClick={handleSaveClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            'Save'
          )}
        </Button>
      </CardFooter>
      <SaveConfirmation
        open={showConfirmation}
        title="Save Store Name"
        description="Are you sure you want to save these changes to your store name?"
        itemName={editableStoreName}
        loading={isLoading}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmation(false)}
      />
    </Card>
  );
};

export default ShopnameCard;
