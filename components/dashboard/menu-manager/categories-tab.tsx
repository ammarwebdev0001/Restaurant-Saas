'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmation } from '@/components/ui/confirmation-dialogs';
import { Input } from '@/components/ui/input';

import type { MenuCategoryRow } from './types';

type Props = {
  categories: MenuCategoryRow[];
  onRefresh: () => Promise<void>;
};

export function CategoriesTab({ categories, onRefresh }: Props) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canAdd = Boolean(name.trim()) && !adding;

  const add = async () => {
    if (!name.trim() || adding) return;
    setAdding(true);
    try {
      await axios.post('/api/restaurant/menu/categories', { name: name.trim() });
      toast.success('Category created');
      setName('');
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      toast.error('Could not create category');
      console.error(err.response?.data);
    } finally {
      setAdding(false);
    }
  };

  const rename = async (id: string, next: string) => {
    if (!next.trim()) return;
    try {
      await axios.patch(`/api/restaurant/menu/categories/${id}`, { name: next.trim() });
      toast.success('Saved');
      await onRefresh();
    } catch {
      toast.error('Could not update');
    }
  };

  const remove = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`/api/restaurant/menu/categories/${deletingId}`);
      toast.success('Deleted');
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Could not delete');
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>
          Menu sections (e.g. Mains, Drinks, Sauces). Create categories before products; add-on
          options for recommendations come from other categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-sm"
            disabled={adding}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdd) void add();
            }}
          />
          <Button
            type="button"
            disabled={!canAdd}
            onClick={() => void add()}
          >
            {adding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="mr-2 h-4 w-4" aria-hidden />
            )}
            {adding ? 'Adding…' : 'Add category'}
          </Button>
        </div>

        <ul className="space-y-2">
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onRename={rename}
              onDelete={(id) => {
                setDeletingId(id);
                setConfirmDeleteOpen(true);
              }}
            />
          ))}
        </ul>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet. Add your first one above.</p>
        )}
      </CardContent>
    </Card>
    <DeleteConfirmation
      open={confirmDeleteOpen}
      title="Delete category"
      description="This category will be removed. Products in this category may need reassignment."
      itemName={categories.find((c) => c.id === deletingId)?.name}
      loading={deleting}
      onConfirm={() =>{
        setDeleting(true);
        void remove();
      }}
      onCancel={() => setConfirmDeleteOpen(false)}
    />
    </>
  );
}

function CategoryRow({
  category,
  onRename,
  onDelete,
}: {
  category: MenuCategoryRow;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [val, setVal] = useState(category.name);
  useEffect(() => setVal(category.name), [category.name]);

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
      <Input
        className="max-w-md"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          if (val.trim() && val.trim() !== category.name) onRename(category.id, val.trim());
        }}
      />
      <span className="text-xs text-muted-foreground">{category.items.length} products</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-destructive"
        onClick={() => onDelete(category.id)}
        aria-label="Delete category"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
