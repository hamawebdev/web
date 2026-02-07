'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Upload,
  FileText,
  Loader2
} from 'lucide-react';
import {
  JsonQuestionInputProps,
  ImportQuestion,
  ValidationResult,
  ValidationError
} from '@/types/question-import';

export function JsonQuestionInput({
  value,
  onChange,
  validation,
  onValidate,
  onValidationResult,
  disabled = false
}: JsonQuestionInputProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [isValidating, setIsValidating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate JSON format only
  const validateQuestions = useCallback((jsonString: string): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let questions: ImportQuestion[] = [];
    let questionCount = 0;

    try {
      // Parse JSON - this is the only validation we do
      const parsed = JSON.parse(jsonString);

      // Check if it's an array
      if (!Array.isArray(parsed)) {
        errors.push({
          field: 'root',
          message: 'JSON must be an array'
        });
        return { isValid: false, errors, warnings, questionCount: 0 };
      }

      questions = parsed;
      questionCount = questions.length;

      // No content validation - accept any structure
      // Explanation is optional and can be empty string

    } catch (parseError) {
      errors.push({
        field: 'json',
        message: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      questionCount
    };
  }, []);

  // Handle input change with validation
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newValue.trim()) {
      setIsValidating(true);
      // Debounce validation
      timeoutRef.current = setTimeout(() => {
        try {
          const validationResult = validateQuestions(newValue);
          // Pass validation result to parent
          if (onValidationResult) {
            onValidationResult(validationResult);
          }
          // Pass parsed questions to parent
          onValidate(validationResult.isValid ? JSON.parse(newValue) : []);
        } catch (error) {
          console.error('Validation error:', error);
          onValidate([]);
          // Pass error validation result to parent
          if (onValidationResult) {
            onValidationResult({
              isValid: false,
              errors: [{ field: 'json', message: 'Invalid JSON format' }],
              warnings: [],
              questionCount: 0
            });
          }
        } finally {
          setIsValidating(false);
        }
      }, 500);
    } else {
      onValidate([]);
      setIsValidating(false);
      // Pass empty validation result to parent
      if (onValidationResult) {
        onValidationResult({
          isValid: false,
          errors: [],
          warnings: [],
          questionCount: 0
        });
      }
    }
  }, [onChange, onValidate, onValidationResult, validateQuestions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Parse questions for preview
  const previewQuestions = useMemo(() => {
    if (!value.trim() || !validation.isValid) return [];
    
    try {
      return JSON.parse(value) as ImportQuestion[];
    } catch {
      return [];
    }
  }, [value, validation.isValid]);

  // Sample JSON for reference
  const sampleJson = `[
  {
    "questionText": "What is the primary function of the heart?",
    "explanation": "",
    "questionType": "SINGLE_CHOICE",
    "answers": [
      {
        "answerText": "Pumping blood",
        "isCorrect": true
      },
      {
        "answerText": "Filtering toxins",
        "isCorrect": false
      }
    ]
  }
]`;

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : validation.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : validation.errors.length > 0 ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {isValidating ? 'Validating...' : 
             validation.isValid ? `${validation.questionCount} questions ready` :
             validation.errors.length > 0 ? `${validation.errors.length} errors found` :
             'Enter questions JSON'}
          </span>
        </div>
        
        {validation.questionCount > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {validation.questionCount} questions
            </Badge>
            {validation.warnings.length > 0 && (
              <Badge variant="outline" className="text-yellow-600">
                {validation.warnings.length} warnings
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'input' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">JSON Input</TabsTrigger>
          <TabsTrigger value="preview" disabled={!validation.isValid}>
            Preview ({validation.questionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions JSON</CardTitle>
              <CardDescription>
                Paste your questions as a JSON array. Each question should include text, type, and answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={sampleJson}
                disabled={disabled}
                className="min-h-[300px] font-mono text-sm"
              />
              
              {/* Validation Messages */}
              {validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Validation Errors:</div>
                      {validation.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">
                          {error.questionIndex !== undefined && `Question ${error.questionIndex + 1}: `}
                          {error.answerIndex !== undefined && `Answer ${error.answerIndex + 1}: `}
                          {error.message}
                        </div>
                      ))}
                      {validation.errors.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ...and {validation.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validation.warnings.length > 0 && validation.errors.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Suggestions:</div>
                      {validation.warnings.slice(0, 3).map((warning, index) => (
                        <div key={index} className="text-sm">
                          {warning.questionIndex !== undefined && `Question ${warning.questionIndex + 1}: `}
                          {warning.message}
                        </div>
                      ))}
                      {validation.warnings.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          ...and {validation.warnings.length - 3} more suggestions
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Question Preview
              </CardTitle>
              <CardDescription>
                Review your questions before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewQuestions.length > 0 ? (
                <div className="space-y-6">
                  {previewQuestions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Question {index + 1}
                        </h4>
                        <Badge variant={question.questionType === 'SINGLE_CHOICE' ? 'default' : 'secondary'}>
                          {question.questionType.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">{question.questionText}</p>
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground italic">
                            Explanation: {question.explanation}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Answers:</div>
                        {question.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-start space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              answer.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <div className={answer.isCorrect ? 'font-medium text-green-700' : ''}>
                                {answer.answerText}
                              </div>
                              {answer.explanation && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {answer.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No valid questions to preview
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
