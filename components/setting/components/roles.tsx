'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { DASHBOARD_MODULES } from '@/constant/dashboardModules';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  rowsFromPermissions,
  toggleModuleAction,
} from '@/lib/dashboard-permissions';
import type { PermissionAction } from '@/constant/dashboardModules';

type RoleRow = {
  id: string;
  name: string;
  permissions: string[];
};

export default function RolesCard() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, RoleRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get<{ roles: RoleRow[] }>('/api/restaurant/roles');
      const list = res.data.roles ?? [];
      setRoles(list);
      const nextDrafts: Record<string, RoleRow> = {};
      for (const r of list) {
        nextDrafts[r.id] = { ...r, permissions: [...r.permissions] };
      }
      setDrafts(nextDrafts);
    } catch (e: any) {
      toast.error(
        e.response?.data?.error ?? e.message ?? 'Failed to load roles.'
      );
      setRoles([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const updateDraft = (id: string, patch: Partial<RoleRow>) => {
    setDrafts((d) => ({
      ...d,
      [id]: { ...d[id], ...patch },
    }));
  };

  const isDirty = (id: string) => {
    const orig = roles.find((r) => r.id === id);
    const cur = drafts[id];
    if (!orig || !cur) return false;
    if (orig.name !== cur.name) return true;
    if (orig.permissions.length !== cur.permissions.length) return true;
    const a = [...orig.permissions].sort().join('|');
    const b = [...cur.permissions].sort().join('|');
    return a !== b;
  };

  const handleSave = async (id: string) => {
    const cur = drafts[id];
    if (!cur) return;
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setSavingId(id);
    try {
      await axios.patch(`/api/restaurant/roles/${id}`, {
        name: cur.name.trim(),
        permissions: cur.permissions,
      });
      toast.success('Role saved.');
      await fetchRoles();
    } catch (e: any) {
      toast.error(
        typeof e.response?.data?.error === 'string'
          ? e.response.data.error
          : e.response?.data?.error?.message ??
              e.message ??
              'Failed to save role.'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Enter a role name.');
      return;
    }
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setCreating(true);
    try {
      await axios.post('/api/restaurant/roles', {
        name,
        permissions: [],
      });
      toast.success('Role created.');
      setNewName('');
      await fetchRoles();
    } catch (e: any) {
      toast.error(
        typeof e.response?.data?.error === 'string'
          ? e.response.data.error
          : e.message ?? 'Failed to create role.'
      );
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (!navigator.onLine) {
      toast.error('You are offline.');
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`/api/restaurant/roles/${deleteId}`);
      toast.success('Role deleted.');
      setDeleteId(null);
      await fetchRoles();
    } catch (e: any) {
      toast.error(
        typeof e.response?.data?.error === 'string'
          ? e.response.data.error
          : e.message ?? 'Failed to delete role.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const togglePermission = (
    roleId: string,
    moduleKey: string,
    action: PermissionAction,
    enabled: boolean
  ) => {
    const cur = drafts[roleId];
    if (!cur) return;
    const next = toggleModuleAction(cur.permissions, moduleKey, action, enabled);
    updateDraft(roleId, { permissions: next });
  };

  return (
    <>
      <Card className="my-5">
        <CardHeader>
          <CardTitle>Roles &amp; module access</CardTitle>
          <CardDescription>
            Create custom roles, choose which dashboard modules each role can
            open, and set separate edit and delete rights per module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="new-role-name" className="text-sm font-medium">
                New role name
              </label>
              <Input
                id="new-role-name"
                placeholder="e.g. Shift manager"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="text-white sm:mb-0"
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create role
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roles yet. Add one to assign to employees later.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((r) => {
                const draft = drafts[r.id];
                if (!draft) return null;
                const dirty = isDirty(r.id);
                return (
                  <Collapsible key={r.id} defaultOpen={roles.length <= 3}>
                    <div className="rounded-lg border bg-card">
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <CollapsibleTrigger className="flex w-full items-center gap-2 text-left font-medium hover:underline sm:w-auto [&[data-state=open]_svg]:rotate-180">
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                          <span>{draft.name || 'Untitled role'}</span>
                          {dirty ? (
                            <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                              Unsaved changes
                            </span>
                          ) : null}
                        </CollapsibleTrigger>
                        <div className="flex flex-wrap gap-2 pl-6 sm:pl-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="text-white"
                            disabled={!dirty || savingId === r.id}
                            onClick={() => void handleSave(r.id)}
                          >
                            {savingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="border-t px-4 pb-4 pt-2">
                          <div className="mb-4 max-w-md space-y-2">
                            <label className="text-sm font-medium">
                              Role name
                            </label>
                            <Input
                              value={draft.name}
                              onChange={(e) =>
                                updateDraft(r.id, { name: e.target.value })
                              }
                            />
                          </div>
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Module</TableHead>
                                  <TableHead className="text-center">
                                    Access
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Edit
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Delete
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  const permRows = rowsFromPermissions(
                                    draft.permissions
                                  );
                                  return DASHBOARD_MODULES.map((m) => {
                                    const row = permRows.get(m.moduleKey)!;
                                    return (
                                    <TableRow key={m.moduleKey}>
                                      <TableCell className="font-medium">
                                        {m.title}
                                      </TableCell>
                                      {(['access', 'edit', 'delete'] as const).map(
                                        (action) => (
                                          <TableCell
                                            key={action}
                                            className="text-center"
                                          >
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 accent-primary"
                                              checked={
                                                action === 'access'
                                                  ? row.access
                                                  : action === 'edit'
                                                    ? row.edit
                                                    : row.delete
                                              }
                                              onChange={(e) =>
                                                togglePermission(
                                                  r.id,
                                                  m.moduleKey,
                                                  action,
                                                  e.target.checked
                                                )
                                              }
                                            />
                                          </TableCell>
                                        )
                                      )}
                                    </TableRow>
                                  );
                                  });
                                })()}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Access lets the role open the module. Edit and delete
                            are enforced when you wire employee sessions to these
                            roles.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchRoles()}
            disabled={loading}
          >
            Refresh list
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Roles that are still assigned to employees
              cannot be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(ev) => {
                ev.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
