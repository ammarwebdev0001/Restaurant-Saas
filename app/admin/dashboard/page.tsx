'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, CreditCard, FlaskConical } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Overview = {
  restaurantCount: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/admin/overview')
      .then((r) => setData(r.data.data))
      .catch(() => setError('Could not load overview'));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading overview…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Restaurants and subscription health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.restaurantCount}</div>
            <p className="text-xs text-muted-foreground">Total onboarded tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying or active plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.trialSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Restaurants in trial</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
