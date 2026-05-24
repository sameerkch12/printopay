'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Hourglass, XCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { OtpPrintPanel } from '@/components/jobs/job-details';
import { JobsCard } from '@/components/jobs/jobs-card';
import { Sidebar, ShopView } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { MetricCard } from '@/components/shared/metric-card';
import {
  DocumentAsset,
  listMyShopJobs,
  PrintJob,
  PrintSettings,
  Shop,
  updateJobStatus,
  User,
  forceHttpsForRenderUrl,
  verifyShopOtp,
} from '@/lib/api';
import { getRealtimeSocket } from '@/lib/realtime';
import { ShopProfile } from './shop-profile';
import { QrPoster } from './qr-poster';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function openPrintWindow(url: string, job: PrintJob, document?: DocumentAsset, settings?: PrintSettings) {
  const printDocumentUrl = forceHttpsForRenderUrl(url);
  const mimeType = document?.mimeType ?? job.document?.mimeType;
  const fileName = document?.originalName ?? job.document?.originalName ?? 'Document';
  const printSettings = settings ?? job.settings;
  const response = await fetch(printDocumentUrl);
  if (!response.ok) {
    throw new Error('Document load nahi hua');
  }

  const blob = await response.blob();
  const printableBlob = blob.type ? blob : blob.slice(0, blob.size, mimeType || 'application/pdf');
  const blobUrl = URL.createObjectURL(printableBlob);

  if (mimeType?.startsWith('image/')) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      return;
    }

    const copies = Math.max(1, Math.min(printSettings?.copies ?? 1, 50));
    const orientation = printSettings?.orientation === 'landscape' ? 'landscape' : 'portrait';
    const pages = Array.from({ length: copies }, (_, index) => `
      <section class="page">
        <img src="${blobUrl}" alt="${escapeHtml(fileName)} copy ${index + 1}" />
      </section>
    `).join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(fileName)}</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 ${orientation}; margin: 10mm; }
            body { margin: 0; background: #fff; }
            .page {
              page-break-after: always;
              width: 100%;
              min-height: 100vh;
              display: grid;
              place-items: center;
            }
            .page:last-child { page-break-after: auto; }
            img {
              max-width: 100%;
              max-height: 96vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          ${pages}
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 600);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  const printWindow = window.open(blobUrl, '_blank', 'width=900,height=700');

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    window.open(printDocumentUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  printWindow.document.title = fileName;
  printWindow.addEventListener('load', () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }, 800);
  }, { once: true });
}

async function downloadDocument(url: string, document: DocumentAsset) {
  const downloadUrl = forceHttpsForRenderUrl(url);
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error('Document download nahi hua');
  }

  const blob = await response.blob();
  const downloadBlob = blob.type ? blob : blob.slice(0, blob.size, document.mimeType || 'application/pdf');
  const blobUrl = URL.createObjectURL(downloadBlob);
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = document.originalName || 'document';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function documentIdOf(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) return String(value._id);
  return '';
}

function getDocumentSettings(job: PrintJob, documentId: string, index: number) {
  return (
    job.documentSettings?.find((item) => item.documentId === documentId || documentIdOf(item.document) === documentId)?.settings ??
    job.documentSettings?.[index]?.settings ??
    job.settings
  );
}

export function ShopOwnerDashboard({
  token,
  user,
  shop,
  onLogout,
}: {
  token: string;
  user: User;
  shop: Shop | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [query, setQuery] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [printMessage, setPrintMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string>();
  const [printingDocumentId, setPrintingDocumentId] = useState<string>();
  const [printedDocumentIds, setPrintedDocumentIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ShopView>('dashboard');
  const [currentShop, setCurrentShop] = useState(shop);
  const [verifiedPrint, setVerifiedPrint] = useState<{
    job: PrintJob;
    printUrl: string;
    printUrls?: { documentId: string; url: string }[];
  } | null>(null);
  const shopApproved = currentShop?.approvalStatus === 'approved' && currentShop.isActive;

  useEffect(() => {
    setCurrentShop(shop);
  }, [shop]);

  useEffect(() => {
    if (pathname.endsWith('/qr')) {
      setView('qr');
      return;
    }

    if (pathname.endsWith('/profile')) {
      setView('profile');
      return;
    }

    setView('dashboard');
  }, [pathname]);

  const handleViewChange = (nextView: ShopView) => {
    setView(nextView);
    router.push(nextView === 'dashboard' ? '/shop' : `/shop/${nextView}`);
  };

  const loadJobs = useCallback(async () => {
    const data = await listMyShopJobs(token);
    setJobs(data);
  }, [token]);

  useEffect(() => {
    if (!shopApproved) return;
    loadJobs().catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load jobs'));
  }, [loadJobs, shopApproved]);

  useEffect(() => {
    if (!shopApproved) return;

    const socket = getRealtimeSocket();
    const refreshJobs = (payload?: { shopId?: string }) => {
      if (payload?.shopId && payload.shopId !== currentShop?._id) return;
      loadJobs().catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load jobs'));
    };

    socket.on('print-jobs:changed', refreshJobs);

    return () => {
      socket.off('print-jobs:changed', refreshJobs);
    };
  }, [loadJobs, currentShop?._id, shopApproved]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return jobs;
    return jobs.filter((job) =>
      [job.jobNumber, job.document?.originalName, job.status].some((value) => value?.toLowerCase().includes(term))
    );
  }, [jobs, query]);

  const pending = jobs.filter((job) => job.status === 'pending').length;
  const successful = jobs.filter((job) => job.status === 'completed').length;

  useEffect(() => {
    setOtp('');
    setMessage('');
    setPrintMessage('');
    setDownloadingDocumentId(undefined);
    setPrintingDocumentId(undefined);
    setPrintedDocumentIds(new Set());
    setVerifiedPrint(null);
  }, []);

  const handleVerifyOtp = async () => {
    if (!shopApproved || otp.length !== 4) return;
    setBusy(true);
    setMessage('');
    setPrintMessage('Print code verify ho raha hai...');
    try {
      const data = await verifyShopOtp(token, otp);
      await loadJobs();
      setVerifiedPrint({ job: data.printJob, printUrl: data.printUrl, printUrls: data.printUrls });
      setPrintingDocumentId(undefined);
      setPrintedDocumentIds(new Set());
      setMessage(`Print code verified for ${data.printJob.jobNumber}. Review settings, then print.`);
      setPrintMessage('Print code verified. Customer settings are shown below.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Print code verification failed');
      setPrintMessage('');
    } finally {
      setBusy(false);
    }
  };

  const handlePrintVerified = async (documentId: string, index: number) => {
    if (!verifiedPrint) return;
    const documents = verifiedPrint.job.documents?.length ? verifiedPrint.job.documents : [verifiedPrint.job.document];
    const document = documents.find((item) => item._id === documentId) ?? documents[index];
    const printUrl =
      verifiedPrint.printUrls?.find((item) => item.documentId === documentId)?.url ??
      verifiedPrint.printUrls?.[index]?.url ??
      (index === 0 ? verifiedPrint.printUrl : undefined);

    if (!document || !printUrl) {
      setMessage('Is file ka print URL nahi mila. Print code dobara verify karein.');
      return;
    }

    setBusy(true);
    setPrintingDocumentId(documentId);
    setMessage('');
    setPrintMessage(`${document.originalName ?? `File ${index + 1}`} open ho raha hai. Please wait...`);
    try {
      await openPrintWindow(printUrl, verifiedPrint.job, document, getDocumentSettings(verifiedPrint.job, documentId, index));
      const nextPrintedDocumentIds = new Set(printedDocumentIds);
      nextPrintedDocumentIds.add(documentId);
      setPrintedDocumentIds(nextPrintedDocumentIds);

      if (documents.every((item) => nextPrintedDocumentIds.has(item._id))) {
        await updateJobStatus(token, verifiedPrint.job._id, 'completed');
        await loadJobs();
        setMessage(`All files opened for ${verifiedPrint.job.jobNumber}.`);
      } else {
        setMessage(`Print opened for ${document.originalName ?? `File ${index + 1}`}.`);
      }
      setPrintMessage('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not open document');
      setPrintMessage('');
    } finally {
      setBusy(false);
      setPrintingDocumentId(undefined);
    }
  };

  const handleDownloadVerified = async (documentId: string, index: number) => {
    if (!verifiedPrint) return;
    const documents = verifiedPrint.job.documents?.length ? verifiedPrint.job.documents : [verifiedPrint.job.document];
    const document = documents.find((item) => item._id === documentId) ?? documents[index];
    const printUrl =
      verifiedPrint.printUrls?.find((item) => item.documentId === documentId)?.url ??
      verifiedPrint.printUrls?.[index]?.url ??
      (index === 0 ? verifiedPrint.printUrl : undefined);

    if (!document || !printUrl) {
      setMessage('Is file ka download URL nahi mila. Print code dobara verify karein.');
      return;
    }

    setBusy(true);
    setDownloadingDocumentId(documentId);
    setMessage('');
    setPrintMessage(`${document.originalName ?? `File ${index + 1}`} download ho raha hai. Please wait...`);
    try {
      await downloadDocument(printUrl, document);
      setMessage(`${document.originalName ?? `File ${index + 1}`} download started.`);
      setPrintMessage('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not download document');
      setPrintMessage('');
    } finally {
      setBusy(false);
      setDownloadingDocumentId(undefined);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[260px_1fr]">
      <Sidebar user={user} shop={currentShop} onLogout={onLogout} activeView={view} onViewChange={handleViewChange} />
      <section className="grid gap-5">
        <TopBar
          title={view === 'profile' ? 'Shop Profile' : view === 'qr' ? 'QR Code Poster' : 'Shop Owner Dashboard'}
          subtitle={
            view === 'profile'
              ? 'Edit your shop details, rates, and public photo.'
              : view === 'qr'
                ? 'Print or save your customer scan poster.'
                : shopApproved
                  ? 'Enter customer print code and print the matched document.'
                  : 'Your shop is waiting for admin approval.'
          }
        />
        {view === 'profile' && currentShop ? (
          <ShopProfile token={token} shop={currentShop} onShopUpdated={setCurrentShop} />
        ) : view === 'qr' && currentShop ? (
          <QrPoster shop={currentShop} />
        ) : !shopApproved ? (
          <div className="rounded-[24px] border border-border bg-card p-8 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <div className="flex max-w-2xl flex-col gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-warning/15 text-warning">
                {shop?.approvalStatus === 'rejected' ? <XCircle className="h-7 w-7" /> : <Hourglass className="h-7 w-7" />}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {currentShop?.approvalStatus === 'rejected' ? 'Shop approval rejected' : 'Wait for admin approval'}
                </p>
                <p className="mt-2 text-secondary">
                  {currentShop?.approvalStatus === 'rejected'
                    ? 'Your shop is not live right now. Please contact the admin before accepting print jobs.'
                    : 'Your registration is submitted. Once admin approves the shop, print code verification and print queue will be available here.'}
                </p>
              </div>
              <div className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 text-sm text-secondary sm:grid-cols-2">
                <span>Shop: <strong className="text-primary-foreground">{currentShop?.name ?? 'Not linked'}</strong></span>
                <span>Status: <strong className="text-primary-foreground">{currentShop?.approvalStatus ?? 'pending'}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard icon={Clock3} label="Pending Code" value={pending} tone="warning" />
          <MetricCard icon={CheckCircle2} label="Successful Print" value={successful} tone="success" />
        </div>
        {message ? <p className="rounded-[14px] border border-border bg-card p-3 text-sm text-secondary">{message}</p> : null}
        <div className="grid gap-5">
          <OtpPrintPanel
            busy={busy}
            otp={otp}
            setOtp={(value) => {
              setOtp(value);
              setVerifiedPrint(null);
              setPrintMessage('');
              setDownloadingDocumentId(undefined);
              setPrintingDocumentId(undefined);
              setPrintedDocumentIds(new Set());
            }}
            printMessage={printMessage}
            verifiedJob={verifiedPrint?.job ?? null}
            onVerifyOtp={handleVerifyOtp}
            onDownload={handleDownloadVerified}
            onPrint={handlePrintVerified}
            downloadingDocumentId={downloadingDocumentId}
            printingDocumentId={printingDocumentId}
          />
          <JobsCard jobs={filtered} query={query} setQuery={setQuery} />
        </div>
          </>
        )}
      </section>
    </div>
  );
}
