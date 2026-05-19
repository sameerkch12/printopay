const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export type Role = 'shop_owner' | 'admin';
export type PrintStatus = 'pending' | 'processing' | 'printing' | 'completed' | 'failed' | 'expired';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  shop?: Shop;
};

export type Shop = {
  _id: string;
  name: string;
  address: string;
  phone: string;
  photoUrl?: string;
  qrCode: string;
  isActive: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  latitude?: number;
  longitude?: number;
  printRates?: {
    bwPerPage: number;
    colorPerPage: number;
  };
  createdAt?: string;
};

export type DocumentAsset = {
  _id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicId: string;
  expiresAt: string;
};

export type PrintJob = {
  _id: string;
  jobNumber: string;
  document: DocumentAsset;
  shop: Shop;
  settings: {
    color: 'bw' | 'color';
    copies: number;
    pageRange: string;
    orientation: 'portrait' | 'landscape';
    sides: 'single' | 'double';
    paperSize: string;
  };
  status: PrintStatus;
  estimatedPages: number;
  otpExpiresAt: string;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type AuthPayload = {
  token: string;
  user: User;
  shop?: Shop;
};

async function request<T>(path: string, init?: RequestInit & { token?: string }) {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (init?.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) {
    throw new Error(payload.message ?? 'Request failed');
  }

  return payload.data;
}

export function login(email: string, password: string) {
  return request<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerShopOwner(input: {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  shop: {
    name: string;
    address: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    printRates?: {
      bwPerPage: number;
      colorPerPage: number;
    };
  };
}) {
  return request<AuthPayload>('/auth/shop-owner/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setupAdmin(input: {
  setupKey: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  return request<AuthPayload>('/auth/admin/setup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe(token: string) {
  return request<{ user: User; shop?: Shop }>('/auth/me', { token });
}

export function listMyShopJobs(token: string) {
  return request<PrintJob[]>('/print-jobs/shop/mine', { token });
}

export function verifyOtp(token: string, jobId: string, otp: string) {
  return request<{ printJob: PrintJob; signedUrl: string; printUrl: string }>(`/print-jobs/${jobId}/verify-otp`, {
    method: 'POST',
    token,
    body: JSON.stringify({ otp }),
  });
}

export function verifyShopOtp(token: string, otp: string) {
  return request<{ printJob: PrintJob; signedUrl: string; printUrl: string }>('/print-jobs/verify-otp', {
    method: 'POST',
    token,
    body: JSON.stringify({ otp }),
  });
}

export function updateJobStatus(token: string, jobId: string, status: PrintStatus) {
  return request<PrintJob>(`/print-jobs/${jobId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export function getAdminOverview(token: string) {
  return request<{
    shops: number;
    users: number;
    documents: number;
    jobs: number;
    pendingJobs: number;
    completedJobs: number;
  }>('/admin/overview', { token });
}

export function listAdminShops(token: string) {
  return request<Shop[]>('/admin/shops', { token });
}

export function updateShopApproval(token: string, shopId: string, approvalStatus: 'pending' | 'approved' | 'rejected') {
  return request<Shop>(`/admin/shops/${shopId}/approval`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ approvalStatus }),
  });
}

export function updateMyShopProfile(token: string, input: {
  name: string;
  address: string;
  phone: string;
  bwPerPage: number;
  colorPerPage: number;
  photo?: File | null;
}) {
  const form = new FormData();
  form.set('name', input.name);
  form.set('address', input.address);
  form.set('phone', input.phone);
  form.set('bwPerPage', String(input.bwPerPage));
  form.set('colorPerPage', String(input.colorPerPage));
  if (input.photo) {
    form.set('photo', input.photo);
  }

  return request<Shop>('/shops/mine', {
    method: 'PATCH',
    token,
    body: form,
  });
}

export function listAdminJobs(token: string) {
  return request<PrintJob[]>('/admin/print-jobs', { token });
}

export function listAdminUsers(token: string) {
  return request<User[]>('/admin/users', { token });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
