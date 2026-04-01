'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type MenuOption = {
  menuItemId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unitPrice: number;
};

export type AttributeGroup = {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  linkedCategoryName?: string | null;
  items: (Omit<MenuOption, 'unitPrice'> & { price: number; salePrice: number | null })[];
};

function effectiveUnitPrice(price: number, salePrice: number | null) {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

type Props = {
  productName: string;
  attributeGroups: AttributeGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mods: {
    attributeGroupId: string;
    groupName: string;
    selections: MenuOption[];
  }[]) => void;
};

export function ProductCustomizeDialog({
  productName,
  attributeGroups,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string[]> = {};
    for (const g of attributeGroups) init[g.id] = [];
    setSelectedByGroup(init);
  }, [open, attributeGroups]);

  const requiredMissing = useMemo(() => {
    return attributeGroups
      .filter((g) => g.required)
      .some((g) => (selectedByGroup[g.id] ?? []).length === 0);
  }, [attributeGroups, selectedByGroup]);

  const setSingle = (groupId: string, optionId: string) => {
    setSelectedByGroup((prev) => ({
      ...prev,
      [groupId]: prev[groupId]?.[0] === optionId ? [] : [optionId],
    }));
  };

  const toggleMulti = (groupId: string, optionId: string) => {
    setSelectedByGroup((prev) => {
      const cur = prev[groupId] ?? [];
      const has = cur.includes(optionId);
      return {
        ...prev,
        [groupId]: has ? cur.filter((x) => x !== optionId) : [...cur, optionId],
      };
    });
  };

  const handleConfirm = () => {
    if (requiredMissing) return;

    const mods: {
      attributeGroupId: string;
      groupName: string;
      selections: MenuOption[];
    }[] = [];

    for (const g of attributeGroups) {
      const ids = selectedByGroup[g.id] ?? [];
      if (ids.length === 0) continue;

      const selectedItems = g.items
        .filter((it) => ids.includes(it.menuItemId))
        .map((it) => ({
          menuItemId: it.menuItemId,
          name: it.name,
          description: it.description,
          imageUrl: it.imageUrl,
          unitPrice: effectiveUnitPrice(it.price, it.salePrice),
        }));

      if (selectedItems.length > 0) {
        mods.push({
          attributeGroupId: g.id,
          groupName: g.name,
          selections: selectedItems,
        });
      }
    }

    onConfirm(mods);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalize {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {attributeGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-ons available.</p>
          ) : (
            attributeGroups.map((g) => {
              const selectedIds = selectedByGroup[g.id] ?? [];
              const missing = g.required && selectedIds.length === 0;

              return (
                <section
                  key={g.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Label className="text-sm font-semibold">
                        {g.name}{' '}
                        {g.required && (
                          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            Required
                          </span>
                        )}
                      </Label>
                      {g.linkedCategoryName ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          From {g.linkedCategoryName}
                        </p>
                      ) : null}
                    </div>
                    {missing ? (
                      <p className="text-xs text-destructive">Required</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {g.selectionType === 'SINGLE' ? 'Choose one' : 'Choose one or more'}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    {g.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No options available in this category yet.
                      </p>
                    ) : g.selectionType === 'SINGLE' ? (
                      <select
                        value={selectedIds[0] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setSelectedByGroup((prev) => ({
                              ...prev,
                              [g.id]: [],
                            }));
                          } else {
                            setSingle(g.id, val);
                          }
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select…</option>
                        {g.items.map((it) => {
                          const unit = effectiveUnitPrice(it.price, it.salePrice);
                          return (
                            <option key={it.menuItemId} value={it.menuItemId}>
                              {it.name} (+€{unit.toFixed(2)})
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {g.items.map((it) => {
                          const unit = effectiveUnitPrice(it.price, it.salePrice);
                          const checked = selectedIds.includes(it.menuItemId);
                          return (
                            <button
                              key={it.menuItemId}
                              type="button"
                              onClick={() => toggleMulti(g.id, it.menuItemId)}
                              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                                checked
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border bg-background hover:bg-muted/50'
                              }`}
                            >
                              <span className="truncate">{it.name}</span>
                              <span className="shrink-0 text-muted-foreground">
                                +€{unit.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={requiredMissing}>
            Add to cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

