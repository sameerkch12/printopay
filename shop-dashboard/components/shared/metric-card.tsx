import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: 'warning' | 'primary' | 'success';
}) {
  const color =
    tone === 'warning'
      ? 'text-warning bg-warning/15'
      : tone === 'success'
        ? 'text-success bg-success/15'
        : 'text-primary-light bg-primary/15';

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-secondary">{label}</p>
          <p className="mt-1 text-3xl font-extrabold">{value}</p>
        </div>
        <div className={cn('grid h-12 w-12 place-items-center rounded-[14px]', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
