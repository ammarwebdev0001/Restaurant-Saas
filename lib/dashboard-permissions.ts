import {
  DASHBOARD_MODULES,
  DASHBOARD_MODULE_KEY_SET,
  PERMISSION_ACTIONS,
  type PermissionAction,
} from '@/constant/dashboardModules';

const ACTION_SET = new Set<string>(PERMISSION_ACTIONS);

export type ModulePermissionRow = {
  access: boolean;
  edit: boolean;
  delete: boolean;
};

export function parsePermissionToken(token: string): {
  moduleKey: string;
  action: (typeof PERMISSION_ACTIONS)[number];
} | null {
  const idx = token.lastIndexOf(':');
  if (idx <= 0 || idx === token.length - 1) return null;
  const moduleKey = token.slice(0, idx);
  const action = token.slice(idx + 1);
  if (!DASHBOARD_MODULE_KEY_SET.has(moduleKey)) return null;
  if (!ACTION_SET.has(action)) return null;
  return {
    moduleKey,
    action: action as (typeof PERMISSION_ACTIONS)[number],
  };
}

export function permissionName(
  moduleKey: string,
  action: (typeof PERMISSION_ACTIONS)[number]
) {
  return `${moduleKey}:${action}`;
}

/** Drop invalid tokens; dedupe; enforce implied access/edit rules. */
export function normalizeDashboardPermissions(raw: string[]): string[] {
  const parsed = new Map<
    string,
    { access: boolean; edit: boolean; delete: boolean }
  >();

  for (const name of raw) {
    const p = parsePermissionToken(name);
    if (!p) continue;
    const row = parsed.get(p.moduleKey) ?? {
      access: false,
      edit: false,
      delete: false,
    };
    if (p.action === 'access') row.access = true;
    if (p.action === 'edit') row.edit = true;
    if (p.action === 'delete') row.delete = true;
    parsed.set(p.moduleKey, row);
  }

  for (const [, row] of parsed) {
    if (row.delete) {
      row.edit = true;
      row.access = true;
    } else if (row.edit) {
      row.access = true;
    }
  }

  const out = new Set<string>();
  for (const [moduleKey, row] of parsed) {
    if (row.access) out.add(permissionName(moduleKey, 'access'));
    if (row.edit) out.add(permissionName(moduleKey, 'edit'));
    if (row.delete) out.add(permissionName(moduleKey, 'delete'));
  }
  return [...out];
}

export function rowsFromPermissions(
  list: string[]
): Map<string, ModulePermissionRow> {
  const map = new Map<string, ModulePermissionRow>();
  for (const m of DASHBOARD_MODULES) {
    map.set(m.moduleKey, { access: false, edit: false, delete: false });
  }
  for (const token of list) {
    const p = parsePermissionToken(token);
    if (!p) continue;
    const row = map.get(p.moduleKey);
    if (!row) continue;
    if (p.action === 'access') row.access = true;
    if (p.action === 'edit') row.edit = true;
    if (p.action === 'delete') row.delete = true;
  }
  return map;
}

export function permissionsFromRows(
  map: Map<string, ModulePermissionRow>
): string[] {
  const tokens: string[] = [];
  for (const m of DASHBOARD_MODULES) {
    const row = map.get(m.moduleKey);
    if (!row) continue;
    if (row.access) tokens.push(permissionName(m.moduleKey, 'access'));
    if (row.edit) tokens.push(permissionName(m.moduleKey, 'edit'));
    if (row.delete) tokens.push(permissionName(m.moduleKey, 'delete'));
  }
  return normalizeDashboardPermissions(tokens);
}

export function toggleModuleAction(
  list: string[],
  moduleKey: string,
  action: PermissionAction,
  enabled: boolean
): string[] {
  const map = rowsFromPermissions(list);
  const row = map.get(moduleKey);
  if (!row) return normalizeDashboardPermissions(list);

  if (action === 'access') {
    row.access = enabled;
    if (!enabled) {
      row.edit = false;
      row.delete = false;
    }
  } else if (action === 'edit') {
    row.edit = enabled;
    if (enabled) row.access = true;
    else row.delete = false;
  } else {
    row.delete = enabled;
    if (enabled) {
      row.access = true;
      row.edit = true;
    }
  }

  return permissionsFromRows(map);
}
