'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil } from 'lucide-react';

import { SubscriptionEditDialog } from '@/components/admin/subscription-edit-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Subscription = {
  id: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  notes: string | null;
} | null;

type Row = {
  id: string;
  name: string;
  subdomain: string;
  owner: { email: string | null };
  subscription: Subscription;
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Row | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get('/api/admin/restaurants')
      .then((r) => setRows(r.data.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Plans and billing status per restaurant.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans &amp; status</CardTitle>
          <CardDescription>Edit trial windows and plan tiers for each tenant.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 text-xs">{r.subdomain}</code>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {r.owner.email ?? '—'}
                  </TableCell>
                  <TableCell>
                    {r.subscription ? (
                      <Badge variant="outline">{r.subscription.plan}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.subscription ? (
                      <Badge
                        variant={
                          r.subscription.status === 'ACTIVE'
                            ? 'default'
                            : r.subscription.status === 'TRIAL'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {r.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="icon" variant="outline" onClick={() => setEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No restaurants yet.</p>
          )}
        </CardContent>
      </Card>

      {edit && (
        <SubscriptionEditDialog
          open={!!edit}
          onOpenChange={(o) => {
            if (!o) setEdit(null);
          }}
          restaurantId={edit.id}
          restaurantName={edit.name}
          subscription={edit.subscription}
          onSaved={load}
        />
      )}
    </div>
  );
}
