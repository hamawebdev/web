'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Edit } from 'lucide-react';
import { ApiUser } from '@/types/api';
import { AdminService } from '@/lib/api-services';

interface EditUserDialogProps {
  user: ApiUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUser: (userData: Partial<ApiUser>) => Promise<void>;
  loading: boolean;
}

interface University {
  id: number;
  name: string;
  country: string;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdateUser,
  loading,
}: EditUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    universityId: user.university?.id,
    specialtyId: user.specialty?.id,
    currentYear: user.currentYear || '',
  });

  // Load universities
  useEffect(() => {
    if (open) {
      loadFormData();
      // Reset form data when user changes
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        universityId: user.university?.id,
        specialtyId: user.specialty?.id,
        currentYear: user.currentYear || '',
      });
    }
  }, [open, user]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const response = await AdminService.getQuestionFilters();
      
      if (response.success && response.data?.filters) {
        setUniversities(response.data.filters.universities || []);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName || !formData.email || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const updateData: Partial<ApiUser> = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include university/specialty for students
      if (formData.role === 'STUDENT') {
        if (formData.universityId) {
          updateData.universityId = formData.universityId;
        }
        if (formData.specialtyId) {
          updateData.specialtyId = formData.specialtyId;
        }
        if (formData.currentYear) {
          updateData.currentYear = formData.currentYear;
        }
      }

      await onUpdateUser(updateData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    role: value as 'STUDENT' | 'ADMIN' | 'EMPLOYEE' 
                  }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  disabled={loading}
                />
                <Label htmlFor="isActive">Active User</Label>
              </div>
            </div>

            {/* Additional Information for Students */}
            {formData.role === 'STUDENT' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Student Information</h4>
                
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select
                    value={formData.universityId?.toString() || 'none'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      universityId: value === 'none' ? undefined : parseInt(value)
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No University</SelectItem>
                      {universities.map((university) => (
                        <SelectItem key={university.id} value={university.id.toString()}>
                          {university.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentYear">Current Year</Label>
                  <Select
                    value={formData.currentYear || 'none'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currentYear: value === 'none' ? '' : value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Year Selected</SelectItem>
                      <SelectItem value="ONE">Year 1</SelectItem>
                      <SelectItem value="TWO">Year 2</SelectItem>
                      <SelectItem value="THREE">Year 3</SelectItem>
                      <SelectItem value="FOUR">Year 4</SelectItem>
                      <SelectItem value="FIVE">Year 5</SelectItem>
                      <SelectItem value="SIX">Year 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
