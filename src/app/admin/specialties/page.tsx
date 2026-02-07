'use client';

import { SpecialtyManagement } from '@/components/admin/specialties/specialty-management';

/**
 * Admin Specialties Management Page
 *
 * Dedicated page for managing medical specialties in the system.
 * Provides full CRUD operations for specialty management.
 */
export default function AdminSpecialtiesPage() {
  return (
    <div className="flex-1 p-6">
      <SpecialtyManagement />
    </div>
  );
}
