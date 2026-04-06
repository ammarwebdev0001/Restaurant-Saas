'use client';

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
    return (
      <p className="text-sm text-muted-foreground">Loading menu…</p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
    );
  }
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No menu published for this restaurant yet. Run{' '}
        <code className="rounded bg-muted px-1">npx prisma db seed</code> to
        load the demo data.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-foreground">Menu</h2>
      {categories.map((cat) => (
        <section key={cat.id} className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {cat.name}
          </h3>
          <ul className="space-y-4">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {item.salePrice != null && item.salePrice < item.price ? (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          €{item.price.toFixed(2)}
                        </span>
                        <p className="font-semibold text-primary">
                          €{item.salePrice.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold">€{item.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {item.attributeGroups && item.attributeGroups.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {item.attributeGroups.map((g) => (
                      <div key={g.id}>
                        <p className="text-xs font-medium text-muted-foreground">
                          {g.name}{' '}
                          <span className="font-normal">
                            ({g.selectionType === 'MULTIPLE' ? 'multi' : 'one'}
                            {g.required ? ', required' : ''})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Suggested add-ons
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                      {item.offersFromThis.map((o) => (
                        <li key={o.sortOrder}>
                          {o.offeredItem.name}{' '}
                          <span className="text-muted-foreground">
                            €
                            {(
                              o.offeredItem.salePrice ?? o.offeredItem.price
                            ).toFixed(2)}
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
