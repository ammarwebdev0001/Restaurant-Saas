'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DeleteConfirmation,
  SaveConfirmation,
} from '@/components/ui/confirmation-dialogs';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export function RecommendationsTab({
  categories,
  onRefresh: _onRefresh,
}: Props) {
  const [localCategories, setLocalCategories] =
    useState<MenuCategoryRow[]>(categories);

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
  /** Checked category ids for the product strip + search. Empty = none. */
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>(() =>
    categories.map((c) => c.id)
  );
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);

  const categoryIdsSignature = useMemo(
    () =>
      localCategories
        .map((c) => c.id)
        .sort()
        .join(','),
    [localCategories]
  );

  useEffect(() => {
    const ids = localCategories.map((c) => c.id);
    if (ids.length === 0) {
      setFilterCategoryIds([]);
      return;
    }
    setFilterCategoryIds((prev) => {
      const idSet = new Set(ids);
      const kept = prev.filter((id) => idSet.has(id));
      const newcomers = ids.filter((id) => !prev.includes(id));
      if (kept.length === 0) return [...ids];
      if (newcomers.length > 0) return [...kept, ...newcomers];
      return kept;
    });
  }, [categoryIdsSignature, localCategories]);

  const selected = useMemo(
    () => allProducts.find((p) => p.id === selectedId) ?? null,
    [allProducts, selectedId]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (filterCategoryIds.length === 0) return [];
    const allow = new Set(filterCategoryIds);
    let list = allProducts.filter((p) => allow.has(p.categoryId));
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProducts, filterCategoryIds, productSearch]);

  const activeCategoryFilterLabel = useMemo(() => {
    const allIds = localCategories.map((c) => c.id);
    if (filterCategoryIds.length === 0) return 'None';
    const isAll =
      allIds.length > 0 &&
      filterCategoryIds.length === allIds.length &&
      allIds.every((id) => filterCategoryIds.includes(id));
    if (isAll) return 'All categories';
    if (filterCategoryIds.length === 1) {
      return (
        localCategories.find((c) => c.id === filterCategoryIds[0])?.name ??
        '1 category'
      );
    }
    return `${filterCategoryIds.length} categories`;
  }, [filterCategoryIds, localCategories]);

  const filteredProductIdsKey = useMemo(
    () => filteredProducts.map((p) => p.id).join(','),
    [filteredProducts]
  );

  const productStripRef = useRef<HTMLDivElement>(null);
  const [productStripScroll, setProductStripScroll] = useState({
    back: false,
    forward: false,
  });

  const syncProductStripScroll = useCallback(() => {
    const el = productStripRef.current;
    if (!el) {
      setProductStripScroll({ back: false, forward: false });
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = Math.max(0, scrollWidth - clientWidth);
    setProductStripScroll({
      back: scrollLeft > 4,
      forward: max > 4 && scrollLeft < max - 4,
    });
  }, []);

  useLayoutEffect(() => {
    syncProductStripScroll();
  }, [filteredProductIdsKey, syncProductStripScroll]);

  useEffect(() => {
    const el = productStripRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => syncProductStripScroll());
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncProductStripScroll]);

  const scrollProductStrip = useCallback((direction: 'back' | 'forward') => {
    const el = productStripRef.current;
    if (!el) return;
    const amount = Math.min(Math.max(el.clientWidth * 0.65, 140), 280);
    el.scrollBy({
      left: direction === 'forward' ? amount : -amount,
      behavior: 'smooth',
    });
  }, []);

  const [savingRules, setSavingRules] = useState(false);
  const [saveRulesConfirmOpen, setSaveRulesConfirmOpen] = useState(false);
  const [ruleSelectionType, setRuleSelectionType] = useState<
    'SINGLE' | 'MULTIPLE'
  >('SINGLE');
  const [ruleRequired, setRuleRequired] = useState(true);
  const [ruleCategoryIds, setRuleCategoryIds] = useState<string[]>([]);

  const [offerCategoryIds, setOfferCategoryIds] = useState<string[]>([]);
  const [selectedOfferProductIds, setSelectedOfferProductIds] = useState<
    string[]
  >([]);
  const [savingOffers, setSavingOffers] = useState(false);
  const [saveOffersConfirmOpen, setSaveOffersConfirmOpen] = useState(false);

  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [deleteRuleConfirmOpen, setDeleteRuleConfirmOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState(false);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [deleteOfferConfirmOpen, setDeleteOfferConfirmOpen] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState(false);
  /** Local-only preview of how single / multiple picks look at checkout (not persisted). */
  const [previewByGroup, setPreviewByGroup] = useState<
    Record<string, string[]>
  >({});

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
    if (!selectedId) return;
    if (filterCategoryIds.length === 0) {
      setSelectedId('');
      return;
    }
    const p = allProducts.find((x) => x.id === selectedId);
    if (!p || !filterCategoryIds.includes(p.categoryId)) {
      setSelectedId('');
    }
  }, [filterCategoryIds, selectedId, allProducts]);

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
            (group) =>
              !item.attributeGroups.some((existing) => existing.id === group.id)
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
          axios.post<{
            data: NonNullable<MenuItemRow['offersFromThis']>[number];
          }>(`/api/restaurant/menu/items/${selected.id}/offers`, {
            offeredItemId: itemId,
            sortOrder: index,
          })
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
      toast.error(
        err.response?.data?.error || 'Could not add offered products'
      );
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
        attributeGroups: item.attributeGroups.filter(
          (g) => g.id !== deletingRuleId
        ),
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
    } catch {
      toast.error('Could not remove offered product');
    } finally {
      setDeletingOfferId(null);
      setDeleteOfferConfirmOpen(false);
      setDeletingOffer(false);
    }
  };

  const allOtherProductsExist = selected != null && linkedOptions.length > 0;

  return (
    <Card className="min-w-0 max-w-full">
      <CardHeader className="space-y-1.5 px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">
          Recommendations &amp; add-ons
        </CardTitle>
        <CardDescription className="text-pretty text-sm leading-relaxed">
          Use the filter (all categories on by default) and search, pick a
          product from the strip, then edit recommendations and offers. The
          guest preview appears beside this on large screens and below on small
          ones.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full space-y-6 px-4 pb-6 sm:px-6">
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
          <div className="min-w-0 max-w-full space-y-6 sm:space-y-8">
            <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-xl border border-border bg-muted/20 p-3 sm:space-y-4 sm:p-5">
              <div className="flex min-w-0 w-full max-w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
                <div className="relative min-h-10 min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search in selected categories…"
                    className="h-11 min-h-11 bg-background pl-9 text-base sm:h-10 sm:text-sm"
                    autoComplete="off"
                    enterKeyHint="search"
                    aria-label="Search products in filtered categories"
                  />
                </div>
                <Popover
                  open={categoryFilterOpen}
                  onOpenChange={setCategoryFilterOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 min-h-11 w-full shrink-0 gap-2 bg-background px-3 sm:h-10 sm:min-h-10 sm:w-auto sm:min-w-[10rem]"
                    >
                      <ListFilter className="h-4 w-4 shrink-0" />
                      <span className="shrink-0">Filter</span>
                      <Badge
                        variant="secondary"
                        className="min-w-0 max-w-[9rem] truncate font-normal sm:max-w-[140px]"
                      >
                        {activeCategoryFilterLabel}
                      </Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(calc(100vw-2rem),20rem)] p-0 sm:w-80"
                    align="end"
                    sideOffset={8}
                    collisionPadding={16}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                      <p className="text-sm font-medium">Categories</p>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setFilterCategoryIds(
                              localCategories.map((c) => c.id)
                            )
                          }
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setFilterCategoryIds([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[min(260px,40dvh)] sm:h-[min(280px,45vh)]">
                      <div className="flex flex-col gap-0.5 p-2">
                        {localCategories.map((cat) => {
                          const checked = filterCategoryIds.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className={cn(
                                'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent sm:min-h-10',
                                checked && 'bg-primary/10'
                              )}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 accent-primary"
                                checked={checked}
                                onChange={() =>
                                  setFilterCategoryIds((prev) =>
                                    toggleInArray(prev, cat.id)
                                  )
                                }
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {cat.name}
                              </span>
                              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                                {cat.items.length}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="border-t px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                      Search only applies to products in checked categories.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="min-w-0 w-full max-w-full min-h-0 overflow-x-clip">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Products
                  <span className="ml-1 hidden font-normal normal-case sm:inline">
                    · compact chips — use arrows or swipe
                  </span>
                  <span className="ml-1 font-normal normal-case sm:hidden">
                    · arrows or swipe
                  </span>
                </p>
                {filterCategoryIds.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-background/80 px-3 py-8 text-center text-sm text-muted-foreground sm:px-4">
                    Turn on at least one category in the filter, or tap{' '}
                    <span className="font-medium text-foreground">All</span>.
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-background/80 px-3 py-8 text-center text-sm text-muted-foreground sm:px-4">
                    No products match the checked categories and search. Adjust
                    the filter or clear the search.
                  </p>
                ) : (
                  <div className="relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border/60 bg-background/50">
                    <div className="grid w-full min-w-0 max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-1 py-1 sm:gap-2 sm:px-1.5 sm:py-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full border-border bg-background shadow-sm"
                        disabled={!productStripScroll.back}
                        aria-label="Scroll products back"
                        onClick={() => scrollProductStrip('back')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div
                        ref={productStripRef}
                        onScroll={syncProductStripScroll}
                        className="min-h-0 min-w-0 max-w-full touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        <div className="flex w-max items-center gap-2 py-0.5 pe-0.5 ps-0.5">
                          {filteredProducts.map((p) => {
                            const isActive = p.id === selectedId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedId(p.id)}
                                className={cn(
                                  'inline-flex h-9 max-w-[11rem] shrink-0 items-center gap-2 rounded-full border px-1.5 py-0.5 text-left text-sm font-medium shadow-sm outline-none ring-offset-background transition sm:max-w-[12.5rem]',
                                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  'active:scale-[0.98]',
                                  isActive
                                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'border-border bg-card hover:border-primary/45 hover:bg-primary/5'
                                )}
                              >
                                <span
                                  className={cn(
                                    'relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted',
                                    isActive &&
                                      'ring-2 ring-primary-foreground/35 ring-offset-1 ring-offset-primary'
                                  )}
                                >
                                  {p.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- dashboard menu URLs
                                    <img
                                      src={p.imageUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 truncate pr-1 leading-tight">
                                  {p.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full border-border bg-background shadow-sm"
                        disabled={!productStripScroll.forward}
                        aria-label="Scroll products forward"
                        onClick={() => scrollProductStrip('forward')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="grid min-w-0 max-w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,440px)]">
              <div className="min-w-0 w-full max-w-xl space-y-6 lg:mx-auto">
                {selected ? (
                  <Tabs defaultValue="recommendations" className="w-full">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1">
                      <TabsTrigger
                        value="recommendations"
                        className="text-xs sm:text-sm"
                      >
                        Recommendations
                      </TabsTrigger>
                      <TabsTrigger
                        value="offered"
                        className="text-xs sm:text-sm"
                      >
                        Offered products
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="recommendations"
                      className="space-y-3 rounded-lg border border-border p-3 sm:space-y-4 sm:p-4"
                    >
                      <h4 className="text-sm font-semibold">
                        Recommendation source categories
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Select one or more categories. Each selected category is
                        saved as a required/optional recommendation group for
                        this product. Categories already used for this product
                        cannot be assigned again.
                      </p>
                      {linkedOptions.length === 0 ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <p className="text-xs text-muted-foreground">
                            Create another category (e.g. Sauces) to use as
                            recommendation source.
                          </p>
                          <Button
                            type="button"
                            asChild
                            size="sm"
                            variant="secondary"
                            className="w-fit shrink-0"
                          >
                            <Link href="/categories">Go to Categories</Link>
                          </Button>
                        </div>
                      ) : assignableRuleCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Every other category is already assigned as a
                          recommendation for this product. Remove a rule in the
                          customer preview if you want to reuse a category.
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="grid w-full max-w-full gap-2 sm:w-auto">
                              <Label>Selection type</Label>
                              <Select
                                value={ruleSelectionType}
                                onValueChange={(v: 'SINGLE' | 'MULTIPLE') =>
                                  setRuleSelectionType(v)
                                }
                              >
                                <SelectTrigger className="h-11 w-full min-w-0 sm:h-10 sm:w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SINGLE">
                                    One option
                                  </SelectItem>
                                  <SelectItem value="MULTIPLE">
                                    Multiple options
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <label className="flex min-h-11 items-center gap-2 text-sm sm:min-h-10 sm:pb-1">
                              <input
                                type="checkbox"
                                checked={ruleRequired}
                                onChange={(e) =>
                                  setRuleRequired(e.target.checked)
                                }
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
                                    checked
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border'
                                  }`}
                                >
                                  <button
                                    onClick={() =>
                                      setRuleCategoryIds((prev) =>
                                        toggleInArray(prev, cat.id)
                                      )
                                    }
                                  >
                                    {cat.name}
                                  </button>
                                </label>
                              );
                            })}
                          </div>
                          <Button
                            type="button"
                            onClick={() => setSaveRulesConfirmOpen(true)}
                            disabled={
                              savingRules || ruleCategoryIds.length === 0
                            }
                            className="w-full"
                          >
                            {savingRules ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                Saving...
                              </>
                            ) : (
                              'Save Recommendation'
                            )}
                          </Button>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent
                      value="offered"
                      className="space-y-3 rounded-lg border border-border p-3 sm:space-y-4 sm:p-4"
                    >
                      <h4 className="text-sm font-semibold">
                        Offered products
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Choose categories first, then select multiple products
                        from those categories.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {linkedOptions.map((cat) => {
                          const checked = offerCategoryIds.includes(cat.id);
                          return (
                            <label
                              key={`offer-cat-${cat.id}`}
                              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                checked
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setOfferCategoryIds((prev) =>
                                    toggleInArray(prev, cat.id)
                                  );
                                  setSelectedOfferProductIds([]);
                                }}
                              >
                                {cat.name}
                              </button>
                            </label>
                          );
                        })}
                      </div>

                      {!allOtherProductsExist ? null : offerCategoryIds.length ===
                        0 ? (
                        <p className="text-sm text-muted-foreground">
                          Select at least one category to load products.
                        </p>
                      ) : offeredProductsFromSelectedCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No products found in selected categories (or already
                          offered).
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {offeredProductsFromSelectedCategories.map((p) => {
                            const checked = selectedOfferProductIds.includes(
                              p.id
                            );

                            return (
                              <label
                                key={`offer-product-${p.id}`}
                                className="group relative block cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={checked}
                                  onChange={() =>
                                    setSelectedOfferProductIds((prev) =>
                                      toggleInArray(prev, p.id)
                                    )
                                  }
                                />
                                <div
                                  className={cn(
                                    'flex h-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:border-primary/40 hover:shadow-md',
                                    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                                    checked
                                      ? 'border-primary ring-2 ring-primary/25'
                                      : 'border-border'
                                  )}
                                >
                                  <div className="relative aspect-[4/3] w-full shrink-0 bg-muted">
                                    {p.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={p.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                        No photo
                                      </div>
                                    )}
                                    <span
                                      className={cn(
                                        'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background/90 text-xs font-bold shadow-sm backdrop-blur-sm transition',
                                        checked
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-border text-transparent group-hover:border-primary/50'
                                      )}
                                      aria-hidden
                                    >
                                      ✓
                                    </span>
                                  </div>
                                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                                      {p.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {p.categoryName}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={() => setSaveOffersConfirmOpen(true)}
                        disabled={
                          savingOffers || selectedOfferProductIds.length === 0
                        }
                        className="w-full"
                      >
                        {savingOffers ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                            Saving...
                          </>
                        ) : (
                          'Save offered products'
                        )}
                      </Button>

                      {currentOffers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No offered products yet.
                        </p>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold">
                            Current offered products
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            These are the products that are currently offered
                            for this product.
                          </p>
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
                                  disabled={deletingOffer}
                                >
                                  {deletingOffer &&
                                  deletingOfferId === offer.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-10 text-center sm:px-6 sm:py-12">
                    <p className="text-sm font-medium text-foreground">
                      Select a product
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      Tap a card in the horizontal strip to configure
                      recommendations and offered products for that item.
                    </p>
                  </div>
                )}
              </div>

              <aside className="min-w-0 rounded-2xl border border-border bg-muted/25 p-1 lg:sticky lg:top-4 lg:max-h-[min(100dvh-8rem,calc(100dvh-10rem))] lg:overflow-y-auto">
                {!selected ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/80 p-6 text-center sm:min-h-[280px] sm:p-8">
                    <p className="text-sm font-medium text-foreground">
                      Customer preview
                    </p>
                    <p className="max-w-[min(100%,260px)] text-xs leading-relaxed text-muted-foreground">
                      Choose a product in the strip above to see how guests view
                      it when ordering online.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl bg-card p-3 shadow-sm sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Customer preview
                    </p>

                    <div className="overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">
                      {selected.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.imageUrl}
                          alt={selected.name}
                          className="aspect-[4/3] w-full object-cover sm:aspect-video lg:h-56 lg:max-h-[40vh]"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-sm text-muted-foreground sm:aspect-video lg:h-56">
                          No photo
                        </div>
                      )}
                      <div className="space-y-3 border-t border-border p-4">
                        <div>
                          <h3 className="text-xl font-bold uppercase leading-tight tracking-wide text-primary md:text-2xl">
                            {selected.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selected.categoryName}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-lg font-bold tabular-nums text-primary">
                            €
                            {effectiveUnitPrice(
                              selected.price,
                              selected.salePrice
                            ).toFixed(2)}
                          </p>
                          {selected.description?.trim() ? (
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {selected.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Recommended add-ons
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Matches your storefront customize step. Choices here are
                        preview only (not saved to a cart).
                      </p>
                    </div>

                    {selected.attributeGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No add-on groups yet. Link categories in the
                        Recommendations tab, then save.
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
                              className="rounded-lg border border-border bg-background p-4 text-foreground shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Label className="text-sm font-semibold">
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
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] uppercase"
                                    >
                                      {g.selectionType === 'SINGLE'
                                        ? 'Single'
                                        : 'Multiple'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    From {g.linkedCategory.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
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
                                  disabled={deletingRule}
                                  aria-label="Remove rule"
                                >
                                  {deletingRule && deletingRuleId === g.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="mt-4">
                                {items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
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
                                    <SelectTrigger className="h-auto min-h-11 border-input bg-background py-2">
                                      {(() => {
                                        const it = items.find(
                                          (x) => x.id === singleValue
                                        );
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
                                                className="h-9 w-9 shrink-0 rounded-md border border-border object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                                                —
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <p className="truncate text-sm font-medium">
                                                {it.name}
                                              </p>
                                              <p className="truncate text-xs text-muted-foreground">
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
                                              <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
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
                                      const checked = previewIds.includes(
                                        it.id
                                      );
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
                                              : 'border-border bg-card hover:bg-muted/50'
                                          )}
                                        >
                                          {it.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={it.imageUrl}
                                              alt=""
                                              className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                                              —
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                              {it.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
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
                )}
              </aside>
            </div>
          </div>
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
