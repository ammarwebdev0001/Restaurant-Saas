'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
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

      // Count every selected instance so multi-quantity add-ons always increase popup total.
      const perGroup = ids.reduce((groupSum, selectedId) => {
        const it = g.items.find((x) => x.menuItemId === selectedId);
        if (!it) return groupSum;
        const key = `${g.id}:${it.menuItemId}`;
        const nestedVariationId = selectedNestedVariationByOption[key];
        const nested = (it.variations ?? []).find(
          (v) => v.id === nestedVariationId
        );
        const price = nested
          ? nested.priceDelta
          : effectiveUnitPrice(it.price, it.salePrice);
        return groupSum + price;
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
        className="flex h-full w-full max-w-[min(100vw,80rem)] flex-col overflow-hidden border-l bg-background p-0 text-foreground sm:max-w-[min(100vw,80rem)]"
        style={dialogVars}
      >
        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left: hero image (desktop — full height) */}
          <div className="relative hidden min-h-0 shrink-0 overflow-hidden bg-muted lg:block lg:w-[58%] lg:max-w-none">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary menu image URLs
              <img
                src={productImageUrl}
                alt={productName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-primary/10">
                <span className="text-sm font-medium text-muted-foreground">
                  No image
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
          </div>

          {/* Mobile: prominent image strip */}
          <div className="relative h-[min(38vh,280px)] w-full shrink-0 overflow-hidden bg-muted lg:hidden">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageUrl}
                alt={productName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Right: details + scroll + footer */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:w-[42%] lg:max-w-none">
            <SheetHeader className="shrink-0 space-y-0 border-b border-border px-5 pb-4 pt-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-2">
                  <SheetTitle className="text-balance text-xl font-bold uppercase leading-tight tracking-wide text-primary md:text-2xl">
                    {productName}
                  </SheetTitle>
                  <p className="mt-2 text-lg font-bold tabular-nums text-primary md:text-xl">
                    {basePriceLabel}
                  </p>
                </div>
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
              {productDescription?.trim() ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {productDescription}
                </p>
              ) : null}
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
              <h3 className="mb-4 text-lg font-semibold tracking-tight text-primary md:text-xl">
                Personalize your product
              </h3>

              <div className="space-y-5">
                {variations.length > 0 ? (
                  <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <Label className="text-sm font-semibold leading-snug text-foreground">
                        Variation
                      </Label>
                      <span className="shrink-0 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        Required
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-3 flex h-12 w-full items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                      onClick={() => setPicker({ kind: 'variation' })}
                    >
                      <span className="truncate text-muted-foreground">
                        {selectedVariationId
                          ? (variations.find((v) => v.id === selectedVariationId)
                              ?.name ?? 'Select…')
                          : 'Select…'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </section>
                ) : null}

                {attributeGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No add-ons available.
                  </p>
                ) : (
                  attributeGroups.map((g) => {
                    const selectedIds = selectedByGroup[g.id] ?? [];
                    const missing = g.required && selectedIds.length === 0;

                    return (
                      <section
                        key={g.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <Label className="text-sm font-semibold leading-snug text-foreground">
                              {g.name}
                            </Label>
                            {g.linkedCategoryName ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                From {g.linkedCategoryName}
                              </p>
                            ) : null}
                          </div>
                          {g.required ? (
                            <span className="shrink-0 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                              Required
                            </span>
                          ) : (
                            <p className="shrink-0 text-xs text-muted-foreground">
                              {g.selectionType === 'SINGLE'
                                ? 'Optional'
                                : 'Choose one or more'}
                            </p>
                          )}
                        </div>
                        {missing ? (
                          <p className="mt-1 text-xs text-destructive">
                            Please select an option
                          </p>
                        ) : null}

                        <div className="mt-3 space-y-3">
                          {g.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No options available in this category yet.
                            </p>
                          ) : g.selectionType === 'SINGLE' ? (
                            <>
                              <button
                                type="button"
                                className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                                onClick={() => openGroupSelection(g)}
                              >
                                <span className="truncate text-muted-foreground">
                                  {selectedIds[0]
                                    ? (g.items.find(
                                        (it) =>
                                          it.menuItemId === selectedIds[0]
                                      )?.name ?? 'Select…')
                                    : 'Select…'}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                                    className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                                    onClick={() =>
                                      setPicker({
                                        kind: 'nested',
                                        groupId: g.id,
                                        optionId: selectedOption.menuItemId,
                                      })
                                    }
                                  >
                                    <span className="truncate text-muted-foreground">
                                      {selectedNestedVariationByOption[key]
                                        ? (selectedOption.variations.find(
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
                                          `Select ${selectedOption.name}…`)
                                        : `Select ${selectedOption.name}…`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  </button>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                                onClick={() => openGroupSelection(g)}
                              >
                                <span className="truncate text-muted-foreground">
                                  {selectedIds.length > 0
                                    ? `${selectedIds.length} selected`
                                    : 'Select…'}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                                    className="ml-1 rounded-lg border border-border bg-muted/30 p-3"
                                  >
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
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
                                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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

            {/* Sticky footer: qty + Add (reference: Add left, price right on orange bar) */}
            <footer className="shrink-0 border-t border-border bg-card px-4 py-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]">
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <div className="flex items-center gap-0.5 rounded-lg border border-primary/30 bg-primary/5 p-0.5">
                  <Button
                    type="button"
                    variant="default"
                    className="h-10 w-10 shrink-0 rounded-md p-0 text-base font-bold"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <span className="min-w-[2.5rem] px-1 text-center text-sm font-bold tabular-nums text-foreground">
                    {String(quantity).padStart(2, '0')}
                  </span>
                  <Button
                    type="button"
                    variant="default"
                    className="h-10 w-10 shrink-0 rounded-md p-0 text-base font-bold"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    +
                  </Button>
                </div>
                <Button
                  type="button"
                  disabled={requiredMissing}
                  onClick={handleConfirm}
                  className="h-12 min-h-[3rem] flex-1 rounded-xl border-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50 sm:min-w-[12rem]"
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>Add</span>
                    <span className="tabular-nums">
                      €{(selectedUnitTotal * quantity).toFixed(2)}
                    </span>
                  </span>
                </Button>
              </div>
            </footer>

            {picker ? (
              <aside
                className="absolute inset-0 z-[80] flex min-h-0 flex-col justify-end bg-black/40 animate-in fade-in-0 duration-200"
                aria-modal="true"
                role="dialog"
                aria-labelledby="product-customize-picker-title"
              >
                <div className="w-full max-h-[min(55dvh,28rem)] shrink-0 overflow-hidden rounded-t-2xl border-t border-border bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 ease-out">
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3
                      id="product-customize-picker-title"
                      className="text-base font-semibold text-foreground"
                    >
                      {pickerTitle}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
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
                            : 'border-border bg-background'
                        }`}
                        onClick={entry.onChoose}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
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
                          <p className="truncate text-sm font-medium text-foreground">
                            {entry.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
