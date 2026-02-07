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
  Search,
  Filter,
  Key,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { useActivationCodesManagement } from '@/hooks/admin/use-activation-codes-management';
import { ActivationCodesTable } from '@/components/admin/activation-codes/activation-codes-table';
import { ActivationCodesFilters } from '@/components/admin/activation-codes/activation-codes-filters';
import { CreateActivationCodeDialog } from '@/components/admin/activation-codes/create-activation-code-dialog';
import { EditActivationCodeDialog } from '@/components/admin/activation-codes/edit-activation-code-dialog';
import { ActivationCode } from '@/types/api';

/**
 * Admin Activation Codes Management Page
 *
 * Main page for managing activation codes in the system with filtering,
 * search, pagination, and code actions.
 */
export default function AdminActivationCodesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<ActivationCode | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    codes,
    totalCodes,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    createCode,
    getCodeById,
    updateCode,
    deleteCode,
    deactivateCode,
    goToPage,
    hasCodes,
    hasError,
    hasFilters,
    refresh,
  } = useActivationCodesManagement();

  const handleCreateCode = async (codeData: any) => {
    try {
      await createCode(codeData);
      setShowCreateDialog(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleEditCode = (code: ActivationCode) => {
    setEditingCode(code);
    setShowEditDialog(true);
  };

  const handleUpdateCode = async (codeId: number, codeData: any) => {
    try {
      await updateCode(codeId, codeData);
      setShowEditDialog(false);
      setEditingCode(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      await deleteCode(codeId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeactivateCode = async (codeId: number) => {
    if (window.confirm('Are you sure you want to deactivate this activation code? This action cannot be undone.')) {
      try {
        await deactivateCode(codeId);
      } catch (error) {
        // Error is already handled in the hook
      }
    }
  };

  // Calculate stats from current page data
  const activeCodes = codes.filter(code => code.isActive).length;
  const totalUsage = codes.reduce((sum, code) => sum + code.currentUses, 0);
  const expiringCodes = codes.filter(code => {
    const expiryDate = new Date(code.expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return code.isActive && expiryDate <= thirtyDaysFromNow;
  }).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activation Codes</h2>
          <p className="text-muted-foreground">
            Manage activation codes for student subscriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCodes}</div>
            <p className="text-xs text-muted-foreground">
              All activation codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCodes}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCodes}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCodes > 0 && (
            <>
              Showing {codes.length} of {totalCodes} codes
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Filter activation codes by status, search terms, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivationCodesFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Activation Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activation Codes</CardTitle>
          <CardDescription>
            A list of all activation codes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivationCodesTable
            codes={codes}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onEditCode={handleEditCode}
            onDeleteCode={handleDeleteCode}
            onDeactivateCode={handleDeactivateCode}
          />
        </CardContent>
      </Card>

      {/* Create Code Dialog */}
      <CreateActivationCodeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCode={handleCreateCode}
      />

      {/* Edit Code Dialog */}
      <EditActivationCodeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateCode={handleUpdateCode}
        activationCode={editingCode}
      />
    </div>
  );
}
