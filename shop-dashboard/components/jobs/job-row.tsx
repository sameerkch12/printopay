import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PrintJob } from '@/lib/api';
import { statusMeta } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function JobRow({
  job,
  selected,
  onSelect,
}: {
  job: PrintJob;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = statusMeta[job.status];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'grid gap-3 rounded-[16px] border border-border bg-surface/70 p-4 text-left transition hover:border-primary/40 md:grid-cols-[1fr_auto]',
        selected && 'border-primary/60 bg-primary/10'
      )}
    >
      <div className="flex min-w-0 gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-error/12 text-error">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{job.jobNumber}</p>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-secondary">
            {job.document?.originalName ?? 'Document'} · {job.shop?.name ?? 'Shop'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {new Date(job.createdAt).toLocaleString()} · {job.estimatedPages} pages · {job.settings.copies} copies
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
        {new Date(job.otpExpiresAt).toLocaleTimeString()}
      </div>
    </button>
  );
}
