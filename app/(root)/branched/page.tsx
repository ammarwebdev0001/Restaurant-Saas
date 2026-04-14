import ErrorBoundary from '@/components/toaster/toaster';
import { BranchedPage } from '@/components/branched/branched-page';

export default function BranchedRoutePage() {
  return (
    <div className="w-full">
      <ErrorBoundary>
        <BranchedPage />
      </ErrorBoundary>
    </div>
  );
}
