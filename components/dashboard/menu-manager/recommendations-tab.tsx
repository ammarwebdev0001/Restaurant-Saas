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

import type { AttrGroupRow, MenuCategoryRow, MenuItemRow } from './types';

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
  const linkedOptions = useMemo(
    () => localCategories.filter((c) => c.id !== selected?.categoryId),
    [localCategories, selected?.categoryId]
  );

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
      const selectedCategories = linkedOptions.filter((c) =>
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
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.categoryName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold">1) Recommendation source categories</h4>
                  <p className="text-xs text-muted-foreground">
                    Select one or more categories. Each selected category is saved as
                    a required/optional recommendation group for this product.
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
                        {linkedOptions.map((cat) => {
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

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold">Saved recommendation groups</h4>
                  {selected.attributeGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No rules yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.attributeGroups.map((g) => (
                        <li
                          key={g.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">{g.name}</span>
                            <span className="text-muted-foreground">
                              {' '}
                              → from “{g.linkedCategory.name}” ·{' '}
                              {g.selectionType.toLowerCase()}
                              {g.required ? ' · required' : ''}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setDeletingRuleId(g.id);
                              setDeleteRuleConfirmOpen(true);
                            }}
                            aria-label="Remove rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
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
                        const displayPrice = p.salePrice ?? p.price;
                        return (
                          <label
                            key={`offer-product-${p.id}`}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                              checked ? 'border-primary bg-primary/10' : 'border-border'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{p.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {p.categoryName} · €{displayPrice.toFixed(2)}
                              </p>
                            </div>
                            <input
                              type="checkbox"
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
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">
                              {offer.offeredItem.name}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}
                              · €{offer.offeredItem.price.toFixed(2)}
                            </span>
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
