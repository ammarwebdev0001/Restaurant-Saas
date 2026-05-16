'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import {
  ProductFormFields,
  buildProductPayload,
  isProductCreateFormDirty,
  isProductFormValid,
  type ProductFormState,
  type VariationFormRow,
} from '@/components/dashboard/menu-manager/product-form-fields';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';
import ErrorBoundary from '@/components/toaster/toaster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SaveConfirmation } from '@/components/ui/confirmation-dialogs';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';

export default function ProductCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, categories } = useRestaurantMenu();
  const [saving, setSaving] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>({
    name: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    price: '',
    salePrice: '',
  });
  const [variationRows, setVariationRows] = useState<VariationFormRow[]>([]);

  const resolvedCategoryId =
    form.categoryId || "";

  const isDirty = useMemo(
    () =>
      isProductCreateFormDirty(
        { ...form, categoryId: resolvedCategoryId },
        variationRows
      ),
    [form, resolvedCategoryId, variationRows]
  );

  const canCreate = useMemo(
    () =>
      isProductFormValid(
        { ...form, categoryId: resolvedCategoryId },
        variationRows
      ),
    [form, resolvedCategoryId, variationRows]
  );

  const {
    leaveOpen,
    leaveMessage,
    requestLeave,
    confirmLeave,
    cancelLeave,
    allowNextNavigation,
  } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!isDirty) return;

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest(
        'a[href]'
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return;
      }

      let path = href;
      if (href.startsWith('http')) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
          path = url.pathname + url.search + url.hash;
        } catch {
          return;
        }
      }

      if (path === pathname || path.startsWith(`${pathname}?`)) return;

      e.preventDefault();
      e.stopPropagation();
      requestLeave(() => router.push(path));
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isDirty, pathname, requestLeave, router]);

  const goToProducts = () => requestLeave(() => router.push('/product'));

  const save = async () => {
    const payload = buildProductPayload(
      { ...form, categoryId: resolvedCategoryId },
      variationRows
    );
    if (!payload.ok) {
      toast.error(payload.error);
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/restaurant/menu/items', payload.body);
      toast.success('Product created');
      allowNextNavigation();
      router.push('/product');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      toast.error(
        typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Could not create product'
      );
    } finally {
      setSaving(false);
      setSaveConfirmOpen(false);
    }
  };

  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Add product"
          description="Create a menu item with photo, category, pricing, and optional variations."
          loading={loading}
        >
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <p className="text-sm text-muted-foreground">
                  Create at least one category before adding products.
                </p>
                <Button type="button" asChild className="w-fit">
                  <Link href="/categories">Go to Categories</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-lg">Product details</CardTitle>
                <Button type="button" variant="outline" onClick={goToProducts}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to products
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProductFormFields
                  categories={categories}
                  form={{ ...form, categoryId: resolvedCategoryId }}
                  onFormChange={(patch) =>
                    setForm((f) => ({ ...f, ...patch }))
                  }
                  variationRows={variationRows}
                  onVariationRowsChange={setVariationRows}
                  showRequired
                />
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    disabled={saving || !canCreate}
                    onClick={() => setSaveConfirmOpen(true)}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create product'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={goToProducts}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </MenuPageShell>

        <AlertDialog
          open={leaveOpen}
          onOpenChange={(open) => {
            if (!open) cancelLeave();
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
              <AlertDialogDescription>{leaveMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Keep editing</AlertDialogCancel>
              <AlertDialogAction type="button" onClick={confirmLeave}>
                Leave without saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SaveConfirmation
          open={saveConfirmOpen}
          title="Create product"
          description="Save this new product to your menu?"
          itemName={form.name.trim() || 'New product'}
          loading={saving}
          onConfirm={() => void save()}
          onCancel={() => setSaveConfirmOpen(false)}
        />
      </ErrorBoundary>
    </div>
  );
}
