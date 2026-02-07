'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useQuizCreation } from './hooks/use-quiz-creation';
import { QuizCreationWizardProps } from './types';

// Import step components (will be created next)
import { CourseSelection } from './components/course-selection';
import { QuestionCountSlider } from './components/question-count-slider';
import { AdvancedFilters } from './components/advanced-filters';

export function QuizCreationWizard({ 
  onQuizCreated, 
  onCancel, 
  initialConfig,
  userProfile 
}: QuizCreationWizardProps) {
  const {
    currentStep,
    config,
    availableQuestions,
    validationErrors,
    isCreating,
    canProceed,
    filterData,
    filtersLoading,
    steps,
    updateConfig,
    nextStep,
    previousStep,
    setCurrentStep,
    createQuiz,
    resetWizard
  } = useQuizCreation(userProfile, initialConfig);

  // Handle quiz creation
  const handleCreateQuiz = async () => {
    try {
      const result = await createQuiz();
      if (result && onQuizCreated) {
        onQuizCreated(result);
      }
    } catch (error) {
      console.error('Quiz creation failed:', error);
    }
  };

  // Calculate progress percentage
  const progressPercentage = (currentStep / steps.length) * 100;

  // Render current step content
  const renderStepContent = () => {
    if (filtersLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading quiz options...</span>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <CourseSelection
            subjects={filterData?.unites || []}
            selectedCourses={config.filters.courseIds}
            onSelectionChange={(courseIds) =>
              updateConfig({
                filters: { ...config.filters, courseIds }
              })
            }
            allowedYearLevels={filterData?.allowedYearLevels || [userProfile.yearLevel]}
          />
        );
      case 2:
        return (
          <AdvancedFilters
            filters={{
              quizSourceIds: config.filters.quizSourceIds || [],
              quizYears: config.filters.quizYears || [],
              questionTypes: config.filters.questionTypes || [],
              examYears: config.filters.examYears || []
            }}
            onFiltersChange={(filters) =>
              updateConfig({
                filters: { ...config.filters, ...filters }
              })
            }
            baseQuestionCount={availableQuestions}
            availableSources={filterData?.quizSources || []}
            availableYears={(filterData?.availableYears || []).map(y => Number(y)).filter(n => !Number.isNaN(n))}
          />
        );
      case 3:
        return (
          <QuestionCountSlider
            selectedCourses={config.filters.courseIds}
            questionCount={config.settings.questionCount}
            availableQuestions={availableQuestions}
            onQuestionCountChange={(questionCount) =>
              updateConfig({
                settings: { ...config.settings, questionCount }
              })
            }
            advancedFilters={{
              quizSourceIds: config.filters.quizSourceIds,
              quizYears: config.filters.quizYears
            }}
            config={config}
            onConfigChange={updateConfig}
            onCreateQuiz={handleCreateQuiz}
            isCreating={isCreating}
          />
        );
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Practice Mode
          </div>
        </div>
        <h1 className="text-3xl font-bold">Create Practice Quiz</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create your personalized practice quiz
        </p>
      </div>

      {/* Step Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-wrap gap-3">
              <AnimatePresence mode="wait">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  const isAccessible = stepNumber <= currentStep || isCompleted;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                      whileHover={{ scale: isAccessible ? 1.05 : 1 }}
                      whileTap={{ scale: isAccessible ? 0.95 : 1 }}
                    >
                      <Button
                        variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                        size="sm"
                        className={`
                          flex items-center gap-2 relative overflow-hidden transition-all duration-300
                          ${isCurrent ? 'shadow-lg shadow-primary/25 ring-2 ring-primary/20' : ''}
                          ${isCompleted ? 'bg-secondary/80 hover:bg-secondary' : ''}
                          ${!isAccessible ? 'opacity-60' : 'hover:shadow-md'}
                        `}
                        onClick={() => isAccessible && setCurrentStep(stepNumber)}
                        disabled={!isAccessible}
                      >
                        {/* Button background glow for current step */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        <motion.div
                          initial={false}
                          animate={{
                            rotate: isCompleted ? 360 : 0,
                            scale: isCurrent ? 1.1 : 1
                          }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="relative z-10"
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className={`h-4 w-4 ${isCurrent ? 'text-primary-foreground' : ''}`} />
                          )}
                        </motion.div>

                        <span className="hidden sm:inline relative z-10 font-medium">
                          {step.title}
                        </span>
                        <span className="sm:hidden relative z-10 font-semibold">
                          {stepNumber}
                        </span>

                        {step.optional && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Badge variant="outline" className="text-xs bg-background/80 relative z-10">
                              Optional
                            </Badge>
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.98 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border-border/60 shadow-xl hover:shadow-2xl transition-all duration-500 group">
          {/* Enhanced background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />

          <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                <motion.div
                  className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"
                  initial={{ height: 0 }}
                  animate={{ height: 32 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                />
                {steps[currentStep - 1]?.title}
                {steps[currentStep - 1]?.optional && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Badge variant="outline" className="bg-background/80">Optional</Badge>
                  </motion.div>
                )}
              </CardTitle>
              <motion.p
                className="text-muted-foreground mt-2 text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                {steps[currentStep - 1]?.description}
              </motion.p>
            </motion.div>
          </CardHeader>

          <CardContent className="relative z-10 p-8 bg-gradient-to-br from-background/50 via-background/30 to-background/20 backdrop-blur-sm">
            {/* Enhanced content area with improved visual hierarchy and micro-interactions */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/3 via-accent/2 to-secondary/2 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out rounded-b-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Layered gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-chart-1/1 via-transparent to-chart-2/1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 rounded-b-xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/1 to-accent/1 opacity-0 group-hover:opacity-100 transition-opacity duration-800 delay-200 rounded-b-xl" />

            {/* Enhanced top accent line with animation */}
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              initial={{ width: "6rem", opacity: 0.6 }}
              whileHover={{ width: "12rem", opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />

            {/* Subtle corner accents */}
            <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600 delay-150" />
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-tr from-accent/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600 delay-300" />

            <div className="relative z-10 space-y-8">
              {/* Validation Errors */}
              <AnimatePresence>
                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl shadow-lg backdrop-blur-sm">
                      <motion.div
                        className="flex items-center gap-3 mb-4"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="p-2 rounded-full bg-destructive/10"
                        >
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </motion.div>
                        <span className="font-semibold text-destructive text-base">
                          Please fix the following issues:
                        </span>
                      </motion.div>
                      <ul className="space-y-3">
                        {validationErrors.map((error, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex items-start gap-3 text-sm text-destructive/90 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                          >
                            <div className="w-2 h-2 rounded-full bg-destructive/60 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{error.message}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Step Content Container with improved spacing and interactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="relative"
              >
                {/* Multi-layered content background with staggered animations */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-card/25 via-muted/8 to-card/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out"
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/1.5 via-transparent to-accent/1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />

                {/* Interactive border glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg shadow-primary/3" />

                {/* Step content with enhanced spacing and visual hierarchy */}
                <div className="relative z-10 space-y-8 p-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </div>

                {/* Enhanced bottom accent with animation */}
                <motion.div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
                  initial={{ width: "4rem", opacity: 0.5 }}
                  whileHover={{ width: "8rem", opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />

                {/* Subtle side accents for enhanced visual depth */}
                <div className="absolute top-1/2 left-0 w-px h-8 bg-gradient-to-b from-transparent via-primary/15 to-transparent transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200" />
                <div className="absolute top-1/2 right-0 w-px h-8 bg-gradient-to-b from-transparent via-accent/15 to-transparent transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
          {/* Enhanced background gradient with multiple layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/8 via-primary/4 to-accent/6 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-all duration-1000 delay-200" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/8 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-all duration-800 delay-300" />

          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <AnimatePresence>
                  {currentStep > 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        onClick={previousStep}
                        disabled={isCreating}
                        className="relative overflow-hidden border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                      >
                        <motion.div
                          animate={{ x: isCreating ? 0 : [-2, 2, -2, 0] }}
                          transition={{ duration: 0.5, repeat: isCreating ? 0 : Infinity, repeatDelay: 2 }}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                        </motion.div>
                        Previous
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {onCancel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isCreating}
                        className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <AnimatePresence mode="wait">
                  {currentStep < 3 ? (
                    <motion.div
                      key="next-button"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: canProceed && !isCreating ? 1.05 : 1 }}
                      whileTap={{ scale: canProceed && !isCreating ? 0.95 : 1 }}
                    >
                      <Button
                        onClick={nextStep}
                        disabled={!canProceed || isCreating}
                        className={`
                          relative overflow-hidden transition-all duration-300
                          ${canProceed && !isCreating
                            ? 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                            : 'opacity-60'
                          }
                        `}
                      >
                        {canProceed && !isCreating && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          />
                        )}
                        <span className="relative z-10">Next</span>
                        <motion.div
                          animate={{ x: canProceed && !isCreating ? [0, 4, 0] : 0 }}
                          transition={{ duration: 0.5, repeat: canProceed && !isCreating ? Infinity : 0, repeatDelay: 2 }}
                          className="relative z-10"
                        >
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="create-button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ scale: canProceed && !isCreating ? 1.05 : 1 }}
                      whileTap={{ scale: canProceed && !isCreating ? 0.95 : 1 }}
                    >
                      <Button
                        onClick={handleCreateQuiz}
                        disabled={!canProceed || isCreating}
                        className={`
                          relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700
                          hover:from-green-700 hover:to-green-800 transition-all duration-300
                          ${canProceed && !isCreating
                            ? 'shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30'
                            : 'opacity-60'
                          }
                        `}
                      >
                        {canProceed && !isCreating && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center">
                          {isCreating ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-4 w-4 mr-2" />
                              </motion.div>
                              Creating Quiz...
                            </>
                          ) : (
                            'Create Quiz'
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
