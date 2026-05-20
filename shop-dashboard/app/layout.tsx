import type { Metadata } from 'next';
import { ErrorReporter } from '@/components/shared/error-reporter';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrintoPay Shop Dashboard',
  description: 'Shop owner dashboard for secure print jobs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
