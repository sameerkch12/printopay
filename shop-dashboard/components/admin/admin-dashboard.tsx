'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, FileText, Printer, Store, Users } from 'lucide-react';
import { JobRow } from '@/components/jobs/job-row';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { MetricCard } from '@/components/shared/metric-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAdminOverview,
  listAdminJobs,
  listAdminShops,
  listAdminUsers,
  PrintJob,
  Shop,
  updateShopApproval,
  User,
} from '@/lib/api';
import { getRealtimeSocket } from '@/lib/realtime';
import { AdminList } from './admin-list';

export function AdminDashboard({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: User;
  onLogout: () => void;
}) {
  const [overview, setOverview] = useState({ shops: 0, users: 0, documents: 0, jobs: 0, pendingJobs: 0, completedJobs: 0 });
  const [shops, setShops] = useState<Shop[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  const loadAdminData = useCallback(async () => {
    const [overviewData, shopsData, jobsData, usersData] = await Promise.all([
      getAdminOverview(token),
      listAdminShops(token),
      listAdminJobs(token),
      listAdminUsers(token),
    ]);
    setOverview(overviewData);
    setShops(shopsData);
    setJobs(jobsData);
    setUsers(usersData);
  }, [token]);

  useEffect(() => {
    loadAdminData().catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load admin data'));
  }, [loadAdminData]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const refreshAdminData = () => {
      loadAdminData().catch((err) => setMessage(err instanceof Error ? err.message : 'Could not load admin data'));
    };

    socket.on('shops:changed', refreshAdminData);
    socket.on('print-jobs:changed', refreshAdminData);

    return () => {
      socket.off('shops:changed', refreshAdminData);
      socket.off('print-jobs:changed', refreshAdminData);
    };
  }, [loadAdminData]);

  const approveShop = async (shopId: string) => {
    setMessage('');
    try {
      await updateShopApproval(token, shopId, 'approved');
      await loadAdminData();
      setMessage('Shop approved and live for customers.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not approve shop');
    }
  };

  const shopItems = useMemo(() => shops.map((shop) => ({
    id: shop._id,
    title: shop.name,
    sub: shop.address,
    badge: shop.approvalStatus === 'approved' ? 'Live' : shop.approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
    meta: [
      shop.phone,
      `B/W ₹${shop.printRates?.bwPerPage ?? 2}/page`,
      `Color ₹${shop.printRates?.colorPerPage ?? 10}/page`,
      typeof shop.latitude === 'number' && typeof shop.longitude === 'number'
        ? `${shop.latitude.toFixed(5)}, ${shop.longitude.toFixed(5)}`
        : 'No location',
    ].join(' • '),
    actionLabel: shop.approvalStatus === 'approved' ? undefined : 'Approve Shop',
  })), [shops]);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[260px_1fr]">
      <Sidebar user={user} shop={null} onLogout={onLogout} admin />
      <section className="grid gap-5">
        <TopBar title="Admin Dashboard" subtitle="System-wide view of shops, users, documents, and jobs." />
        {message ? <p className="rounded-[14px] border border-error/30 bg-error/10 p-3 text-sm text-error">{message}</p> : null}
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard icon={Store} label="Shops" value={overview.shops} tone="primary" />
          <MetricCard icon={Users} label="Users" value={overview.users} tone="success" />
          <MetricCard icon={FileText} label="Documents" value={overview.documents} tone="warning" />
          <MetricCard icon={Printer} label="Jobs" value={overview.jobs} tone="primary" />
          <MetricCard icon={Clock3} label="Pending" value={overview.pendingJobs} tone="warning" />
          <MetricCard icon={CheckCircle2} label="Completed" value={overview.completedJobs} tone="success" />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <AdminList title="Shops" items={shopItems} onAction={approveShop} />
          <AdminList
            title="Users"
            items={users.map((adminUser) => ({
              id: adminUser.id ?? adminUser._id ?? adminUser.email,
              title: adminUser.name,
              sub: adminUser.email,
              badge: adminUser.role,
            }))}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Print Jobs</CardTitle>
            <CardDescription>Latest jobs across all shops.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {jobs.length ? jobs.slice(0, 12).map((job) => <JobRow key={job._id} job={job} selected={false} onSelect={() => undefined} />) : <EmptyState text="No print jobs found." />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
