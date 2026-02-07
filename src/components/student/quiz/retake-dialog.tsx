// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export type RetakeType = 'SAME' | 'INCORRECT_ONLY' | 'CORRECT_ONLY' | 'NOT_RESPONDED';

interface RetakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { retakeType: RetakeType }) => Promise<void> | void;
}

export function RetakeDialog({ open, onOpenChange, onConfirm }: RetakeDialogProps) {
  const [retakeType, setRetakeType] = useState<RetakeType>('SAME');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return !!retakeType;
  }, [retakeType]);

  const handleConfirm = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      console.log('🔄 [RetakeDialog] Submitting retake request:', {
        retakeType
      });

      await onConfirm({ retakeType });

    } catch (error) {
      console.error('💥 [RetakeDialog] Error in onConfirm:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Retake Session</DialogTitle>
          <DialogDescription>Choose what to include in the retake session.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Retake Type</Label>
            <RadioGroup value={retakeType} onValueChange={(v: any) => setRetakeType(v)} className="grid grid-cols-1 gap-2">
              <label className={cn('flex items-center gap-3 p-3 border rounded-md cursor-pointer ', retakeType==='SAME' && 'border-primary bg-primary/80') }>
                <RadioGroupItem value="SAME" id="retake_same" />
                <div>
                  <div className="font-medium">Same Questions</div>
                </div>
              </label>
              <label className={cn('flex items-center gap-3 p-3 border rounded-md cursor-pointer ', retakeType==='INCORRECT_ONLY' && 'border-primary bg-primary/80') }>
                <RadioGroupItem value="INCORRECT_ONLY" id="retake_incorrect" />
                <div>
                  <div className="font-medium">Incorrect Only</div>
                </div>
              </label>
              <label className={cn('flex items-center gap-3 p-3 border rounded-md cursor-pointer ', retakeType==='CORRECT_ONLY' && 'border-primary bg-primary/80') }>
                <RadioGroupItem value="CORRECT_ONLY" id="retake_correct" />
                <div>
                  <div className="font-medium">Correct Only</div>
                </div>
              </label>
              <label className={cn('flex items-center gap-3 p-3 border rounded-md cursor-pointer ', retakeType==='NOT_RESPONDED' && 'border-primary bg-primary/80') }>
                <RadioGroupItem value="NOT_RESPONDED" id="retake_skipped" />
                <div>
                  <div className="font-medium">Not Responded</div>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || submitting}>
            {submitting ? 'Creating…' : 'Create Retake'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

