'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import type { DashboardModuleKey, PermissionAction } from '@/constant/dashboardModules';
import { hasDashboardPermission } from '@/lib/dashboard-permissions';

type PlanFeatures = {
  recommendations?: boolean;
};

export function useDashboardPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get<{ permissions?: string[]; plan?: PlanFeatures }>(
        '/api/me/dashboard-permissions'
      )
      .then((res) => {
        if (!mounted) return;
        setPermissions(res.data.permissions ?? []);
        setPlan(res.data.plan ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setPermissions([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const can = useCallback(
    (moduleKey: DashboardModuleKey, action: PermissionAction) =>
      hasDashboardPermission(permissions, moduleKey, action),
    [permissions]
  );

  return {
    loading,
    permissions,
    plan,
    canAccess: (moduleKey: DashboardModuleKey) => can(moduleKey, 'access'),
    canEdit: (moduleKey: DashboardModuleKey) => can(moduleKey, 'edit'),
    canDelete: (moduleKey: DashboardModuleKey) => can(moduleKey, 'delete'),
    can,
  };
}
