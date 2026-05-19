import { PrintStatus } from './api';

export const TOKEN_KEY = 'printtary_shop_token';

export const statusMeta: Record<
  PrintStatus,
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'error' | 'muted';
    dot: string;
  }
> = {
  pending: { label: 'Pending', variant: 'warning', dot: 'bg-warning' },
  processing: { label: 'Processing', variant: 'default', dot: 'bg-primary' },
  printing: { label: 'Printing', variant: 'default', dot: 'bg-primary' },
  completed: { label: 'Successful Print', variant: 'success', dot: 'bg-success' },
  failed: { label: 'Failed', variant: 'error', dot: 'bg-error' },
  expired: { label: 'Expired', variant: 'muted', dot: 'bg-muted' },
};
