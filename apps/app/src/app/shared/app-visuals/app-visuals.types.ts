export type AppVisualKind = 'event' | 'property' | 'ticket' | 'service' | 'game' | 'inspection';

export type AppVertical = 'events' | 'real_estate' | 'tickets' | 'services' | 'games' | 'inspection';

export interface AppMetricItem {
  label: string;
  value: string;
  trend?: string;
  icon?: string;
}

export interface AppEntityCard {
  kind: AppVisualKind;
  title: string;
  subtitle: string;
  detail?: string;
  status?: string;
  price?: string;
  actionLabel?: string;
  icon?: string;
  imageLabel?: string;
}

export interface AppTimelineItem {
  label: string;
  detail?: string;
  state?: 'complete' | 'active' | 'pending' | 'warning';
}
