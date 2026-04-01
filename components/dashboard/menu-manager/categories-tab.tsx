'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { MenuCategoryRow } from './types';

type Props = {
  categories: MenuCategoryRow[];
  onRefresh: () => Promise<void>;
};

export function CategoriesTab({ categories, onRefresh }: Props) {
  const [name, setName] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    try {
      await axios.post('/api/restaurant/menu/categories', { name: name.trim() });
      toast.success('Category created');
      setName('');
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      toast.error('Could not create category');
      console.error(err.response?.data);
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

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await axios.delete(`/api/restaurant/menu/categories/${id}`);
      toast.success('Deleted');
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Could not delete');
    }
  };

  return (
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
            onKeyDown={(e) => e.key === 'Enter' && void add()}
          />
          <Button type="button" onClick={() => void add()}>
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>
        </div>

        <ul className="space-y-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} onRename={rename} onDelete={remove} />
          ))}
        </ul>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet. Add your first one above.</p>
        )}
      </CardContent>
    </Card>
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
