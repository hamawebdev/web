'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { AdminContentService, UniversityService } from '@/lib/api-services';
import { getApiErrorMessage } from '@/lib/api-error';

// Schemas for different entity types (limits match the API validation). Imported records
// often have no description or city, so those stay optional and never block an edit.
const optionalText = z.string().trim().optional();

const universitySchema = z.object({
  name: z.string().trim().min(2, 'University name must be at least 2 characters'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters'),
  city: z.string().trim().refine(value => value === '' || value.length >= 2, 'City must be at least 2 characters').optional(),
});

const studyPackSchema = z.object({
  name: z.string().trim().min(2, 'Study pack name must be at least 2 characters'),
  description: optionalText,
  // Optional: residency packs have no year number (the field is hidden for them)
  yearNumber: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN']).optional(),
  pricePerMonth: z.number().min(0, 'Monthly price cannot be negative'),
  pricePerYear: z.number().min(0, 'Yearly price cannot be negative'),
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

type EntityType = 'university' | 'studyPack' | 'unit' | 'module' | 'course';

interface BaseEntity {
  id: number;
  name: string;
  description?: string;
}

interface University extends BaseEntity {
  country: string;
  city?: string | null;
}

interface StudyPack extends BaseEntity {
  // Backend PackType enum
  type: 'YEAR' | 'RESIDENCY';
  yearNumber: string | null;
  pricePerMonth: number;
  pricePerYear: number;
  description: string;
}

interface Unit extends BaseEntity {
  studyPackId: number;
  description: string;
}

interface Module extends BaseEntity {
  uniteId: number;
  description: string;
}

interface Course extends BaseEntity {
  moduleId: number;
  description: string;
}

type EntityData = University | StudyPack | Unit | Module | Course;

interface EditEntityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entity: EntityData | null;
  onSuccess: () => void;
}

export function EditEntityDialog({
  isOpen,
  onClose,
  entityType,
  entity,
  onSuccess
}: EditEntityDialogProps) {
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
      case 'course':
        return courseSchema;
      default:
        return universitySchema;
    }
  };

  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      name: '',
      description: '',
      country: '',
      city: '',
      pricePerMonth: 0,
      pricePerYear: 0,
    },
  });

  // Reset form when entity changes
  useEffect(() => {
    if (entity) {
      const formData: any = {
        name: entity.name,
        description: entity.description || '',
      };

      if (entityType === 'university') {
        const university = entity as University;
        formData.country = university.country ?? '';
        formData.city = university.city ?? '';
      } else if (entityType === 'studyPack') {
        const studyPack = entity as StudyPack;
        formData.yearNumber = studyPack.yearNumber ?? undefined;
        formData.pricePerMonth = Number(studyPack.pricePerMonth) || 0;
        formData.pricePerYear = Number(studyPack.pricePerYear) || 0;
      }

      form.reset(formData);
    }
  }, [entity, entityType, form]);

  // Get entity info
  const getEntityInfo = () => {
    switch (entityType) {
      case 'university':
        return {
          title: 'Edit University',
          description: 'Update university information',
          fields: ['name', 'country', 'city']
        };
      case 'studyPack':
        return {
          title: 'Edit Study Pack',
          description: 'Update study pack information',
          fields: ['name', 'description', 'yearNumber', 'pricePerMonth', 'pricePerYear']
        };
      case 'unit':
        return {
          title: 'Edit Unit',
          description: 'Update unit information',
          fields: ['name', 'description']
        };
      case 'module':
        return {
          title: 'Edit Module',
          description: 'Update module information',
          fields: ['name', 'description']
        };
      case 'course':
        return {
          title: 'Edit Course',
          description: 'Update course information',
          fields: ['name', 'description']
        };
      default:
        return {
          title: 'Edit Entity',
          description: 'Update entity information',
          fields: ['name']
        };
    }
  };

  const onSubmit = async (data: any) => {
    if (!entity) return;

    setIsSubmitting(true);
    // Optional texts: an empty field is left out rather than sent as ''
    const description = data.description?.trim() || undefined;
    try {
      let result;

      switch (entityType) {
        case 'university':
          result = await UniversityService.updateUniversity(entity.id, {
            name: data.name,
            country: data.country,
            city: data.city?.trim() || undefined,
          });
          break;
        case 'studyPack':
          // The pack type cannot be edited here: leave it out so a RESIDENCY pack is never
          // turned into a YEAR pack, and never send a year number for residency packs.
          result = await AdminContentService.updateStudyPack(entity.id, {
            name: data.name,
            description,
            yearNumber: (entity as StudyPack).type === 'RESIDENCY' ? undefined : data.yearNumber,
            pricePerMonth: data.pricePerMonth,
            pricePerYear: data.pricePerYear,
          });
          break;
        case 'unit':
          const unitEntity = entity as Unit;
          result = await AdminContentService.updateUnit(entity.id, {
            name: data.name,
            description,
            studyPackId: unitEntity.studyPackId,
          });
          break;
        case 'module':
          const moduleEntity = entity as Module;
          result = await AdminContentService.updateModule(entity.id, {
            name: data.name,
            description,
            uniteId: moduleEntity.uniteId,
          });
          break;
        case 'course':
          const courseEntity = entity as Course;
          result = await AdminContentService.updateCourse(entity.id, {
            name: data.name,
            description,
            moduleId: courseEntity.moduleId,
          });
          break;
      }

      // Check for success or if we received an entity with an ID (canonical API response)
      if (result?.success || result?.id) {
        toast.success(`${entityInfo.title.replace('Edit ', '')} updated successfully!`);
        form.reset();
        onClose();
        onSuccess();
      } else {
        toast.error(result?.error || result?.message || `Failed to update ${entityType}`);
      }
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      toast.error(`Failed to update ${entityType}: ${getApiErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const entityInfo = getEntityInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                      <Input placeholder="Enter name" {...field} />
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
                      <Input placeholder="Enter description" {...field} />
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


            {entityInfo.fields.includes('yearNumber') && (entity as StudyPack | null)?.type !== 'RESIDENCY' && (
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
