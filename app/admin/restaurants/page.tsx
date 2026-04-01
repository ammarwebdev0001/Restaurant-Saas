'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Row = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  logoUrl: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string | null };
  subscription: {
    plan: string;
    status: string;
  } | null;
  _count: { orders: number; menuItems: number };
};

export default function AdminRestaurantsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/admin/restaurants')
      .then((r) => setRows(r.data.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading restaurants…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Restaurants</h1>
        <p className="text-sm text-muted-foreground">All tenant restaurants and owners.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Subdomain, owner, and catalog size.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Menu items</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 text-xs">{r.subdomain}</code>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {r.owner.email ?? r.owner.name}
                  </TableCell>
                  <TableCell>
                    {r.subscription ? (
                      <Badge variant="secondary">{r.subscription.plan}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{r._count.menuItems}</TableCell>
                  <TableCell className="text-right">{r._count.orders}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(r.createdAt), 'MMM d, yyyy')}
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
    </div>
  );
}
