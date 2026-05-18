'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Trash2, UserPlus } from 'lucide-react';

import { RESTAURANT_ROLE_SLUG } from '@/lib/restaurant-roles';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type RoleOption = { id: string; name: string; slug?: string | null };

type EmployeeRow = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  role: { id: string; name: string; slug?: string | null };
  isOwner: boolean;
};

type PendingInvite = {
  id: string;
  email: string;
  role: { id: string; name: string };
  expiresAt: string;
};

type RestaurantUsersCardProps = {
  roleBasedSettingsAllowed?: boolean;
};

export default function RestaurantUsersCard({
  roleBasedSettingsAllowed = true,
}: RestaurantUsersCardProps) {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);

  const loadAssignableRoles = useCallback(async () => {
    const res = await axios.get<{ roles: RoleOption[] }>(
      '/api/restaurant/roles'
    );
    const all = res.data.roles ?? [];
    const list = !roleBasedSettingsAllowed
      ? all.filter((r) => r.slug === RESTAURANT_ROLE_SLUG.ADMIN)
      : all.filter(
          (r) =>
            r.slug !== RESTAURANT_ROLE_SLUG.ADMIN &&
            r.slug !== RESTAURANT_ROLE_SLUG.OWNER
        );
    setRoles(list);
    setRoleId((prev) => {
      if (prev && list.some((r) => r.id === prev)) return prev;
      return list[0]?.id ?? '';
    });
  }, [roleBasedSettingsAllowed]);

  const fetchAll = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setLoading(true);
    try {
      const [empRes] = await Promise.all([
        axios.get<{
          employees: EmployeeRow[];
          pendingInvites: PendingInvite[];
        }>('/api/restaurant/employees'),
        loadAssignableRoles(),
      ]);
      setEmployees(empRes.data.employees ?? []);
      setPendingInvites(empRes.data.pendingInvites ?? []);
    } catch (e: any) {
      toast.error(
        e.response?.data?.error ?? e.message ?? 'Failed to load team members.'
      );
      setEmployees([]);
      setPendingInvites([]);
    } finally {
      setLoading(false);
    }
  }, [loadAssignableRoles]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function handleAdd() {
    const e = email.trim().toLowerCase();
    if (!e) {
      toast.error('Enter an email address.');
      return;
    }
    if (!roleId) {
      toast.error('Select a role.');
      return;
    }
    if (password.length < 8) {
      toast.error(
        'Password must be at least 8 characters (used for new accounts).'
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password and confirmation do not match.');
      return;
    }
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: {
        email: string;
        roleId: string;
        password: string;
        name?: string;
      } = {
        email: e,
        roleId,
        password,
      };
      const nm = name.trim();
      if (nm.length >= 2) {
        payload.name = nm;
      }
      const res = await axios.post('/api/restaurant/employees', payload);
      const msg =
        typeof res.data?.message === 'string'
          ? res.data.message
          : res.data?.flow === 'invite_sent'
            ? 'Invitation email sent.'
            : 'Team member added.';
      if (res.data?.emailDelivered === false) {
        toast.warning(msg);
        if (
          typeof res.data?.manualInviteUrl === 'string' &&
          res.data.manualInviteUrl.length > 0
        ) {
          toast.info(
            `Invite link (copy to user): ${res.data.manualInviteUrl}`,
            { autoClose: 20000 }
          );
        }
        if (typeof res.data?.emailError === 'string') {
          toast.error(res.data.emailError, { autoClose: 12000 });
        }
      } else {
        toast.success(msg);
      }
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      await fetchAll();
    } catch (err: any) {
      const d = err.response?.data;
      toast.error(
        typeof d?.error === 'string'
          ? d.error
          : d?.error?.formErrors?.[0] ?? err.message ?? 'Request failed.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEmployeeRole(employeeId: string, newRoleId: string) {
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setSavingEmployeeId(employeeId);
    try {
      await axios.patch(`/api/restaurant/employees/${employeeId}`, {
        roleId: newRoleId,
      });
      toast.success('Role updated.');
      await fetchAll();
    } catch (err: any) {
      toast.error(
        typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : err.message ?? 'Could not update role.'
      );
    } finally {
      setSavingEmployeeId(null);
    }
  }

  async function removeEmployee(employeeId: string) {
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    if (!confirm('Remove this person from the restaurant?')) return;
    try {
      await axios.delete(`/api/restaurant/employees/${employeeId}`);
      toast.success('Removed from team.');
      await fetchAll();
    } catch (err: any) {
      toast.error(
        typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : err.message ?? 'Could not remove.'
      );
    }
  }

  async function cancelInvite(inviteId: string) {
    try {
      await axios.delete(`/api/restaurant/invites/${inviteId}`);
      toast.success('Invitation cancelled.');
      await fetchAll();
    } catch (err: any) {
      toast.error(
        typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : err.message ?? 'Could not cancel invite.'
      );
    }
  }

  return (
    <Card className="my-5">
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>
          Add people by email and set a password they can use to sign in. If the
          email already has an account, only the invite is sent—password is
          ignored and they accept in email.
        </CardDescription>
        {!roleBasedSettingsAllowed ? (
          <p className="text-sm text-muted-foreground">
            On Starter, new invites use the <strong>Admin</strong> role only.
            Custom roles and permission presets are available on Growth and
            Scale.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="member-email">
              Email
            </label>
            <Input
              id="member-email"
              type="email"
              autoComplete="off"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="member-name">
              Name (required only for new accounts)
            </label>
            <Input
              id="member-name"
              placeholder="e.g. Sam Lee"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="member-password">
              Password (for new accounts)
            </label>
            <Input
              id="member-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="member-password2">
              Confirm password
            </label>
            <Input
              id="member-password2"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="member-role">
              Role
            </label>
            <select
              id="member-role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={roles.length === 0}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.slug === RESTAURANT_ROLE_SLUG.ADMIN ? ' (preset)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex lg:col-span-3 lg:justify-end">
            <Button
              type="button"
              className="text-white"
              disabled={submitting || roles.length === 0}
              onClick={() => void handleAdd()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add / invite
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading team…</p>
        ) : (
          <>
            {pendingInvites.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Pending invitations</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvites.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.role.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => void cancelInvite(p.id)}
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">People</h3>
              {employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employees loaded.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">
                            {emp.name}
                            {emp.isOwner ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (owner)
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>{emp.email ?? '—'}</TableCell>
                          <TableCell>
                            {emp.isOwner ? (
                              <span className="text-sm text-muted-foreground">
                                {emp.role.name}
                              </span>
                            ) : (
                              <select
                                className="h-9 max-w-[220px] rounded-md border border-input bg-background px-2 text-sm"
                                value={emp.role.id}
                                disabled={
                                  savingEmployeeId === emp.id ||
                                  roles.length === 0
                                }
                                onChange={(e) =>
                                  void updateEmployeeRole(
                                    emp.id,
                                    e.target.value
                                  )
                                }
                              >
                                {(roles.some((r) => r.id === emp.role.id)
                                  ? roles
                                  : [
                                      ...roles,
                                      {
                                        id: emp.role.id,
                                        name: emp.role.name,
                                        slug: emp.role.slug,
                                      },
                                    ]
                                ).map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {emp.isOwner ? (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => void removeEmployee(emp.id)}
                              >
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Remove</span>
                                </>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Set the <code className="rounded bg-muted px-1">SMTP_*</code> variables in{' '}
          <code className="rounded bg-muted px-1">.env</code> and restart the dev server.
          For Gmail, use an{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            App Password
          </a>{' '}
          as <code className="rounded bg-muted px-1">SMTP_PASSWORD</code>, and make sure{' '}
          <code className="rounded bg-muted px-1">SMTP_FROM_EMAIL</code> matches{' '}
          <code className="rounded bg-muted px-1">SMTP_USER</code> or a verified alias.
        </p>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchAll()}
          disabled={loading}
        >
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
