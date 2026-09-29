// @ts-nocheck
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription';
import { QuizService } from '@/lib/api-services';
import { NewApiService } from '@/lib/api/new-api-services';
import { toast } from 'sonner';
import { Stethoscope, Loader2 } from 'lucide-react';
import { residencyPartLabel } from '@/lib/residency-parts';
import { useCachedResource } from '@/lib/cached-resource';

interface University {
  id: number;
  name: string;
  examYears: number[];
}

export default function ResidencyCreatePage() {

  // Universities and their exam years (shown at once on later visits, refreshed in the background)
  const { data: universitiesData, loading: filtersLoading, error: filtersFetchError } = useCachedResource<University[]>(
    'residency-filters',
    async () => {
      const res = await NewApiService.getResidencyFilters();
      const data = (res?.data?.data) ?? res?.data;
      if (!res?.success || !data) {
        throw new Error(res?.error || 'Failed to load filters');
      }
      return data.universities || [];
    }
  );
  const universities = React.useMemo(() => universitiesData ?? [], [universitiesData]);
  const filtersError = filtersFetchError ? 'Impossible de charger les filtres de résidanat.' : null;

  // Form state
  const [selectedUniversityId, setSelectedUniversityId] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');
  const [selectedParts, setSelectedParts] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);

  // Parts loaded from the new endpoint (per university + year)
  const [availableParts, setAvailableParts] = React.useState<string[]>([]);
  const [partsLoading, setPartsLoading] = React.useState(false);
  const [questionCount, setQuestionCount] = React.useState<number>(0);

  // Derive available years from the selected university
  const availableYears = React.useMemo(() => {
    if (!selectedUniversityId) return [];
    const uni = universities.find(u => String(u.id) === selectedUniversityId);
    return (uni?.examYears || []).sort((a, b) => b - a);
  }, [selectedUniversityId, universities]);


  // When university changes, reset year & parts
  const handleUniversityChange = React.useCallback((universityId: string) => {
    setSelectedUniversityId(universityId);
    setSelectedYear('');
    setSelectedParts([]);
    setAvailableParts([]);
    setQuestionCount(0);
  }, []);

  // When year changes, fetch available parts from the new endpoint
  const handleYearChange = React.useCallback(async (year: string) => {
    setSelectedYear(year);
    setSelectedParts([]);
    setAvailableParts([]);
    setQuestionCount(0);

    if (!selectedUniversityId || !year) return;

    try {
      setPartsLoading(true);
      const res = await NewApiService.getResidencyAvailableParts(
        Number(selectedUniversityId),
        Number(year)
      );
      const data = (res?.data?.data) ?? res?.data;
      if (res?.success && data) {
        // Papers without parts (e.g. Oran) list none; drop empty entries defensively
        setAvailableParts((data.parts || []).filter((part: unknown) => typeof part === 'string' && part.trim()));
        setQuestionCount(data.questionCount || 0);
      }
    } catch (e) {
      console.error('[Residency/Create] Error loading parts:', e);
    } finally {
      setPartsLoading(false);
    }
  }, [selectedUniversityId]);

  const router = useRouter();
  const { subscriptions } = useUserSubscriptions();
  const { isResidency } = selectEffectiveActiveSubscription(subscriptions);

  const handleCreate = async () => {
    try {
      if (!isResidency) {
        return;
      }

      setCreating(true);

      const selectedUni = universities.find(u => String(u.id) === selectedUniversityId);
      const uniName = selectedUni ? selectedUni.name : 'Unknown University';
      const autoTitle = `Residency - ${uniName} - ${selectedYear}`;

      const payload = {
        title: autoTitle.slice(0, 100),
        examYear: Number(selectedYear),
        universityId: Number(selectedUniversityId),
        ...(selectedParts.length ? { parts: selectedParts } : {}),
      };

      const res = await NewApiService.createResidencySession(payload);
      const sid = (res as any)?.data?.data?.sessionId ?? (res as any)?.data?.sessionId;

      if (res?.success && sid) {
        toast.success('Residency session created');
        router.push(`/session/${sid}`);
      } else {
        const errorMsg = (res as any)?.error || 'Aucune question trouvée pour ces filtres.';
        toast.error(errorMsg);
      }
    } catch (e: any) {
      console.error('[Residency/Create] error:', e);
      const message = e?.message || 'Failed to create residency session';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Create Residency Session
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6 space-y-6">
            {filtersError && (
              <Alert variant="destructive">
                <AlertDescription>Impossible de charger les filtres de résidanat.</AlertDescription>
              </Alert>
            )}

            {!filtersError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* University Select */}
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Select
                      value={selectedUniversityId}
                      onValueChange={handleUniversityChange}
                      disabled={filtersLoading || universities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filtersLoading ? 'Loading...' : 'Select a university'} />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exam Year Select - filtered by selected university */}
                  <div className="space-y-2">
                    <Label>Exam Year</Label>
                    <Select
                      value={selectedYear}
                      onValueChange={handleYearChange}
                      disabled={filtersLoading || !selectedUniversityId || availableYears.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedUniversityId
                            ? 'Select a university first'
                            : availableYears.length === 0
                              ? 'No years available'
                              : 'Select year'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parts - loaded dynamically based on university + year */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Parts (optional)
                      {partsLoading && (
                        <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />
                      )}
                    </Label>
                    {!selectedUniversityId || !selectedYear ? (
                      <p className="text-sm text-muted-foreground">
                        Select a university and year to see available parts.
                      </p>
                    ) : partsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading available parts...</p>
                    ) : availableParts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No parts available for this selection.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableParts.map((p) => (
                          <label key={p} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedParts.includes(p)}
                              onCheckedChange={(checked) => {
                                setSelectedParts((prev) => (checked ? [...prev, p] : prev.filter((x) => x !== p)));
                              }}
                            />
                            <span className="text-sm">{residencyPartLabel(p)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {questionCount > 0 && selectedYear && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {questionCount} question{questionCount !== 1 ? 's' : ''} available for this selection
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => router.push('/student/residency')}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      creating || !selectedUniversityId || !selectedYear
                    }
                  >
                    {creating ? 'Creating...' : 'Create Session'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
