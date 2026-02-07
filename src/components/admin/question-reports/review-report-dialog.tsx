'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Calendar,
  FileQuestion,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminQuestionReport, ReviewQuestionReportRequest } from '@/types/api';

const reviewReportSchema = z.object({
  response: z.string().min(1, 'Response is required').max(1000, 'Response must be less than 1000 characters'),
  action: z.enum(['RESOLVED', 'DISMISSED'], {
    required_error: 'Action is required',
  }),
});

type ReviewReportFormData = z.infer<typeof reviewReportSchema>;

interface ReviewReportDialogProps {
  report: AdminQuestionReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewReport: (reportId: number, data: ReviewQuestionReportRequest) => Promise<any>;
}

export function ReviewReportDialog({ report, open, onOpenChange, onReviewReport }: ReviewReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewReportFormData>({
    resolver: zodResolver(reviewReportSchema),
    defaultValues: {
      response: '',
      action: 'RESOLVED',
    },
  });

  // Reset form when report changes
  useEffect(() => {
    form.reset({
      response: report.adminResponse || '',
      action: report.status === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
    });
  }, [report, form]);

  const onSubmit = async (data: ReviewReportFormData) => {
    setIsSubmitting(true);
    try {
      await onReviewReport(report.id, data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'INCORRECT_ANSWER':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'UNCLEAR_QUESTION':
        return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'TYPO':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'OTHER':
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return <FileQuestion className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'INCORRECT_ANSWER':
        return 'Incorrect Answer';
      case 'UNCLEAR_QUESTION':
        return 'Unclear Question';
      case 'TYPO':
        return 'Typo';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>;
      case 'REVIEWED':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Reviewed</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="outline" className="text-red-600 border-red-600">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isReadOnly = report.status !== 'PENDING';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            {isReadOnly ? 'Question Report Details' : 'Review Question Report'}
          </DialogTitle>
          <DialogDescription>
            {isReadOnly 
              ? 'View the details of this question report and your previous response.'
              : 'Review this question report and provide a response to the student.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Report Information
                {getStatusBadge(report.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Report ID</div>
                  <div className="font-mono">#{report.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Report Type</div>
                  <div className="flex items-center gap-2">
                    {getReportTypeIcon(report.reportType)}
                    {getReportTypeLabel(report.reportType)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(report.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reporter</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{report.user.fullName}</div>
                      <div className="text-xs text-muted-foreground">{report.user.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question Details</CardTitle>
              <CardDescription>The question that was reported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Question ID: {report.questionId}
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{report.question.questionText}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Question Type: {report.question.questionType}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student's Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student's Report</CardTitle>
              <CardDescription>What the student reported about this question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{report.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Review Form or Previous Response */}
          {isReadOnly ? (
            /* Show previous response */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Response</CardTitle>
                <CardDescription>
                  {report.status !== 'PENDING' && `Reviewed on ${formatDate(report.updatedAt)}`}
                  {report.reviewedBy && ` by ${report.reviewedBy.fullName}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Action Taken</div>
                    <div className="flex items-center gap-2">
                      {report.status === 'RESOLVED' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="capitalize">{report.status?.toLowerCase()}</span>
                    </div>
                  </div>
                  {report.adminResponse && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Response</div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{report.adminResponse}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Show review form */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Response</CardTitle>
                <CardDescription>Provide feedback to the student and take action</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RESOLVED">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Resolved - Issue addressed
                                </div>
                              </SelectItem>
                              <SelectItem value="DISMISSED">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  Dismissed - Not actionable
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose whether to resolve the issue or dismiss the report
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="response"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response to Student</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a helpful response to the student explaining your decision..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This message will be sent to the student who reported the issue
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
