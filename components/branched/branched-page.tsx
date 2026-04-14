'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
};

export function BranchedPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get<{ data: BranchRow[] }>('/api/restaurant/branches');
        setBranches(res.data.data ?? []);
      } catch {
        setBranches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branched</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading branches...</p>
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No branches found yet. Add branches during onboarding or restaurant setup.
          </p>
        ) : (
          branches.map((b, index) => (
            <div key={b.id} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">
                {index + 1}. {b.name}
              </p>
              <p className="text-xs text-muted-foreground">{b.address || 'No address'}</p>
              <p className="text-xs text-muted-foreground">{b.phone || 'No phone'}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
