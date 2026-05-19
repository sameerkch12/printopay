import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrintJob } from '@/lib/api';

export function OtpDialog({
  selectedJob,
  otp,
  setOtp,
  busy,
  onVerify,
}: {
  selectedJob?: PrintJob;
  otp: string;
  setOtp: (value: string) => void;
  busy: boolean;
  onVerify: () => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Verify Print OTP</DialogTitle>
        <DialogDescription>
          Enter the customer OTP for {selectedJob?.jobNumber ?? 'selected job'}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <Label htmlFor="otp">OTP</Label>
        <Input
          id="otp"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
          inputMode="numeric"
          className="h-14 text-center text-2xl font-extrabold tracking-[0.4em]"
        />
        <Button onClick={onVerify} disabled={busy || otp.length !== 4}>
          <KeyRound className="h-4 w-4" />
          Unlock Preview
        </Button>
      </div>
    </DialogContent>
  );
}
