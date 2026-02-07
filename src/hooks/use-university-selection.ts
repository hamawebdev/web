import { useState, useEffect, useMemo } from 'react';

export interface University {
  id: number;
  name: string;
  country?: string;
  questionCount?: number;
}

export interface UniversitySelectionState {
  // Available universities from API
  availableUniversities: University[];
  
  // Selected university IDs
  selectedUniversityIds: number[];
  
  // UI state
  showDropdown: boolean;
  autoSelectedUniversity: University | null;
  errorMessage: string | null;
  
  // Helper functions
  selectUniversity: (universityId: number) => void;
  selectMultipleUniversities: (universityIds: number[]) => void;
  clearSelection: () => void;
  
  // Validation
  isValid: boolean;
  getValidationError: () => string | null;
}

export interface UseUniversitySelectionOptions {
  universities: University[];
  allowMultiple?: boolean;
  required?: boolean;
  initialSelection?: number[];
}

/**
 * Hook for managing university selection logic in session creation
 * 
 * Rules:
 * 1. If 0 universities available: Show error, block creation
 * 2. If 1 university available: Auto-select, hide UI, no dropdown
 * 3. If 2+ universities available: Show dropdown for selection
 * 4. For practice sessions: Allow multiple selection (if allowMultiple=true)
 * 5. For exam sessions: Allow single selection only (allowMultiple=false)
 */
export function useUniversitySelection({
  universities,
  allowMultiple = false,
  required = true,
  initialSelection = []
}: UseUniversitySelectionOptions): UniversitySelectionState {
  
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<number[]>(initialSelection);

  // Determine UI state based on available universities
  const uiState = useMemo(() => {
    const count = universities.length;
    
    if (count === 0) {
      return {
        showDropdown: false,
        autoSelectedUniversity: null,
        errorMessage: 'Aucune université disponible pour votre session.'
      };
    }
    
    if (count === 1) {
      return {
        showDropdown: false,
        autoSelectedUniversity: universities[0],
        errorMessage: null
      };
    }
    
    return {
      showDropdown: true,
      autoSelectedUniversity: null,
      errorMessage: null
    };
  }, [universities]);

  // Auto-select single university when available
  useEffect(() => {
    if (uiState.autoSelectedUniversity && selectedUniversityIds.length === 0) {
      console.log('[UniversitySelection] Auto-selecting single university:', uiState.autoSelectedUniversity.name);
      setSelectedUniversityIds([uiState.autoSelectedUniversity.id]);
    }
  }, [uiState.autoSelectedUniversity, selectedUniversityIds.length]);

  // Clear selection if selected universities are no longer available
  useEffect(() => {
    const availableIds = new Set(universities.map(u => u.id));
    const validSelection = selectedUniversityIds.filter(id => availableIds.has(id));

    if (validSelection.length !== selectedUniversityIds.length) {
      console.log('[UniversitySelection] Clearing invalid university selections:', {
        previous: selectedUniversityIds,
        valid: validSelection,
        available: universities.map(u => u.id)
      });
      setSelectedUniversityIds(validSelection);
    }
  }, [universities, selectedUniversityIds]);

  const selectUniversity = (universityId: number) => {
    if (allowMultiple) {
      setSelectedUniversityIds(prev => 
        prev.includes(universityId) 
          ? prev.filter(id => id !== universityId)
          : [...prev, universityId]
      );
    } else {
      setSelectedUniversityIds([universityId]);
    }
  };

  const selectMultipleUniversities = (universityIds: number[]) => {
    if (allowMultiple) {
      setSelectedUniversityIds(universityIds);
    } else {
      // For single selection, take the first ID
      setSelectedUniversityIds(universityIds.slice(0, 1));
    }
  };

  const clearSelection = () => {
    // Don't clear if auto-selected
    if (!uiState.autoSelectedUniversity) {
      setSelectedUniversityIds([]);
    }
  };

  const isValid = useMemo(() => {
    if (!required) return true;
    if (universities.length === 0) return false;
    return selectedUniversityIds.length > 0;
  }, [required, universities.length, selectedUniversityIds.length]);

  const getValidationError = (): string | null => {
    if (!required) return null;
    
    if (universities.length === 0) {
      return 'Aucune université disponible pour votre session.';
    }
    
    if (selectedUniversityIds.length === 0) {
      return allowMultiple 
        ? 'Veuillez sélectionner au moins une université.'
        : 'Veuillez sélectionner une université.';
    }
    
    return null;
  };

  return {
    availableUniversities: universities,
    selectedUniversityIds,
    showDropdown: uiState.showDropdown,
    autoSelectedUniversity: uiState.autoSelectedUniversity,
    errorMessage: uiState.errorMessage,
    selectUniversity,
    selectMultipleUniversities,
    clearSelection,
    isValid,
    getValidationError
  };
}

/**
 * Validation helper for session creation with university requirements
 */
export function validateUniversitySelection(
  universitySelection: UniversitySelectionState,
  sessionType: 'PRACTICE' | 'EXAM'
): { isValid: boolean; errorMessage?: string } {
  // For practice sessions, universities are optional
  if (sessionType === 'PRACTICE') {
    return { isValid: true };
  }

  // For exam sessions, universities are required
  if (sessionType === 'EXAM') {
    if (universitySelection.availableUniversities.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Aucune université disponible pour votre session d\'examen.'
      };
    }

    if (!universitySelection.isValid || universitySelection.selectedUniversityIds.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Veuillez sélectionner une université pour la session d\'examen.'
      };
    }
  }

  return { isValid: true };
}
