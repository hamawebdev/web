'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  Copy,
  Ban,
  Calendar,
  Users,
  Package,
  Edit,
  Trash2
} from 'lucide-react';
import { ActivationCode } from '@/types/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivationCodesTableProps {
  codes: ActivationCode[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditCode: (code: ActivationCode) => void;
  onDeleteCode: (codeId: number) => void;
  onDeactivateCode: (codeId: number) => void;
}

export function ActivationCodesTable({
  codes,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEditCode,
  onDeleteCode,
  onDeactivateCode,
}: ActivationCodesTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const handleDeleteConfirm = async (codeId: number) => {
    try {
      await onDeleteCode(codeId);
      setDeleteConfirmId(null);
    } catch (error) {
      // Error is handled in parent component
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No activation codes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new activation code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Study Packs</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{code.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyCode(code.code)}
                    >
                      <Copy className={`h-3 w-3 ${copiedCode === code.code ? 'text-green-600' : ''}`} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {code.description || 'No description'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        !code.isActive ? 'secondary' :
                        isExpired(code.expiresAt) ? 'destructive' :
                        isExpiringSoon(code.expiresAt) ? 'outline' :
                        'default'
                      }
                    >
                      {!code.isActive ? 'Inactive' :
                       isExpired(code.expiresAt) ? 'Expired' :
                       isExpiringSoon(code.expiresAt) ? 'Expiring Soon' :
                       'Active'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {code.currentUses}/{code.maxUses}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {code.durationType === 'DAYS' 
                        ? `${code.durationDays} Days`
                        : `${code.durationMonths} Months`
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    {code.studyPacks.length > 0 ? (
                      <div className="space-y-1">
                        {code.studyPacks.slice(0, 2).map((sp, index) => (
                          <div key={index} className="text-xs text-muted-foreground truncate">
                            {sp.name}
                          </div>
                        ))}
                        {code.studyPacks.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{code.studyPacks.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(code.expiresAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(code.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopyCode(code.code)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEditCode(code)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {code.isActive && (
                        <DropdownMenuItem
                          onClick={() => onDeactivateCode(code.id)}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirmId(code.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this activation code? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
