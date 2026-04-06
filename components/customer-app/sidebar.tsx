import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

const mockAttributeCategories = [
  {
    name: 'Build-your-own tacos NEW',
    required: true,
  },
  {
    name: 'New drink',
    required: true,
  },
  {
    name: 'Extra sauces',
    required: false,
  },
];

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

type SidebarProps = {
  mode: 'delivery' | 'takeaway';
  setMode: (mode: 'delivery' | 'takeaway') => void;
  deliveryAddress: string;
  setDeliveryAddress: (value: string) => void;
  apartmentDoorNumber: string;
  setApartmentDoorNumber: (value: string) => void;
  gateCode: string;
  setGateCode: (value: string) => void;
  addressName: string;
  setAddressName: (value: string) => void;
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  /** When set (e.g. `/web-app/{slug}`), order flow loads menu via `restaurantSlug` query. */
  restaurantSlug?: string;
};

export function Sidebar({
  mode,
  setMode,
  deliveryAddress,
  setDeliveryAddress,
  apartmentDoorNumber,
  setApartmentDoorNumber,
  gateCode,
  setGateCode,
  addressName,
  setAddressName,
  selectedStoreId,
  setSelectedStoreId,
  restaurantSlug,
}: SidebarProps) {
  const activeStores = useMemo(() => stores, []);

  const createOrder = () => {
    const orderId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : `id${Date.now().toString(16)}`;

    const selectedStore = activeStores.find((s) => s.id === selectedStoreId);

    const paramsObj: Record<string, string> = {
      mode,
      storeId: selectedStoreId || '',
      storeName: selectedStore?.name || '',
      storeAddress: selectedStore?.address || '',
      address: deliveryAddress,
      apartment: apartmentDoorNumber,
      gateCode,
      addressName,
    };
    if (restaurantSlug?.trim()) {
      paramsObj.restaurantSlug = restaurantSlug.trim();
    }
    const params = new URLSearchParams(paramsObj).toString();

    const path =
      mode === 'delivery'
        ? `/order/delivery/${orderId}?${params}`
        : `/order/pickUp/${orderId}?${params}`;

    window.location.href = path;
  };

  return (
    <section className="md:sticky md:top-20 md:self-start md:z-50 flex flex-col gap-6 bg-foreground rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            J
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Hi Javi</p>
            <p className="text-xs text-muted-foreground dark:text-black/80">
              Welcome to the app
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full">
          <IconMenu2 className="h-4 w-4" />
        </Button>
      </div>
      <Card className="rounded-3xl bg-card shadow-xl border border-primary">
        <CardHeader></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Tuesday Treat
            </p>
            <p className="text-lg font-bold text-foreground">
              €5 off your menu
            </p>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-primary/10 p-4">
            <IconShoppingBag className="h-8 w-8 text-primary-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl bg-card shadow-xl overflow-hidden border border-primary">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 py-5">
            <Button
              variant={mode === 'delivery' ? 'default' : 'outline'}
              onClick={() => setMode('delivery')}
            >
              <IconTruck className="mr-2" />
              Delivery
            </Button>
            <Button
              variant={mode === 'takeaway' ? 'default' : 'outline'}
              onClick={() => setMode('takeaway')}
            >
              <IconShoppingBag className="mr-2" />
              Take Away
            </Button>
          </div>

          {mode === 'delivery' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery address
              </p>
              <Input
                placeholder="Your Address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                className="bg-card text-foreground placeholder:text-muted-foreground rounded-2xl"
              />
              <Input
                placeholder="Your Name"
                value={addressName}
                onChange={(event) => setAddressName(event.target.value)}
                className="bg-card text-foreground placeholder:text-muted-foreground rounded-2xl"
              />
              <Input
                placeholder="Apartment or door number"
                value={apartmentDoorNumber}
                onChange={(event) => setApartmentDoorNumber(event.target.value)}
                className="bg-card text-foreground placeholder:text-muted-foreground rounded-2xl"
              />
              <Input
                placeholder="Gate code, intercom..."
                value={gateCode}
                onChange={(event) => setGateCode(event.target.value)}
                className="bg-card text-foreground placeholder:text-muted-foreground rounded-2xl"
              />

              <p className="text-xs text-muted-foreground">
                This information will be used to identify your order and contact
                you if necessary.
              </p>
              <Button
                className="w-full"
                onClick={createOrder}
                disabled={!deliveryAddress}
              >
                Proceed Order
              </Button>
            </div>
          )}

          {mode === 'takeaway' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Select a store (scroll if needed)
              </p>
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {activeStores.map((store) => (
                  <div
                    key={store.id}
                    className={`flex items-start justify-between rounded-3xl border bg-card p-4 transition ${
                      selectedStoreId === store.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {store.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {store.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order collection from {store.collectionFrom}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant={
                          selectedStoreId === store.id ? 'default' : 'outline'
                        }
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
              <Button
                className="w-full"
                onClick={createOrder}
                disabled={!selectedStoreId}
              >
                Proceed Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
