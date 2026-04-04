export type NavItem = {
  title: string;
  path: string;
  /** Stable key for module access / RBAC (dashboard nav only). */
  moduleKey?: string;
  icon?: JSX.Element;
};
