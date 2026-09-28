'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Headphones,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Star,
  Video
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentService } from '@/lib/api-services';
import { resolveMediaUrl } from '@/lib/image-loader';
import { cn } from '@/lib/utils';
import type { AllCourseResourcesResponse, CourseResource } from '@/types/api';

interface ResourceGroup {
  type: string;
  label: string;
  icon: LucideIcon;
  tint: string;
}

// Kinds of course resources, in the order the panel lists them
const GROUPS: ResourceGroup[] = [
  { type: 'OTHER', label: 'Résumés', icon: FileText, tint: 'text-amber-600' },
  { type: 'OFFICIAL_SUPPORT', label: 'Official supports', icon: BookOpen, tint: 'text-green-600' },
  { type: 'CHOICE_OF_TEAM', label: "Team's picks", icon: Star, tint: 'text-orange-500' },
  { type: 'VIDEO', label: 'Videos', icon: Video, tint: 'text-blue-500' },
  { type: 'AUDIO', label: 'Audios', icon: Headphones, tint: 'text-purple-500' },
];
// Kinds the API may add later are still listed, last
const UNKNOWN_GROUP: ResourceGroup = { type: '*', label: 'More', icon: LinkIcon, tint: 'text-muted-foreground' };

// Where a resource opens: its link, its YouTube video or its uploaded file (http and https only)
function resourceUrl(resource: CourseResource): string | null {
  const candidate = resource.externalUrl?.trim()
    || (resource.youtubeVideoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(resource.youtubeVideoId)}` : '')
    || (resource.filePath ? resolveMediaUrl(resource.filePath) : '');
  if (!candidate) return null;
  try {
    const url = new URL(candidate, typeof window === 'undefined' ? undefined : window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function hostLabel(href: string): string {
  const host = new URL(href).hostname.replace(/^(www|m)\./, '');
  if (host === 'drive.google.com') return 'Google Drive';
  if (host === 'docs.google.com') return 'Google Docs';
  if (host === 'youtube.com' || host === 'youtu.be') return 'YouTube';
  if (host === 'mega.nz') return 'MEGA';
  if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'Facebook';
  return host;
}

interface CourseResourcesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: { id: number; name?: string } | null;
}

/**
 * Every resource of a question's course, grouped by kind. Fetched each time the panel
 * opens, so resources added to the course since show up without a reload.
 */
export function CourseResourcesSheet({ open, onOpenChange, course }: CourseResourcesSheetProps) {
  const courseId = course?.id ?? null;
  const [data, setData] = useState<AllCourseResourcesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (id: number) => {
    const request = ++latestRequest.current;
    setLoading(true);
    setError(null);
    // Keep showing this course's list while it refreshes, never another course's
    setData(previous => (previous?.course.id === id ? previous : null));
    try {
      const response = await ContentService.getAllCourseResources(id);
      const body = response?.data;
      if (!body || !Array.isArray(body.items)) {
        throw new Error('The server sent an unexpected answer.');
      }
      if (request === latestRequest.current) setData(body);
    } catch (err: any) {
      if (request === latestRequest.current) setError(err?.message || 'Could not load the resources of this course.');
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && courseId) load(courseId);
  }, [open, courseId, load]);

  const groups = useMemo(() => {
    const items = data?.items ?? [];
    const known = new Set(GROUPS.map(group => group.type));
    const list = GROUPS.map(group => ({ ...group, items: items.filter(item => item.type === group.type) }));
    list.push({ ...UNKNOWN_GROUP, items: items.filter(item => !known.has(item.type)) });
    return list.filter(group => group.items.length > 0);
  }, [data]);

  // A tag shared by every resource (the module name, for uploaded ones) says nothing here
  const sharedTag = useMemo(() => {
    const tags = new Set((data?.items ?? []).map(item => item.tag || ''));
    return tags.size === 1 ? [...tags][0] : null;
  }, [data]);

  const jumpTo = (type: string) => {
    listRef.current?.querySelector<HTMLElement>(`[data-group="${type}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const total = data?.items.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b pr-10">
          <SheetTitle className="flex items-start gap-2 text-base leading-snug">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="[overflow-wrap:anywhere]">{course?.name || data?.course.name || 'Course resources'}</span>
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-1.5">
            <span>{data ? `${total} resource${total === 1 ? '' : 's'}` : 'Resources for this course'}</span>
            {data?.yearCourse && (
              <span>· includes the course in {data.yearCourse.studyPack.name}</span>
            )}
            {loading && data && <Loader2 className="h-3 w-3 animate-spin" aria-label="Refreshing" />}
          </SheetDescription>
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-2" role="navigation" aria-label="Resource kinds">
              {groups.map(group => (
                <button
                  key={group.type}
                  type="button"
                  onClick={() => jumpTo(group.type)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <group.icon className={cn('h-3.5 w-3.5', group.tint)} />
                  {group.label}
                  <span className="tabular-nums text-muted-foreground">{group.items.length}</span>
                </button>
              ))}
            </div>
          )}
        </SheetHeader>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-8">
          {loading && !data && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading resources…
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p>{error}</p>
              {courseId && (
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => load(courseId)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </Button>
              )}
            </div>
          )}

          {data && total === 0 && !error && (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No resources for this course yet.</p>
            </div>
          )}

          {groups.map(group => (
            <section key={group.type} data-group={group.type} className="scroll-mt-3 pt-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <group.icon className={cn('h-4 w-4', group.tint)} />
                {group.label}
                <span className="font-normal tabular-nums text-muted-foreground">{group.items.length}</span>
              </h3>
              <ul className="space-y-1.5">
                {group.items.map(resource => (
                  <ResourceRow key={resource.id} resource={resource} showTag={!!resource.tag && resource.tag !== sharedTag} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResourceRow({ resource, showTag }: { resource: CourseResource; showTag: boolean }) {
  const href = resourceUrl(resource);
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug [overflow-wrap:anywhere]">{resource.title}</p>
        {resource.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {showTag && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">{resource.tag}</Badge>
          )}
          <span>{href ? hostLabel(href) : 'No link'}</span>
        </div>
      </div>
      {href && <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />}
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-border/60 px-3 py-2 opacity-70">
          {content}
        </div>
      )}
    </li>
  );
}
