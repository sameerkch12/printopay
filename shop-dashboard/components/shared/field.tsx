import type { HTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Field({
  name,
  label,
  placeholder,
  type = 'text',
  minLength,
  maxLength,
  min,
  max,
  pattern,
  inputMode,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        max={max}
        pattern={pattern}
        inputMode={inputMode}
        required
      />
    </div>
  );
}
