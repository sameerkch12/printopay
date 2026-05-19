import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Printtary Shop Dashboard',
  description: 'Shop owner dashboard for secure print jobs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
