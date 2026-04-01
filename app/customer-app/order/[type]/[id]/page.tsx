import { notFound } from 'next/navigation';
import OrderPageClient from '@/components/order/order-page';

type OrderSummaryProps = {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function OrderSummaryPage({ params, searchParams }: OrderSummaryProps) {
  const { type: typeParam, id: orderId } = await params;
  const searchParamsResolved = await searchParams;

  const mode =
    typeParam === 'pickUp' || typeParam.toLowerCase() === 'pickup'
      ? 'pickUp'
      : typeParam === 'delivery'
        ? 'delivery'
        : null;

  if (mode !== 'delivery' && mode !== 'pickUp') {
    notFound();
  }

  const orderType = mode === 'pickUp' ? 'pickUp' : 'delivery';

  const orderInfo = {
    mode: orderType as 'delivery' | 'pickUp',
    storeId: Array.isArray(searchParamsResolved.storeId)
      ? searchParamsResolved.storeId[0]
      : searchParamsResolved.storeId || '',
    storeName: Array.isArray(searchParamsResolved.storeName)
      ? searchParamsResolved.storeName[0]
      : searchParamsResolved.storeName || '',
    storeAddress: Array.isArray(searchParamsResolved.storeAddress)
      ? searchParamsResolved.storeAddress[0]
      : searchParamsResolved.storeAddress || '',
    address: Array.isArray(searchParamsResolved.address)
      ? searchParamsResolved.address[0]
      : searchParamsResolved.address || '',
    apartment: Array.isArray(searchParamsResolved.apartment)
      ? searchParamsResolved.apartment[0]
      : searchParamsResolved.apartment || '',
    gateCode: Array.isArray(searchParamsResolved.gateCode)
      ? searchParamsResolved.gateCode[0]
      : searchParamsResolved.gateCode || '',
    addressName: Array.isArray(searchParamsResolved.addressName)
      ? searchParamsResolved.addressName[0]
      : searchParamsResolved.addressName || '',
  };

  return <OrderPageClient orderType={orderType} orderId={orderId} orderInfo={orderInfo} />;
}
