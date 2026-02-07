'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';
import { Specialty } from '@/types/api';
import { EditSpecialtyDialog } from './edit-specialty-dialog';

interface SpecialtyTableProps {
  specialties: Specialty[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateSpecialty: (specialtyId: number, updateData: { name?: string }) => Promise<Specialty>;
  onDeleteSpecialty: (specialtyId: number) => Promise<boolean>;
}

export function SpecialtyTable({
  specialties,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateSpecialty,
  onDeleteSpecialty,
}: SpecialtyTableProps) {
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [deleteSpecialty, setDeleteSpecialty] = useState<Specialty | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSpecialty = async () => {
    if (!deleteSpecialty) return;

    try {
      setIsDeleting(true);
      await onDeleteSpecialty(deleteSpecialty.id);
      setDeleteSpecialty(null);
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to delete specialty:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
              <TableHead>Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialties.map((specialty) => (
              <TableRow key={specialty.id}>
                <TableCell>
                  <div className="font-medium">{specialty.name}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{specialty._count?.users || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(specialty.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditingSpecialty(specialty)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Specialty
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteSpecialty(specialty)}
                        className="text-destructive"
                        disabled={(specialty._count?.users || 0) > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Specialty
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Specialty Dialog */}
      {editingSpecialty && (
        <EditSpecialtyDialog
          specialty={editingSpecialty}
          isOpen={!!editingSpecialty}
          onClose={() => setEditingSpecialty(null)}
          onUpdate={onUpdateSpecialty}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSpecialty} onOpenChange={() => setDeleteSpecialty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specialty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSpecialty?.name}"? This action cannot be undone.
              {(deleteSpecialty?._count?.users || 0) > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive">
                    This specialty has {deleteSpecialty?._count?.users} associated users and cannot be deleted.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpecialty}
              disabled={isDeleting || (deleteSpecialty?._count?.users || 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
