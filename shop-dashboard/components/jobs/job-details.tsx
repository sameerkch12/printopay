import { KeyRound, Printer, Settings2, ShieldCheck } from 'lucide-react';
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

export function OtpPrintPanel({
  busy,
  otp,
  setOtp,
  printMessage,
  verifiedJob,
  onVerifyOtp,
  onPrint,
}: {
  busy: boolean;
  otp: string;
  setOtp: (value: string) => void;
  printMessage?: string;
  verifiedJob?: PrintJob | null;
  onVerifyOtp: () => void;
  onPrint: () => void;
}) {
  const settings = verifiedJob?.settings;
  const document = verifiedJob?.document;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
        <CardHeader>
          <CardTitle>Print by OTP</CardTitle>
          <CardDescription>Verify the customer OTP first.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
        <div className="rounded-[16px] border border-border bg-bg/45 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-primary-light" />
            Enter Customer OTP
          </div>
          <div className="grid gap-3">
            <Label htmlFor="job-otp">OTP</Label>
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
              {busy ? 'Verifying...' : 'Verify OTP'}
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
        {verifiedJob && settings && document ? (
          <div className="grid gap-4 rounded-[16px] border border-primary/25 bg-surface/70 p-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary-light" />
              <p className="text-lg font-extrabold">Customer Print Configuration</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="File Name" value={document.originalName ?? 'Document'} />
              <DetailItem label="Format" value={document.mimeType ?? 'Unknown'} />
              <DetailItem label="File Size" value={formatBytes(document.sizeBytes ?? 0)} />
              <DetailItem label="Estimated Pages" value={verifiedJob.estimatedPages ?? 1} />
              <DetailItem label="Copies" value={settings.copies} />
              <DetailItem label="Color" value={settings.color === 'bw' ? 'Black & White' : 'Color'} />
              <DetailItem label="Orientation" value={settingLabel(settings.orientation)} />
              <DetailItem label="Paper Size" value={settings.paperSize} />
              <DetailItem label="Sides" value={settingLabel(settings.sides)} />
              <DetailItem label="Page Range" value={settings.pageRange || 'All'} />
            </div>
            <Button onClick={onPrint} disabled={busy} size="lg">
              <Printer className="h-4 w-4" />
              {busy ? 'Opening...' : 'Print Document'}
            </Button>
          </div>
        ) : (
        <div className="grid min-h-[335px] place-items-center rounded-[16px] border border-dashed border-border bg-surface/55 p-6 text-center">
          <div>
            <ShieldCheck className="mx-auto h-10 w-10 text-primary-light" />
            <p className="mt-3 text-sm font-semibold">Settings appear after OTP verification</p>
            <p className="mt-1 text-xs text-secondary">Shop owner reviews customer requirements before printing.</p>
          </div>
        </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
