'use client';

import { Download, FileText, LayoutDashboard, LogOut, Printer, QrCode, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCodeSvg, createQrSvg } from '@/components/shared/qr-code';
import { Shop, User } from '@/lib/api';

const CUSTOMER_APP_URL = (process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? 'http://localhost:8083').replace(/\/$/, '');

function getCustomerShopUrl(shop: Shop) {
  return `${CUSTOMER_APP_URL}/shop/${shop._id}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function downloadQr(shop: Shop) {
  const svg = createQrSvg(getCustomerShopUrl(shop));
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'shop'}-qr.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

function printQrPoster(shop: Shop) {
  const popup = window.open('', '_blank', 'width=840,height=1100');
  if (!popup) return;

  const customerUrl = getCustomerShopUrl(shop);
  const svg = createQrSvg(customerUrl);
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(shop.name)} QR Poster</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f8fafc;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }
          .poster {
            width: 720px;
            min-height: 960px;
            padding: 48px;
            border: 2px solid #111827;
            background: #ffffff;
          }
          .eyebrow {
            margin: 0 0 12px;
            color: #2563eb;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0;
            font-size: 52px;
            line-height: 1;
          }
          .security {
            margin: 28px 0;
            padding: 20px;
            border-radius: 18px;
            background: #eff6ff;
            color: #1e3a8a;
            font-size: 24px;
            font-weight: 800;
          }
          .security span {
            display: block;
            margin-top: 8px;
            color: #334155;
            font-size: 18px;
            font-weight: 600;
          }
          .qr {
            display: grid;
            place-items: center;
            margin: 32px auto;
            width: 420px;
            height: 420px;
            padding: 24px;
            border: 2px solid #e2e8f0;
            border-radius: 28px;
          }
          .qr svg { width: 100%; height: 100%; }
          .steps {
            margin: 0;
            padding-left: 24px;
            color: #334155;
            font-size: 22px;
            line-height: 1.45;
          }
          .shop {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #cbd5e1;
            color: #475569;
            font-size: 18px;
          }
          .link {
            margin-top: 16px;
            overflow-wrap: anywhere;
            color: #2563eb;
            font-size: 15px;
          }
          @media print {
            body { background: #ffffff; }
            .poster { width: 100%; min-height: auto; border: 0; }
          }
        </style>
      </head>
      <body>
        <main class="poster">
          <p class="eyebrow">Printtary Secure Print</p>
          <h1>Scan to send your document</h1>
          <div class="security">
            Secure your document.
            <span>No login required. Auto delete after expiry. Shop owner cannot open your document without OTP approval.</span>
          </div>
          <div class="qr">${svg}</div>
          <ol class="steps">
            <li>Scan this QR code.</li>
            <li>Upload your document and choose print settings.</li>
            <li>Share OTP at the counter only when you are ready to print.</li>
          </ol>
          <div class="shop">
            <strong>${escapeHtml(shop.name)}</strong><br/>
            ${escapeHtml(shop.address)}
            <div class="link">${escapeHtml(customerUrl)}</div>
          </div>
        </main>
        <script>window.print();</script>
      </body>
    </html>
  `);
  popup.document.close();
}

export function Sidebar({
  user,
  shop,
  onLogout,
  admin,
  activeView = 'dashboard',
  onViewChange,
}: {
  user: User;
  shop: Shop | null;
  onLogout: () => void;
  admin?: boolean;
  activeView?: 'dashboard' | 'profile';
  onViewChange?: (view: 'dashboard' | 'profile') => void;
}) {
  const customerShopUrl = shop ? getCustomerShopUrl(shop) : '';

  return (
    <aside className="rounded-[24px] border border-border bg-card/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.3)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 rounded-[18px] bg-gradient-to-r from-primary/20 to-accent/10 p-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-r from-primary to-accent">
          <Printer className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Printtary</p>
          <p className="text-xs text-secondary">{admin ? 'Admin Console' : 'Shop Console'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={() => onViewChange?.('dashboard')}
          className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-semibold transition ${
            activeView === 'dashboard'
              ? 'border border-primary/25 bg-primary/15 text-primary-light'
              : 'text-secondary hover:bg-surface hover:text-primary-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        {!admin && shop ? (
          <button
            type="button"
            onClick={() => onViewChange?.('profile')}
            className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-semibold transition ${
              activeView === 'profile'
                ? 'border border-primary/25 bg-primary/15 text-primary-light'
                : 'text-secondary hover:bg-surface hover:text-primary-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            Profile
          </button>
        ) : null}
        {shop ? (
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-semibold text-secondary transition hover:bg-surface hover:text-primary-foreground">
                <QrCode className="h-4 w-4" />
                QR Code
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{shop.name} QR Code Poster</DialogTitle>
                <DialogDescription>Print this poster and place it at your counter.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="rounded-[18px] border border-success/25 bg-success/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-success/15 text-success">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary-foreground">Secure your document.</p>
                      <p className="mt-1 text-sm leading-6 text-secondary">
                        No login required. Files auto delete after expiry. Shop owner cannot open the document without the customer OTP.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 rounded-[20px] border border-border bg-white p-5 text-slate-950 md:grid-cols-[1fr_210px]">
                  <div className="grid content-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Customer Instructions</p>
                      <h3 className="mt-2 text-3xl font-black leading-tight">Scan to send your document</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Scan this QR, upload the document, select print settings, and share OTP only at the counter when ready to print.
                      </p>
                    </div>
                    <div className="rounded-[14px] bg-slate-100 p-3 text-sm font-semibold text-slate-700">
                      {shop.name}<br />
                      <span className="font-normal">{shop.address}</span>
                    </div>
                  </div>
                  <div className="grid place-items-center rounded-[18px] border border-slate-200 bg-white p-3">
                    <QrCodeSvg value={customerShopUrl} className="h-44 w-44 [&_svg]:h-full [&_svg]:w-full" />
                  </div>
                </div>

                <div className="rounded-[16px] border border-border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 text-primary-light" />
                    <div>
                      <p className="font-semibold">For shop owner</p>
                      <p className="mt-1 text-sm leading-6 text-secondary">
                        Print this QR poster and paste it in your shop. Customers will scan it to send documents to your queue. After OTP verification, you can preview the document and download/print it for the customer.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="break-all rounded-[12px] border border-border bg-surface p-3 text-xs text-secondary">
                  {customerShopUrl}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" onClick={() => printQrPoster(shop)}>
                    <Printer className="h-4 w-4" />
                    Print Poster
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => downloadQr(shop)}>
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
        <div className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-semibold text-secondary">
          <ShieldCheck className="h-4 w-4" />
          Secure Access
        </div>
      </div>

      <Button variant="secondary" className="mt-6 w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </aside>
  );
}
