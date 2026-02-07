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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { AdminService } from '@/lib/api-services';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'ADMIN' | 'EMPLOYEE';
    universityId?: number;
    specialtyId?: number;
    currentYear?: string;
  }) => Promise<void>;
}

interface University {
  id: number;
  name: string;
  country: string;
}

interface Specialty {
  id: number;
  name: string;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreateUser,
}: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: '' as 'STUDENT' | 'ADMIN' | 'EMPLOYEE' | '',
    universityId: undefined as number | undefined,
    specialtyId: undefined as number | undefined,
    currentYear: '',
  });

  // Load universities and specialties
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const response = await AdminService.getQuestionFilters();
      
      if (response.success && response.data?.filters) {
        setUniversities(response.data.filters.universities || []);
        // Note: Specialties might need a separate API call if not included in filters
        // For now, we'll leave it empty and add when the API is available
        setSpecialties([]);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: '',
      universityId: undefined,
      specialtyId: undefined,
      currentYear: '',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.fullName || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        universityId: formData.universityId,
        specialtyId: formData.specialtyId,
        currentYear: formData.currentYear || undefined,
      };

      await onCreateUser(userData);
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. All fields marked with * are required.
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password (min 6 characters)"
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
            </div>

            {/* Additional Information for Students */}
            {formData.role === 'STUDENT' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Student Information</h4>
                
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select
                    value={formData.universityId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      universityId: value ? parseInt(value) : undefined 
                    }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.currentYear}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currentYear: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
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
                Create User
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
