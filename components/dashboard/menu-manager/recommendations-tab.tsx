'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmation, SaveConfirmation } from '@/components/ui/confirmation-dialogs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { AttrGroupRow, MenuCategoryRow, MenuItemRow } from './types';

function effectiveUnitPrice(price: number, salePrice: number | null) {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

function linkedItemsForGroup(
  group: AttrGroupRow,
  baseProduct: MenuItemRow,
  categories: MenuCategoryRow[]
): MenuItemRow[] {
  const cat = categories.find((c) => c.id === group.linkedCategory.id);
  return (cat?.items ?? []).filter((i) => i.id !== baseProduct.id);
}

type Props = {
  categories: MenuCategoryRow[];
  onRefresh: () => Promise<void>;
};

export function RecommendationsTab({ categories, onRefresh: _onRefresh }: Props) {
  const [localCategories, setLocalCategories] = useState<MenuCategoryRow[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const allProducts = useMemo(
    () =>
      localCategories.flatMap((c) =>
        c.items.map((i) => ({ ...i, categoryName: c.name }))
      ),
    [localCategories]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const selected = useMemo(
    () => allProducts.find((p) => p.id === selectedId) ?? null,
    [allProducts, selectedId]
  );

  const [savingRules, setSavingRules] = useState(false);
  const [saveRulesConfirmOpen, setSaveRulesConfirmOpen] = useState(false);
  const [ruleSelectionType, setRuleSelectionType] = useState<'SINGLE' | 'MULTIPLE'>(
    'SINGLE'
  );
  const [ruleRequired, setRuleRequired] = useState(true);
  const [ruleCategoryIds, setRuleCategoryIds] = useState<string[]>([]);

  const [offerCategoryIds, setOfferCategoryIds] = useState<string[]>([]);
  const [selectedOfferProductIds, setSelectedOfferProductIds] = useState<string[]>([]);
  const [savingOffers, setSavingOffers] = useState(false);
  const [saveOffersConfirmOpen, setSaveOffersConfirmOpen] = useState(false);

  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [deleteRuleConfirmOpen, setDeleteRuleConfirmOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState(false);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [deleteOfferConfirmOpen, setDeleteOfferConfirmOpen] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState(false);
  /** Local-only preview of how single / multiple picks look at checkout (not persisted). */
  const [previewByGroup, setPreviewByGroup] = useState<Record<string, string[]>>({});

  /** Categories usable for “offered products” (any except the product’s own). */
  const linkedOptions = useMemo(
    () => localCategories.filter((c) => c.id !== selected?.categoryId),
    [localCategories, selected?.categoryId]
  );

  /** Categories not yet used as a recommendation rule for this product (cannot assign twice). */
  const assignableRuleCategories = useMemo(() => {
    if (!selected) return [];
    const alreadyLinked = new Set(
      selected.attributeGroups.map((g) => g.linkedCategory.id)
    );
    return localCategories.filter(
      (c) => c.id !== selected.categoryId && !alreadyLinked.has(c.id)
    );
  }, [localCategories, selected]);

  const assignedCategoryIdsKey = useMemo(() => {
    if (!selected?.attributeGroups.length) return '';
    return selected.attributeGroups
      .map((g) => g.linkedCategory.id)
      .sort()
      .join(',');
  }, [selected?.attributeGroups]);

  const currentOffers = selected?.offersFromThis ?? [];
  const offeredProductsFromSelectedCategories = useMemo(() => {
    if (!selected || offerCategoryIds.length === 0) return [];
    const blockedIds = new Set<string>([
      selected.id,
      ...currentOffers.map((o) => o.offeredItem.id),
    ]);
    const byId = new Map<string, (typeof allProducts)[number]>();
    for (const p of allProducts) {
      if (blockedIds.has(p.id)) continue;
      if (!offerCategoryIds.includes(p.categoryId)) continue;
      byId.set(p.id, p);
    }
    return Array.from(byId.values());
  }, [allProducts, currentOffers, offerCategoryIds, selected]);

  const toggleInArray = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  useEffect(() => {
    setPreviewByGroup({});
  }, [selectedId]);

  useEffect(() => {
    if (!selected) {
      setRuleCategoryIds([]);
      return;
    }
    const alreadyLinked = new Set(
      selected.attributeGroups.map((g) => g.linkedCategory.id)
    );
    setRuleCategoryIds((prev) =>
      prev.filter(
        (id) =>
          id !== selected.categoryId &&
          !alreadyLinked.has(id) &&
          localCategories.some((c) => c.id === id)
      )
    );
  }, [selectedId, assignedCategoryIdsKey, selected, localCategories]);

  const updateSelectedItem = (updater: (item: MenuItemRow) => MenuItemRow) => {
    if (!selectedId) return;
    setLocalCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === selectedId ? updater(item) : item
        ),
      }))
    );
  };

  const saveRules = async () => {
    if (!selected) {
      toast.error('Select a product first.');
      return;
    }
    if (ruleCategoryIds.length === 0) {
      toast.error('Choose at least one recommendation category.');
      return;
    }
    setSavingRules(true);
    try {
      const selectedCategories = assignableRuleCategories.filter((c) =>
        ruleCategoryIds.includes(c.id)
      );
      const responses = await Promise.all(
        selectedCategories.map((cat, index) =>
          axios.post<{ data: AttrGroupRow }>(
            `/api/restaurant/menu/items/${selected.id}/attributes`,
            {
              name: `Choose from ${cat.name}`,
              selectionType: ruleSelectionType,
              required: ruleRequired,
              linkedCategoryId: cat.id,
              sortOrder: index,
            }
          )
        )
      );
      const createdGroups = responses.map((res) => res.data.data);
      updateSelectedItem((item) => ({
        ...item,
        attributeGroups: [
          ...item.attributeGroups,
          ...createdGroups.filter(
            (group) => !item.attributeGroups.some((existing) => existing.id === group.id)
          ),
        ],
      }));
      toast.success('Recommendation categories saved');
      setRuleCategoryIds([]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Could not save');
    } finally {
      setSavingRules(false);
    }
  };

  const saveOfferedProducts = async () => {
    if (!selected) {
      toast.error('Select a product first.');
      return;
    }
    if (selectedOfferProductIds.length === 0) {
      toast.error('Select offered products first.');
      return;
    }
    setSavingOffers(true);
    try {
      const responses = await Promise.all(
        selectedOfferProductIds.map((itemId, index) =>
          axios.post<{ data: NonNullable<MenuItemRow['offersFromThis']>[number] }>(
            `/api/restaurant/menu/items/${selected.id}/offers`,
            {
              offeredItemId: itemId,
              sortOrder: index,
            }
          )
        )
      );
      const createdOffers = responses.map((res) => res.data.data);
      updateSelectedItem((item) => ({
        ...item,
        offersFromThis: [
          ...(item.offersFromThis ?? []),
          ...createdOffers.filter(
            (offer) =>
              !(item.offersFromThis ?? []).some(
                (existing) => existing.id === offer.id
              )
          ),
        ],
      }));
      toast.success('Offered products added');
      setSelectedOfferProductIds([]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Could not add offered products');
    } finally {
      setSavingOffers(false);
    }
  };

  const deleteRule = async () => {
    if (!deletingRuleId) return;
    setDeletingRule(true);
    try {
      await axios.delete(`/api/restaurant/menu/attributes/${deletingRuleId}`);
      updateSelectedItem((item) => ({
        ...item,
        attributeGroups: item.attributeGroups.filter((g) => g.id !== deletingRuleId),
      }));
      toast.success('Removed');
      setDeleteRuleConfirmOpen(false);
      setDeletingRuleId(null);
    } catch {
      toast.error('Could not remove');
    } finally {
      setDeletingRule(false);
    }
  };

  const deleteOffer = async () => {
    if (!deletingOfferId) return;
    setDeletingOffer(true);
    try {
      await axios.delete(`/api/restaurant/menu/offers/${deletingOfferId}`);
      updateSelectedItem((item) => ({
        ...item,
        offersFromThis: (item.offersFromThis ?? []).filter(
          (o) => o.id !== deletingOfferId
        ),
      }));
      toast.success('Removed offered product');
      setDeleteOfferConfirmOpen(false);
      setDeletingOfferId(null);
    } catch {
      toast.error('Could not remove offered product');
    } finally {
      setDeletingOffer(false);
    }
  };

  const allOtherProductsExist = selected != null && linkedOptions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations &amp; add-ons</CardTitle>
        <CardDescription>
          For each product, define rules that let guests pick extra items from
          another category (e.g. sauces or drinks). Those options appear at
          checkout when the product is in the cart.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {allProducts.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">
              Add products first — recommendations are attached to a product.
            </p>
            <Button type="button" asChild className="w-fit">
              <Link href="/product">Go to Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-2 max-w-md">
              <Label>Product</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-auto min-h-11 py-2">
                  {selected ? (
                    <div className="flex min-w-0 items-center gap-3 text-left">
                      {selected.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dashboard menu URLs
                        <img
                          src={selected.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{selected.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {selected.categoryName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose a product" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                        <span className="truncate">
                          {p.name} ({p.categoryName})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <>
                {/* Match order customize sheet: hero image + title + price strip */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                  {selected.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.imageUrl}
                      alt={selected.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                      No photo
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-wide text-primary">
                        {selected.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {selected.categoryName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="inline-flex rounded-full bg-white px-2.5 py-1 text-base font-bold text-primary ring-1 ring-slate-200">
                        €{effectiveUnitPrice(selected.price, selected.salePrice).toFixed(2)}
                      </p>
                      {selected.description?.trim() ? (
                        <p className="mt-3 text-sm leading-relaxed text-slate-700">
                          {selected.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold">1) Recommendation source categories</h4>
                  <p className="text-xs text-muted-foreground">
                    Select one or more categories. Each selected category is saved as
                    a required/optional recommendation group for this product. Categories
                    already used for this product cannot be assigned again.
                  </p>
                  {linkedOptions.length === 0 ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <p className="text-xs text-muted-foreground">
                        Create another category (e.g. Sauces) to use as recommendation source.
                      </p>
                      <Button type="button" asChild size="sm" variant="secondary" className="w-fit shrink-0">
                        <Link href="/categories">Go to Categories</Link>
                      </Button>
                    </div>
                  ) : assignableRuleCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Every other category is already assigned as a recommendation for this
                      product. Remove a rule below if you want to reuse a category.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-4">
                        <div className="grid gap-2">
                          <Label>Selection type</Label>
                          <Select
                            value={ruleSelectionType}
                            onValueChange={(v: 'SINGLE' | 'MULTIPLE') => setRuleSelectionType(v)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SINGLE">One option</SelectItem>
                              <SelectItem value="MULTIPLE">Multiple options</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <label className="mt-7 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={ruleRequired}
                            onChange={(e) => setRuleRequired(e.target.checked)}
                          />
                          Required before add to cart
                        </label>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {assignableRuleCategories.map((cat) => {
                          const checked = ruleCategoryIds.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                checked ? 'border-primary bg-primary/10' : 'border-border'
                              }`}
                            >
                              <span>{cat.name}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setRuleCategoryIds((prev) => toggleInArray(prev, cat.id))
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setSaveRulesConfirmOpen(true)}
                        disabled={savingRules || ruleCategoryIds.length === 0}
                      >
                        {savingRules ? 'Saving...' : 'Save recommendation categories'}
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold">Saved recommendation groups</h4>
                    <p className="text-xs text-muted-foreground">
                      Same layout as the customer order sidebar: one dropdown per group when
                      selection is single; multiple choice uses a multi-select list with photos.
                      Preview choices here are not saved — they show how the rule behaves.
                    </p>
                  </div>
                  {selected.attributeGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No rules yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selected.attributeGroups.map((g) => {
                        const items = linkedItemsForGroup(
                          g,
                          selected,
                          localCategories
                        );
                        const previewIds = previewByGroup[g.id] ?? [];
                        const singleValue = previewIds[0] ?? '';

                        return (
                          <section
                            key={g.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Label className="text-sm font-semibold text-slate-900">
                                    {g.name}
                                  </Label>
                                  {g.required ? (
                                    <Badge
                                      variant="outline"
                                      className="border-red-200 bg-red-50 text-[10px] font-semibold uppercase text-red-700"
                                    >
                                      Required
                                    </Badge>
                                  ) : null}
                                  <Badge variant="secondary" className="text-[10px] uppercase">
                                    {g.selectionType === 'SINGLE' ? 'Single' : 'Multiple'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                  From {g.linkedCategory.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {g.selectionType === 'SINGLE'
                                    ? 'Choose one option'
                                    : 'Choose one or more options'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingRuleId(g.id);
                                  setDeleteRuleConfirmOpen(true);
                                }}
                                aria-label="Remove rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-4">
                              {items.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  No products in this linked category yet.
                                </p>
                              ) : g.selectionType === 'SINGLE' ? (
                                <Select
                                  value={singleValue || undefined}
                                  onValueChange={(v) =>
                                    setPreviewByGroup((prev) => ({
                                      ...prev,
                                      [g.id]: v ? [v] : [],
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-auto min-h-11 border-slate-300 bg-white py-2 text-slate-900">
                                    {(() => {
                                      const it = items.find((x) => x.id === singleValue);
                                      if (!it) {
                                        return (
                                          <SelectValue placeholder="Select an option…" />
                                        );
                                      }
                                      return (
                                        <div className="flex min-w-0 items-center gap-3 text-left">
                                          {it.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={it.imageUrl}
                                              alt=""
                                              className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                                              —
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                              {it.name}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                              €
                                              {effectiveUnitPrice(
                                                it.price,
                                                it.salePrice
                                              ).toFixed(2)}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map((it) => (
                                      <SelectItem key={it.id} value={it.id}>
                                        <span className="flex items-center gap-2 py-0.5">
                                          {it.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={it.imageUrl}
                                              alt=""
                                              className="h-8 w-8 rounded object-cover"
                                            />
                                          ) : (
                                            <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
                                              —
                                            </span>
                                          )}
                                          <span className="flex flex-col gap-0.5 text-left">
                                            <span className="font-medium leading-tight">
                                              {it.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              €
                                              {effectiveUnitPrice(
                                                it.price,
                                                it.salePrice
                                              ).toFixed(2)}
                                            </span>
                                          </span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                  {items.map((it) => {
                                    const checked = previewIds.includes(it.id);
                                    const unit = effectiveUnitPrice(
                                      it.price,
                                      it.salePrice
                                    );
                                    return (
                                      <label
                                        key={it.id}
                                        className={cn(
                                          'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition',
                                          checked
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                        )}
                                      >
                                        {it.imageUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={it.imageUrl}
                                            alt=""
                                            className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                                            —
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-medium text-slate-900">
                                            {it.name}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            €{unit.toFixed(2)}
                                          </p>
                                        </div>
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 shrink-0 accent-primary"
                                          checked={checked}
                                          onChange={() =>
                                            setPreviewByGroup((prev) => ({
                                              ...prev,
                                              [g.id]: toggleInArray(
                                                prev[g.id] ?? [],
                                                it.id
                                              ),
                                            }))
                                          }
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3 rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold">2) Offered products</h4>
                  <p className="text-xs text-muted-foreground">
                    Choose categories first, then select multiple products from those categories.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {linkedOptions.map((cat) => {
                      const checked = offerCategoryIds.includes(cat.id);
                      return (
                        <label
                          key={`offer-cat-${cat.id}`}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            checked ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setOfferCategoryIds((prev) => toggleInArray(prev, cat.id));
                              setSelectedOfferProductIds([]);
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>

                  {!allOtherProductsExist ? null : offerCategoryIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Select at least one category to load products.
                    </p>
                  ) : offeredProductsFromSelectedCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No products found in selected categories (or already offered).
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {offeredProductsFromSelectedCategories.map((p) => {
                        const checked = selectedOfferProductIds.includes(p.id);
                        const displayPrice = effectiveUnitPrice(p.price, p.salePrice);
                        return (
                          <label
                            key={`offer-product-${p.id}`}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                              checked ? 'border-primary bg-primary/10' : 'border-border'
                            }`}
                          >
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                                —
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{p.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {p.categoryName} · €{displayPrice.toFixed(2)}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4 shrink-0 accent-primary"
                              checked={checked}
                              onChange={() =>
                                setSelectedOfferProductIds((prev) => toggleInArray(prev, p.id))
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => setSaveOffersConfirmOpen(true)}
                    disabled={savingOffers || selectedOfferProductIds.length === 0}
                  >
                    {savingOffers ? 'Saving...' : 'Save offered products'}
                  </Button>

                  {currentOffers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No offered products yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {currentOffers.map((offer) => (
                        <li
                          key={offer.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {offer.offeredItem.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={offer.offeredItem.imageUrl}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                                —
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium">
                                {offer.offeredItem.name}
                              </span>
                              <span className="text-muted-foreground">
                                {' '}
                                · €
                                {effectiveUnitPrice(
                                  offer.offeredItem.price,
                                  offer.offeredItem.salePrice
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setDeletingOfferId(offer.id);
                              setDeleteOfferConfirmOpen(true);
                            }}
                            aria-label="Remove offered product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>

      <SaveConfirmation
        open={saveRulesConfirmOpen}
        title="Save recommendation categories"
        description="Create recommendation groups for the selected categories?"
        itemName={selected?.name || 'Selected product'}
        loading={savingRules}
        onConfirm={() => {
          setSaveRulesConfirmOpen(false);
          void saveRules();
        }}
        onCancel={() => setSaveRulesConfirmOpen(false)}
      />

      <SaveConfirmation
        open={saveOffersConfirmOpen}
        title="Save offered products"
        description="Add selected products as offers for this product?"
        itemName={selected?.name || 'Selected product'}
        loading={savingOffers}
        onConfirm={() => {
          setSaveOffersConfirmOpen(false);
          void saveOfferedProducts();
        }}
        onCancel={() => setSaveOffersConfirmOpen(false)}
      />

      <DeleteConfirmation
        open={deleteRuleConfirmOpen}
        title="Remove rule"
        description="This add-on rule will be removed from this product."
        itemName={
          selected?.attributeGroups.find((g) => g.id === deletingRuleId)?.name
        }
        loading={deletingRule}
        onConfirm={() => void deleteRule()}
        onCancel={() => {
          setDeleteRuleConfirmOpen(false);
          setDeletingRuleId(null);
        }}
      />

      <DeleteConfirmation
        open={deleteOfferConfirmOpen}
        title="Remove offered product"
        description="This offered product link will be removed."
        itemName={
          currentOffers.find((o) => o.id === deletingOfferId)?.offeredItem.name
        }
        loading={deletingOffer}
        onConfirm={() => void deleteOffer()}
        onCancel={() => {
          setDeleteOfferConfirmOpen(false);
          setDeletingOfferId(null);
        }}
      />
    </Card>
  );
}
