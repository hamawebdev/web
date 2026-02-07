'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit,
  UserX,
  Key,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users
} from 'lucide-react';
import { ApiUser } from '@/types/api';
import { AdminService } from '@/lib/api-services';
import { EditUserDialog } from './edit-user-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface UserTableProps {
  users: ApiUser[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateUser: (userId: number, userData: Partial<ApiUser>) => Promise<ApiUser>;
  onDeactivateUser: (userId: number) => Promise<ApiUser>;
  onDeleteUser?: (userId: number) => Promise<any>;
  onResetPassword: (userId: number, newPassword: string) => Promise<any>;
}

export function UserTable({
  users,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateUser,
  onDeactivateUser,
  onDeleteUser,
  onResetPassword,
}: UserTableProps) {
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<ApiUser | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<ApiUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ApiUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'EMPLOYEE':
        return 'default';
      case 'STUDENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const handleDeactivateUser = async () => {
    if (!deactivateUser) return;

    try {
      setActionLoading(deactivateUser.id);
      await onDeactivateUser(deactivateUser.id);
      setDeactivateUser(null);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    const target = deleteUser || deactivateUser;
    if (!target) return;

    try {
      setActionLoading(target.id);
      if (typeof onDeleteUser === 'function') {
        await onDeleteUser(target.id);
      } else {
        // If parent didn't provide a delete handler (shouldn't happen), call AdminService.deleteUser directly
        await AdminService.deleteUser(target.id);
      }
      setDeleteUser(null);
      setDeactivateUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async (userData: Partial<ApiUser>) => {
    if (!editingUser) return;

    try {
      setActionLoading(editingUser.id);
      await onUpdateUser(editingUser.id, userData);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetPasswordUser) return;

    try {
      setActionLoading(resetPasswordUser.id);
      await onResetPassword(resetPasswordUser.id, newPassword);
      setResetPasswordUser(null);
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No users found</h3>
        <p className="text-muted-foreground mb-4">
          There are no users matching your current criteria.
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any).profilePicture} alt={user.fullName} />
                      <AvatarFallback>
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {user.university?.name || 'N/A'}
                  </div>
                  {user.specialty && (
                    <div className="text-xs text-muted-foreground">
                      {user.specialty.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.isActive)}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteUser(user)}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1}
              className="hidden sm:flex"
            >
              First
            </Button>
            
            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Adjust start if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                // Add ellipsis at start if needed
                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={1 === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="start-ellipsis" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                }

                // Add visible page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={i === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(i)}
                      className="w-8 h-8 p-0"
                    >
                      {i}
                    </Button>
                  );
                }

                // Add ellipsis at end if needed
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="end-ellipsis" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={totalPages === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="hidden sm:flex"
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUpdateUser={handleUpdateUser}
          loading={actionLoading === editingUser.id}
        />
      )}

      {/* Reset Password Dialog */}
      {resetPasswordUser && (
        <ResetPasswordDialog
          user={resetPasswordUser}
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
          onResetPassword={handleResetPassword}
          loading={actionLoading === resetPasswordUser.id}
        />
      )}

      {/* Delete User Confirmation */}
      <AlertDialog
        open={!!(deleteUser || deactivateUser)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUser(null);
            setDeactivateUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {(deleteUser || deactivateUser)?.fullName}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
