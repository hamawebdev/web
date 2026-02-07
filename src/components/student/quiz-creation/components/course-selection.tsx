'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  BookOpen, 
  GraduationCap,
  Lock,
  CheckSquare,
  Square
} from 'lucide-react';
import { CourseSelectionProps } from '../types';
import { QuizUnit, QuizModule, QuizCourse } from '@/types/api';

export function CourseSelection({
  subjects,
  selectedCourses,
  onSelectionChange,
  userYearLevel,
  allowedYearLevels
}: CourseSelectionProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter subjects by allowed year levels (fallback to single userYearLevel)
  const filteredSubjects = useMemo(() => {
    const allowed = allowedYearLevels && allowedYearLevels.length > 0
      ? new Set(allowedYearLevels)
      : (userYearLevel ? new Set([userYearLevel]) : new Set<string>());
    return subjects.filter(subject => allowed.has(subject.year));
  }, [subjects, allowedYearLevels, userYearLevel]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchTerm) return filteredSubjects;
    
    return filteredSubjects.map(subject => ({
      ...subject,
      modules: subject.modules.map(module => ({
        ...module,
        courses: module.courses.filter(course =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(module => module.courses.length > 0)
    })).filter(subject => subject.modules.length > 0);
  }, [filteredSubjects, searchTerm]);

  // Calculate total available questions
  const totalAvailableQuestions = useMemo(() => {
    return selectedCourses.reduce((total, courseId) => {
      for (const subject of filteredSubjects) {
        for (const module of subject.modules) {
          const course = module.courses.find(c => c.id === courseId);
          if (course) {
            total += course.questionCount || 0;
          }
        }
      }
      return total;
    }, 0);
  }, [selectedCourses, filteredSubjects]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handle course selection
  const handleCourseToggle = useCallback((courseId: number, isSelected: boolean) => {
    const newSelection = isSelected
      ? [...selectedCourses, courseId]
      : selectedCourses.filter(id => id !== courseId);
    onSelectionChange(newSelection);
  }, [selectedCourses, onSelectionChange]);

  // Select all available courses
  const selectAllAvailableCourses = useCallback(() => {
    const allAvailableCourseIds: number[] = [];
    filteredSubjects.forEach(subject => {
      subject.modules.forEach(module => {
        module.courses.forEach(course => {
          if (course.questionCount > 0) {
            allAvailableCourseIds.push(course.id);
          }
        });
      });
    });
    onSelectionChange(allAvailableCourseIds);
  }, [filteredSubjects, onSelectionChange]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Render course node
  const renderCourseNode = (course: QuizCourse) => {
    const isSelected = selectedCourses.includes(course.id);
    const isDisabled = course.questionCount === 0;

    return (
      <div
        key={course.id}
        className={`group/course relative overflow-hidden rounded-lg border transition-all duration-300 ${
          isDisabled
            ? 'opacity-60 bg-muted/20 border-border/30'
            : isSelected
              ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/20'
              : 'bg-gradient-to-r from-background/90 to-background/70 border-border/40 hover:shadow-md hover:border-primary/20'
        }`}
      >
        {/* Background enhancement */}
        {!isDisabled && (
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isSelected
              ? 'bg-gradient-to-r from-primary/5 to-primary/3 opacity-100'
              : 'bg-gradient-to-r from-accent/3 to-primary/2 opacity-0 group-hover/course:opacity-100'
          }`} />
        )}

        <div className="flex items-center gap-4 p-4 relative z-10">
          <div className="flex-shrink-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                !isDisabled && handleCourseToggle(course.id, checked as boolean)
              }
              disabled={isDisabled}
              id={`course-${course.id}`}
              className={`size-5 border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                isSelected ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary' : ''
              }`}
            />
          </div>

          <label
            htmlFor={`course-${course.id}`}
            className="flex-1 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-md transition-colors duration-300 ${
                isDisabled
                  ? 'bg-muted/30'
                  : isSelected
                    ? 'bg-primary/15'
                    : 'bg-accent/10 group-hover/course:bg-accent/15'
              }`}>
                <BookOpen className={`h-4 w-4 transition-colors duration-300 ${
                  isDisabled
                    ? 'text-muted-foreground'
                    : isSelected
                      ? 'text-primary'
                      : 'text-accent group-hover/course:text-primary'
                }`} />
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDisabled
                  ? 'text-muted-foreground'
                  : isSelected
                    ? 'text-primary'
                    : 'text-foreground group-hover/course:text-primary'
              }`}>
                {course.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={isDisabled ? "secondary" : isSelected ? "default" : "outline"}
                className={`text-xs font-medium transition-all duration-300 ${
                  isDisabled
                    ? 'bg-muted/50 text-muted-foreground'
                    : isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : course.questionCount > 10
                        ? 'bg-chart-5/20 text-chart-5 border-chart-5/30 group-hover/course:bg-chart-5/30'
                        : 'bg-background border-border/60 group-hover/course:border-primary/30'
                }`}
              >
                {course.questionCount} question{course.questionCount !== 1 ? 's' : ''}
              </Badge>
              {isDisabled && (
                <div className="p-1 rounded-full bg-muted/40">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
    );
  };

  // Render module node
  const renderModuleNode = (module: QuizModule, subjectId: number) => {
    const moduleKey = `module-${subjectId}-${module.id}`;
    const isExpanded = expandedNodes.has(moduleKey);
    const availableCourses = module.courses.filter(course => course.questionCount > 0);
    const totalQuestions = module.courses.reduce((sum, course) => sum + course.questionCount, 0);

    return (
      <div key={module.id} className="group/module space-y-3">
        <div className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-r from-background/80 to-background/60 hover:shadow-md transition-all duration-300">
          {/* Subtle background enhancement */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent/3 via-transparent to-primary/3 opacity-0 group-hover/module:opacity-100 transition-opacity duration-500" />

          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0 hover:bg-transparent relative z-10"
            onClick={() => toggleNode(moduleKey)}
          >
            <div className="flex items-center gap-3 flex-1 p-4">
              <div className="p-1.5 rounded-md bg-accent/10 group-hover/module:bg-accent/20 transition-colors duration-300">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-accent transition-transform duration-300" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-accent transition-transform duration-300 group-hover/module:translate-x-0.5" />
                )}
              </div>

              <div className="p-2 rounded-lg bg-primary/10 group-hover/module:bg-primary/15 transition-colors duration-300">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 text-left">
                <span className="font-semibold text-foreground group-hover/module:text-primary transition-colors duration-300">
                  {module.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-background/80 border-accent/30 text-accent-foreground font-medium px-3 py-1"
                >
                  {availableCourses.length}/{module.courses.length} courses
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 font-medium px-3 py-1"
                >
                  {totalQuestions} questions
                </Badge>
              </div>
            </div>
          </Button>
        </div>

        {isExpanded && (
          <div className="ml-8 space-y-2 relative">
            {/* Connection line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-border/60 via-border/40 to-transparent" />

            <div className="space-y-2 pl-4">
              {module.courses.map(renderCourseNode)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render subject node
  const renderSubjectNode = (subject: QuizUnit) => {
    const subjectKey = `subject-${subject.id}`;
    const isExpanded = expandedNodes.has(subjectKey);
    const totalCourses = subject.modules.reduce((sum, module) => sum + module.courses.length, 0);
    const availableCourses = subject.modules.reduce((sum, module) => 
      sum + module.courses.filter(course => course.questionCount > 0).length, 0
    );
    const totalQuestions = subject.modules.reduce((sum, module) => 
      sum + module.courses.reduce((courseSum, course) => courseSum + course.questionCount, 0), 0
    );

    return (
      <Card
        key={subject.id}
        className="group relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-lg transition-all duration-300"
      >
        {/* Subtle background enhancement */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-accent/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="pb-4 relative z-10">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0 hover:bg-transparent group-hover:bg-primary/5 transition-all duration-300 rounded-lg"
            onClick={() => toggleNode(subjectKey)}
          >
            <div className="flex items-center gap-4 flex-1 p-2">
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-primary transition-transform duration-300" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="flex-1 text-left space-y-2">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                  {subject.name}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                    <span>{availableCourses}/{totalCourses} courses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500/60" />
                    <span>{totalQuestions} questions</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-background/80 border-primary/20 text-primary font-medium"
                  >
                    {subject.year}
                  </Badge>
                </div>
              </div>
            </div>
          </Button>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4 relative z-10 border-t border-border/30 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm">
            {/* Enhanced module container */}
            <div className="space-y-4 pt-3 relative">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {/* Module list with enhanced spacing and visual hierarchy */}
              <div className="space-y-4">
                {subject.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="relative"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.4s ease-out forwards'
                    }}
                  >
                    {renderModuleNode(module, subject.id)}
                  </div>
                ))}
              </div>

              {/* Subtle bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-6">


        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Enhanced Quick Actions */}
        <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-background/80 to-background/60 border border-border/40 shadow-sm">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            Quick Actions:
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllAvailableCourses}
              className="group relative overflow-hidden border-green-200/60 text-green-700 hover:text-green-800 hover:border-green-300 hover:bg-green-50/80 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CheckSquare className="h-4 w-4 mr-2 relative z-10 group-hover:scale-110 transition-transform duration-200" />
              <span className="relative z-10 font-medium">Select All Available</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearAllSelections}
              disabled={selectedCourses.length === 0}
              className={`group relative overflow-hidden transition-all duration-300 shadow-sm ${
                selectedCourses.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'border-red-200/60 text-red-700 hover:text-red-800 hover:border-red-300 hover:bg-red-50/80 hover:shadow-md'
              }`}
            >
              {selectedCourses.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <Square className={`h-4 w-4 mr-2 relative z-10 transition-transform duration-200 ${
                selectedCourses.length > 0 ? 'group-hover:scale-110' : ''
              }`} />
              <span className="relative z-10 font-medium">Clear All</span>
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Course Hierarchy */}
      <div className="space-y-4">
        {searchResults.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No courses found matching your search.' : 'No courses available for your year level.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          searchResults.map(renderSubjectNode)
        )}
      </div>

      {/* Enhanced Selection Summary */}
      {selectedCourses.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50/50 via-green-50/30 to-emerald-50/20 border-green-200/50 shadow-lg">
          {/* Success indicator background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-transparent rounded-full blur-2xl" />

          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-100 border border-green-200/50">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-green-800 text-lg">Selection Complete</h3>
                <div className="space-y-1">
                  <p className="text-sm text-green-700 font-medium">
                    {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-green-600">
                    {totalAvailableQuestions} questions available for your quiz
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
