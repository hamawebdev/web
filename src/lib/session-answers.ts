/**
 * Session answers and verdicts, shared by the quiz runner, the review page and analytics so that a
 * session shows the same results everywhere.
 *
 * - The runner holds one answer per question id, with the selected answer ids as strings
 *   (`selectedOptions`) or a QROC text. Answers are keyed by answer id, never by text or position,
 *   so they survive a French/English switch.
 * - `collectSubmitPayloads` turns the runner's answers into the body of
 *   POST /students/quiz-sessions/:id/submit-answer (the backend stores and scores them).
 * - `answerVerdict` reads a question's verdict from GET /quiz-sessions/:id the way the results
 *   count it: correct, incorrect (partially correct multiple choice included) or unanswered.
 *
 * This module is dependency-free on purpose: `npm test` runs it under plain Node.
 */

export type AnswerVerdict = 'correct' | 'incorrect' | 'unanswered';

/** An answer as the runner holds it (session.userAnswers / localAnswers entries). */
export interface RunnerAnswer {
  questionId?: number | string;
  selectedOptions?: string[];
  selectedAnswerId?: number | string;
  selectedAnswerIds?: Array<number | string>;
  textAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  [key: string]: unknown;
}

/** An answer as GET /quiz-sessions/:id returns it. */
export interface ApiSessionAnswer {
  questionId: number | string;
  selectedAnswerId?: number | null;
  selectedAnswerIds?: Array<number | null> | null;
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  answeredAt?: string;
}

/** One item of the submit-answer body. */
export interface SubmitAnswerPayload {
  questionId: number;
  selectedAnswerId?: number;
  selectedAnswerIds?: number[];
  textAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface SessionQuestionRef {
  id: number | string;
  questionType?: string;
  type?: string;
}

function toIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return values.map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Selected answer ids of a runner answer, whichever field holds them. */
export function selectedIdsOf(answer: RunnerAnswer | null | undefined): number[] {
  if (!answer) return [];
  const fromOptions = toIds(answer.selectedOptions);
  if (fromOptions.length > 0) return fromOptions;
  const fromIds = toIds(answer.selectedAnswerIds);
  if (fromIds.length > 0) return fromIds;
  return toIds([answer.selectedAnswerId]);
}

/** True when a runner answer holds a selection or a QROC text. */
export function isAnswered(answer: RunnerAnswer | null | undefined): boolean {
  return selectedIdsOf(answer).length > 0 || hasText(answer?.textAnswer);
}

function kindOf(questionType: string | undefined): 'single' | 'multiple' | 'other' {
  const type = String(questionType || 'SINGLE_CHOICE').toUpperCase();
  if (type === 'SINGLE_CHOICE' || type === 'QCS') return 'single';
  if (type === 'MULTIPLE_CHOICE' || type === 'QCM') return 'multiple';
  return 'other';
}

/**
 * Submit-answer payload for one runner answer, shaped by the question type: single choice sends
 * one selectedAnswerId, multiple choice every selected id, QROC its text and self-assessment.
 * Null when the answer holds nothing to send.
 */
export function submitPayloadFor(
  questionType: string | undefined,
  questionId: number | string,
  answer: RunnerAnswer | null | undefined
): SubmitAnswerPayload | null {
  const id = Number(questionId);
  if (!answer || !Number.isInteger(id) || id <= 0) return null;
  const selected = Array.from(new Set(selectedIdsOf(answer)));
  const timeSpent = typeof answer.timeSpent === 'number' ? { timeSpent: answer.timeSpent } : {};

  switch (kindOf(questionType)) {
    case 'single':
      return selected.length > 0 ? { questionId: id, selectedAnswerId: selected[0], ...timeSpent } : null;
    case 'multiple':
      return selected.length > 0 ? { questionId: id, selectedAnswerIds: selected, ...timeSpent } : null;
    default:
      if (hasText(answer.textAnswer)) {
        return {
          questionId: id,
          textAnswer: answer.textAnswer,
          ...(typeof answer.isCorrect === 'boolean' ? { isCorrect: answer.isCorrect } : {}),
          ...timeSpent,
        };
      }
      return selected.length > 0 ? { questionId: id, selectedAnswerId: selected[0], ...timeSpent } : null;
  }
}

/**
 * Every answer the runner holds, as a submit-answer body. The session's answers
 * (session.userAnswers) come first; the context's localAnswers fill in questions they miss.
 */
export function collectSubmitPayloads(
  questions: SessionQuestionRef[] | null | undefined,
  userAnswers: Record<string, RunnerAnswer> | null | undefined,
  localAnswers?: Record<string, RunnerAnswer> | null
): SubmitAnswerPayload[] {
  const typeById = new Map<number, string | undefined>();
  for (const question of questions || []) {
    typeById.set(Number(question.id), question.questionType || question.type);
  }

  const merged = new Map<number, RunnerAnswer>();
  for (const [questionId, answer] of Object.entries(userAnswers || {})) {
    if (isAnswered(answer)) merged.set(Number(questionId), answer);
  }
  for (const [questionId, answer] of Object.entries(localAnswers || {})) {
    if (!merged.has(Number(questionId)) && isAnswered(answer)) merged.set(Number(questionId), answer);
  }

  const payloads: SubmitAnswerPayload[] = [];
  for (const [questionId, answer] of merged) {
    // Answers to questions outside the session are never sent (the backend would refuse them)
    if (!typeById.has(questionId)) continue;
    const payload = submitPayloadFor(typeById.get(questionId), questionId, answer);
    if (payload) payloads.push(payload);
  }
  return payloads;
}

/**
 * The runner's answers rebuilt from GET /quiz-sessions/:id when a student comes back to a
 * session, keyed by question id. Rows without a selection or a text are not answers.
 */
export function runnerAnswersFromApi(answers: ApiSessionAnswer[] | null | undefined): Record<string, RunnerAnswer> {
  const map: Record<string, RunnerAnswer> = {};
  for (const answer of answers || []) {
    const questionId = String(answer.questionId);
    const selected = toIds(answer.selectedAnswerIds);
    const single = toIds([answer.selectedAnswerId]);
    const ids = selected.length > 0 ? selected : single;
    const text = hasText(answer.textAnswer) ? answer.textAnswer : undefined;
    if (ids.length === 0 && !text) continue;
    map[questionId] = {
      questionId,
      selectedOptions: ids.map(String),
      ...(text ? { textAnswer: text } : {}),
      isCorrect: answer.isCorrect === true,
      timeSpent: 0,
      isBookmarked: false,
      notes: '',
      flags: [],
      answeredAt: answer.answeredAt,
      // Saved answers are shown as submitted
      locked: true,
    };
  }
  return map;
}

/**
 * Verdict of a choice question as the runner shows it once answered: single choice is correct
 * when the selected answer is a correct one, multiple choice only when exactly the correct
 * answers are selected (a partial selection is incorrect, it only earns partial credit).
 * The backend grades the same way.
 */
export function choiceIsCorrect(
  options: Array<{ id: number | string; isCorrect?: boolean }> | null | undefined,
  selectedIds: Array<number | string>,
  isMultipleChoice: boolean
): boolean {
  const correct = new Set((options || []).filter((option) => option.isCorrect === true).map((option) => String(option.id)));
  const selected = Array.from(new Set(selectedIds.map(String)));
  if (isMultipleChoice) {
    return correct.size > 0 && selected.length === correct.size && selected.every((id) => correct.has(id));
  }
  return selected.length === 1 && correct.has(selected[0]);
}

/**
 * Verdict of a question from the session's answers (GET /quiz-sessions/:id), counted the same way
 * as the results: unanswered without a selection or a text, else correct or incorrect.
 */
export function answerVerdict(answer: ApiSessionAnswer | null | undefined): AnswerVerdict {
  if (!answer) return 'unanswered';
  const answered = toIds(answer.selectedAnswerIds).length > 0
    || toIds([answer.selectedAnswerId]).length > 0
    || hasText(answer.textAnswer);
  if (!answered) return 'unanswered';
  return answer.isCorrect === true ? 'correct' : 'incorrect';
}

/** Selected answer ids of a session answer (GET /quiz-sessions/:id). */
export function apiSelectedIds(answer: ApiSessionAnswer | null | undefined): number[] {
  if (!answer) return [];
  const ids = toIds(answer.selectedAnswerIds);
  return ids.length > 0 ? ids : toIds([answer.selectedAnswerId]);
}

/** Results of a session as GET /quiz-sessions/type/:type and GET /quiz-sessions/:id/results send them. */
export interface SessionResultsFields {
  score?: number;
  totalScore20?: number;
  correctAnswersCount?: number;
  incorrectAnswersCount?: number;
  unansweredCount?: number;
  totalQuestions?: number;
}

/**
 * Statistics shown for a session on the analytics page: the results screen's numbers
 * (correct, incorrect, unanswered, total) and its score as a percentage.
 */
export function analyticsStatsFrom(session: SessionResultsFields & { stats?: unknown }) {
  const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  return {
    totalQuestions: number(session.totalQuestions),
    answeredCorrect: number(session.correctAnswersCount),
    answeredWrong: number(session.incorrectAnswersCount),
    unanswered: number(session.unansweredCount),
    accuracy: `${number(session.score)}%`,
    scoreOutOf20: number(session.totalScore20),
  };
}
