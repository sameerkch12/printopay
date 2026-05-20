'use client';

import { LayoutDashboard, LogOut, Printer, QrCode, Settings, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Shop, User } from '@/lib/api';

export type ShopView = 'dashboard' | 'profile' | 'qr';

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
  activeView?: ShopView;
  onViewChange?: (view: ShopView) => void;
}) {
  return (
    <aside className="rounded-[24px] border border-border bg-card/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.3)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 rounded-[18px] bg-gradient-to-r from-primary/20 to-accent/10 p-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-r from-primary to-accent">
          <Printer className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">PrintoPay</p>
          <p className="text-xs text-secondary">{admin ? 'Admin Console' : 'Shop Console'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <NavButton active={activeView === 'dashboard'} icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => onViewChange?.('dashboard')}>
          Dashboard
        </NavButton>
        {!admin && shop ? (
          <>
            <NavButton active={activeView === 'profile'} icon={<Settings className="h-4 w-4" />} onClick={() => onViewChange?.('profile')}>
              Profile
            </NavButton>
            <NavButton active={activeView === 'qr'} icon={<QrCode className="h-4 w-4" />} onClick={() => onViewChange?.('qr')}>
              QR Code
            </NavButton>
          </>
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

function NavButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? 'border border-primary/25 bg-primary/15 text-primary-light'
          : 'text-secondary hover:bg-surface hover:text-primary-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
