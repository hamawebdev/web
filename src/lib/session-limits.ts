/**
 * The API refuses a session of more than 1,000 questions (backend MAX_SESSION_QUESTIONS,
 * validation of POST /quizzes/sessions). Selections often hold more than that.
 *
 * Free of app imports so `node --test` can load it.
 */
export const MAX_SESSION_QUESTIONS = 1000;

/** How many questions a student can pick for a session out of what the selection holds */
export function selectableQuestionCount(available: number): number {
  return Math.max(0, Math.min(Number.isFinite(available) ? available : 0, MAX_SESSION_QUESTIONS));
}
