'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  School,
  BookOpen,
  Layers,
  GraduationCap,
  Database,
  Calendar,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogoDisplay } from '@/components/ui/logo-display';
import { toast } from 'sonner';
import { AdminContentService, UniversityService } from '@/lib/api-services';
import { getApiErrorMessage } from '@/lib/api-error';

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
  type: 'YEAR' | 'RESIDENCY';
  yearNumber?: string;
  price: number;
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

interface EntityCardProps {
  entity: EntityData;
  entityType: EntityType;
  onSelect?: (entity: EntityData) => void;
  onEdit?: (entity: EntityData) => void;
  onDelete?: (entityId: number) => void;
  isSelectable?: boolean;
  showActions?: boolean;
}

export function EntityCard({
  entity,
  entityType,
  onSelect,
  onEdit,
  onDelete,
  isSelectable = true,
  showActions = true
}: EntityCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image upload dialog state and helpers
  const isUnit = entityType === 'unit';
  const isModule = entityType === 'module';
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Units store `logoUrl`; modules store `imagePath` (some responses also echo it as logoUrl)
  const [localLogoUrl, setLocalLogoUrl] = useState<string | undefined>(
    () => (entity as any)?.logoUrl || (entity as any)?.imagePath || undefined
  );

  const allowedTypes = useMemo(() => new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ]), []);
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const openImageDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    setShowImageDialog(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Max 5MB');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }
    try {
      setIsUploading(true);
      if (isUnit) {
        const u = entity as Unit;
        const res = await AdminContentService.updateUnitLogo({
          unitId: u.id,
          name: u.name,
          studyPackId: u.studyPackId,
          description: u.description,
          logo: selectedFile,
        });
        if (res?.success) {
          const newUrl = (res.data?.unite?.logoUrl) || (res.data?.data?.unite?.logoUrl) || (res.data as any)?.logoUrl;
          if (newUrl) setLocalLogoUrl(newUrl);
          toast.success('Unit image updated');
          setShowImageDialog(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      } else if (isModule) {
        const m = entity as Module;
        const res = await AdminContentService.updateModuleLogo({
          moduleId: m.id,
          name: m.name,
          // Pass both IDs if present; service will include exactly one per API docs
          uniteId: (m as any).uniteId,
          studyPackId: (m as any).studyPackId,
          description: m.description,
          logo: selectedFile,
        });
        if (res?.success) {
          const data: any = res.data;
          const newUrl = data?.imagePath || data?.logoUrl || data?.module?.imagePath || data?.module?.logoUrl;
          if (newUrl) setLocalLogoUrl(newUrl);
          toast.success('Module image updated');
          setShowImageDialog(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to update image', error);
      toast.error(getApiErrorMessage(error, 'Failed to update image'));
    } finally {
      setIsUploading(false);
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'university':
        return School;
      case 'studyPack':
        return BookOpen;
      case 'unit':
        return Layers;
      case 'module':
        return GraduationCap;
      case 'course':
        return Database;
      default:
        return School;
    }
  };

  const getEntityDetails = () => {
    switch (entityType) {
      case 'university':
        const university = entity as University;
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{university.country}</p>
            {university.city && <p className="text-xs text-muted-foreground">{university.city}</p>}
          </div>
        );
      case 'studyPack':
        const studyPack = entity as StudyPack;
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{studyPack.description}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {studyPack.type === 'YEAR' ? `Year ${studyPack.yearNumber}` : studyPack.type}
              </Badge>
              <Badge variant="outline">
                ${studyPack.price}
              </Badge>
            </div>
          </div>
        );
      case 'unit':
      case 'module':
      case 'course':
        return (
          <p className="text-sm text-muted-foreground">
            {entity.description}
          </p>
        );
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let result;

      switch (entityType) {
        case 'university':
          result = await UniversityService.deleteUniversity(entity.id);
          break;
        case 'studyPack':
          result = await AdminContentService.deleteStudyPack(entity.id);
          break;
        case 'unit':
          result = await AdminContentService.deleteUnit(entity.id);
          break;
        case 'module':
          result = await AdminContentService.deleteModule(entity.id);
          break;
        case 'course':
          result = await AdminContentService.deleteCourse(entity.id);
          break;
      }

      // Check for success or message (canonical API response for deletions)
      if (result?.success || result?.message) {
        toast.success(`${entityType} deleted successfully!`);
        onDelete?.(entity.id);
      } else {
        toast.error(result?.error || `Failed to delete ${entityType}`);
      }
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      toast.error(`Failed to delete ${entityType}: ${getApiErrorMessage(error)}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const Icon = getEntityIcon();

  return (
    <>
      <Card
        className={`transition-all duration-200 ${isSelectable
            ? 'cursor-pointer hover:shadow-md hover:border-primary/50'
            : ''
          }`}
        onClick={isSelectable ? () => onSelect?.(entity) : undefined}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center space-x-2 text-base">
              {(isUnit || isModule) ? (
                <LogoDisplay
                  logoUrl={localLogoUrl || (entity as any)?.logoUrl || (entity as any)?.imagePath}
                  fallbackIcon={isUnit ? GraduationCap : Layers}
                  alt={`${entity.name} logo`}
                  size="md"
                  variant="rounded"
                />
              ) : (
                <Icon className="h-5 w-5 text-primary" />
              )}
              <span>{entity.name}</span>
            </CardTitle>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Units store a logoUrl, modules an imagePath (both uploaded via /admin/upload/logo) */}
                  {(isUnit || isModule) && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageDialog();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUnit ? 'Update Unit Image' : 'Update Module Image'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(entity);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {getEntityDetails()}
        </CardContent>
      </Card>


      {(isUnit || isModule) && (
        <Dialog
          open={showImageDialog}
          onOpenChange={(open) => {
            setShowImageDialog(open);
            if (!open) {
              setSelectedFile(null);
              setPreviewUrl(null);
            }
          }}
        >
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{isUnit ? 'Update Unit Image' : 'Update Module Image'}</DialogTitle>
              <DialogDescription>
                Upload a new logo image (JPEG, PNG, GIF, WebP, SVG; max 5MB). Preview before saving.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-file">Select image</Label>
                <Input id="image-file" type="file" accept="image/*" onChange={onFileChange} />
              </div>

              {previewUrl && (
                <div className="rounded-md border p-2">
                  <img src={previewUrl} alt="Preview" className="max-h-48 object-contain mx-auto" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImageDialog(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveImage} disabled={isUploading || !selectedFile}>
                {isUploading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entity.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
