'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, KeyRound, LocateFixed, MapPin, Printer, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/shared/field';
import { AuthPayload, login, registerShopOwner, setupAdmin } from '@/lib/api';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register' | 'admin';
type ShopLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

function readBrowserLocation(options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function AuthScreen({ onAuth }: { onAuth: (payload: AuthPayload) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [shopLocation, setShopLocation] = useState<ShopLocation | null>(null);

  const getLiveLocation = async () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Live location is not supported in this browser.');
      return;
    }

    setLocating(true);
    try {
      let position: GeolocationPosition;

      try {
        position = await readBrowserLocation({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000,
        });
      } catch (highAccuracyError) {
        const geoError = highAccuracyError as GeolocationPositionError;
        if (geoError.code === geoError.PERMISSION_DENIED) {
          throw geoError;
        }

        position = await readBrowserLocation({
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 10 * 60 * 1000,
        });
      }

      setShopLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch (geoError) {
      const errorCode = (geoError as GeolocationPositionError).code;
      const message =
        errorCode === GeolocationPositionError.PERMISSION_DENIED
          ? 'Location permission denied. Please click the location icon in the address bar and allow access.'
          : errorCode === GeolocationPositionError.TIMEOUT
            ? 'Location timed out. Turn on Windows location services or try again.'
            : 'Location unavailable. Turn on device/browser location services, then try again.';

      setError(message);
    } finally {
      setLocating(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));

    try {
      if (mode === 'login') {
        onAuth(await login(String(form.get('email')), password));
      } else if (mode === 'register') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }

        if (!shopLocation) {
          setError('Please get live location before creating the shop account.');
          return;
        }

        onAuth(await registerShopOwner({
          ownerName: String(form.get('ownerName')),
          email: String(form.get('email')),
          phone: String(form.get('phone')),
          password,
          shop: {
            name: String(form.get('shopName')),
            address: String(form.get('address')),
            phone: String(form.get('shopPhone')),
            latitude: shopLocation.latitude,
            longitude: shopLocation.longitude,
            printRates: {
              bwPerPage: Number(form.get('bwPerPage')),
              colorPerPage: Number(form.get('colorPerPage')),
            },
          },
        }));
      } else {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }

        onAuth(await setupAdmin({
          setupKey: String(form.get('setupKey')),
          name: String(form.get('name')),
          email: String(form.get('email')),
          phone: String(form.get('phone')),
          password,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-border bg-card/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-primary to-accent shadow-[0_0_28px_rgba(99,102,241,0.45)]">
          <Printer className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Printtary Shop Console</h1>
        <p className="mt-3 max-w-md text-secondary">
          Secure print operations for shop owners: register your shop, verify OTPs, preview authorized files, and manage every print job from one place.
        </p>
        <div className="mt-8 grid gap-3 text-sm text-secondary">
          {[
            'No demo jobs or local fake data',
            'JWT protected shop-owner and admin access',
            'Cloudinary signed document preview after OTP',
            'Admin visibility across shops, users, jobs, and documents',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-3 gap-2 rounded-[14px] bg-surface p-1">
            {[
              ['login', 'Login'],
              ['register', 'Register Shop'],
              ['admin', 'Admin Setup'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value as AuthMode);
                  setError('');
                }}
                className={cn(
                  'rounded-[10px] px-3 py-2 text-sm font-semibold text-secondary transition',
                  mode === value && 'bg-card text-primary-light'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <CardTitle>{mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Shop Owner Account' : 'Create Admin Account'}</CardTitle>
          <CardDescription>
            {mode === 'register'
              ? 'Your shop will go live after admin approval.'
              : mode === 'admin'
                ? 'Admin setup needs the private ADMIN_SETUP_KEY from backend env.'
                : 'Use your real backend credentials.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            {mode === 'register' ? (
              <>
                <Field name="ownerName" label="Owner Name" placeholder="Your name" minLength={2} maxLength={80} />
                <Field name="phone" label="Owner Phone" placeholder="+91..." minLength={8} maxLength={20} inputMode="tel" />
                <Field name="shopName" label="Shop Name" placeholder="QuickPrint Hub" minLength={2} maxLength={100} />
                <Field name="address" label="Shop Address" placeholder="Full shop address" minLength={5} maxLength={240} />
                <Field name="shopPhone" label="Shop Phone" placeholder="+91..." minLength={8} maxLength={20} inputMode="tel" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="bwPerPage" label="B/W Rate Per Page" placeholder="2" type="number" min={0} max={1000} inputMode="decimal" />
                  <Field name="colorPerPage" label="Color Rate Per Page" placeholder="10" type="number" min={0} max={1000} inputMode="decimal" />
                </div>
                <div className="grid gap-3 rounded-[14px] border border-border bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-card text-primary-light">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">Shop Live Location</p>
                        <p className="text-xs text-secondary">Use this while you are at the shop.</p>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={getLiveLocation} disabled={locating || busy}>
                      <LocateFixed className="h-4 w-4" />
                      {locating ? 'Getting location...' : shopLocation ? 'Update Location' : 'Get Live Location'}
                    </Button>
                  </div>
                  {shopLocation ? (
                    <p className="rounded-[10px] border border-success/30 bg-success/10 p-3 text-sm text-success">
                      Location captured: {shopLocation.latitude.toFixed(5)}, {shopLocation.longitude.toFixed(5)}
                      {shopLocation.accuracy ? ` (${Math.round(shopLocation.accuracy)}m accuracy)` : ''}
                    </p>
                  ) : (
                    <p className="rounded-[10px] border border-border bg-card/60 p-3 text-sm text-secondary">
                      Latitude and longitude will be added automatically after location permission.
                    </p>
                  )}
                </div>
              </>
            ) : null}
            {mode === 'admin' ? (
              <>
                <Field name="setupKey" label="Admin Setup Key" placeholder="Private setup key" type="password" minLength={1} />
                <Field name="name" label="Admin Name" placeholder="Admin name" minLength={2} maxLength={80} />
                <Field name="phone" label="Phone" placeholder="+91..." minLength={8} maxLength={20} inputMode="tel" />
              </>
            ) : null}
            <Field name="email" label="Email" placeholder="you@example.com" type="email" />
            <Field name="password" label="Password" placeholder="Minimum 8 characters" type="password" minLength={mode === 'login' ? 1 : 8} maxLength={128} />
            {error ? <p className="rounded-[12px] border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</p> : null}
            <Button disabled={busy} size="lg">
              {mode === 'register' ? <UserRoundPlus className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
