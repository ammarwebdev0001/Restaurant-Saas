'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type MenuItemLite = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  attributeGroups?: {
    id: string;
    name: string;
    selectionType: string;
    required: boolean;
    minItems?: number | null;
    maxItems?: number | null;
    linkedCategory: {
      name: string;
      items: { id: string; name: string; price: number }[];
    };
  }[];
  offersFromThis?: {
    sortOrder: number;
    offeredItem: {
      name: string;
      price: number;
      salePrice?: number | null;
    };
  }[];
};

type CategoryLite = {
  id: string;
  name: string;
  items: MenuItemLite[];
};

export function StoreMenu({ slug }: { slug: string }) {
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/customer/menu?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error ?? 'Failed to load menu');
        }
        const menus = json?.data?.menus ?? [];
        if (!cancelled) {
          setCategories(menus);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load menu');
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <Loader2 className="animate-spin text-primary text-center mx-auto" />;
  }
  if (error) {
    return <AlertCircle className="text-destructive text-center mx-auto" />;
  }
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        No menu published for this restaurant yet. Run{' '}
        <code className="rounded bg-[#f1f5f9] px-1 text-[#0f172a]">npx prisma db seed</code> to
        load the demo data.
      </p>
    );
  }

  return (
    <div className="space-y-8 text-[#0f172a]">
      <h2 className="text-lg font-semibold text-[#0f172a]">Menu</h2>
      {categories.map((cat) => (
        <section key={cat.id} className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[#64748b]">
            {cat.name}
          </h3>
          <ul className="space-y-4">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[#e2e8f0] bg-white/95 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#0f172a]">{item.name}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-[#64748b]">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {item.salePrice != null && item.salePrice < item.price ? (
                      <>
                        <span className="text-sm text-[#94a3b8] line-through">
                          €{item.price.toFixed(2)}
                        </span>
                        <p className="font-semibold text-primary">
                          €{item.salePrice.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-[#0f172a]">€{item.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {item.attributeGroups && item.attributeGroups.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-[#e2e8f0] pt-3">
                    {item.attributeGroups.map((g) => (
                      <div key={g.id}>
                        <p className="text-xs font-medium text-[#64748b]">
                          {g.name}{' '}
                          <span className="font-normal">
                            ({g.selectionType === 'MULTIPLE' ? 'multi' : 'one'}
                            {g.required ? ', required' : ''}
                            {g.selectionType === 'MULTIPLE' &&
                            g.minItems != null &&
                            g.maxItems != null
                              ? `, ${g.minItems}–${g.maxItems} items`
                              : g.selectionType === 'MULTIPLE' && g.minItems != null
                                ? `, min ${g.minItems}`
                                : g.selectionType === 'MULTIPLE' &&
                                    g.maxItems != null
                                  ? `, max ${g.maxItems}`
                                  : ''}
                            )
                          </span>
                        </p>
                        <p className="text-xs text-[#64748b]">
                          Options from “{g.linkedCategory.name}”:{' '}
                          {g.linkedCategory.items
                            .map((o) => `${o.name} (€${o.price.toFixed(2)})`)
                            .join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {item.offersFromThis && item.offersFromThis.length > 0 ? (
                  <div className="mt-3 border-t border-[#e2e8f0] pt-3">
                    <p className="text-xs font-medium text-[#64748b]">Suggested add-ons</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-[#0f172a]">
                      {item.offersFromThis.map((o) => (
                        <li key={o.sortOrder}>
                          {o.offeredItem.name}{' '}
                          <span className="text-[#64748b]">
                            €
                            {(o.offeredItem.salePrice ?? o.offeredItem.price).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
