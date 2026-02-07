// @ts-nocheck
'use client';

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AuthService } from '@/lib/api-services';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentPasswordError = useMemo(() => {
    if (!currentPassword) return 'Current password is required';
    return '';
  }, [currentPassword]);

  const newPasswordError = useMemo(() => {
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 4) return 'New password must be at least 4 characters';
    return '';
  }, [newPassword]);

  const canSubmit = useMemo(() => !currentPasswordError && !newPasswordError, [currentPasswordError, newPasswordError]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await AuthService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success(res.data?.message || 'Password changed successfully');
        // Clear fields
        setCurrentPassword('');
        setNewPassword('');
        onOpenChange(false);
      } else {
        toast.error(res.error || 'Failed to change password');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset when closing
      setCurrentPassword('');
      setNewPassword('');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password. Minimum 4 characters.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            {!!currentPasswordError && <p className="text-sm text-destructive">{currentPasswordError}</p>}
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            {!!newPasswordError && <p className="text-sm text-destructive">{newPasswordError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Saving...' : 'Change Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

