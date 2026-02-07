'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  BookOpen,
  Info,
  RotateCcw
} from 'lucide-react';
import { AdvancedFiltersProps } from '../types';
import { useFilterImpact } from '../hooks/use-question-calculation';
import { cn } from '@/lib/utils';

export function AdvancedFilters({
  filters,
  onFiltersChange,
  baseQuestionCount,
  availableSources,
  availableYears
}: AdvancedFiltersProps) {
  const [useSmartDefaults, setUseSmartDefaults] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);

  // Calculate filter impact
  const { filteredCount, reductions } = useFilterImpact(
    baseQuestionCount,
    filters,
    { availableYears } as any
  );

  const hasReduction = filteredCount < baseQuestionCount;

  // Handle smart defaults
  const handleUseSmartDefaults = () => {
    setUseSmartDefaults(true);
    setShowCustomization(false);
    onFiltersChange({
      quizSourceIds: [],
      quizYears: []
    });
  };

  // Handle manual customization
  const handleCustomize = () => {
    setUseSmartDefaults(false);
    setShowCustomization(true);
  };

  // Handle source selection
  const handleSourceToggle = (sourceId: number, checked: boolean) => {
    const currentSources = filters.quizSourceIds || [];
    const newSources = checked
      ? [...currentSources, sourceId]
      : currentSources.filter(id => id !== sourceId);
    
    onFiltersChange({
      ...filters,
      quizSourceIds: newSources
    });
  };

  // Handle year selection
  const handleYearToggle = (year: number, checked: boolean) => {
    const currentYears = filters.quizYears || [];
    const newYears = checked
      ? [...currentYears, year]
      : currentYears.filter(y => y !== year);
    
    onFiltersChange({
      ...filters,
      quizYears: newYears
    });
  };

  // Smart defaults recommendation
  if (useSmartDefaults && !showCustomization) {
    return (
      <div className="space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          whileHover={{ y: -2 }}
        >
          <Card className="relative overflow-hidden border-green-200/60 bg-gradient-to-br from-green-50/80 via-green-50/60 to-green-100/40 shadow-lg hover:shadow-xl transition-all duration-500 group backdrop-blur-sm">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 via-transparent to-green-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-green-50/20 to-green-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />

            {/* Subtle corner accents */}
            <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-green-200/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600 delay-150" />
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-tr from-green-300/15 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-600 delay-300" />

            {/* Interactive border glow */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg shadow-green-200/20" />

            <CardHeader className="relative z-10 pb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <CardTitle className="flex items-center gap-3 text-green-700 font-semibold">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="p-1 rounded-full bg-green-100/50"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                    Smart Defaults Recommended
                  </span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="px-2 py-1 bg-green-200/50 text-green-700 text-xs font-medium rounded-full"
                  >
                    Recommended
                  </motion.div>
                </CardTitle>
              </motion.div>
            </CardHeader>

            <CardContent className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {[
                  "All question sources included automatically",
                  "All available years included",
                  `Maximum ${baseQuestionCount} questions available`,
                ].map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-start sm:items-center gap-3 p-3 sm:p-2 rounded-lg hover:bg-green-100/30 transition-all duration-200 cursor-default"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 mt-0.5 sm:mt-0"
                    >
                      <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 text-green-600" />
                    </motion.div>
                    <span className="text-sm sm:text-sm text-green-800 font-medium leading-relaxed break-words">{text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="origin-left"
              >
                <Separator className="bg-green-200/50" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="flex justify-center pt-2 sm:pt-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleCustomize}
                    className="w-full sm:w-auto px-6 py-2.5 sm:px-4 sm:py-2 text-sm sm:text-sm border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-300 font-medium"
                  >
                    Customize Manually
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>


      </div>
    );
  }

  // Manual customization interface
  return (
    <div className="space-y-6">

      {/* Question Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <BookOpen className="h-5 w-5 text-primary" />
              </motion.div>
              Question Types
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select question types to include in the session
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'SINGLE_CHOICE', name: 'Single Choice' },
                { id: 'MULTIPLE_CHOICE', name: 'Multiple Choice' }
              ].map((type, index) => {
                const isSelected = filters.questionTypes?.includes(type.id as any) || false;
                return (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{
                      scale: 1.02,
                      x: 4,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer",
                      "transition-all duration-200 ease-out",
                      "hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm",
                      isSelected && "bg-primary/5 border-primary/30 shadow-sm"
                    )}
                    onClick={() => {
                      const next = isSelected
                        ? (filters.questionTypes || []).filter(t => t !== (type.id as any))
                        : ([...(filters.questionTypes || []), type.id] as any);
                      onFiltersChange({ ...filters, questionTypes: next });
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? ([...(filters.questionTypes || []), type.id] as any)
                          : (filters.questionTypes || []).filter(t => t !== (type.id as any));
                        onFiltersChange({ ...filters, questionTypes: next });
                      }}
                      id={`type-${type.id}`}
                      className="pointer-events-none"
                    />
                    <label
                      htmlFor={`type-${type.id}`}
                      className="flex-1 cursor-pointer pointer-events-none"
                    >
                      <div className="font-medium text-sm leading-tight">{type.name}</div>
                    </label>
                  </motion.div>
                );
              })}
            </div>

            {(!filters.questionTypes || filters.questionTypes.length === 0) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-lg border-l-2 border-muted-foreground/20"
              >
                No types selected - all types will be included
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Exam Years */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <Calendar className="h-5 w-5 text-primary" />
              </motion.div>
              Exam Years
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select specific exam years for questions
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {availableYears.map((year, index) => {
                const isSelected = filters.examYears?.includes(year) || false;
                const isLatest = year === Math.max(...availableYears);

                return (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer",
                      "transition-all duration-200 ease-out",
                      "hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm",
                      isSelected && "bg-primary/5 border-primary/30 shadow-sm",
                      isLatest && "ring-1 ring-primary/20"
                    )}
                    onClick={() => handleYearToggle(year, !isSelected)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleYearToggle(year, checked as boolean)
                      }
                      id={`year-${year}`}
                      className="pointer-events-none"
                    />
                    <label
                      htmlFor={`year-${year}`}
                      className="cursor-pointer font-medium text-sm pointer-events-none"
                    >
                      {year}
                    </label>
                    {isLatest && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          Latest
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {(!filters.examYears || filters.examYears.length === 0) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-lg border-l-2 border-muted-foreground/20"
              >
                No years selected - all years will be included
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Reset to Smart Defaults */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-muted/30 border-muted-foreground/20 hover:bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">Reset to Smart Defaults</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Clear all filters and use recommended settings for maximum question variety
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={handleUseSmartDefaults}
                  className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                >
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.div>
                  Reset
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Impact Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30">
          <CardContent className="p-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className={cn(
                "flex items-center justify-between font-medium",
                hasReduction
                  ? "text-warning"
                  : "text-success"
              )}
            >
              <span>Result:</span>
              <div className="text-right">
                <div>{filteredCount} questions available</div>
                {hasReduction && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-xs text-orange-600 mt-0.5"
                  >
                    ({baseQuestionCount - filteredCount} fewer than maximum)
                  </motion.div>
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
