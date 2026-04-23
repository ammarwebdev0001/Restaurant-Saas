'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { buildThemeCssVars } from '@/lib/restaurant-theme';

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
  productBaseUnitPrice: number;
  productDescription?: string | null;
  themePrimaryColor?: string | null;
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
    variation?: SelectedProductVariation | null,
    quantity?: number
  ) => void;
};

export function ProductCustomizeDialog({
  productName,
  productImageUrl,
  productBaseUnitPrice,
  productDescription,
  themePrimaryColor,
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
  const [quantity, setQuantity] = useState(1);
  const [picker, setPicker] = useState<
    | null
    | { kind: 'variation' }
    | { kind: 'group-single'; groupId: string }
    | { kind: 'group-multi'; groupId: string }
    | { kind: 'nested'; groupId: string; optionId: string }
  >(null);

  const getNextPendingPicker = (
    nextVariationId: string,
    nextSelectedByGroup: Record<string, string[]>,
    nextNested: Record<string, string>
  ):
    | null
    | { kind: 'variation' }
    | { kind: 'group-single'; groupId: string }
    | { kind: 'group-multi'; groupId: string }
    | { kind: 'nested'; groupId: string; optionId: string } => {
    if (variations.length > 0 && !nextVariationId) {
      return { kind: 'variation' };
    }

    for (const g of attributeGroups) {
      const selectedIds = nextSelectedByGroup[g.id] ?? [];
      if (selectedIds.length === 0 && g.required) {
        if (g.selectionType === 'SINGLE') {
          return { kind: 'group-single', groupId: g.id };
        }
        return { kind: 'group-multi', groupId: g.id };
      }
      if (selectedIds.length === 0 && g.selectionType === 'MULTIPLE') {
        continue;
      }
      if (selectedIds.length === 0) {
        return { kind: 'group-single', groupId: g.id };
      }
      const optionsToCheck =
        g.selectionType === 'SINGLE' ? selectedIds.slice(0, 1) : selectedIds;
      for (const optionId of optionsToCheck) {
        const selectedOption = g.items.find((it) => it.menuItemId === optionId);
        if (
          !selectedOption ||
          !selectedOption.variations ||
          selectedOption.variations.length === 0
        ) {
          continue;
        }
        const key = `${g.id}:${selectedOption.menuItemId}`;
        if (!nextNested[key]) {
          return {
            kind: 'nested',
            groupId: g.id,
            optionId: selectedOption.menuItemId,
          };
        }
      }
    }

    return null;
  };

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string[]> = {};
    for (const g of attributeGroups) init[g.id] = [];
    setSelectedByGroup(init);
    setSelectedVariationId('');
    setSelectedNestedVariationByOption({});
    setQuantity(1);
    setPicker(getNextPendingPicker('', init, {}));
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

  const increaseMultiQty = (groupId: string, optionId: string) => {
    setSelectedByGroup((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] ?? []), optionId],
    }));
  };

  const decreaseMultiQty = (groupId: string, optionId: string) => {
    setSelectedByGroup((prev) => {
      const current = [...(prev[groupId] ?? [])];
      const idx = current.lastIndexOf(optionId);
      if (idx < 0) return prev;
      current.splice(idx, 1);
      const remainingQty = current.filter((id) => id === optionId).length;
      if (remainingQty === 0) {
        setSelectedNestedVariationByOption((prevNested) => {
          const next = { ...prevNested };
          delete next[`${groupId}:${optionId}`];
          return next;
        });
      }
      return { ...prev, [groupId]: current };
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
          const qty =
            g.selectionType === 'MULTIPLE'
              ? ids.filter((x) => x === it.menuItemId).length
              : 1;
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
            name: qty > 1 ? `${finalName} x${qty}` : finalName,
            description: it.description,
            imageUrl: it.imageUrl,
            unitPrice: finalUnitPrice * qty,
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
    onConfirm(mods, variation, quantity);
  };

  const decreaseGroupSelection = (
    group: AttributeGroup,
    selectedIds: string[]
  ) => {
    if (selectedIds.length === 0) return;
    if (group.selectionType === 'SINGLE') {
      setSelectedByGroup((prev) => ({ ...prev, [group.id]: [] }));
      setSelectedNestedVariationByOption((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${group.id}:`)) delete next[key];
        }
        return next;
      });
      return;
    }
    const removeId = selectedIds[selectedIds.length - 1]!;
    setSelectedByGroup((prev) => ({
      ...prev,
      [group.id]: (prev[group.id] ?? []).filter((id) => id !== removeId),
    }));
    setSelectedNestedVariationByOption((prev) => {
      const next = { ...prev };
      delete next[`${group.id}:${removeId}`];
      return next;
    });
  };

  const openGroupSelection = (group: AttributeGroup) => {
    if (group.selectionType === 'SINGLE') {
      setPicker({ kind: 'group-single', groupId: group.id });
      return;
    }
    setPicker({ kind: 'group-multi', groupId: group.id });
  };

  const selectedUnitTotal = useMemo(() => {
    const selectedVariation = variations.find(
      (v) => v.id === selectedVariationId
    );
    const base = selectedVariation
      ? selectedVariation.priceDelta
      : productBaseUnitPrice;
    const addons = attributeGroups.reduce((sum, g) => {
      const ids = selectedByGroup[g.id] ?? [];
      if (ids.length === 0) return sum;
      const perGroup = g.items
        .filter((it) => ids.includes(it.menuItemId))
        .reduce((s, it) => {
          const key = `${g.id}:${it.menuItemId}`;
          const nestedVariationId = selectedNestedVariationByOption[key];
          const nested = (it.variations ?? []).find(
            (v) => v.id === nestedVariationId
          );
          const price = nested
            ? nested.priceDelta
            : effectiveUnitPrice(it.price, it.salePrice);
          return s + price;
        }, 0);
      return sum + perGroup;
    }, 0);
    return base + addons;
  }, [
    attributeGroups,
    productBaseUnitPrice,
    selectedByGroup,
    selectedNestedVariationByOption,
    selectedVariationId,
    variations,
  ]);

  const dialogVars = useMemo(() => {
    const primaryVars = buildThemeCssVars(themePrimaryColor);
    return {
      ...primaryVars,
      '--background': 'oklch(0.9383 0.0042 236.4993)',
      '--foreground': 'oklch(0.3211 0 0)',
      '--card': 'oklch(1 0 0)',
      '--card-foreground': 'oklch(0.3211 0 0)',
      '--popover': 'oklch(1 0 0)',
      '--popover-foreground': 'oklch(0.3211 0 0)',
      '--secondary': 'oklch(0.967 0.0029 264.5419)',
      '--secondary-foreground': 'oklch(0.4461 0.0263 256.8018)',
      '--muted': 'oklch(0.9846 0.0017 247.8389)',
      '--muted-foreground': 'oklch(0.551 0.0234 264.3637)',
      '--border': 'oklch(0.9022 0.0052 247.8822)',
      '--input': 'oklch(0.97 0.0029 264.542)',
      colorScheme: 'light',
    } as CSSProperties;
  }, [themePrimaryColor]);

  const basePriceLabel = `€${productBaseUnitPrice.toFixed(2)}`;

  const pickerTitle = useMemo(() => {
    if (!picker) return '';
    if (picker.kind === 'variation') return 'Select variation';
    if (picker.kind === 'group-single') {
      const group = attributeGroups.find((g) => g.id === picker.groupId);
      return group ? `Select ${group.name}` : 'Select option';
    }
    if (picker.kind === 'group-multi') {
      const group = attributeGroups.find((g) => g.id === picker.groupId);
      return group ? `Select ${group.name}` : 'Select options';
    }
    const group = attributeGroups.find((g) => g.id === picker.groupId);
    const item = group?.items.find((i) => i.menuItemId === picker.optionId);
    return item ? `Select ${item.name} variation` : 'Select variation';
  }, [attributeGroups, picker]);

  const pickerEntries = useMemo(() => {
    if (!picker)
      return [] as Array<{
        id: string;
        name: string;
        price: number;
        imageUrl?: string | null;
        selected: boolean;
        quantity?: number;
        onChoose: () => void;
        onIncrease?: () => void;
        onDecrease?: () => void;
      }>;
    if (picker.kind === 'variation') {
      return variations.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.priceDelta,
        imageUrl: null,
        selected: selectedVariationId === v.id,
        quantity: undefined,
        onChoose: () => {
          const nextVariationId = v.id;
          const nextPicker = getNextPendingPicker(
            nextVariationId,
            selectedByGroup,
            selectedNestedVariationByOption
          );
          setSelectedVariationId(nextVariationId);
          setPicker(nextPicker);
        },
        onIncrease: undefined,
        onDecrease: undefined,
      }));
    }
    if (picker.kind === 'group-single') {
      const group = attributeGroups.find((g) => g.id === picker.groupId);
      if (!group) return [];
      const selected = selectedByGroup[group.id]?.[0] ?? '';
      return group.items.map((it) => ({
        id: it.menuItemId,
        name: it.name,
        price: effectiveUnitPrice(it.price, it.salePrice),
        imageUrl: it.imageUrl,
        selected: selected === it.menuItemId,
        quantity: undefined,
        onChoose: () => {
          const nextSelectedByGroup = {
            ...selectedByGroup,
            [group.id]:
              selectedByGroup[group.id]?.[0] === it.menuItemId
                ? []
                : [it.menuItemId],
          };
          const nextNested = { ...selectedNestedVariationByOption };
          for (const key of Object.keys(nextNested)) {
            if (key.startsWith(`${group.id}:`)) delete nextNested[key];
          }
          const nextPicker = getNextPendingPicker(
            selectedVariationId,
            nextSelectedByGroup,
            nextNested
          );
          setSingle(group.id, it.menuItemId);
          setPicker(nextPicker);
        },
        onIncrease: undefined,
        onDecrease: undefined,
      }));
    }
    if (picker.kind === 'group-multi') {
      const group = attributeGroups.find((g) => g.id === picker.groupId);
      if (!group) return [];
      const selected = selectedByGroup[group.id] ?? [];
      return group.items.map((it) => ({
        id: it.menuItemId,
        name: it.name,
        price: effectiveUnitPrice(it.price, it.salePrice),
        imageUrl: it.imageUrl,
        selected: selected.includes(it.menuItemId),
        quantity: selected.filter((x) => x === it.menuItemId).length,
        onChoose: () => {
          increaseMultiQty(group.id, it.menuItemId);
        },
        onIncrease: () => increaseMultiQty(group.id, it.menuItemId),
        onDecrease: () => decreaseMultiQty(group.id, it.menuItemId),
      }));
    }
    const group = attributeGroups.find((g) => g.id === picker.groupId);
    const item = group?.items.find((it) => it.menuItemId === picker.optionId);
    if (!item) return [];
    const key = `${picker.groupId}:${picker.optionId}`;
    return (item.variations ?? []).map((v) => ({
      id: v.id,
      name: v.name ?? v.title ?? 'Variation',
      price: v.priceDelta,
      imageUrl: v.imageUrl ?? item.imageUrl ?? null,
      selected: selectedNestedVariationByOption[key] === v.id,
      quantity: undefined,
      onChoose: () => {
        const nextNested = { ...selectedNestedVariationByOption, [key]: v.id };
        const nextPicker = getNextPendingPicker(
          selectedVariationId,
          selectedByGroup,
          nextNested
        );
        setSelectedNestedVariationByOption((prev) => ({
          ...prev,
          [key]: v.id,
        }));
        setPicker(nextPicker);
      },
      onIncrease: undefined,
      onDecrease: undefined,
    }));
  }, [
    attributeGroups,
    picker,
    selectedByGroup,
    selectedNestedVariationByOption,
    selectedVariationId,
    variations,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl border-l border-border bg-background p-0 text-foreground"
        style={dialogVars}
      >
        <div className="relative flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary menu image URLs
              <img
                src={productImageUrl}
                alt={productName}
                className="h-44 w-full object-cover"
              />
            ) : null}
            <div className="p-6 pb-24">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold uppercase tracking-wide text-primary">
                  {productName}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-base font-bold text-primary">
                  {basePriceLabel}
                </p>
                {productDescription?.trim() ? (
                  <p className="text-base leading-relaxed text-slate-700">
                    {productDescription}
                  </p>
                ) : null}
              </div>

              <div className="space-y-6 py-2">
                <h3 className="text-3xl font-bold tracking-tight text-primary">
                  Personalize your product
                </h3>
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
                    <button
                      type="button"
                      className="mt-3 flex h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
                      onClick={() => setPicker({ kind: 'variation' })}
                    >
                      <span>
                        {selectedVariationId
                          ? variations.find((v) => v.id === selectedVariationId)
                              ?.name ?? 'Select variation…'
                          : 'Select variation…'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </section>
                ) : null}

                {attributeGroups.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No add-ons available.
                  </p>
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
                          <div className="flex items-center gap-2">
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
                        </div>

                        <div className="mt-3 space-y-3">
                          {g.items.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No options available in this category yet.
                            </p>
                          ) : g.selectionType === 'SINGLE' ? (
                            <>
                              <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
                                onClick={() => openGroupSelection(g)}
                              >
                                <span>
                                  {selectedIds[0]
                                    ? g.items.find(
                                        (it) => it.menuItemId === selectedIds[0]
                                      )?.name ?? 'Select…'
                                    : 'Select…'}
                                </span>
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              </button>
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
                                  <button
                                    type="button"
                                    className="mt-2 flex h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
                                    onClick={() =>
                                      setPicker({
                                        kind: 'nested',
                                        groupId: g.id,
                                        optionId: selectedOption.menuItemId,
                                      })
                                    }
                                  >
                                    <span>
                                      {selectedNestedVariationByOption[key]
                                        ? selectedOption.variations.find(
                                            (v) =>
                                              v.id ===
                                              selectedNestedVariationByOption[
                                                key
                                              ]
                                          )?.name ??
                                          selectedOption.variations.find(
                                            (v) =>
                                              v.id ===
                                              selectedNestedVariationByOption[
                                                key
                                              ]
                                          )?.title ??
                                          `Select ${selectedOption.name} variation…`
                                        : `Select ${selectedOption.name} variation…`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-slate-500" />
                                  </button>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
                                onClick={() => openGroupSelection(g)}
                              >
                                <span>
                                  {selectedIds.length > 0
                                    ? `${selectedIds.length} selected`
                                    : 'Select options…'}
                                </span>
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              </button>
                              {g.items.map((it) => {
                                const checked = selectedIds.includes(
                                  it.menuItemId
                                );
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
                                        selectedNestedVariationByOption[key] ??
                                        ''
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
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-white p-3 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="default"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </Button>
              <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="default"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              >
                +
              </Button>
              <Button
                type="button"
                className="ml-auto h-10 min-w-[180px] bg-primary px-6 font-semibold text-white hover:bg-primary/90"
                onClick={handleConfirm}
                disabled={requiredMissing}
              >
                Add €{(selectedUnitTotal * quantity).toFixed(2)}
              </Button>
            </div>
          </aside>
          {picker ? (
            <aside className="absolute inset-0 z-[80] flex items-end bg-black/40 animate-in fade-in-0 duration-200">
              <div className="w-full rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 ease-out">
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {pickerTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    {picker?.kind === 'group-multi' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const nextPicker = getNextPendingPicker(
                            selectedVariationId,
                            selectedByGroup,
                            selectedNestedVariationByOption
                          );
                          if (
                            nextPicker &&
                            nextPicker.kind === 'group-multi' &&
                            nextPicker.groupId === picker.groupId
                          ) {
                            setPicker(null);
                            return;
                          }
                          setPicker(nextPicker);
                        }}
                      >
                        Done
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPicker(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <div className="max-h-[45vh] space-y-2 overflow-y-auto pb-2">
                  {pickerEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                        entry.selected
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 bg-white'
                      }`}
                      onClick={entry.onChoose}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {entry.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- menu images are external/base64
                          <img
                            src={entry.imageUrl}
                            alt={entry.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {entry.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          +€{entry.price.toFixed(2)}
                        </p>
                      </div>
                      {picker?.kind === 'group-multi' ? (
                        <div
                          className="ml-auto flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={!entry.quantity}
                            onClick={entry.onDecrease}
                          >
                            -
                          </Button>
                          <span className="min-w-[2ch] text-center text-xs font-semibold">
                            {entry.quantity ?? 0}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={entry.onIncrease}
                          >
                            +
                          </Button>
                        </div>
                      ) : entry.selected ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
