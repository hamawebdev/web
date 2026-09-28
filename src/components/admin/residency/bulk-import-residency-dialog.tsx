'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Upload, FileJson } from 'lucide-react';
import { BulkResidencyQuestionRequest } from '@/types/api';
import { ResidencyQuestionsService, AuthService } from '@/lib/api-services';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { RESIDENCY_PARTS } from '@/lib/residency-parts';
import type { ResidencyPart } from '@/types/api';

interface BulkImportResidencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function BulkImportResidencyDialog({
  open,
  onOpenChange,
  onImportComplete,
}: BulkImportResidencyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [universities, setUniversities] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  // Form state for metadata
  const [universityId, setUniversityId] = useState<number | undefined>(undefined);
  const [examYear, setExamYear] = useState<number | undefined>(undefined);
  const [part, setPart] = useState<ResidencyPart | ''>('');

  // Load universities when dialog opens
  const loadUniversities = async () => {
    try {
      console.log('🔄 Loading universities...');
      setLoadingUniversities(true);
      const response = await AuthService.getUniversities();
      console.log('📥 Universities response:', response);
      if (response.success && response.data) {
        const univList = response.data.universities || [];
        console.log('✅ Universities loaded:', univList.length, univList);
        setUniversities(univList);
      } else {
        console.error('❌ Failed to load universities:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading universities:', error);
    } finally {
      setLoadingUniversities(false);
    }
  };

  // Load universities when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🚪 Dialog opened, loading universities...');
      loadUniversities();
    }
  }, [open]);

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setJsonInput('');
      setUniversityId(undefined);
      setExamYear(undefined);
      setPart('');
      setError(null);
      setSuccess(null);
    }
    onOpenChange(newOpen);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Validate and parse JSON
  const validateAndParseJson = (): BulkResidencyQuestionRequest | null => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Check if it's the full request format or just the questions array
      let requestData: BulkResidencyQuestionRequest;

      if (Array.isArray(parsed)) {
        // User provided just the questions array
        if (!universityId || !examYear || !part) {
          setError('When providing only questions array, you must fill in University, Exam Year, and Part fields');
          return null;
        }
        requestData = {
          universityId,
          examYear,
          part,
          questions: parsed,
        };
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        // User provided the full request format
        requestData = {
          universityId: parsed.universityId || universityId,
          examYear: parsed.examYear || examYear,
          part: parsed.part || part,
          questions: parsed.questions,
        };
      } else {
        setError('Invalid JSON format. Expected either an array of questions or an object with "questions" property');
        return null;
      }

      // Validate required fields
      if (!requestData.universityId) {
        setError('University ID is required');
        return null;
      }
      if (!requestData.examYear) {
        setError('Exam Year is required');
        return null;
      }
      if (!requestData.part) {
        setError('Part is required');
        return null;
      }
      if (!requestData.questions || requestData.questions.length === 0) {
        setError('At least one question is required');
        return null;
      }

      // Normalize and validate each question
      for (let i = 0; i < requestData.questions.length; i++) {
        const q = requestData.questions[i];

        // Normalize: accept both "answers" and "questionAnswers"
        if ((q as any).answers && !q.questionAnswers) {
          q.questionAnswers = (q as any).answers;
          delete (q as any).answers;
        }

        if (!q.questionText) {
          setError(`Question ${i + 1}: questionText is required`);
          return null;
        }
        if (!q.questionAnswers || !Array.isArray(q.questionAnswers) || q.questionAnswers.length < 2) {
          setError(`Question ${i + 1}: At least 2 answers are required (found: ${q.questionAnswers ? q.questionAnswers.length : 0})`);
          return null;
        }
        const hasCorrectAnswer = q.questionAnswers.some(a => a.isCorrect === true);
        if (!hasCorrectAnswer) {
          setError(`Question ${i + 1}: At least one answer must be marked as correct`);
          return null;
        }
      }

      return requestData;
    } catch (err) {
      setError('Invalid JSON format: ' + (getApiErrorMessage(err, 'Unknown error')));
      return null;
    }
  };

  // Handle import
  const handleImport = async () => {
    setError(null);
    setSuccess(null);

    if (!jsonInput.trim()) {
      setError('Please paste or upload JSON data');
      return;
    }

    const requestData = validateAndParseJson();
    if (!requestData) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Importing residency questions:', requestData);

      const response = await ResidencyQuestionsService.bulkCreateResidencyQuestions(requestData);
      console.log('📥 Bulk import response:', response);

      if (response.success && response.data) {
        // The backend replies with a raw { questions, totalCreated, message } body; the service
        // wraps it so response.data is that body (apiClient already threw on any non-2xx).
        const totalCreated = response.data.totalCreated ?? response.data.questions?.length ?? 0;
        console.log('✅ Total created:', totalCreated);

        setSuccess(`Successfully imported ${totalCreated} question(s)`);
        toast.success('Import Successful', {
          description: `${totalCreated} residency question(s) have been created`,
        });

        // Wait a bit to show success message, then close and refresh
        setTimeout(() => {
          onImportComplete();
          handleOpenChange(false);
        }, 1500);
      } else {
        throw new Error(response.error || 'Failed to import questions');
      }
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Failed to import questions');
      console.error('❌ Import error:', err);
      setError(errorMessage);
      toast.error('Import Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate example JSON
  const exampleJson = {
    universityId: 1,
    examYear: 2024,
    part: 'Sciences_fondamentales',
    questions: [
      {
        questionText: 'What is the primary function of mitochondria?',
        explanation: 'Mitochondria are the powerhouse of the cell',
        metadata: 'Biology - Cell Structure - 2024',
        questionAnswers: [
          { answerText: 'Energy production', isCorrect: true },
          { answerText: 'Protein synthesis', isCorrect: false },
          { answerText: 'DNA replication', isCorrect: false },
          { answerText: 'Cell division', isCorrect: false },
        ],
      },
    ],
  };

  const handleUseExample = () => {
    setJsonInput(JSON.stringify(exampleJson, null, 2));
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Bulk Import Residency Questions (JSON)
          </DialogTitle>
          <DialogDescription>
            Import multiple residency questions at once using JSON format. You can paste JSON directly or upload a .json file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select
                value={universityId?.toString()}
                onValueChange={(value) => setUniversityId(parseInt(value))}
                disabled={loadingUniversities}
              >
                <SelectTrigger id="university">
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id.toString()}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examYear">Exam Year</Label>
              <Input
                id="examYear"
                type="number"
                placeholder="e.g., 2024"
                value={examYear || ''}
                onChange={(e) => setExamYear(e.target.value ? parseInt(e.target.value) : undefined)}
                min="2000"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="part">Part</Label>
              <Select value={part} onValueChange={(value: any) => setPart(value)}>
                <SelectTrigger id="part">
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  {RESIDENCY_PARTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload JSON File (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseExample}
                disabled={loading}
              >
                Use Example
              </Button>
            </div>
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <Label htmlFor="json-input">JSON Data</Label>
            <Textarea
              id="json-input"
              placeholder="Paste your JSON here or upload a file above..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              disabled={loading}
              className="font-mono text-sm min-h-[300px]"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !jsonInput.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Questions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

