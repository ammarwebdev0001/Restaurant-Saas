'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  items: (Omit<MenuOption, 'unitPrice'> & {
    price: number;
    salePrice: number | null;
    variations?: {
      id: string;
      name?: string;
      title?: string;
      swatchHex?: string | null;
      imageUrl?: string | null;
      priceDelta: number;
    }[];
  })[];
};

export type ProductVariationOption = {
  id: string;
  name: string;
  swatchHex: string | null;
  priceDelta: number; // stored field; interpreted as absolute override price
};

export type SelectedProductVariation = {
  id: string;
  name: string;
  swatchHex: string | null;
  priceDelta: number; // absolute selected unit price
};

function effectiveUnitPrice(price: number, salePrice: number | null) {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

type Props = {
  productName: string;
  productImageUrl?: string | null;
  attributeGroups: AttributeGroup[];
  variations?: ProductVariationOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    mods: {
      attributeGroupId: string;
      groupName: string;
      selections: MenuOption[];
    }[],
    variation?: SelectedProductVariation | null
  ) => void;
};

export function ProductCustomizeDialog({
  productName,
  productImageUrl,
  attributeGroups,
  variations = [],
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, string[]>
  >({});
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [selectedNestedVariationByOption, setSelectedNestedVariationByOption] =
    useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string[]> = {};
    for (const g of attributeGroups) init[g.id] = [];
    setSelectedByGroup(init);
    setSelectedVariationId('');
    setSelectedNestedVariationByOption({});
  }, [open, attributeGroups]);

  const requiredMissing = useMemo(() => {
    const missingAttrs = attributeGroups
      .filter((g) => g.required)
      .some((g) => (selectedByGroup[g.id] ?? []).length === 0);
    const missingVariation = variations.length > 0 && !selectedVariationId;
    const missingNestedVariation = attributeGroups.some((g) => {
      const selectedIds = selectedByGroup[g.id] ?? [];
      if (selectedIds.length === 0) return false;
      return selectedIds.some((optionId) => {
        const option = g.items.find((it) => it.menuItemId === optionId);
        if (!option || !option.variations || option.variations.length === 0)
          return false;
        return !selectedNestedVariationByOption[`${g.id}:${optionId}`];
      });
    });
    return missingAttrs || missingVariation || missingNestedVariation;
  }, [
    attributeGroups,
    selectedByGroup,
    variations,
    selectedVariationId,
    selectedNestedVariationByOption,
  ]);

  const setSingle = (groupId: string, optionId: string) => {
    setSelectedNestedVariationByOption((prevVar) => {
      const next = { ...prevVar };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${groupId}:`)) delete next[key];
      }
      return next;
    });
    setSelectedByGroup((prev) => ({
      ...prev,
      [groupId]: prev[groupId]?.[0] === optionId ? [] : [optionId],
    }));
  };

  const toggleMulti = (groupId: string, optionId: string) => {
    setSelectedByGroup((prev) => {
      const cur = prev[groupId] ?? [];
      const has = cur.includes(optionId);
      if (has) {
        setSelectedNestedVariationByOption((prevVar) => {
          const next = { ...prevVar };
          delete next[`${groupId}:${optionId}`];
          return next;
        });
      }
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
        .map((it) => {
          // If this add-on item has its own swatches, selected swatch price replaces base/sale.
          const key = `${g.id}:${it.menuItemId}`;
          const nestedVariationId = selectedNestedVariationByOption[key];
          const nestedVariation = (it.variations ?? []).find(
            (v) => v.id === nestedVariationId
          );
          const nestedVariationName =
            nestedVariation?.name ?? nestedVariation?.title;
          const finalName = nestedVariationName
            ? `${it.name} (${nestedVariationName})`
            : it.name;
          const finalUnitPrice =
            nestedVariation != null
              ? nestedVariation.priceDelta
              : effectiveUnitPrice(it.price, it.salePrice);
          return {
            menuItemId: it.menuItemId,
            name: finalName,
            description: it.description,
            imageUrl: it.imageUrl,
            unitPrice: finalUnitPrice,
          };
        });

      if (selectedItems.length > 0) {
        mods.push({
          attributeGroupId: g.id,
          groupName: g.name,
          selections: selectedItems,
        });
      }
    }

    const variation =
      variations.find((v) => v.id === selectedVariationId) ?? null;
    onConfirm(mods, variation);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-slate-50 p-0 text-slate-900"
      >
        {productImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary menu image URLs
          <img
            src={productImageUrl}
            alt={productName}
            className="h-44 w-full object-cover"
          />
        ) : null}
        <div className="p-6">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-primary">
              Personalize {productName}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-2">
            {variations.length > 0 ? (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <Label className="text-sm font-semibold text-slate-900">
                    Variation{' '}
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Required
                    </span>
                  </Label>
                  {!selectedVariationId ? (
                    <p className="text-xs text-red-700">Required</p>
                  ) : null}
                </div>
                <div className="mt-3">
                  <select
                    value={selectedVariationId}
                    onChange={(e) => setSelectedVariationId(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select variation…</option>
                    {variations.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {` (€${v.priceDelta.toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            ) : null}

            {attributeGroups.length === 0 ? (
              <p className="text-sm text-slate-500">No add-ons available.</p>
            ) : (
              attributeGroups.map((g) => {
                const selectedIds = selectedByGroup[g.id] ?? [];
                const missing = g.required && selectedIds.length === 0;

                return (
                  <section
                    key={g.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Label className="text-sm font-semibold text-slate-900">
                          {g.name}{' '}
                          {g.required && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              Required
                            </span>
                          )}
                        </Label>
                        {g.linkedCategoryName ? (
                          <p className="mt-1 text-xs text-slate-500">
                            From {g.linkedCategoryName}
                          </p>
                        ) : null}
                      </div>
                      {missing ? (
                        <p className="text-xs text-red-700">Required</p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          {g.selectionType === 'SINGLE'
                            ? 'Choose one'
                            : 'Choose one or more'}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 space-y-3">
                      {g.items.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No options available in this category yet.
                        </p>
                      ) : g.selectionType === 'SINGLE' ? (
                        <>
                          <select
                            value={selectedIds[0] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setSelectedByGroup((prev) => ({
                                  ...prev,
                                  [g.id]: [],
                                }));
                                setSelectedNestedVariationByOption((prev) => {
                                  const next = { ...prev };
                                  for (const key of Object.keys(next)) {
                                    if (key.startsWith(`${g.id}:`))
                                      delete next[key];
                                  }
                                  return next;
                                });
                              } else {
                                setSingle(g.id, val);
                              }
                            }}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select…</option>
                            {g.items.map((it) => {
                              const unit = effectiveUnitPrice(
                                it.price,
                                it.salePrice
                              );
                              return (
                                <option
                                  key={it.menuItemId}
                                  value={it.menuItemId}
                                >
                                  {it.name} (+€{unit.toFixed(2)})
                                </option>
                              );
                            })}
                          </select>
                          {(() => {
                            const selectedOption = g.items.find(
                              (it) => it.menuItemId === selectedIds[0]
                            );
                            if (
                              !selectedOption ||
                              !selectedOption.variations ||
                              selectedOption.variations.length === 0
                            ) {
                              return null;
                            }
                            const key = `${g.id}:${selectedOption.menuItemId}`;
                            return (
                              <div className="mt-2">
                                <select
                                  value={
                                    selectedNestedVariationByOption[key] ?? ''
                                  }
                                  onChange={(e) =>
                                    setSelectedNestedVariationByOption(
                                      (prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      })
                                    )
                                  }
                                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">
                                    {`Select ${selectedOption.name} variation…`}
                                  </option>
                                  {selectedOption.variations.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {(v.name ?? v.title ?? 'Variation') +
                                        ` (€${v.priceDelta.toFixed(2)})`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {g.items.map((it) => {
                            const unit = effectiveUnitPrice(
                              it.price,
                              it.salePrice
                            );
                            const checked = selectedIds.includes(it.menuItemId);
                            return (
                              <button
                                key={it.menuItemId}
                                type="button"
                                onClick={() => toggleMulti(g.id, it.menuItemId)}
                                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                                  checked
                                    ? 'border-orange-500 bg-orange-50 text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate">{it.name}</span>
                                <span className="shrink-0 text-slate-500">
                                  +€{unit.toFixed(2)}
                                </span>
                              </button>
                            );
                          })}
                          {g.items.map((it) => {
                            const checked = selectedIds.includes(it.menuItemId);
                            if (
                              !checked ||
                              !it.variations ||
                              it.variations.length === 0
                            ) {
                              return null;
                            }
                            const key = `${g.id}:${it.menuItemId}`;
                            return (
                              <div
                                key={`${it.menuItemId}-nested-variation`}
                                className="ml-3 rounded-md border border-slate-200 bg-slate-100 p-2"
                              >
                                <p className="mb-1 text-xs text-slate-500">
                                  {it.name} variation
                                </p>
                                <select
                                  value={
                                    selectedNestedVariationByOption[key] ?? ''
                                  }
                                  onChange={(e) =>
                                    setSelectedNestedVariationByOption(
                                      (prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      })
                                    )
                                  }
                                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">
                                    Select nested variation…
                                  </option>
                                  {it.variations.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {(v.name ?? v.title ?? 'Variation') +
                                        ` (€${v.priceDelta.toFixed(2)})`}
                                    </option>
                                  ))}
                                </select>
                              </div>
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

          <SheetFooter>
            <Button
              className="bg-destructive text-white hover:bg-destructive/75 hover:text-white"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary text-white hover:bg-primary/75 hover:text-white"
              onClick={handleConfirm}
              disabled={requiredMissing}
            >
              Add to cart
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
