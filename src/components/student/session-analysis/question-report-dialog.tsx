// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuestionReporting } from '@/hooks/use-session-analysis';
import { toast } from 'sonner';

// Report types based on API validation response
const REPORT_TYPES = [
  {
    value: 'INCORRECT_ANSWER',
    label: 'Incorrect answer',
    description: 'The marked correct answer appears to be incorrect'
  },
  {
    value: 'UNCLEAR_QUESTION',
    label: 'Unclear question',
    description: 'The question is ambiguous or hard to understand'
  },
  {
    value: 'TYPO',
    label: 'Typo',
    description: 'Spelling mistake or typographical error'
  },
  {
    value: 'INAPPROPRIATE',
    label: 'Inappropriate content',
    description: 'Offensive or inappropriate content'
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Another issue not listed above'
  }
];

interface QuestionReportDialogProps {
  questionId: number;
  questionText?: string;
  questionType?: string;
  onReportSubmitted?: () => void;
  children: React.ReactNode;
}

export function QuestionReportDialog({
  questionId,
  questionText,
  questionType,
  onReportSubmitted,
  children
}: QuestionReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState('');
  
  const { submitting, error, success, reportQuestion, resetState } = useQuestionReporting();

  const handleSubmit = async () => {
    if (!reportType || !description.trim()) {
      toast.error('Please select a problem type and provide a description');
      return;
    }

    try {
      await reportQuestion(questionId, {
        reportType,
        description: description.trim()
      });

      // Success handling
      toast.success('Report sent successfully');
      setOpen(false);
      setReportType('');
      setDescription('');
      resetState();
      
      // Call the callback if provided
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (error) {
      // Error is already handled by the hook and toast
      console.error('Report submission failed:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setReportType('');
      setDescription('');
      resetState();
    }
  };

  const selectedReportType = REPORT_TYPES.find(type => type.value === reportType);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report a problem with this question
          </DialogTitle>
          <DialogDescription>
            Help us improve question quality by reporting any issues you encounter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Question #{questionId}</span>
              {questionType && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {questionType}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">
              {questionText && questionText.length > 200
                ? `${questionText.substring(0, 200)}...`
                : (questionText || 'Question text not available')
              }
            </p>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Problem type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select the problem type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReportType && (
              <p className="text-xs text-muted-foreground">
                {selectedReportType.description}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Please be as specific as possible.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reportType || !description.trim() || description.trim().length < 10}
            className="gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
