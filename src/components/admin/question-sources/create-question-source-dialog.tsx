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
import { getApiErrorMessage } from '@/lib/api-error';
import { CreateQuestionSourceRequest } from '@/types/api';

// Unicode classes need the `u` flag (built at runtime: the TS target predates it)
const QUESTION_SOURCE_NAME = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s\\-_'’.]+$", 'u');

// Validation schema based on API documentation
const createQuestionSourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Question source name must be at least 2 characters')
    .max(100, 'Question source name must not exceed 100 characters')
    // Same rule as the API: letters (accents included), digits, spaces, - _ ' ’ and dots
    .regex(
      QUESTION_SOURCE_NAME,
      'Question source name can only contain letters, numbers, spaces, hyphens, underscores, apostrophes and dots'
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
      
      // Field errors from the API validation (apiClient rejection or raw Axios error)
      const apiErrors: any[] = error?.details?.errors || error?.response?.data?.error?.details?.errors || [];
      const nameError = apiErrors.find((err: any) => err?.field === 'name');
      if (nameError?.message) {
        form.setError('name', { message: nameError.message });
      } else {
        setApiError(getApiErrorMessage(error, 'Failed to create question source'));
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
