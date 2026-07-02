export interface AppMenuItem {
  key: string;
  label: string;
  route: string;
  icon?: string | null;
  permissions?: string[];
  roles?: string[];
  sortOrder?: number;
  group?: string | null;
  placement?: 'primary' | 'admin' | 'build' | 'more' | 'drawer' | 'bottom' | null;
  priority?: number | null;
}
