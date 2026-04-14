import ErrorBoundary from '@/components/toaster/toaster';
import { PosScreen } from '@/components/pos/pos-screen';

export default function PosPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ErrorBoundary>
        <PosScreen />
      </ErrorBoundary>
    </div>
  );
}
