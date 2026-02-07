'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  Clock, 
  Target, 
  TrendingUp,
  Play,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LayerProgressCardProps {
  courseId: number;
  courseName: string;
  courseDescription?: string;
  moduleInfo: {
    moduleName: string;
    uniteName: string;
    studyPackName: string;
  };
  currentProgress: {
    layer1Completed: boolean;
    layer2Completed: boolean;
    layer3Completed: boolean;
    progressPercentage: number;
  };
  statistics?: {
    questionsCount: number;
    quizzesCount: number;
  };
  onLayerUpdate: (layer: number, completed: boolean) => Promise<void>;
  onCourseClick: () => void;
  onViewResources?: () => void;
  onStartQuiz?: () => void;
  className?: string;
}

interface LayerInfo {
  number: 1 | 2 | 3;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    text: string;
    border: string;
    completed: string;
  };
}

const LAYER_DEFINITIONS: LayerInfo[] = [
  {
    number: 1,
    title: 'Foundation',
    description: 'Basic concepts and reading materials',
    icon: BookOpen,
    color: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20',
      completed: 'bg-primary'
    }
  },
  {
    number: 2,
    title: 'Practice',
    description: 'Exercises and practice questions',
    icon: Target,
    color: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
      completed: 'bg-warning'
    }
  },
  {
    number: 3,
    title: 'Mastery',
    description: 'Advanced understanding and application',
    icon: TrendingUp,
    color: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      completed: 'bg-green-500'
    }
  }
];

export function LayerProgressCard({
  courseId,
  courseName,
  courseDescription,
  moduleInfo,
  currentProgress,
  statistics,
  onLayerUpdate,
  onCourseClick,
  onViewResources,
  onStartQuiz,
  className
}: LayerProgressCardProps) {
  const [updatingLayer, setUpdatingLayer] = useState<number | null>(null);

  // Calculate completion status
  const completedLayers = [
    currentProgress.layer1Completed,
    currentProgress.layer2Completed,
    currentProgress.layer3Completed
  ].filter(Boolean).length;

  const isFullyCompleted = completedLayers === 3;
  const hasStarted = completedLayers > 0;

  // Handle layer toggle
  const handleLayerToggle = async (layerNumber: number, currentlyCompleted: boolean) => {
    const newCompletedState = !currentlyCompleted;
    
    try {
      setUpdatingLayer(layerNumber);
      await onLayerUpdate(layerNumber, newCompletedState);
      
      toast.success(
        newCompletedState 
          ? `Layer ${layerNumber} marked as complete!` 
          : `Layer ${layerNumber} marked as incomplete`
      );
    } catch (error) {
      toast.error(`Failed to update Layer ${layerNumber}`);
      console.error('Layer update error:', error);
    } finally {
      setUpdatingLayer(null);
    }
  };

  // Get layer completion status
  const getLayerStatus = (layerNumber: number) => {
    switch (layerNumber) {
      case 1: return currentProgress.layer1Completed;
      case 2: return currentProgress.layer2Completed;
      case 3: return currentProgress.layer3Completed;
      default: return false;
    }
  };

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 cursor-pointer",
      isFullyCompleted && "ring-2 ring-green-200 dark:ring-green-800",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0" onClick={onCourseClick}>
            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
              {courseName}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {moduleInfo.studyPackName} • {moduleInfo.moduleName}
            </CardDescription>
            {courseDescription && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {courseDescription}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {isFullyCompleted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCourseClick}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Course
                </DropdownMenuItem>
                {onViewResources && (
                  <DropdownMenuItem onClick={onViewResources}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Resources
                  </DropdownMenuItem>
                )}
                {onStartQuiz && (
                  <DropdownMenuItem onClick={onStartQuiz}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {Math.round(currentProgress.progressPercentage)}%
            </span>
          </div>
          <Progress 
            value={currentProgress.progressPercentage} 
            className="h-2"
          />
        </div>

        {/* Enhanced Layer Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Learning Layers</span>
            <span className="text-xs text-muted-foreground">
              {completedLayers}/3 completed
            </span>
          </div>

          {/* Layer Progress Buttons - More Prominent */}
          <div className="space-y-3">
            {LAYER_DEFINITIONS.map((layer) => {
              const isCompleted = getLayerStatus(layer.number);
              const isUpdating = updatingLayer === layer.number;
              const IconComponent = layer.icon;

              return (
                <div key={layer.number} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        isCompleted ? layer.color.completed : "bg-gray-200 dark:bg-gray-700"
                      )}>
                        <span className={cn(
                          "text-xs font-bold",
                          isCompleted ? "text-white" : "text-gray-500"
                        )}>
                          {layer.number}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{layer.title}</div>
                        <div className="text-xs text-muted-foreground">{layer.description}</div>
                      </div>
                    </div>

                    <Button
                      variant={isCompleted ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "min-w-[80px] transition-all",
                        isCompleted && "bg-green-600 hover:bg-green-700 text-white",
                        isUpdating && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        console.log(`Layer ${layer.number} clicked, current status:`, isCompleted);
                        if (!isUpdating) {
                          handleLayerToggle(layer.number, isCompleted);
                        }
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">...</span>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Done</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Circle className="h-3 w-3" />
                          <span className="text-xs">Start</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Progress indicator for this layer */}
                  <div className="ml-8">
                    <div className={cn(
                      "h-1 rounded-full transition-all",
                      isCompleted ? layer.color.completed : "bg-gray-200 dark:bg-gray-700"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Statistics */}
        {statistics && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {statistics.questionsCount} questions
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {statistics.quizzesCount} quizzes
              </span>
            </div>
            
            {hasStarted && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCourseClick}
                className="h-auto p-1 text-xs"
              >
                Continue Learning →
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
