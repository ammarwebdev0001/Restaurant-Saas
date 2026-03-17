'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  IconChevronRight,
  IconHeart,
  IconMapPin,
  IconMenu2,
  IconShoppingBag,
  IconTruck,
} from '@tabler/icons-react';

type Store = {
  id: string;
  name: string;
  address: string;
  collectionFrom: string;
  isFavorite?: boolean;
};

const stores: Store[] = [
  {
    id: 'arles',
    name: 'Enjoy Tacos - Arles',
    address: '14 Boulevard des Lices, 13200 Arles',
    collectionFrom: '3:00 PM',
    isFavorite: true,
  },
  {
    id: 'aubagne',
    name: 'Enjoy Tacos - Aubagne',
    address: '26 Cr Voltaire, 13400 Aubagne',
    collectionFrom: '3:00 PM',
  },
  {
    id: 'beziers',
    name: 'Enjoy Tacos - Béziers 1',
    address: 'Place Jean Jaurès, 34500 Béziers',
    collectionFrom: '3:00 PM',
  },
];

export default function CustomerLandingPage() {
  const [mode, setMode] = useState<'delivery' | 'takeaway'>('delivery');
  const [address, setAddress] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const activeStores = useMemo(() => stores, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-primary/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center border justify-center rounded-full bg-primary/20 text-xl font-bold text-primary-foreground ring-1 ring-primary/20">
              E
            </span>
            <span className="text-lg font-semibold tracking-wide text-primary-foreground">Enjoy Tacos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground/80">javi</span>
            <Button variant="outline" size="sm" className="rounded-full">
              <IconMenu2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-[1.75fr,1fr]">
        {/* Hero section */}
        <section className="relative flex flex-col overflow-hidden rounded-3xl p-10 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,211,77,0.3),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(226,97,209,0.2),transparent_60%)]" />
          <div className="relative z-10 flex flex-1 flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary-foreground ring-1 ring-primary/20">
                      E
                    </span>
                    <span className="text-lg font-semibold tracking-wide text-foreground">Enjoy Tacos</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Sundae ou tacos sucré à 2€</p>
                </div>
                <Button variant="secondary" size="sm" className="rounded-full">
                  MENU
                </Button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-8 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  sundae ou tacos sucré
                </p>
                <div className="mt-4 flex items-end gap-4">
                  <p className="text-6xl font-black leading-none tracking-tight text-foreground md:text-7xl">
                    À <span className="text-9xl text-primary">2</span>€
                  </p>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  À l'achat d'un menu tacos, frite, boisson
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Petits plaisirs
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Profitez des meilleures offres disponibles en magasin. Consultez les restaurants à proximité et commandez en quelques clics.
                </p>
              </div>
            </div>

            <footer className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Take advantage of the best offers
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-foreground">
                    App Store
                  </Button>
                  <Button variant="outline" size="sm" className="text-foreground">
                    Google Play
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Powered by <span className="text-foreground">Belorder</span>
              </div>
            </footer>
          </div>
        </section>

        {/* Sidebar */}
        <section className="md:sticky md:top-20 md:self-start md:z-50 flex flex-col gap-6 bg-white/80 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    J
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Hi Javi</p>
                    <p className="text-xs text-muted-foreground">Bienvenue dans l'app</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  <IconMenu2 className="h-4 w-4" />
                </Button>
              </div>
          <Card className="rounded-3xl bg-card shadow-xl border border-purple-500">
            <CardHeader>
              
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-muted-foreground">Mardi Mouise</p>
                <p className="text-lg font-bold text-foreground">5€ de réduction sur ton menu</p>
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-primary/10 p-4">
                <IconShoppingBag className="h-8 w-8 text-primary-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card shadow-xl">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant={mode === 'delivery' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    mode === 'delivery'
                      ? 'bg-primary/20 text-primary-foreground'
                      : 'text-foreground/80'
                  }
                  onClick={() => setMode('delivery')}
                >
                  <IconTruck className="mr-2 h-4 w-4" />
                  Delivery
                </Button>
                <Button
                  variant={mode === 'takeaway' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    mode === 'takeaway'
                      ? 'bg-primary/20 text-primary-foreground'
                      : 'text-foreground/80'
                  }
                  onClick={() => setMode('takeaway')}
                >
                  <IconShoppingBag className="mr-2 h-4 w-4" />
                  Take away
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select a {mode === 'delivery' ? 'delivery' : 'pickup'} address
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add your address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="bg-card text-foreground placeholder:text-muted-foreground rounded-2xl"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <IconMapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {activeStores.map((store) => (
                  <div
                    key={store.id}
                    className={
                      `flex items-start justify-between rounded-3xl border bg-card p-4 transition ${
                        selectedStoreId === store.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`
                    }
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Order collection from {store.collectionFrom}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant={selectedStoreId === store.id ? 'default' : 'outline'}
                        size="sm"
                        className={
                          selectedStoreId === store.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground/80'
                        }
                        onClick={() => setSelectedStoreId(store.id)}
                      >
                        {selectedStoreId === store.id ? 'Selected' : 'Select'}
                        <IconChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconHeart className="h-3.5 w-3.5 text-primary" />
                        {store.isFavorite ? 'Favorite' : 'Add to favorites'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border bg-secondary px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>General Terms and Conditions of Sale</li>
              <li>General Terms of Use</li>
              <li>Cookie Policy</li>
              <li>Privacy Policy</li>
              <li>Legal notice</li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Take advantage of the best offers</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="text-foreground">
                App Store
              </Button>
              <Button variant="outline" size="sm" className="text-foreground">
                Google Play
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Powered by <span className="text-foreground">Belorder</span>
            </p>
            <p>Enjoy Tacos v2.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
 