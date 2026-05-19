'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AuthScreen } from '@/components/auth/auth-screen';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ShopOwnerDashboard } from '@/components/shop/shop-owner-dashboard';
import { AuthPayload, getMe, Shop, User } from '@/lib/api';
import { TOKEN_KEY } from '@/lib/constants';

type RouteMode = 'login' | 'admin' | 'shop';

function rolePath(role: User['role']) {
  return role === 'admin' ? '/admin' : '/shop';
}

export function AuthRoute({ mode }: { mode: RouteMode }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      if (mode !== 'login') router.replace('/login');
      setLoading(false);
      return;
    }

    getMe(stored)
      .then((data) => {
        const target = rolePath(data.user.role);
        setToken(stored);
        setUser(data.user);
        setShop(data.shop ?? null);

        if (mode === 'login' || (mode === 'admin' && data.user.role !== 'admin') || (mode === 'shop' && data.user.role !== 'shop_owner')) {
          router.replace(target);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (mode !== 'login') router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [mode, router]);

  const applyAuth = (payload: AuthPayload) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
    setShop(payload.shop ?? null);
    router.replace(rolePath(payload.user.role));
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setShop(null);
    router.replace('/login');
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="grid min-h-[70vh] place-items-center text-secondary">Loading secure console...</div>
      </DashboardShell>
    );
  }

  if (mode === 'login') {
    return (
      <DashboardShell>
        <AuthScreen onAuth={applyAuth} />
      </DashboardShell>
    );
  }

  if (!token || !user) {
    return (
      <DashboardShell>
        <div className="grid min-h-[70vh] place-items-center text-secondary">Redirecting to login...</div>
      </DashboardShell>
    );
  }

  if (mode === 'admin' && user.role === 'admin') {
    return (
      <DashboardShell>
        <AdminDashboard token={token} user={user} onLogout={logout} />
      </DashboardShell>
    );
  }

  if (mode === 'shop' && user.role === 'shop_owner') {
    return (
      <DashboardShell>
        <ShopOwnerDashboard token={token} user={user} shop={shop} onLogout={logout} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="grid min-h-[70vh] place-items-center text-secondary">Opening your dashboard...</div>
    </DashboardShell>
  );
}
