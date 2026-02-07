'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  GraduationCap,
} from 'lucide-react';

interface QuizTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuizModeOption {
  type: 'practice' | 'exam';
  title: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
  gradient: string;
}

const QUIZ_MODE_OPTIONS: QuizModeOption[] = [
  {
    type: 'practice',
    title: 'Practice Quiz',
    description: 'Study with immediate feedback and explanations',
    icon: <BookOpen className="h-6 w-6" />,
    recommended: true,
    gradient: 'from-primary to-primary'
  },
  {
    type: 'exam',
    title: 'Exam Mode',
    description: 'Timed test with realistic exam conditions',
    icon: <GraduationCap className="h-6 w-6" />,
    gradient: 'from-chart-3 to-chart-3'
  }
];

export function QuizTypeSelectionModal({ isOpen, onClose }: QuizTypeSelectionModalProps) {
  const router = useRouter();

  const handleModeSelection = (mode: 'practice' | 'exam') => {
    onClose();
    
    if (mode === 'practice') {
      // Navigate to existing quiz creation wizard (practice mode)
      router.push('/student/quiz/create?mode=practice');
    } else {
      // Navigate to new exam creation form
      router.push('/student/exams/create');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <DialogHeader className="text-center pb-[calc(var(--spacing)*6)]">
            <DialogTitle className="text-2xl font-semibold">
              Choose Quiz Type
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-[calc(var(--spacing)*3)]">
            {QUIZ_MODE_OPTIONS.map((option, index) => (
              <motion.button
                key={option.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelection(option.type)}
                className={`w-full p-[calc(var(--spacing)*4)] rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-200 text-left group bg-gradient-to-r ${option.gradient} hover:shadow-lg relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <div className="relative z-10 flex items-center gap-[calc(var(--spacing)*3)]">
                  <div className="p-[calc(var(--spacing)*2)] rounded-lg bg-white/20 text-white">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-[calc(var(--spacing)*2)]">
                      <h3 className="font-semibold text-white">{option.title}</h3>
                      {option.recommended && (
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/80 mt-1">{option.description}</p>
                  </div>
                </div>

              </motion.button>
            ))}
        </div>

          <div className="flex justify-center pt-[calc(var(--spacing)*6)]">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
