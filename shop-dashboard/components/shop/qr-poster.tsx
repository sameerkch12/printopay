'use client';

import { Download, Printer, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createQrSvg, QrCodeSvg } from '@/components/shared/qr-code';
import { Shop } from '@/lib/api';

const CUSTOMER_APP_URL = (process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? 'http://localhost:8083').replace(/\/$/, '');

function getCustomerShopUrl(shop: Shop) {
  return `${CUSTOMER_APP_URL}/shop/${shop._id}`;
}

function slugify(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'shop';
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function svgToPng(svg: string, width = 1200, height = width) {
  return new Promise<{ blob: Blob; dataUrl: string }>((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas create nahi hua'));
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (!pngBlob) {
          reject(new Error('QR image create nahi hua'));
          return;
        }

        resolve({ blob: pngBlob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('QR load nahi hua'));
    };

    image.src = url;
  });
}

function createPosterSvg(shop: Shop, customerUrl: string) {
  const qrSvg = createQrSvg(customerUrl).replace('<svg ', '<svg x="255" y="535" width="470" height="470" ');
  const shopLine = `${shop.name} | ${shop.address}`;
  const dots = Array.from({ length: 36 }, (_, index) => {
    const x = 820 + (index % 6) * 28;
    const y = 70 + Math.floor(index / 6) * 28;
    return `<circle cx="${x}" cy="${y}" r="5" fill="#2563eb" opacity="0.48"/>`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="980" height="1380" viewBox="0 0 980 1380">
      <defs>
        <radialGradient id="topGlow" cx="88%" cy="12%" r="45%">
          <stop offset="0" stop-color="#2563eb" stop-opacity="0.16"/>
          <stop offset="1" stop-color="#2563eb" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.55" stop-color="#f8fbff"/>
          <stop offset="1" stop-color="#eaf3ff"/>
        </linearGradient>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1d4ed8"/>
          <stop offset="1" stop-color="#0ea5e9"/>
        </linearGradient>
        <linearGradient id="blueBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#1d4ed8"/>
          <stop offset="1" stop-color="#2563eb"/>
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#2563eb" flood-opacity="0.16"/>
        </filter>
      </defs>
      <rect width="980" height="1380" rx="48" fill="url(#bg)"/>
      <rect width="980" height="1380" fill="url(#topGlow)"/>
      <circle cx="-120" cy="-95" r="310" fill="none" stroke="#2563eb" stroke-width="88"/>
      <circle cx="-120" cy="-95" r="390" fill="none" stroke="#2563eb" stroke-opacity="0.12" stroke-width="42"/>
      <circle cx="1150" cy="1465" r="370" fill="none" stroke="#2563eb" stroke-opacity="0.75" stroke-width="84"/>
      <circle cx="1150" cy="1465" r="458" fill="none" stroke="#2563eb" stroke-opacity="0.11" stroke-width="42"/>
      ${dots}

      <g transform="translate(0 70)">
        <rect x="328" y="0" width="86" height="86" rx="24" fill="url(#brand)"/>
        <path d="M371 25c-15 0-27 12-27 27v7h18v-7c0-5 4-9 9-9s9 4 9 9v7h18v-7c0-15-12-27-27-27z" fill="#ffffff"/>
        <rect x="342" y="54" width="58" height="35" rx="9" fill="#ffffff"/>
        <circle cx="371" cy="70" r="6" fill="#1d4ed8"/>
        <rect x="368" y="75" width="6" height="11" rx="3" fill="#1d4ed8"/>
        <text x="438" y="51" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="#0f172a">PRINTO<tspan fill="#1d4ed8">PAY</tspan></text>
        <text x="440" y="85" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="10" fill="#1d4ed8">SECURE PRINT</text>
      </g>

      <text x="490" y="285" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="900" fill="#071a38">Scan &amp; Send</text>
      <text x="490" y="372" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="900" fill="#1d4ed8">Your Document</text>

      <rect x="250" y="430" width="480" height="58" rx="29" fill="#d1fae5"/>
      <text x="490" y="469" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#065f46">Secure Your Document.</text>

      <g filter="url(#softShadow)">
        <rect x="220" y="500" width="540" height="540" rx="52" fill="#ffffff" opacity="0.94"/>
        <path d="M266 576v-52h52M714 576v-52h-52M266 964v52h52M714 964v52h-52" fill="none" stroke="#2563eb" stroke-width="11" stroke-linecap="round"/>
        <rect x="255" y="535" width="470" height="470" fill="#ffffff"/>
        ${qrSvg}
      </g>

      <text x="490" y="1086" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" letter-spacing="1.5" fill="#1d4ed8">EASY 3 STEPS</text>
      ${[
        ['1', 'Scan QR'],
        ['2', 'Upload document'],
        ['3', 'Share code'],
      ].map(([step, text], index) => {
        const x = 120 + index * 280;
        const lines = text === 'Upload document' ? ['Upload', 'document'] : [text];
        const lineHeight = 34;
        const firstLineY = 1208 - ((lines.length - 1) * lineHeight) / 2;
        return `
          <g>
            <rect x="${x}" y="1130" width="230" height="150" rx="26" fill="#ffffff" opacity="0.9" filter="url(#softShadow)"/>
            <circle cx="${x + 34}" cy="1130" r="32" fill="#1d4ed8"/>
            <text x="${x + 34}" y="1142" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#ffffff">${step}</text>
            <text text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900" fill="#1d4ed8">
              ${lines.map((line, lineIndex) => `<tspan x="${x + 115}" y="${firstLineY + lineIndex * lineHeight}">${escapeXml(line)}</tspan>`).join('')}
            </text>
          </g>
        `;
      }).join('')}

      <rect x="95" y="1304" width="790" height="52" rx="18" fill="url(#blueBar)"/>
      <text x="490" y="1337" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#ffffff">${escapeXml(shopLine)}</text>
    </svg>
  `;
}

export function QrPoster({ shop }: { shop: Shop }) {
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const customerUrl = getCustomerShopUrl(shop);
  const downloadQr = async () => {
    const svg = createQrSvg(customerUrl);
    const { blob } = await svgToPng(svg);
    const pngUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${slugify(shop.name)}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(pngUrl);
  };

  const downloadPosterPdf = async () => {
    if (isPdfDownloading) return;

    setIsPdfDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const posterSvg = createPosterSvg(shop, customerUrl);
      const posterImage = await svgToPng(posterSvg, 1960, 2760);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      pdf.addImage(posterImage.dataUrl, 'PNG', 0, 0, 148, 210);
      pdf.save(`${slugify(shop.name)}-qr-poster.pdf`);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .qr-print-area, .qr-print-area * { visibility: visible !important; }
          .qr-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">QR Code Poster</p>
          <p className="text-sm text-secondary">This route stays inside the shop console. Use print to save as PDF.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={downloadPosterPdf} disabled={isPdfDownloading}>
            <Printer className="h-4 w-4" />
            {isPdfDownloading ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
          <Button type="button" variant="secondary" onClick={downloadQr}>
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        </div>
      </div>

      <section className="qr-print-area relative mx-auto min-h-[690px] w-full max-w-[490px] overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_88%_12%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_8%_0%,rgba(37,99,235,0.24),transparent_30%),linear-gradient(145deg,#ffffff_0%,#f8fbff_52%,#eaf3ff_100%)] px-8 py-6 text-[#071a38] shadow-[0_24px_64px_rgba(15,70,158,0.2)]">
        <div className="absolute -left-[200px] -top-[140px] h-[310px] w-[310px] rounded-full border-[44px] border-blue-600 shadow-[0_0_0_20px_rgba(37,99,235,0.12)]" />
        <div className="absolute -bottom-[190px] -right-[230px] h-[370px] w-[370px] rounded-full border-[42px] border-blue-600/75 shadow-[0_0_0_20px_rgba(37,99,235,0.11)]" />
        <div className="absolute right-7 top-7 grid grid-cols-6 gap-2.5 opacity-50">
          {Array.from({ length: 36 }, (_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center gap-3 text-left">
          <div className="grid h-12 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-blue-700 to-sky-500 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[26px] font-black leading-none tracking-wide text-slate-950">PRINTO<span className="text-blue-700">PAY</span></p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.32em] text-blue-700">Secure Print</p>
          </div>
        </div>

        <h1 className="relative z-10 mt-4 text-center text-[40px] font-black leading-none tracking-[-0.04em] text-slate-950">
          Scan &amp; Send
          <span className="block text-blue-700">Your Document</span>
        </h1>

        <div className="relative z-10 mx-auto mt-4 max-w-[330px] text-center">
          <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-[18px] font-black text-emerald-800">
            Secure Your Document.
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-7 grid h-[304px] w-[304px] place-items-center rounded-[24px] bg-white/90 p-5 shadow-[inset_0_0_34px_rgba(37,99,235,0.08),0_18px_42px_rgba(37,99,235,0.16)]">
          <div className="absolute inset-6 rounded-[14px] bg-[linear-gradient(#2563eb,#2563eb)_left_top/28px_4px_no-repeat,linear-gradient(#2563eb,#2563eb)_left_top/4px_28px_no-repeat,linear-gradient(#2563eb,#2563eb)_right_top/28px_4px_no-repeat,linear-gradient(#2563eb,#2563eb)_right_top/4px_28px_no-repeat,linear-gradient(#2563eb,#2563eb)_left_bottom/28px_4px_no-repeat,linear-gradient(#2563eb,#2563eb)_left_bottom/4px_28px_no-repeat,linear-gradient(#2563eb,#2563eb)_right_bottom/28px_4px_no-repeat,linear-gradient(#2563eb,#2563eb)_right_bottom/4px_28px_no-repeat]" />
          <div className="relative z-10 bg-white p-1.5">
            <QrCodeSvg value={customerUrl} className="h-[250px] w-[250px] [&_svg]:h-full [&_svg]:w-full" />
          </div>
        </div>

        <p className="relative z-10 mt-4 text-center text-[18px] font-black tracking-wide text-blue-700">EASY 3 STEPS</p>
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-4">
          {[
            ['1', 'Scan QR'],
            ['2', 'Upload document'],
            ['3', 'Share code'],
          ].map(([step, text]) => (
            <div key={step} className="relative grid min-h-[92px] place-items-center rounded-[14px] bg-white/85 px-2.5 py-3 text-center shadow-[0_12px_28px_rgba(37,99,235,0.13)]">
              <span className="absolute left-3 top-[-14px] grid h-8 w-8 place-items-center rounded-full bg-blue-700 text-[18px] font-black text-white">{step}</span>
              <p className="text-[16px] font-black leading-tight text-blue-700">{text}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-[72px_1fr] items-center gap-3.5 rounded-[16px] bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3.5 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[14px] font-black tracking-wide">YOUR PRIVACY. OUR PRIORITY.</p>
            <p className="mt-1 text-[12px]">Documents are safe, secure &amp; auto deleted.</p>
          </div>
        </div>

        <p className="relative z-10 mt-3 text-center text-[10px] text-slate-600">
          <strong>{shop.name}</strong> &middot; {shop.address}
        </p>
      </section>
    </div>
  );
}
