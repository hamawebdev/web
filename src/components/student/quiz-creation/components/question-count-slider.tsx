'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Info,
  CheckCircle,
  Type
} from 'lucide-react';
import {
  useQuestionRanges,
  useTimeEstimate,
  useCurrentRange
} from '../hooks/use-question-calculation';
import { QuestionCountSliderProps } from '../types';

// Helper function to sanitize quiz title
const sanitizeTitle = (title: string): string => {
  return title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 100); // Limit to 100 characters
};

export function QuestionCountSlider({
  selectedCourses,
  questionCount,
  availableQuestions,
  onQuestionCountChange,
  advancedFilters = {},
  config,
  onConfigChange,
  onCreateQuiz,
  isCreating = false
}: QuestionCountSliderProps) {

  const ranges = useQuestionRanges(availableQuestions);
  const timeEstimate = useTimeEstimate(questionCount);
  const currentRange = useCurrentRange(questionCount, ranges);

  // Generate default title with date and time
  const generateDefaultTitle = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `Practice Quiz - ${date} at ${time}`;
  };

  // Handle title change with sanitization
  const handleTitleChange = (title: string) => {
    onConfigChange({ title });
  };

  // Handle title blur to sanitize
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTitle(e.target.value);
    if (sanitized !== e.target.value) {
      onConfigChange({ title: sanitized });
    }
  };

  // Handle settings changes
  const handleSettingsChange = (key: string, value: any) => {
    onConfigChange({
      settings: {
        ...config.settings,
        [key]: value
      }
    });
  };

  // Ensure default settings are set
  React.useEffect(() => {
    onConfigChange({
      settings: {
        ...config.settings,
        shuffleQuestions: true,
        showExplanations: 'after_each'
      }
    });
  }, []);

  // Handle slider change with validation
  const handleSliderChange = useCallback((value: number[]) => {
    const newValue = Math.min(Math.max(1, value[0]), availableQuestions);
    onQuestionCountChange(newValue);
  }, [availableQuestions, onQuestionCountChange]);



  // Show placeholder when no courses selected
  if (selectedCourses.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Select courses first</strong>
            <br />
            Please select at least one course to see available question count and configure your quiz.
          </AlertDescription>
        </Alert>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Question Count Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-muted rounded animate-pulse" />
                <div className="h-16 bg-muted rounded animate-pulse" />
                <div className="h-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get range color for styling
  const getRangeColor = (range: string) => {
    switch (range) {
      case 'quick': return 'bg-primary';
      case 'standard': return 'bg-accent';
      case 'comprehensive': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Slider Card */}
      <Card className="relative overflow-hidden group bg-gradient-to-br from-background via-background to-muted/20 border-border/60 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors duration-200">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-medium text-muted-foreground">Question Count</span>
              <span className="text-2xl font-bold text-foreground">
                {questionCount} question{questionCount !== 1 ? 's' : ''}
              </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-8 px-6 pb-8">
          {/* Slider Section */}
          <div className="space-y-6">
            <div className="px-2">
              <Slider
                value={[questionCount]}
                onValueChange={handleSliderChange}
                max={availableQuestions}
                min={1}
                step={1}
                className="w-full group-hover:scale-[1.01] transition-transform duration-200"
              />
            </div>

            {/* Enhanced Slider Labels */}
            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col items-center gap-1 group/label hover:scale-105 transition-transform duration-200">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs font-medium text-muted-foreground group-hover/label:text-foreground transition-colors">1</span>
              </div>
              <div className="flex flex-col items-center gap-1 group/label hover:scale-105 transition-transform duration-200">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs font-medium text-muted-foreground group-hover/label:text-foreground transition-colors">5</span>
              </div>
              <div className="flex flex-col items-center gap-1 group/label hover:scale-105 transition-transform duration-200">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs font-medium text-muted-foreground group-hover/label:text-foreground transition-colors">10</span>
              </div>
              <div className="flex flex-col items-center gap-1 group/label hover:scale-105 transition-transform duration-200">
                <div className="h-2 w-2 rounded-full bg-primary/60" />
                <span className="text-xs font-medium text-primary group-hover/label:text-primary/80 transition-colors">
                  {availableQuestions} <span className="text-muted-foreground">(max)</span>
                </span>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(questionCount / availableQuestions) * 125.6} 125.6`}
                      className="text-primary transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {Math.round((questionCount / availableQuestions) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {questionCount} of {availableQuestions} questions selected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {availableQuestions - questionCount} questions remaining
                </p>
              </div>
            </div>
          </div>

          {/* Quiz Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <Separator className="bg-gradient-to-r from-border via-border/50 to-transparent" />

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-muted-foreground"
              >
                <Type className="h-4 w-4" />
              </motion.div>
              <Label className="font-medium">Quiz Title</Label>
              <span className="text-destructive text-xs">*</span>
            </div>

            <motion.div
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Input
                id="quiz-title"
                placeholder="Enter a descriptive title for your quiz"
                value={config.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full transition-all duration-300 focus:shadow-md focus:shadow-primary/10 hover:border-primary/30"
                maxLength={100}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              Title automatically includes current date and time for better organization. You can edit it as needed. Special characters will be automatically cleaned.
            </motion.p>
          </motion.div>

          {/* Time Limit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            <Separator className="bg-gradient-to-r from-border via-border/50 to-transparent" />

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="text-muted-foreground"
              >
                <Clock className="h-4 w-4" />
              </motion.div>
              <Label className="font-medium">Time Limit</Label>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Select
                value={config.settings.timeLimit?.toString() || 'none'}
                onValueChange={(value) =>
                  handleSettingsChange('timeLimit', value === 'none' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger className="transition-all duration-300 hover:border-primary/30 focus:shadow-md focus:shadow-primary/10">
                  <SelectValue placeholder="Select time limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No time limit</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {config.type === 'PRACTICE'
                ? 'Practice quizzes work best without time pressure'
                : config.type === 'EXAM'
                  ? 'Exam simulations benefit from realistic time constraints'
                  : 'Choose based on your study goals'
              }
            </motion.p>
          </motion.div>

        </CardContent>
      </Card>

    </div>
  );
}
