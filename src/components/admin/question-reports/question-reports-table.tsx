'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileQuestion,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  Edit
} from 'lucide-react';
import { AdminQuestionReport } from '@/types/api';

interface QuestionReportsTableProps {
  reports: AdminQuestionReport[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onReviewReport: (report: AdminQuestionReport) => void;
  onUpdateQuestion?: (report: AdminQuestionReport) => void;
}

function QuestionReportsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function QuestionReportsTable({
  reports,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onReviewReport,
  onUpdateQuestion
}: QuestionReportsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return <QuestionReportsTableSkeleton />;
  }

  if (!reports.length) {
    return (
      <div className="text-center py-8">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No question reports found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No reports match your current filters.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-mono text-sm">
                  #{report.id}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate text-sm font-medium">
                          {report.question.questionText}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{report.question.questionText}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="text-xs text-muted-foreground">
                      Question ID: {report.questionId}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{report.user.fullName}</div>
                      <div className="text-xs text-muted-foreground">{report.user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getReportTypeIcon(report.reportType)}
                    <span className="text-sm">{getReportTypeLabel(report.reportType)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(report.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(report.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  {report.status !== 'PENDING' ? (
                    <div>
                      <div className="text-sm">{formatDate(report.updatedAt)}</div>
                      {report.reviewedBy && (
                        <div className="text-xs text-muted-foreground">
                          by {report.reviewedBy.fullName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Not reviewed
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onReviewReport(report)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {report.status === 'PENDING' ? 'Review Report' : 'View Details'}
                      </DropdownMenuItem>
                      {report.questionId && onUpdateQuestion && (
                        <DropdownMenuItem onClick={() => onUpdateQuestion(report)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Update Question
                        </DropdownMenuItem>
                      )}
                      {report.status === 'PENDING' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onReviewReport(report)}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onReviewReport(report)}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Dismiss Report
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
