'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { useUserManagement } from '@/hooks/admin/use-user-management';
import { UserTable } from '@/components/admin/users/user-table';
import { UserFilters } from '@/components/admin/users/user-filters';
import { CreateUserDialog } from '@/components/admin/users/create-user-dialog';

/**
 * Admin Users Management Page
 *
 * Main page for managing all users in the system with filtering,
 * search, pagination, and user actions.
 */
export default function AdminUsersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    users,
    totalUsers,
    stats,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    createUser,
    updateUser,
    deactivateUser,
    deleteUser,
    resetUserPassword,
    reactivateSubscription,
    goToPage,
    hasUsers,
    hasError,
    hasFilters,
  } = useUserManagement();

  const handleCreateUser = async (userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'ADMIN' | 'EMPLOYEE';
    universityId?: number;
    specialtyId?: number;
    currentYear?: string;
  }) => {
    try {
      await createUser(userData);
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and access permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats over every user, whatever the search and filters: Active + Non-active = Total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Total Users',
            icon: Users,
            value: stats?.totalUsers,
            caption: 'All accounts, whatever the filters',
          },
          {
            title: 'Active',
            icon: UserCheck,
            value: stats?.activeUsers,
            caption: 'Subscription active and not past its end date',
          },
          {
            title: 'Non-active',
            icon: UserMinus,
            value: stats?.nonActiveUsers,
            caption: stats
              ? `Everyone else, incl. ${stats.deactivatedUsers.toLocaleString()} deactivated`
              : 'Everyone else, incl. deactivated accounts',
          },
          { title: 'Students', value: stats?.students, caption: 'Students in system' },
          { title: 'Employees', value: stats?.employees, caption: 'Employees in system' },
          { title: 'Admins', value: stats?.admins, caption: 'Admins in system' },
        ].map(({ title, icon: Icon, value, caption }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {value !== undefined ? (
                  value.toLocaleString()
                ) : hasError ? (
                  '—'
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{caption}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>
              Filter users by role, university, status, or search by name/email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              hasFilters={hasFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
            {hasFilters && (
              <Badge variant="outline" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading ? (
              'Loading users...'
            ) : hasUsers ? (
              `Showing ${users.length} of ${totalUsers} users (Page ${currentPage} of ${totalPages})`
            ) : hasFilters ? (
              'No users found matching the current filters'
            ) : (
              'No users found in the system'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onUpdateUser={updateUser}
            onDeactivateUser={deactivateUser}
            onDeleteUser={deleteUser}
            onResetPassword={resetUserPassword}
            onReactivateSubscription={reactivateSubscription}
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
}
