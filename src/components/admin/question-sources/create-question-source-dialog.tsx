'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { CreateQuestionSourceRequest } from '@/types/api';

// Validation schema based on API documentation
const createQuestionSourceSchema = z.object({
  name: z
    .string()
    .min(2, 'Question source name must be at least 2 characters')
    .max(100, 'Question source name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Question source name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
});

type CreateQuestionSourceFormData = z.infer<typeof createQuestionSourceSchema>;

interface CreateQuestionSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQuestionSource: (data: CreateQuestionSourceRequest) => Promise<any>;
}

export function CreateQuestionSourceDialog({
  open,
  onOpenChange,
  onCreateQuestionSource,
}: CreateQuestionSourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<CreateQuestionSourceFormData>({
    resolver: zodResolver(createQuestionSourceSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: CreateQuestionSourceFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      await onCreateQuestionSource(data);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error creating question source:', error);
      
      // Handle API validation errors
      if (error?.response?.data?.error?.details?.errors) {
        const apiErrors = error.response.data.error.details.errors;
        apiErrors.forEach((err: any) => {
          if (err.field === 'name') {
            form.setError('name', { message: err.message });
          }
        });
      } else {
        // Generic error message
        const errorMessage = error?.message || error?.response?.data?.error?.message || 'Failed to create question source';
        setApiError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        form.reset();
        setApiError(null);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Question Source</DialogTitle>
          <DialogDescription>
            Add a new question source to categorize questions in the system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* API Error Alert */}
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter question source name"
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
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Question Source'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
