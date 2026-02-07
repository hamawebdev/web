'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  GraduationCap, 
  RefreshCw,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';
import { QuizType } from '../types';

interface QuizTypeSelectionProps {
  selectedType: QuizType;
  onTypeChange: (type: QuizType) => void;
}

interface QuizTypeOption {
  type: QuizType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  timeEstimate: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const QUIZ_TYPE_OPTIONS: QuizTypeOption[] = [
  {
    type: 'PRACTICE',
    title: 'Practice Quiz',
    description: 'Perfect for regular study sessions and skill building',
    icon: <BookOpen className="h-6 w-6" />,
    features: [
      'Immediate feedback after each question',
      'Detailed explanations for all answers',
      'No time pressure',
      'Can pause and resume',
      'Progress tracking'
    ],
    recommended: true,
    timeEstimate: '10-30 minutes',
    difficulty: 'Beginner'
  },
  {
    type: 'EXAM',
    title: 'Exam Simulation',
    description: 'Simulate real exam conditions for comprehensive assessment',
    icon: <GraduationCap className="h-6 w-6" />,
    features: [
      'Timed exam environment',
      'No immediate feedback',
      'Comprehensive final results',
      'Performance analytics',
      'Exam-like question distribution'
    ],
    timeEstimate: '30-120 minutes',
    difficulty: 'Advanced'
  },
  {
    type: 'REMEDIAL',
    title: 'Remedial Study',
    description: 'Focus on weak areas and topics that need improvement',
    icon: <RefreshCw className="h-6 w-6" />,
    features: [
      'Targets weak knowledge areas',
      'Adaptive question selection',
      'Extra practice on missed topics',
      'Personalized learning path',
      'Progress monitoring'
    ],
    timeEstimate: '15-45 minutes',
    difficulty: 'Intermediate'
  }
];

export function QuizTypeSelection({ selectedType, onTypeChange }: QuizTypeSelectionProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Quiz Type</h2>
        <p className="text-muted-foreground">
          Select the type of quiz that best fits your learning goals
        </p>
      </div>

      {/* Quiz Type Options */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {QUIZ_TYPE_OPTIONS.map((option) => (
          <Card
            key={option.type}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedType === option.type
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onTypeChange(option.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedType === option.type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {option.title}
                      {option.recommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
                
                {selectedType === option.type && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                {option.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quiz Metadata */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {option.timeEstimate}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  {option.difficulty}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Features:</h4>
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Type Summary */}
      {selectedType && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                {QUIZ_TYPE_OPTIONS.find(opt => opt.type === selectedType)?.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {QUIZ_TYPE_OPTIONS.find(opt => opt.type === selectedType)?.title} Selected
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {QUIZ_TYPE_OPTIONS.find(opt => opt.type === selectedType)?.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{QUIZ_TYPE_OPTIONS.find(opt => opt.type === selectedType)?.timeEstimate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{QUIZ_TYPE_OPTIONS.find(opt => opt.type === selectedType)?.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Start with Practice Quiz if you're new to the platform. 
          You can always create different types of quizzes later.
        </p>
      </div>
    </div>
  );
}
