'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  CheckCircle, 
  Copy, 
  FileText,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

export function ImportUsageGuide() {
  const sampleQuestion = {
    questionText: "What is the primary function of the heart?",
    explanation: "The heart pumps blood throughout the body",
    questionType: "SINGLE_CHOICE",
    answers: [
      {
        answerText: "Pumping blood",
        isCorrect: true,
        explanation: "Correct - the heart's main function is circulation"
      },
      {
        answerText: "Filtering toxins",
        isCorrect: false,
        explanation: "This is the function of kidneys"
      },
      {
        answerText: "Producing hormones",
        isCorrect: false,
        explanation: "This is primarily done by endocrine glands"
      }
    ]
  };

  const sampleArray = [sampleQuestion];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Sample JSON copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to import questions successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Select Hierarchy</h4>
                <p className="text-sm text-muted-foreground">
                  Choose University → Exam Year → Unit → Module → Course
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Prepare JSON</h4>
                <p className="text-sm text-muted-foreground">
                  Format your questions as a JSON array (see sample below)
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Import & Validate</h4>
                <p className="text-sm text-muted-foreground">
                  Paste JSON, review validation, and import questions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Format Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-500" />
            JSON Format Requirements
          </CardTitle>
          <CardDescription>
            Your questions must follow this exact structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields */}
          <div>
            <h4 className="font-medium mb-2">Required Fields</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <code className="bg-muted px-2 py-1 rounded">questionText</code>
                <span className="text-muted-foreground">- The question content</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <code className="bg-muted px-2 py-1 rounded">questionType</code>
                <span className="text-muted-foreground">- "SINGLE_CHOICE" or "MULTIPLE_CHOICE"</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <code className="bg-muted px-2 py-1 rounded">answers</code>
                <span className="text-muted-foreground">- Array of answer objects</span>
              </div>
            </div>
          </div>

          {/* Answer Requirements */}
          <div>
            <h4 className="font-medium mb-2">Answer Requirements</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Each answer needs <code className="bg-muted px-1 rounded">answerText</code> and <code className="bg-muted px-1 rounded">isCorrect</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>SINGLE_CHOICE: exactly 1 correct answer</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>MULTIPLE_CHOICE: at least 1 correct answer</span>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h4 className="font-medium mb-2">Optional Fields</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <code className="bg-muted px-2 py-1 rounded">explanation</code>
                <span className="text-muted-foreground">- Question explanation (recommended)</span>
              </div>
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <code className="bg-muted px-2 py-1 rounded">answers[].explanation</code>
                <span className="text-muted-foreground">- Answer explanations</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample JSON */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-green-500" />
              Sample JSON
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(sampleArray, null, 2))}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Sample
            </Button>
          </CardTitle>
          <CardDescription>
            Copy this sample and modify it with your questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <code>{JSON.stringify(sampleArray, null, 2)}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2 text-sm">
            <li>• Use a JSON validator to check your format before importing</li>
            <li>• Add explanations to improve the learning experience</li>
            <li>• Test with a small batch first (2-3 questions)</li>
            <li>• Keep question text clear and concise</li>
            <li>• Ensure answer options are distinct and unambiguous</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
