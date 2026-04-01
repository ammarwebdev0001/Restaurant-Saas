'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link2, Trash2 } from 'lucide-react';

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

import type { MenuCategoryRow } from './types';

type Props = {
  categories: MenuCategoryRow[];
  onRefresh: () => Promise<void>;
};

export function RecommendationsTab({ categories, onRefresh }: Props) {
  const allProducts = useMemo(
    () =>
      categories.flatMap((c) =>
        c.items.map((i) => ({ ...i, categoryName: c.name }))
      ),
    [categories]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const selected = useMemo(
    () => allProducts.find((p) => p.id === selectedId) ?? null,
    [allProducts, selectedId]
  );

  const [attrOpen, setAttrOpen] = useState(false);
  const [attrForm, setAttrForm] = useState({
    name: '',
    selectionType: 'SINGLE' as 'SINGLE' | 'MULTIPLE',
    required: false,
    linkedCategoryId: '',
  });

  const openAddRule = () => {
    if (!selected) {
      toast.error('Select a product first.');
      return;
    }
    setAttrForm({
      name: '',
      selectionType: 'SINGLE',
      required: false,
      linkedCategoryId: '',
    });
    setAttrOpen(true);
  };

  const saveRule = async () => {
    if (!selected || !attrForm.name.trim() || !attrForm.linkedCategoryId) {
      toast.error('Label and linked category are required.');
      return;
    }
    try {
      await axios.post(`/api/restaurant/menu/items/${selected.id}/attributes`, {
        name: attrForm.name.trim(),
        selectionType: attrForm.selectionType,
        required: attrForm.required,
        linkedCategoryId: attrForm.linkedCategoryId,
      });
      toast.success('Recommendation rule added');
      setAttrOpen(false);
      await onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Could not save');
    }
  };

  const deleteRule = async (groupId: string) => {
    if (!confirm('Remove this add-on rule?')) return;
    try {
      await axios.delete(`/api/restaurant/menu/attributes/${groupId}`);
      toast.success('Removed');
      await onRefresh();
    } catch {
      toast.error('Could not remove');
    }
  };

  const linkedOptions = categories.filter((c) => c.id !== selected?.categoryId);

  const allOtherProducts =
    selected == null
      ? []
      : allProducts.filter((p) => p.id !== selected.id);

  const currentOffers = selected?.offersFromThis ?? [];
  const [offerTargetId, setOfferTargetId] = useState<string>('');

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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={openAddRule}
                    disabled={linkedOptions.length === 0}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Add rule
                  </Button>
                  {linkedOptions.length === 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <p className="text-xs text-muted-foreground">
                        Create another category (e.g. Sauces) to use as add-on
                        source.
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
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">
                    Rules for “{selected.name}”
                  </h4>
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
                            onClick={() => void deleteRule(g.id)}
                            aria-label="Remove rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold">
                    Offered products for “{selected.name}”
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="grid gap-2 max-w-xs">
                      <Label>Product to offer</Label>
                      <Select
                        value={offerTargetId}
                        onValueChange={setOfferTargetId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a product to offer" />
                        </SelectTrigger>
                        <SelectContent>
                          {allOtherProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.categoryName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      disabled={!offerTargetId}
                      onClick={async () => {
                        if (!selected || !offerTargetId) return;
                        try {
                          await axios.post(
                            `/api/restaurant/menu/items/${selected.id}/offers`,
                            { offeredItemId: offerTargetId }
                          );
                          toast.success('Offered product added');
                          setOfferTargetId('');
                          await onRefresh();
                        } catch (e: unknown) {
                          const err = e as {
                            response?: { data?: { error?: string } };
                          };
                          toast.error(
                            err.response?.data?.error || 'Could not add offer'
                          );
                        }
                      }}
                    >
                      Add offered product
                    </Button>
                  </div>

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
                            onClick={async () => {
                              if (
                                !confirm(
                                  'Remove this offered product from this item?'
                                )
                              )
                                return;
                              try {
                                await axios.delete(
                                  `/api/restaurant/menu/offers/${offer.id}`
                                );
                                toast.success('Removed offered product');
                                await onRefresh();
                              } catch {
                                toast.error('Could not remove offered product');
                              }
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

      <Dialog open={attrOpen} onOpenChange={setAttrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New add-on rule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Guests will choose from products in the linked category (must differ
            from this product&apos;s category).
          </p>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Label shown to guest</Label>
              <Input
                placeholder="e.g. Choose a sauce"
                value={attrForm.name}
                onChange={(e) =>
                  setAttrForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Selection</Label>
              <Select
                value={attrForm.selectionType}
                onValueChange={(v: 'SINGLE' | 'MULTIPLE') =>
                  setAttrForm((f) => ({ ...f, selectionType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">One option</SelectItem>
                  <SelectItem value="MULTIPLE">Multiple options</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={attrForm.required}
                onChange={(e) =>
                  setAttrForm((f) => ({ ...f, required: e.target.checked }))
                }
              />
              Required before adding to cart
            </label>
            <div className="grid gap-2">
              <Label>Linked category (add-on products)</Label>
              <Select
                value={attrForm.linkedCategoryId}
                onValueChange={(v) =>
                  setAttrForm((f) => ({ ...f, linkedCategoryId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {linkedOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttrOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveRule()}>
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
