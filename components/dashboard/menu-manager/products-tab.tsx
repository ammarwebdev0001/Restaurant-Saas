'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Base64ImageUploadField } from '@/components/ui/base64-image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmation, SaveConfirmation } from '@/components/ui/confirmation-dialogs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { MenuCategoryRow, MenuItemRow } from './types';

type Props = {
  categories: MenuCategoryRow[];
  onRefresh: () => Promise<void>;
};

export function ProductsTab({ categories, onRefresh }: Props) {
  const rows = categories.flatMap((c) => c.items.map((item) => ({ item, categoryName: c.name })));

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemRow | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<MenuItemRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    price: '',
    salePrice: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      categoryId: categories[0]?.id ?? '',
      imageUrl: '',
      price: '',
      salePrice: '',
    });
    setOpen(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      categoryId: item.categoryId,
      imageUrl: item.imageUrl ?? '',
      price: String(item.price),
      salePrice: item.salePrice != null ? String(item.salePrice) : '',
    });
    setOpen(true);
  };

  const save = async () => {
    const price = Number(form.price);
    if (!form.name.trim() || !form.categoryId || Number.isNaN(price) || price <= 0) {
      toast.error('Name, category, and a valid price are required.');
      return;
    }
    const sale = form.salePrice.trim() === '' ? null : Number(form.salePrice);
    if (sale != null && (Number.isNaN(sale) || sale <= 0)) {
      toast.error('Sale price must be empty or a positive number.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.patch(`/api/restaurant/menu/items/${editing.id}`, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId,
          imageUrl: form.imageUrl.trim() || null,
          price,
          salePrice: sale,
        });
        toast.success('Product updated');
      } else {
        await axios.post('/api/restaurant/menu/items', {
          name: form.name.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId,
          imageUrl: form.imageUrl.trim() || null,
          price,
          salePrice: sale,
        });
        toast.success('Product created');
      }
      setOpen(false);
      setSaveConfirmOpen(false);
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      toast.error(typeof err.response?.data?.error === 'string' ? err.response.data.error : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/restaurant/menu/items/${deletingProduct.id}`);
      toast.success('Deleted');
      setDeleteConfirmOpen(false);
      setDeletingProduct(null);
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Name, category, photo URL, price, optional sale price, and description.
          </CardDescription>
        </div>
        <Button type="button" onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              Create at least one category before you can add products.
            </p>
            <Button type="button" asChild className="w-fit">
              <Link href="/categories">Go to Categories</Link>
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Sale</th>
                  <th className="p-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, categoryName }) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="line-clamp-2 text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{categoryName}</td>
                    <td className="p-3">€{item.price.toFixed(2)}</td>
                    <td className="p-3">
                      {item.salePrice != null && item.salePrice < item.price ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          €{item.salePrice.toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="outline" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => {
                            setDeletingProduct(item);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'New product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <Base64ImageUploadField
              label="Photo"
              value={form.imageUrl}
              onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
              helperText="Upload image stores base64 directly in database."
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Sale price (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  value={form.salePrice}
                  onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setSaveConfirmOpen(true)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveConfirmation
        open={saveConfirmOpen}
        title={editing ? 'Update product' : 'Create product'}
        description={editing ? 'Save changes to this product?' : 'Create this new product now?'}
        itemName={form.name.trim() || editing?.name || 'Product'}
        loading={saving}
        onConfirm={() => void save()}
        onCancel={() => setSaveConfirmOpen(false)}
      />

      <DeleteConfirmation
        open={deleteConfirmOpen}
        title="Delete product"
        description="This product will be removed permanently."
        itemName={deletingProduct?.name}
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeletingProduct(null);
        }}
      />
    </Card>
  );
}
