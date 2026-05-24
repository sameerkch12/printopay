import { Download, KeyRound, Printer, Settings2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrintJob, formatBytes } from '@/lib/api';

function settingLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] border border-border bg-bg/45 p-3">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-primary-foreground">{value}</p>
    </div>
  );
}

function formatRupees(value: number) {
  return `Rs ${Math.round(value)}`;
}

function documentIdOf(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) return String(value._id);
  return '';
}

export function OtpPrintPanel({
  busy,
  otp,
  setOtp,
  printMessage,
  verifiedJob,
  onVerifyOtp,
  onDownload,
  onPrint,
  downloadingDocumentId,
  printingDocumentId,
}: {
  busy: boolean;
  otp: string;
  setOtp: (value: string) => void;
  printMessage?: string;
  verifiedJob?: PrintJob | null;
  onVerifyOtp: () => void;
  onDownload: (documentId: string, index: number) => void;
  onPrint: (documentId: string, index: number) => void;
  downloadingDocumentId?: string;
  printingDocumentId?: string;
}) {
  const settings = verifiedJob?.settings;
  const document = verifiedJob?.document;
  const documents = verifiedJob?.documents?.length ? verifiedJob.documents : document ? [document] : [];
  const settingsForDocument = (documentId: string, index: number) => (
    verifiedJob?.documentSettings?.find((item) => (
      item.documentId === documentId || documentIdOf(item.document) === documentId
    ))?.settings ?? verifiedJob?.documentSettings?.[index]?.settings ?? settings
  );
  const documentSettingItem = (documentId: string, index: number) => (
    verifiedJob?.documentSettings?.find((item) => (
      item.documentId === documentId || documentIdOf(item.document) === documentId
    )) ?? verifiedJob?.documentSettings?.[index]
  );
  const amountForDocument = (documentId: string, index: number) => {
    const itemSettings = settingsForDocument(documentId, index);
    if (!itemSettings || !verifiedJob?.shop) return 0;
    const item = documentSettingItem(documentId, index);
    if (typeof item?.estimatedPrice === 'number') return item.estimatedPrice;
    const chargeablePages = item?.chargeablePages ?? itemSettings.copies;
    const rate = itemSettings.color === 'color'
      ? verifiedJob.shop.printRates?.colorPerPage ?? 10
      : verifiedJob.shop.printRates?.bwPerPage ?? 2;
    return chargeablePages * rate;
  };
  const amountToCollect = verifiedJob?.estimatedPrice ?? documents.reduce((total, item, index) => total + amountForDocument(item._id, index), 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
        <CardHeader>
          <CardTitle>Print by Code</CardTitle>
          <CardDescription>Verify the customer print code first.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
        <div className="rounded-[16px] border border-border bg-bg/45 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-primary-light" />
            Enter Customer Print Code
          </div>
          <div className="grid gap-3">
            <Label htmlFor="job-otp">Print Code</Label>
            <Input
              id="job-otp"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              className="h-14 text-center text-2xl font-extrabold tracking-[0.4em]"
            />
            <Button onClick={onVerifyOtp} disabled={busy || otp.length !== 4} size="lg">
              <KeyRound className="h-4 w-4" />
              {busy ? 'Verifying...' : 'Verify Print Code'}
            </Button>
            {printMessage ? (
              <div className="rounded-[12px] border border-primary/25 bg-primary/10 p-3 text-center text-sm font-semibold text-primary-light">
                {printMessage}
              </div>
            ) : null}
          </div>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Review customer requirements before printing.</CardDescription>
        </CardHeader>
        <CardContent>
        {verifiedJob && settings && documents.length ? (
          <div className="grid gap-4 rounded-[16px] border border-primary/25 bg-surface/70 p-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary-light" />
              <p className="text-lg font-extrabold">Customer Print Configuration</p>
            </div>
            {verifiedJob.usedDefaultSettings ? (
              <div className="rounded-[12px] border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">
                Customer ne default settings select ki hain. Print se pehle ek baar confirm kar lein.
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Files" value={documents.length} />
              <DetailItem label="Total Size" value={formatBytes(documents.reduce((total, item) => total + (item.sizeBytes ?? 0), 0))} />
              <DetailItem label="Estimated Pages" value={verifiedJob.estimatedPages ?? 1} />
              <DetailItem label="Amount To Collect" value={formatRupees(amountToCollect)} />
            </div>
            <div className="grid gap-2">
              {documents.map((item, index) => {
                const itemSettings = settingsForDocument(item._id, index);
                const itemAmount = amountForDocument(item._id, index);
                return (
                  <div
                    key={item._id ?? index}
                    className="grid gap-3 rounded-[12px] border border-border bg-bg/45 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-muted">File {index + 1}</p>
                      <p className="mt-1 break-words text-sm font-bold text-primary-foreground">{item.originalName ?? 'Document'}</p>
                      <p className="mt-1 text-xs text-secondary">
                        {item.mimeType ?? 'Unknown'} &middot; {formatBytes(item.sizeBytes ?? 0)}
                      </p>
                      {itemSettings ? (
                        <div className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-2 lg:grid-cols-3">
                          <span><strong className="text-primary-foreground">{itemSettings.copies}</strong> copy</span>
                          <span><strong className="text-primary-foreground">{itemSettings.color === 'bw' ? 'B & W' : 'Color'}</strong></span>
                          <span><strong className="text-primary-foreground">{settingLabel(itemSettings.orientation)}</strong></span>
                          <span>Pages: <strong className="text-primary-foreground">{itemSettings.pageRange || 'All'}</strong></span>
                          <span>Paper: <strong className="text-primary-foreground">{itemSettings.paperSize}</strong></span>
                          <span>Sides: <strong className="text-primary-foreground">{settingLabel(itemSettings.sides)}</strong></span>
                          <span>Amount: <strong className="text-primary-foreground">{formatRupees(itemAmount)}</strong></span>
                        </div>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:flex sm:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onDownload(item._id, index)}
                        disabled={busy}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingDocumentId === item._id ? 'Downloading...' : 'Download'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onPrint(item._id, index)}
                        disabled={busy}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Printer className="h-4 w-4" />
                        {printingDocumentId === item._id ? 'Opening...' : 'Print'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="grid min-h-[335px] place-items-center rounded-[16px] border border-dashed border-border bg-surface/55 p-6 text-center">
          <div>
            <ShieldCheck className="mx-auto h-10 w-10 text-primary-light" />
            <p className="mt-3 text-sm font-semibold">Settings appear after print code verification</p>
            <p className="mt-1 text-xs text-secondary">Shop owner reviews customer requirements before printing.</p>
          </div>
        </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
