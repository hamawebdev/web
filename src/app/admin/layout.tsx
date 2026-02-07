// @ts-nocheck
'use client';

import { AuthenticatedLayout } from '@/components/admin/layout/authenticated-layout';
import { AdminAuthGuard } from '@/components/auth/auth-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </AdminAuthGuard>
  );
}
