"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, CalendarClock, Star, StarOff, Info, Play, RotateCcw, BarChart3, Trash2, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import type { PracticeSessionPayload } from "./session-wizard";

export type PracticeSessionRecord = PracticeSessionPayload & {
  id: string;
  createdAt: string;
  favorite?: boolean;
  elapsedSeconds?: number;
  lastStartedAt?: string | null;
  questionCount?: number; // optional until API
  currentQuestionIndex?: number; // mini progress
};

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function SessionCard({
  session,
  onUpdate,
  onDelete,
}: {
  session: PracticeSessionRecord;
  onUpdate: (id: string, patch: Partial<PracticeSessionRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title);
  const [showInfo, setShowInfo] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  // tick while running
  const running = !!session.lastStartedAt;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const elapsed = useMemo(() => {
    const base = session.elapsedSeconds || 0;
    if (!session.lastStartedAt) return base;
    const started = new Date(session.lastStartedAt).getTime();
    return base + Math.max(0, Math.floor((now - started) / 1000));
  }, [session.elapsedSeconds, session.lastStartedAt, now]);

  const saveTitle = () => {
    const t = titleInput.trim();
    if (!t) return;
    onUpdate(session.id, { title: t });
    setIsEditing(false);
  };

  const toggleStar = () => onUpdate(session.id, { favorite: !session.favorite });

  const startOrContinue = () => {
    // All sessions now use the unified session page
    // which handles API-based session resumption properly
    router.push(`/session/${session.id}`);
  };

  const retake = () => {
    onUpdate(session.id, { elapsedSeconds: 0, lastStartedAt: null, currentQuestionIndex: 0 });
  };

  const openStats = () => {
    // For now, reuse info dialog with a different title
    setShowInfo(true);
  };

  const confirmDelete = () => setShowDelete(true);

  const performDelete = () => {
    setShowDelete(false);
    onDelete(session.id);
  };

  const hasStarted = (session.elapsedSeconds ?? 0) > 0 || !!session.lastStartedAt || (session.currentQuestionIndex ?? 0) > 0;
  const miniTotal = session.questionCount ?? 0;
  const miniIndex = (session.currentQuestionIndex ?? 0) + (miniTotal ? 1 : 0);
  const miniPct = miniTotal > 0 ? (miniIndex / miniTotal) * 100 : 0;

  return (
    <Card className="card-hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <Input autoFocus value={titleInput} onChange={(e) => setTitleInput(e.target.value)} className="h-8 py-1" />
                <Button size="sm" variant="secondary" onClick={saveTitle}><Check className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setTitleInput(session.title); setIsEditing(false); }}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <span className="truncate max-w-[220px]" title={session.title}>{session.title}</span>
            )}
          </CardTitle>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              {/* Removed Edit title button as requested */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={toggleStar} aria-label={session.favorite ? "Unstar" : "Star"}>
                    {session.favorite ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{session.favorite ? 'Unstar' : 'Star'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {session.program && <Badge variant="secondary">{session.program}</Badge>}
          {session.filters?.type && <Badge variant="outline">{session.filters.type.toUpperCase()}</Badge>}
          {session.filters?.source && <Badge variant="outline">{session.filters.source}</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4" />
          <span>{new Date(session.createdAt).toLocaleString()}</span>
          <span className="mx-2">•</span>
          <span>Elapsed: {formatDuration(elapsed)}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <span>Unit: {session.unit || '—'}</span>
          <span>Courses: {session.courses?.length || 0}</span>
        </div>

        {/* Mini progress */}
        {miniTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span>{miniIndex}/{miniTotal}</span>
            </div>
            <Progress value={miniPct} className="h-1.5" />
          </div>
        )}

        <div className="pt-1 flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={startOrContinue}>
                  <Play className="w-4 h-4 mr-1" /> {hasStarted ? 'Continue' : 'Start'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{hasStarted ? 'Continue session' : 'Start session'}</TooltipContent>
            </Tooltip>
            {!running && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={retake}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Retake
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset elapsed time</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={openStats}>
                  <BarChart3 className="w-4 h-4 mr-1" /> Statistics
                </Button>
              </TooltipTrigger>
              <TooltipContent>View statistics</TooltipContent>
            </Tooltip>
            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={() => setShowInfo(true)} aria-label="Info">
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Session info</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={confirmDelete} aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete session</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>

      {/* Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Info</DialogTitle>
            <DialogDescription>Details of this practice session</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2">
            <div><span className="text-muted-foreground">Title:</span> {session.title}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Unit:</span> {session.unit || '—'}</div>
              <div><span className="text-muted-foreground">Module:</span> {session.module || '—'}</div>
              <div><span className="text-muted-foreground">Courses:</span> {session.courses?.length || 0}</div>
              <div><span className="text-muted-foreground">Questions:</span> {session.questionCount ?? '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Type:</span> {session.filters?.type || '—'}</div>
              <div><span className="text-muted-foreground">Source:</span> {session.filters?.source || '—'}</div>
            </div>
            <div><span className="text-muted-foreground">Elapsed:</span> {formatDuration(elapsed)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The session will be removed from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

