'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Sub = {
  id: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  notes: string | null;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
  subscription: Sub;
  onSaved: () => void;
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SubscriptionEditDialog({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  subscription,
  onSaved,
}: Props) {
  const [plan, setPlan] = useState('STARTER');
  const [status, setStatus] = useState('TRIAL');
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlan(subscription?.plan ?? 'STARTER');
    setStatus(subscription?.status ?? 'TRIAL');
    setTrialEndsAt(toLocalInput(subscription?.trialEndsAt ?? null));
    setCurrentPeriodEnd(toLocalInput(subscription?.currentPeriodEnd ?? null));
    setNotes(subscription?.notes ?? '');
  }, [open, subscription]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/subscriptions/${restaurantId}`, {
        plan,
        status,
        trialEndsAt: trialEndsAt || null,
        currentPeriodEnd: currentPeriodEnd || null,
        notes: notes.trim() || null,
      });
      toast.success('Subscription updated');
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      toast.error('Could not save subscription');
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscription — {restaurantName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="SCALE">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past due</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Trial ends</Label>
            <Input
              type="datetime-local"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Current period ends</Label>
            <Input
              type="datetime-local"
              value={currentPeriodEnd}
              onChange={(e) => setCurrentPeriodEnd(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <textarea
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
