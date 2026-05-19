'use client';

import { FormEvent, useState } from 'react';
import { Camera, Save, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shop, updateMyShopProfile } from '@/lib/api';

export function ShopProfile({
  token,
  shop,
  onShopUpdated,
}: {
  token: string;
  shop: Shop;
  onShopUpdated: (shop: Shop) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState(shop.photoUrl ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const maxPhotoBytes = 5 * 1024 * 1024;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const form = new FormData(event.currentTarget);
    try {
      const updated = await updateMyShopProfile(token, {
        name: String(form.get('name')),
        address: String(form.get('address')),
        phone: String(form.get('phone')),
        bwPerPage: Number(form.get('bwPerPage')),
        colorPerPage: Number(form.get('colorPerPage')),
        photo,
      });
      onShopUpdated(updated);
      setPreviewUrl(updated.photoUrl ?? '');
      setPhoto(null);
      setMessage('Shop profile updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not update shop profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/15 text-primary-light">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Shop Profile</CardTitle>
            <CardDescription>Update the details customers see before sending documents.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="grid gap-3">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-[18px] border border-border bg-surface">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-12 w-12 text-muted" />
                )}
              </div>
              <Label htmlFor="photo">Shop Photo</Label>
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > maxPhotoBytes) {
                    event.target.value = '';
                    setPhoto(null);
                    setMessage('Shop photo must be 5MB or smaller.');
                    return;
                  }
                  setPhoto(file);
                  if (file) setPreviewUrl(URL.createObjectURL(file));
                }}
              />
              <p className="text-xs leading-5 text-secondary">This image appears in the customer app shop list.</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input id="name" name="name" defaultValue={shop.name} minLength={2} maxLength={100} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={shop.address} minLength={5} maxLength={240} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={shop.phone} minLength={8} maxLength={20} inputMode="tel" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="bwPerPage">B/W Rate Per Page</Label>
                  <Input id="bwPerPage" name="bwPerPage" type="number" min="0" max="1000" defaultValue={shop.printRates?.bwPerPage ?? 2} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="colorPerPage">Color Rate Per Page</Label>
                  <Input id="colorPerPage" name="colorPerPage" type="number" min="0" max="1000" defaultValue={shop.printRates?.colorPerPage ?? 10} required />
                </div>
              </div>
            </div>
          </div>

          {message ? <p className="rounded-[12px] border border-border bg-surface p-3 text-sm text-secondary">{message}</p> : null}
          <Button disabled={busy} className="w-fit">
            <Save className="h-4 w-4" />
            {busy ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
