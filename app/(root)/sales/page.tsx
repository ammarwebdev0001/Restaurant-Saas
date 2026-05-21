import React from 'react';
import { Orders } from '@/components/order/demo';
import ErrorBoundary from '@/components/toaster/toaster';

const page = () => {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <ErrorBoundary>  
        <Orders />
      </ErrorBoundary>
    </div>
  );
};

export default page;
