import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminList({
  title,
  items,
  onAction,
}: {
  title: string;
  items: { id: string; title: string; sub: string; badge: string; meta?: string; actionLabel?: string }[];
  onAction?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} records</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={item.id || `${item.title}-${index}`} className="rounded-[14px] border border-border bg-surface/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <Badge>{item.badge}</Badge>
              </div>
              <p className="mt-1 text-sm text-secondary">{item.sub}</p>
              {item.meta ? <p className="mt-1 text-xs text-muted">{item.meta}</p> : null}
              {item.actionLabel && onAction ? (
                <Button className="mt-3 w-full" size="sm" onClick={() => onAction(item.id)}>
                  {item.actionLabel}
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState text={`No ${title.toLowerCase()} found.`} />
        )}
      </CardContent>
    </Card>
  );
}
