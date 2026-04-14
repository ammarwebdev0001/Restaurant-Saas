import ErrorBoundary from '@/components/toaster/toaster';
import { KdsManagerBoard } from '@/components/kds/kds-manager-board';

export default function KdsManagerPage() {
  return (
    <div className="w-full">
      <ErrorBoundary>
        <KdsManagerBoard />
      </ErrorBoundary>
    </div>
  );
}
