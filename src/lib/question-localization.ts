/**
 * Question language selection (FR/EN).
 *
 * Questions are authored in French; `questionTextEn`, `explanationEn`, `answerTextEn` and answer
 * `explanationEn` hold an optional English translation. `localizeQuestion` picks the texts to show
 * for the requested language:
 *
 * - English is used only when the question text AND every non-empty answer text are translated, so
 *   a question is never shown half in English and half in French. Otherwise it stays in French and
 *   `hasEnglish` is false (the UI shows a "shown in French" badge when English was requested).
 * - Explanations (question-level and per answer) fall back to French one by one when their English
 *   version is missing; `explanationLanguage` says which language the question explanation is in.
 * - Answers keep their order, ids and every other field, so selections keyed by answer id survive
 *   a language switch.
 *
 * This module is dependency-free on purpose (it is also exercised by a plain Node script).
 */

export type QuestionLanguage = 'fr' | 'en';

export const QUESTION_LANGUAGES: readonly QuestionLanguage[] = ['fr', 'en'];

export function isQuestionLanguage(value: unknown): value is QuestionLanguage {
  return value === 'fr' || value === 'en';
}

export interface LocalizableAnswer {
  id?: number | string;
  answerText?: string | null;
  answerTextEn?: string | null;
  text?: string | null;
  isCorrect?: boolean;
  explanation?: string | null;
  explanationEn?: string | null;
}

export interface LocalizableQuestion {
  questionText?: string | null;
  questionTextEn?: string | null;
  content?: string | null;
  explanation?: string | null;
  explanationEn?: string | null;
  questionAnswers?: LocalizableAnswer[] | null;
  answers?: LocalizableAnswer[] | null;
}

export type LocalizedAnswer<A extends LocalizableAnswer = LocalizableAnswer> = A & {
  /** Answer text in the displayed language. */
  answerText: string;
  /** Answer explanation in the displayed language when available, else French. */
  explanation: string | null;
};

export interface LocalizedQuestion<A extends LocalizableAnswer = LocalizableAnswer> {
  /** Question text in the displayed language. */
  questionText: string;
  /** Question explanation (English when requested and available, else French). */
  explanation: string | null;
  /** Answers in their original order with localized answerText/explanation. */
  answers: Array<LocalizedAnswer<A>>;
  /** Text of the first correct answer (the expected answer of a QROC), localized. */
  qrocAnswer: string | null;
  /** True when a complete English version (question + all answers) exists. */
  hasEnglish: boolean;
  /** Language the question text and answers are shown in. */
  displayedLanguage: QuestionLanguage;
  /** Language the question explanation is shown in. */
  explanationLanguage: QuestionLanguage;
  /** The language that was asked for. */
  requestedLanguage: QuestionLanguage;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

function frenchAnswerText(answer: LocalizableAnswer): string {
  return textOrEmpty(answer.answerText ?? answer.text);
}

/** True when the question text and every non-empty answer text have an English version. */
export function questionHasEnglish(question: LocalizableQuestion | null | undefined): boolean {
  if (!question || !hasText(question.questionTextEn)) return false;
  const answers = question.questionAnswers ?? question.answers ?? [];
  if (!Array.isArray(answers)) return true;
  return answers.every((answer) => !answer || !hasText(frenchAnswerText(answer)) || hasText(answer.answerTextEn));
}

export function localizeQuestion<A extends LocalizableAnswer = LocalizableAnswer>(
  question: (LocalizableQuestion & { questionAnswers?: A[] | null; answers?: A[] | null }) | null | undefined,
  lang: QuestionLanguage,
): LocalizedQuestion<A> {
  const requestedLanguage: QuestionLanguage = lang === 'en' ? 'en' : 'fr';
  const source = question ?? {};
  const rawAnswers = source.questionAnswers ?? source.answers ?? [];
  const answersIn: A[] = Array.isArray(rawAnswers) ? rawAnswers : [];

  const hasEnglish = questionHasEnglish(source);
  const useEnglish = requestedLanguage === 'en' && hasEnglish;
  const displayedLanguage: QuestionLanguage = useEnglish ? 'en' : 'fr';

  const frenchQuestionText = textOrEmpty(source.questionText ?? source.content);
  const questionText = useEnglish ? textOrEmpty(source.questionTextEn) : frenchQuestionText;

  // Explanations follow the requested language when an English version exists for them, but only
  // when the question itself is shown in English (never an English explanation under French text).
  const explanationEnglish = useEnglish && hasText(source.explanationEn);
  const explanation = explanationEnglish
    ? textOrEmpty(source.explanationEn)
    : hasText(source.explanation) ? source.explanation : null;

  const answers = answersIn.map((answer) => {
    const answerText = useEnglish && hasText(answer.answerTextEn)
      ? textOrEmpty(answer.answerTextEn)
      : frenchAnswerText(answer);
    const answerExplanation = useEnglish && hasText(answer.explanationEn)
      ? textOrEmpty(answer.explanationEn)
      : (answer.explanation ?? null);
    return { ...answer, answerText, explanation: answerExplanation } as LocalizedAnswer<A>;
  });

  const correct = answers.find((answer) => answer.isCorrect === true && hasText(answer.answerText));

  return {
    questionText,
    explanation,
    answers,
    qrocAnswer: correct ? correct.answerText : null,
    hasEnglish,
    displayedLanguage,
    explanationLanguage: explanationEnglish ? 'en' : 'fr',
    requestedLanguage,
  };
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

/**
 * One-line plain-text version of a question/answer text (HTML tags, Markdown markers and extra
 * whitespace removed, common entities decoded), for previews and captions that must not render
 * markup. With `maxLen`, the result is cut to that many characters and ends with "...".
 */
export function toPlainText(value: string | null | undefined, maxLen?: number): string {
  const text = stripMarkup(value);
  if (maxLen === undefined || maxLen <= 0 || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trimEnd()}...`;
}

function stripMarkup(value: string | null | undefined): string {
  if (!value) return '';
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+])\s+/gm, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
      const lower = code.toLowerCase();
      if (!lower.startsWith('#')) return NAMED_ENTITIES[lower] ?? entity;
      const codePoint = lower.startsWith('#x') ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}
