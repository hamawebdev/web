'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Loader2, 
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ImportProgressTrackerProps } from '@/types/question-import';

export function ImportProgressTracker({ 
  progress, 
  steps 
}: ImportProgressTrackerProps) {
  const getStepIcon = (step: typeof steps[0]) => {
    if (step.completed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (step.active) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    } else {
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepStatus = (step: typeof steps[0]) => {
    if (step.completed) return 'completed';
    if (step.active) return 'active';
    return 'pending';
  };

  const getProgressColor = () => {
    if (progress.step === 'error') return 'bg-destructive';
    if (progress.step === 'completed') return 'bg-green-500';
    if (progress.step === 'importing') return 'bg-primary';
    return 'bg-primary';
  };

  const getProgressMessage = () => {
    switch (progress.step) {
      case 'selecting':
        return 'Select hierarchy path for import';
      case 'inputting':
        return 'Add questions JSON data';
      case 'validating':
        return 'Validating question format';
      case 'importing':
        return 'Importing questions to database';
      case 'completed':
        return 'Import completed successfully';
      case 'error':
        return 'Import failed - please check and retry';
      default:
        return progress.message;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Import Progress
          <Badge variant={progress.step === 'completed' ? 'default' : 'secondary'}>
            {Math.round(progress.progress)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={progress.progress} 
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {getProgressMessage()}
            </span>
            {progress.step === 'error' && progress.error && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Step-by-step Progress */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                step.active ? 'bg-blue-50 border border-blue-200' :
                step.completed ? 'bg-green-50 border border-green-200' :
                'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    step.completed ? 'text-primary' :
                    step.active ? 'text-primary-foreground' :
                    'text-muted-foreground'
                  }`}>
                    {step.title}
                  </h4>
                  
                  <Badge 
                    variant={
                      step.completed ? 'default' :
                      step.active ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {step.completed ? 'Done' :
                     step.active ? 'Active' :
                     'Pending'}
                  </Badge>
                </div>
                
                <p className={`text-xs mt-1 ${
                  step.completed ? 'text-green-600' :
                  step.active ? 'text-blue-600' :
                  'text-muted-foreground'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Details */}
        {progress.step === 'error' && progress.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-700">Error Details</h4>
                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {progress.step === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-700">Import Successful</h4>
                <p className="text-xs text-green-600 mt-1">{progress.message}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
