'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Users, Clock, Package } from 'lucide-react';
import { StudentService } from '@/lib/api-services';
import { ActivationCode, UpdateActivationCodeRequest, StudyPack } from '@/types/api';
import { toast } from 'sonner';
import { endOfDayIso, isDayNotPast, toDateInputValue } from './expiry-date';

interface EditActivationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCode: (codeId: number, codeData: UpdateActivationCodeRequest) => Promise<void>;
  activationCode: ActivationCode | null;
}

interface EditForm {
  description: string;
  durationType: 'MONTHS' | 'DAYS';
  durationMonths: number;
  durationDays: number;
  maxUses: number;
  expiresAt: string; // YYYY-MM-DD
  studyPackIds: number[];
  isActive: boolean;
}

function formFromCode(code: ActivationCode): EditForm {
  return {
    description: code.description || '',
    durationType: code.durationType || 'MONTHS',
    durationMonths: code.durationMonths || 1,
    durationDays: code.durationDays || 30,
    maxUses: code.maxUses,
    expiresAt: toDateInputValue(code.expiresAt),
    studyPackIds: code.studyPacks?.map(sp => sp.id) || [],
    isActive: code.isActive,
  };
}

const sameIds = (a: number[], b: number[]) => {
  const x = [...a].sort((m, n) => m - n);
  const y = [...b].sort((m, n) => m - n);
  return x.length === y.length && x.every((id, i) => id === y[i]);
};

export function EditActivationCodeDialog({
  open,
  onOpenChange,
  onUpdateCode,
  activationCode,
}: EditActivationCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [studyPacksLoading, setStudyPacksLoading] = useState(false);
  const [formData, setFormData] = useState<EditForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load study packs when dialog opens
  useEffect(() => {
    if (open) {
      loadStudyPacks();
    }
  }, [open]);

  // Start from the code as saved each time the dialog opens: unsaved edits of a
  // cancelled dialog are dropped
  useEffect(() => {
    if (open && activationCode) {
      setFormData(formFromCode(activationCode));
      setErrors({});
    }
  }, [open, activationCode]);

  const loadStudyPacks = async () => {
    try {
      setStudyPacksLoading(true);
      // Use the correct endpoint: GET /api/v1/study-packs
      const response = await StudentService.getStudyPacks({ limit: 100 });

      // Handle both standard and canonical API response formats
      const resp = response as any;
      let studyPacksList: StudyPack[] = [];

      if (resp?.success && resp?.data) {
        // Standard response: { success: true, data: [...] or { data: [...] } }
        const data = resp.data?.data?.data || resp.data?.data || resp.data;
        if (Array.isArray(data)) {
          studyPacksList = data;
        } else if (data?.items && Array.isArray(data.items)) {
          // Canonical response wrapped in success object: { success: true, data: { items: [...] } }
          studyPacksList = data.items;
        } else if (data?.studyPacks && Array.isArray(data.studyPacks)) {
          studyPacksList = data.studyPacks;
        }
      } else if (resp?.items && Array.isArray(resp.items)) {
        // Canonical response: { items: [...], total: ... }
        studyPacksList = resp.items;
      } else if (Array.isArray(resp)) {
        // Direct array response
        studyPacksList = resp;
      }

      if (studyPacksList.length > 0 || (resp?.success) || (resp?.items)) {
        // Filter only active study packs
        const activeStudyPacks = studyPacksList.filter((pack: StudyPack) => pack.isActive);
        setStudyPacks(activeStudyPacks);
      } else {
        console.warn('Unexpected API response format:', response);
        throw new Error('Failed to load study packs');
      }
    } catch (error) {
      console.error('Failed to load study packs:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les Study Packs.',
      });
    } finally {
      setStudyPacksLoading(false);
    }
  };

  if (!activationCode || !formData) {
    return null;
  }

  const saved = formFromCode(activationCode);
  const usedCount = activationCode.currentUses;
  const minMaxUses = Math.max(1, usedCount);

  // The code's packs that the list of active packs leaves out (a pack deactivated since)
  const inactiveCodePacks = (activationCode.studyPacks || []).filter(
    sp => !studyPacks.some(pack => pack.id === sp.id)
  );

  const update = (patch: Partial<EditForm>) => setFormData(prev => (prev ? { ...prev, ...patch } : prev));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.durationType === 'MONTHS') {
      if (!formData.durationMonths || formData.durationMonths < 1 || formData.durationMonths > 60) {
        newErrors.duration = 'Duration must be between 1 and 60 months';
      }
    } else if (!formData.durationDays || formData.durationDays < 1 || formData.durationDays > 1825) {
      newErrors.duration = 'Duration must be between 1 and 1825 days';
    }

    if (!formData.maxUses || formData.maxUses < minMaxUses) {
      newErrors.maxUses = usedCount > 0
        ? `Max uses cannot be lower than ${usedCount}: the code has already been redeemed ${usedCount} time(s)`
        : 'Max uses must be at least 1';
    }

    // An unchanged date is kept as is, even if it has passed
    if (!formData.expiresAt) {
      newErrors.expiresAt = 'Expiration date is required';
    } else if (formData.expiresAt !== saved.expiresAt && !isDayNotPast(formData.expiresAt)) {
      newErrors.expiresAt = 'Expiration date must be today or later';
    }

    if (formData.studyPackIds.length === 0) {
      newErrors.studyPackIds = 'Au moins un Study Pack doit être sélectionné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Only what the admin changed: PUT /admin/activation-codes/:id leaves other fields as they are
  const changes = (): UpdateActivationCodeRequest => {
    const data: UpdateActivationCodeRequest = {};
    const description = formData.description.trim();
    if (description !== saved.description.trim()) {
      data.description = description || null;
    }
    const typeChanged = formData.durationType !== saved.durationType;
    if (typeChanged) {
      data.durationType = formData.durationType;
    }
    if (formData.durationType === 'MONTHS' && (typeChanged || formData.durationMonths !== saved.durationMonths)) {
      data.durationMonths = formData.durationMonths;
    }
    if (formData.durationType === 'DAYS' && (typeChanged || formData.durationDays !== saved.durationDays)) {
      data.durationDays = formData.durationDays;
    }
    if (formData.maxUses !== saved.maxUses) {
      data.maxUses = formData.maxUses;
    }
    if (formData.expiresAt !== saved.expiresAt) {
      // Valid until the end of the chosen day, in the admin's time zone
      data.expiresAt = endOfDayIso(formData.expiresAt);
    }
    if (formData.isActive !== saved.isActive) {
      data.isActive = formData.isActive;
    }
    if (!sameIds(formData.studyPackIds, saved.studyPackIds)) {
      data.studyPackIds = formData.studyPackIds;
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const codeData = changes();
    if (Object.keys(codeData).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      await onUpdateCode(activationCode.id, codeData);
      setErrors({});
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleStudyPackToggle = (studyPackId: number, checked: boolean) => {
    setFormData(prev => prev ? {
      ...prev,
      studyPackIds: checked
        ? [...prev.studyPackIds, studyPackId]
        : prev.studyPackIds.filter(id => id !== studyPackId)
    } : prev);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!loading) onOpenChange(next); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Activation Code
          </DialogTitle>
          <DialogDescription>
            Update the activation code details. Code: <strong>{activationCode.code}</strong>
            {' '}· Redeemed {usedCount} of {activationCode.maxUses} time{activationCode.maxUses > 1 ? 's' : ''}.
            Changes apply to the next student who enters the code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for this activation code..."
              value={formData.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Duration Type and Duration */}
          <div className="space-y-4">
            {/* Duration Type Toggle */}
            <div className="space-y-2">
              <Label>
                <Clock className="inline h-4 w-4 mr-1" />
                Duration Type
              </Label>
              <Select
                value={formData.durationType}
                onValueChange={(value: 'MONTHS' | 'DAYS') => update({ durationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHS">Months</SelectItem>
                  <SelectItem value="DAYS">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Value and Max Uses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration ({formData.durationType === 'MONTHS' ? 'Months' : 'Days'}) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max={formData.durationType === 'MONTHS' ? "60" : "1825"}
                  value={formData.durationType === 'MONTHS' ? formData.durationMonths || '' : formData.durationDays || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    update(formData.durationType === 'MONTHS' ? { durationMonths: value } : { durationDays: value });
                  }}
                  placeholder={formData.durationType === 'MONTHS' ? '1-60 months' : '1-1825 days'}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.durationType === 'MONTHS' ? 'Range: 1-60 months' : 'Range: 1-1825 days (5 years)'}.
                  {' '}Students who already redeemed the code keep what they got.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Max Uses *
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={minMaxUses}
                  max="10000"
                  value={formData.maxUses || ''}
                  onChange={(e) => update({ maxUses: parseInt(e.target.value) || 1 })}
                  className={errors.maxUses ? 'border-red-500' : ''}
                />
                {errors.maxUses && (
                  <p className="text-sm text-red-500">{errors.maxUses}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Already redeemed {usedCount} time{usedCount === 1 ? '' : 's'}.
                </p>
              </div>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date *</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => update({ expiresAt: e.target.value })}
              className={errors.expiresAt ? 'border-red-500' : ''}
            />
            {errors.expiresAt && (
              <p className="text-sm text-red-500">{errors.expiresAt}</p>
            )}
            <p className="text-xs text-muted-foreground">The code works until the end of this day.</p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => update({ isActive: checked as boolean })}
            />
            <Label htmlFor="isActive">Active (students can redeem it)</Label>
          </div>

          {/* Study Packs */}
          <div className="space-y-2">
            <Label>Study Packs *</Label>
            <p className="text-xs text-muted-foreground">
              The packs a student gets when redeeming the code. Students who already redeemed it keep their packs.
            </p>
            {studyPacksLoading ? (
              <div className="flex items-center justify-center py-4 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Chargement des Study Packs...</span>
              </div>
            ) : studyPacks.length > 0 || inactiveCodePacks.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2 bg-background">
                {studyPacks.map((pack) => (
                  <div key={pack.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`pack-${pack.id}`}
                      checked={formData.studyPackIds.includes(pack.id)}
                      onCheckedChange={(checked) => handleStudyPackToggle(pack.id, checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={`pack-${pack.id}`}
                      className="text-sm font-normal cursor-pointer flex-1 leading-none"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{pack.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pack.type}{pack.yearNumber ? ` • Année ${pack.yearNumber}` : ''}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
                {inactiveCodePacks.map((pack) => (
                  <div key={pack.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`pack-${pack.id}`}
                      checked={formData.studyPackIds.includes(pack.id)}
                      onCheckedChange={(checked) => handleStudyPackToggle(pack.id, checked as boolean)}
                    />
                    <Label
                      htmlFor={`pack-${pack.id}`}
                      className="text-sm font-normal cursor-pointer flex-1 leading-none"
                    >
                      <div className="font-medium text-muted-foreground">{pack.name} (inactive pack: not granted)</div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 border rounded-md bg-muted/50">
                <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Aucun Study Pack disponible.</span>
              </div>
            )}
            {errors.studyPackIds && (
              <p className="text-sm text-red-500">{errors.studyPackIds}</p>
            )}
            {formData.studyPackIds.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                <Package className="h-4 w-4" />
                <span>
                  {formData.studyPackIds.length} Study Pack{formData.studyPackIds.length > 1 ? 's' : ''} sélectionné{formData.studyPackIds.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
