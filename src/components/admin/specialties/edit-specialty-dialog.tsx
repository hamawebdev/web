'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Specialty } from '@/types/api';

// Validation schema for specialty editing
const editSpecialtySchema = z.object({
  name: z.string()
    .min(1, 'Specialty name is required')
    .min(2, 'Specialty name must be at least 2 characters')
    .max(100, 'Specialty name must be less than 100 characters')
    .trim(),
});

type EditSpecialtyFormData = z.infer<typeof editSpecialtySchema>;

interface EditSpecialtyDialogProps {
  specialty: Specialty;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (specialtyId: number, updateData: { name?: string }) => Promise<Specialty>;
}

export function EditSpecialtyDialog({
  specialty,
  isOpen,
  onClose,
  onUpdate,
}: EditSpecialtyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditSpecialtyFormData>({
    resolver: zodResolver(editSpecialtySchema),
    defaultValues: {
      name: specialty.name,
    },
  });

  // Update form when specialty changes
  useEffect(() => {
    if (specialty) {
      form.reset({
        name: specialty.name,
      });
      setError(null);
    }
  }, [specialty, form]);

  const handleSubmit = async (data: EditSpecialtyFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log('🔄 Updating specialty with data:', { specialtyId: specialty.id, data });

      // Only send changed fields
      const updateData: { name?: string } = {};
      if (data.name !== specialty.name) {
        updateData.name = data.name;
      }

      // If no changes, just close the dialog
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      await onUpdate(specialty.id, updateData);

      // Close dialog on success
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update specialty';
      console.error('❌ Update specialty error:', error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset({
        name: specialty.name,
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Specialty</DialogTitle>
          <DialogDescription>
            Update the specialty information. Changes will be reflected across the system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Specialty Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Cardiology, Neurology, Pediatrics"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialty Info */}
            <div className="text-sm text-muted-foreground space-y-1">
              <div>ID: {specialty.id}</div>
              <div>Users: {specialty._count?.users || 0}</div>
              <div>Created: {new Date(specialty.createdAt).toLocaleDateString()}</div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Specialty'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
