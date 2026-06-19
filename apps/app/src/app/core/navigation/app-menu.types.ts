export interface AppMenuItem {
  key: string;
  label: string;
  route: string;
  icon?: string | null;
  permissions?: string[];
  sortOrder?: number;
}
