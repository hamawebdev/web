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
  UserPlus
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
    totalEmployees,
    totalAdmins,
    totalStudents,
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

      {/* Stats Section - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                totalUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Fetching user data...' : hasFilters ? 'Filtered results' : 'All users in system'}
            </p>
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                (totalStudents || 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Students in system</p>
          </CardContent>
        </Card>

        {/* Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                (totalEmployees || 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Employees in system</p>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                (totalAdmins || 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Admins in system</p>
          </CardContent>
        </Card>
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
