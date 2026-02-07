'use client';

import { useState } from 'react';
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

// Validation schema for specialty creation
const createSpecialtySchema = z.object({
  name: z.string()
    .min(1, 'Specialty name is required')
    .min(2, 'Specialty name must be at least 2 characters')
    .max(100, 'Specialty name must be less than 100 characters')
    .trim(),
});

type CreateSpecialtyFormData = z.infer<typeof createSpecialtySchema>;

interface CreateSpecialtyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (specialtyData: { name: string }) => Promise<Specialty>;
}

export function CreateSpecialtyDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateSpecialtyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateSpecialtyFormData>({
    resolver: zodResolver(createSpecialtySchema),
    defaultValues: {
      name: '',
    },
  });

  const handleSubmit = async (data: CreateSpecialtyFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log('🔄 Creating specialty with data:', data);

      await onCreate(data);

      // Reset form and close dialog on success
      form.reset();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create specialty';
      console.error('❌ Create specialty error:', error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Specialty</DialogTitle>
          <DialogDescription>
            Add a new medical specialty to the system. This will be available for user registration.
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
                    Creating...
                  </>
                ) : (
                  'Create Specialty'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
