// @ts-nocheck
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AdminContentService, UniversityService } from '@/lib/api-services';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Schemas for different entity types (limits match the API validation)
const optionalText = z.string().trim().optional();

const universitySchema = z.object({
  name: z.string().trim().min(2, 'University name must be at least 2 characters'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters'),
  city: z.string().trim().refine(value => value === '' || value.length >= 2, 'City must be at least 2 characters').optional(),
});

const unitSchema = z.object({
  name: z.string().trim().min(2, 'Unit name must be at least 2 characters'),
  description: optionalText,
});

const moduleSchema = z.object({
  name: z.string().trim().min(2, 'Module name must be at least 2 characters'),
  description: optionalText,
});

const courseSchema = z.object({
  name: z.string().trim().min(3, 'Course name must be at least 3 characters'),
  description: optionalText,
});

const independentModuleSchema = z.object({
  name: z.string().trim().min(2, 'Module name must be at least 2 characters'),
  description: optionalText,
});

const studyPackSchema = z.object({
  name: z.string().trim().min(2, 'Study pack name must be at least 2 characters'),
  description: optionalText,
  // Backend PackType enum: YEAR packs need a year number, RESIDENCY packs have none
  type: z.enum(['YEAR', 'RESIDENCY']),
  yearNumber: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN']).optional(),
  pricePerMonth: z.number().min(0, 'Monthly price cannot be negative'),
  pricePerYear: z.number().min(0, 'Yearly price cannot be negative'),
}).refine(data => data.type !== 'YEAR' || !!data.yearNumber, {
  message: 'Year number is required for a year study pack',
  path: ['yearNumber'],
});

type EntityType = 'university' | 'studyPack' | 'unit' | 'module' | 'course' | 'independentModule';

interface AddEntityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  parentId?: number;
  onSuccess: () => void;
}

export function AddEntityDialog({
  isOpen,
  onClose,
  entityType,
  parentId,
  onSuccess
}: AddEntityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get schema based on entity type
  const getSchema = () => {
    switch (entityType) {
      case 'university':
        return universitySchema;
      case 'studyPack':
        return studyPackSchema;
      case 'unit':
        return unitSchema;
      case 'module':
        return moduleSchema;
      case 'independentModule':
        return independentModuleSchema;
      case 'course':
        return courseSchema;
      default:
        return universitySchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      name: '',
      description: '',
      country: '',
      city: '',
      type: 'YEAR' as 'YEAR' | 'RESIDENCY',
      yearNumber: 'ONE' as const,
      pricePerMonth: 0,
      pricePerYear: 0,
    },
  });

  // Get entity info
  const getEntityInfo = () => {
    switch (entityType) {
      case 'university':
        return {
          title: 'Add University',
          description: 'Create a new university in the system',
          fields: ['name', 'country', 'city']
        };
      case 'studyPack':
        return {
          title: 'Add Study Pack',
          description: 'Create a new study pack for the selected university',
          fields: ['name', 'description', 'type', 'yearNumber', 'pricePerMonth', 'pricePerYear']
        };
      case 'unit':
        return {
          title: 'Add Unit',
          description: 'Create a new unit for the selected study pack',
          fields: ['name', 'description']
        };
      case 'module':
        return {
          title: 'Add Module',
          description: 'Create a new module for the selected unit',
          fields: ['name', 'description']
        };
      case 'independentModule':
        return {
          title: 'Add Independent Module',
          description: 'Create a new independent module for the selected study pack',
          fields: ['name', 'description']
        };
      case 'course':
        return {
          title: 'Add Course',
          description: 'Create a new course for the selected module',
          fields: ['name', 'description']
        };
      default:
        return {
          title: 'Add Entity',
          description: 'Create a new entity',
          fields: ['name']
        };
    }
  };

  const entityInfo = getEntityInfo();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    // Optional texts: send nothing rather than an empty string
    const description = data.description?.trim() || undefined;
    try {
      let result;

      switch (entityType) {
        case 'university':
          result = await UniversityService.createUniversity({
            name: data.name,
            country: data.country,
            city: data.city?.trim() || undefined,
          });
          break;
        case 'studyPack':
          result = await AdminContentService.createStudyPack({
            name: data.name,
            description,
            type: data.type,
            yearNumber: data.type === 'RESIDENCY' ? undefined : data.yearNumber,
            pricePerMonth: data.pricePerMonth,
            pricePerYear: data.pricePerYear,
          });
          break;
        case 'unit':
          if (!parentId) {
            toast.error('Study pack ID is required to create a unit');
            return;
          }
          result = await AdminContentService.createUnit({
            name: data.name,
            description,
            studyPackId: parentId,
          });
          break;
        case 'module':
          if (!parentId) {
            toast.error('Unit ID is required to create a module');
            return;
          }
          result = await AdminContentService.createModule({
            name: data.name,
            description,
            uniteId: parentId,
          });
          break;
        case 'independentModule':
          if (!parentId) {
            toast.error('Study pack ID is required to create an independent module');
            return;
          }
          result = await AdminContentService.createIndependentModule({
            name: data.name,
            description,
            studyPackId: parentId,
          });
          break;
        case 'course':
          if (!parentId) {
            toast.error('Module ID is required to create a course');
            return;
          }
          result = await AdminContentService.createCourse({
            name: data.name,
            description,
            moduleId: parentId,
          });
          break;
      }

      // Check for success or if we received an entity with an ID (canonical API response)
      if (result?.success || result?.id) {
        toast.success(`${entityInfo.title.replace('Add ', '')} created successfully!`);
        form.reset();
        onClose();
        onSuccess();
      } else {
        toast.error(result?.error || result?.message || `Failed to create ${entityType}`);
      }
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      toast.error(`Failed to create ${entityType}: ${getApiErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{entityInfo.title}</DialogTitle>
          <DialogDescription>
            {entityInfo.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {entityInfo.fields.includes('name') && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter ${entityType} name`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('description') && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Enter ${entityType} description`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('country') && (
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('city') && (
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('type') && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="YEAR">Year</option>
                        <option value="RESIDENCY">Residency</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('yearNumber') && form.watch('type') !== 'RESIDENCY' && (
              <FormField
                control={form.control}
                name="yearNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Number</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="ONE">First Year</option>
                        <option value="TWO">Second Year</option>
                        <option value="THREE">Third Year</option>
                        <option value="FOUR">Fourth Year</option>
                        <option value="FIVE">Fifth Year</option>
                        <option value="SIX">Sixth Year</option>
                        <option value="SEVEN">Seventh Year</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('pricePerMonth') && (
              <FormField
                control={form.control}
                name="pricePerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter monthly price"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entityInfo.fields.includes('pricePerYear') && (
              <FormField
                control={form.control}
                name="pricePerYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter yearly price"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
