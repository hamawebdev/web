'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  HelpCircle,
  Search,
  Filter,
  Download,
  Upload,
  X
} from 'lucide-react';
import { useQuestionManagement } from '@/hooks/admin/use-question-management';
import { QuestionTable } from '@/components/admin/questions/question-table';
import QuestionFilters from '@/components/admin/questions/question-filters';

import { useRouter } from 'next/navigation';

/**
 * Admin Questions Management Page
 *
 * Main page for managing all questions in the system with filtering,
 * search, pagination, and question actions.
 */
export default function AdminQuestionsPage() {
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(false);

  const {
    questions,
    totalQuestions,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,

    updateQuestion,
    deleteQuestion,
    updateQuestionExplanation,
    updateQuestionImages,
    goToPage,
    hasQuestions,
    hasError,
    hasFilters,
  } = useQuestionManagement();



  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Questions</h1>
          <p className="text-muted-foreground">
            Gérer les questions, réponses et explications pour tous les cours
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Masquer les Filtres' : 'Afficher les Filtres'}
            {hasFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {Object.values(filters).filter(v => v !== '' && v !== undefined).length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/content')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import en Masse
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {hasFilters ? 'Résultats filtrés' : 'Toutes les questions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Choix Unique</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter(q => q.questionType === 'SINGLE_CHOICE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Page actuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Choix Multiple</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter(q => q.questionType === 'MULTIPLE_CHOICE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Page actuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Actives</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.filter(q => q.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Page actuelle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Filtres</CardTitle>
                <CardDescription>
                  Filtrer les questions par pack d'études, cours, université, type ou rechercher par texte
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <QuestionFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              hasFilters={hasFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {hasFilters && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Filtres actifs:</span>
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Recherche: {filters.search.substring(0, 30)}{filters.search.length > 30 ? '...' : ''}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ search: '' })}
                    />
                  </Badge>
                )}
                {filters.yearLevel && (
                  <Badge variant="secondary" className="gap-1">
                    Année: {filters.yearLevel}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ yearLevel: undefined, unitId: undefined, moduleId: undefined, courseId: undefined })}
                    />
                  </Badge>
                )}
                {filters.unitId && (
                  <Badge variant="secondary" className="gap-1">
                    Unité
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ unitId: undefined, moduleId: undefined, courseId: undefined })}
                    />
                  </Badge>
                )}
                {filters.moduleId && (
                  <Badge variant="secondary" className="gap-1">
                    Module
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ moduleId: undefined, courseId: undefined })}
                    />
                  </Badge>
                )}
                {filters.courseId && (
                  <Badge variant="secondary" className="gap-1">
                    Cours
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ courseId: undefined })}
                    />
                  </Badge>
                )}
                {filters.universityId && (
                  <Badge variant="secondary" className="gap-1">
                    Université
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ universityId: undefined })}
                    />
                  </Badge>
                )}
                {filters.questionType && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.questionType === 'SINGLE_CHOICE' ? 'Choix Unique' : 'Choix Multiple'}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ questionType: undefined })}
                    />
                  </Badge>
                )}
                {filters.examYear && (
                  <Badge variant="secondary" className="gap-1">
                    Examen: {filters.examYear}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ examYear: undefined })}
                    />
                  </Badge>
                )}
                {filters.rotation && (
                  <Badge variant="secondary" className="gap-1">
                    Rotation: {filters.rotation}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ rotation: undefined })}
                    />
                  </Badge>
                )}
                {filters.sourceId && (
                  <Badge variant="secondary" className="gap-1">
                    Source ID: {filters.sourceId}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ sourceId: undefined })}
                    />
                  </Badge>
                )}
                {filters.isActive !== undefined && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.isActive ? 'Actif' : 'Inactif'}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => updateFilters({ isActive: undefined })}
                    />
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Effacer Tout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Questions
            {hasFilters && (
              <Badge variant="outline" className="ml-2">
                Filtré
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading ? (
              'Chargement des questions...'
            ) : hasQuestions ? (
              `Affichage de ${questions.length} sur ${totalQuestions} questions (Page ${currentPage} sur ${totalPages})`
            ) : hasFilters ? (
              'Aucune question trouvée pour ces filtres.'
            ) : (
              'Aucune question trouvée'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && !hasQuestions && hasFilters ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune question trouvée pour ces filtres</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Essayez d'ajuster vos critères de filtrage ou effacez tous les filtres pour voir toutes les questions.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <QuestionTable
              questions={questions}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onUpdateQuestion={updateQuestion}
              onDeleteQuestion={deleteQuestion}
              onUpdateExplanation={updateQuestionExplanation}
              onUpdateImages={updateQuestionImages}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
