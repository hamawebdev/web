import { useEffect, useCallback } from 'react';
import { useQuiz } from '../quiz-api-context';

interface UseGlobalKeyboardShortcutsProps {
  onShowExitDialog?: () => void;
  onClearAnswers?: () => void;
}

export function useGlobalKeyboardShortcuts({
  onShowExitDialog,
  onClearAnswers
}: UseGlobalKeyboardShortcutsProps = {}) {
  const {
    state,
    nextQuestion,
    previousQuestion,
    revealAnswer,
    pauseQuiz,
    resumeQuiz
  } = useQuiz();

  const { session, timer, isAnswerRevealed, showExplanation } = state;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    // Don't handle shortcuts if any modal/dialog is open
    if (document.querySelector('[role="dialog"]') || document.querySelector('.modal-open')) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Prevent default for handled shortcuts
    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (key) {
      case 'enter':
        // Only handle Enter globally if answer is already revealed or if there's no current question
        // Let the question component handle Enter for answer submission
        if (isAnswerRevealed && !showExplanation) {
          preventDefault();
          revealAnswer();
        }
        break;

      case 'arrowleft':
        // Navigate to previous question
        if (session.currentQuestionIndex > 0) {
          preventDefault();
          previousQuestion();
        }
        break;

      case 'arrowright':
        // Navigate to next question
        if (session.currentQuestionIndex < session.totalQuestions - 1) {
          preventDefault();
          nextQuestion();
        }
        break;

      case 'p':
        // Pause/Resume the session
        if (!isCtrlOrCmd && (session.settings?.allowPause ?? true)) {
          preventDefault();
          if (timer.isPaused) {
            resumeQuiz();
          } else {
            pauseQuiz();
          }
        }
        break;

      case 'escape':
        // Show exit dialog
        if (onShowExitDialog) {
          preventDefault();
          onShowExitDialog();
        }
        break;

      case 'backspace':
      case 'delete':
        // Deselect all selected answers (only if not in completed session)
        if (
          !isCtrlOrCmd &&
          session.status !== 'COMPLETED' &&
          session.status !== 'completed' &&
          !isAnswerRevealed &&
          onClearAnswers
        ) {
          preventDefault();
          onClearAnswers();
        }
        break;

      default:
        // Don't prevent default for unhandled keys
        break;
    }
  }, [
    session,
    timer,
    isAnswerRevealed,
    showExplanation,
    nextQuestion,
    previousQuestion,
    revealAnswer,
    pauseQuiz,
    resumeQuiz,
    onShowExitDialog,
    onClearAnswers
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);

  return {
    // Return current state for components that need it
    canGoNext: session.currentQuestionIndex < session.totalQuestions - 1,
    canGoPrevious: session.currentQuestionIndex > 0,
    canPause: session.settings?.allowPause ?? true,
    isPaused: timer.isPaused
  };
}
