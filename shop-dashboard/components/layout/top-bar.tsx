import { Badge } from '@/components/ui/badge';

export function TopBar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-[24px] border border-border bg-card/75 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <Badge variant="success">Production API</Badge>
        <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-secondary">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
