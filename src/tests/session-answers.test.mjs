// Session results in the web app: what the runner sends, what it rebuilds when a student comes back,
// the verdicts the review page shows and the numbers analytics shows. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analyticsStatsFrom,
  answerVerdict,
  apiSelectedIds,
  choiceIsCorrect,
  collectSubmitPayloads,
  runnerAnswersFromApi,
  submitPayloadFor,
} from '../lib/session-answers.ts';
import { localizeQuestion } from '../lib/question-localization.ts';

// A session as GET /quiz-sessions/:id returns it: single choice, multiple choice with three correct
// answers, multiple choice with two, a QROC and a question left unanswered
const single = {
  id: 11,
  questionType: 'SINGLE_CHOICE',
  questionText: 'Q simple',
  questionTextEn: 'Single Q',
  questionAnswers: [
    { id: 101, answerText: 'A fr', answerTextEn: 'A en', isCorrect: true },
    { id: 102, answerText: 'B fr', answerTextEn: 'B en', isCorrect: false },
    { id: 103, answerText: 'C fr', answerTextEn: 'C en', isCorrect: false },
  ],
};
const multi3 = {
  id: 12,
  questionType: 'MULTIPLE_CHOICE',
  questionText: 'Q multiple',
  questionTextEn: 'Multiple Q',
  questionAnswers: [
    { id: 201, answerText: 'A fr', answerTextEn: 'A en', isCorrect: true },
    { id: 202, answerText: 'B fr', answerTextEn: 'B en', isCorrect: true },
    { id: 203, answerText: 'C fr', answerTextEn: 'C en', isCorrect: true },
    { id: 204, answerText: 'D fr', answerTextEn: 'D en', isCorrect: false },
  ],
};
const multi2 = {
  id: 13,
  questionType: 'MULTIPLE_CHOICE',
  questionText: 'Q deux',
  questionAnswers: [
    { id: 301, answerText: 'A', isCorrect: true },
    { id: 302, answerText: 'B', isCorrect: true },
    { id: 303, answerText: 'C', isCorrect: false },
  ],
};
const qroc = {
  id: 14,
  questionType: 'QROC',
  questionText: 'QROC',
  questionAnswers: [{ id: 401, answerText: 'expected', isCorrect: true }],
};
const untouched = {
  id: 15,
  questionType: 'SINGLE_CHOICE',
  questionText: 'Sans réponse',
  questionAnswers: [
    { id: 501, answerText: 'A', isCorrect: true },
    { id: 502, answerText: 'B', isCorrect: false },
  ],
};
const questions = [single, multi3, multi2, qroc, untouched];

// Options as the runner shows them for a question in a language (question-display.tsx)
const optionsIn = (question, language) =>
  localizeQuestion(question, language).answers.map((answer) => ({
    id: String(answer.id),
    text: answer.answerText,
    isCorrect: answer.isCorrect,
  }));

// What the runner stores once "Submit Answer" is clicked (unified-question.tsx + quiz-api-context.tsx)
const submitted = (question, selectedOptions, language = 'fr') => {
  const isMultiple = question.questionType === 'MULTIPLE_CHOICE';
  return {
    questionId: question.id,
    selectedOptions,
    selectedAnswerIds: selectedOptions.map(Number),
    selectedAnswerId: Number(selectedOptions[0]),
    isCorrect: choiceIsCorrect(optionsIn(question, language), selectedOptions, isMultiple),
  };
};

test('each answer is saved with the shape its question type needs', () => {
  assert.deepEqual(submitPayloadFor('SINGLE_CHOICE', 11, submitted(single, ['101'])), { questionId: 11, selectedAnswerId: 101 });
  assert.deepEqual(
    submitPayloadFor('MULTIPLE_CHOICE', 12, submitted(multi3, ['201', '203', '201'])),
    { questionId: 12, selectedAnswerIds: [201, 203] }
  );
  assert.deepEqual(
    submitPayloadFor('QROC', 14, { textAnswer: 'self-assessed-incorrect', isCorrect: false }),
    { questionId: 14, textAnswer: 'self-assessed-incorrect', isCorrect: false }
  );
  // Short type names used by the runner
  assert.deepEqual(submitPayloadFor('QCS', '11', { selectedOptions: ['102'] }), { questionId: 11, selectedAnswerId: 102 });
  assert.deepEqual(submitPayloadFor('QCM', '12', { selectedOptions: ['204'] }), { questionId: 12, selectedAnswerIds: [204] });
  // Nothing to send: no selection, blank text, bookmark only
  assert.equal(submitPayloadFor('SINGLE_CHOICE', 11, { selectedOptions: [] }), null);
  assert.equal(submitPayloadFor('QROC', 14, { textAnswer: '   ' }), null);
  assert.equal(submitPayloadFor('MULTIPLE_CHOICE', 12, { isBookmarked: true }), null);
});

test('finishing sends every given answer once, and nothing for unanswered questions', () => {
  const userAnswers = {
    11: submitted(single, ['101']),
    12: submitted(multi3, ['201', '202']),
    // Bookmarked without an answer
    15: { questionId: 15, isBookmarked: true, timeSpent: 3 },
  };
  const localAnswers = {
    13: submitted(multi2, ['302', '301']),
    14: { questionId: 14, textAnswer: 'self-assessed-correct', isCorrect: true },
    // Stale copy of a question the session answers already hold
    11: { questionId: 11, selectedOptions: ['103'] },
    // Not a question of this session
    99: { questionId: 99, selectedOptions: ['1'] },
  };

  const payloads = collectSubmitPayloads(questions, userAnswers, localAnswers);
  assert.deepEqual(
    [...payloads].sort((a, b) => a.questionId - b.questionId),
    [
      { questionId: 11, selectedAnswerId: 101 },
      { questionId: 12, selectedAnswerIds: [201, 202] },
      { questionId: 13, selectedAnswerIds: [302, 301] },
      { questionId: 14, textAnswer: 'self-assessed-correct', isCorrect: true },
    ]
  );
});

test('coming back to a session restores the saved answers, and finishing sends them unchanged', () => {
  // GET /quiz-sessions/:id answers (isCorrect false is sent as false; older servers left it out)
  const apiAnswers = [
    { questionId: 11, selectedAnswerId: 102, isCorrect: false, answeredAt: '2026-09-28T10:00:00Z' },
    { questionId: 12, selectedAnswerIds: [203, 201], isCorrect: false },
    { questionId: 13, selectedAnswerIds: [301, 302], isCorrect: true },
    { questionId: 14, textAnswer: 'self-assessed-correct', isCorrect: true },
    // A row without a selection is not an answer
    { questionId: 15, selectedAnswerIds: [] },
  ];

  const restored = runnerAnswersFromApi(apiAnswers);
  assert.deepEqual(Object.keys(restored).sort(), ['11', '12', '13', '14']);
  assert.deepEqual(restored['11'].selectedOptions, ['102']);
  assert.equal(restored['11'].isCorrect, false);
  assert.deepEqual(restored['12'].selectedOptions, ['203', '201']);
  assert.equal(restored['13'].isCorrect, true);
  assert.equal(restored['14'].textAnswer, 'self-assessed-correct');

  // The runner resumes with these answers and sends them all again when the student finishes
  const payloads = collectSubmitPayloads(questions, restored, restored);
  assert.deepEqual(
    [...payloads].sort((a, b) => a.questionId - b.questionId),
    [
      { questionId: 11, selectedAnswerId: 102, timeSpent: 0 },
      { questionId: 12, selectedAnswerIds: [203, 201], timeSpent: 0 },
      { questionId: 13, selectedAnswerIds: [301, 302], timeSpent: 0 },
      { questionId: 14, textAnswer: 'self-assessed-correct', isCorrect: true, timeSpent: 0 },
    ]
  );
});

test('several correct answers: only the exact set is correct', () => {
  const options = optionsIn(multi3, 'fr');
  assert.equal(choiceIsCorrect(options, ['201', '202', '203'], true), true);
  assert.equal(choiceIsCorrect(options, ['203', '201', '202', '201'], true), true);
  assert.equal(choiceIsCorrect(options, [201, 202, 203], true), true);
  // Partial selections and an extra wrong answer are incorrect (they only earn partial credit)
  assert.equal(choiceIsCorrect(options, ['201', '202'], true), false);
  assert.equal(choiceIsCorrect(options, ['201'], true), false);
  assert.equal(choiceIsCorrect(options, ['201', '202', '203', '204'], true), false);
  assert.equal(choiceIsCorrect(options, ['204'], true), false);
  // Single choice: any correct answer; a question with no correct answer is never correct
  assert.equal(choiceIsCorrect(optionsIn(single, 'fr'), ['101'], false), true);
  assert.equal(choiceIsCorrect(optionsIn(single, 'fr'), ['102'], false), false);
  assert.equal(choiceIsCorrect([{ id: 1, isCorrect: false }], ['1'], true), false);
});

test('the review page gives each question the verdict the results count', () => {
  // A finished session: results say 2 correct, 3 incorrect, 1 unanswered
  const results = { correctAnswersCount: 2, incorrectAnswersCount: 3, unansweredCount: 1, totalQuestions: 6 };
  const answers = [
    { questionId: 11, selectedAnswerId: 101, isCorrect: true },
    { questionId: 12, selectedAnswerIds: [201, 202], isCorrect: false, partialScore: 0.67 },
    { questionId: 13, selectedAnswerIds: [301, 302], isCorrect: true },
    { questionId: 14, textAnswer: 'self-assessed-incorrect', isCorrect: false },
    // An older server left isCorrect out when it was false
    { questionId: 16, selectedAnswerId: 602 },
  ];
  const sessionQuestions = [11, 12, 13, 14, 15, 16];
  const verdicts = sessionQuestions.map((id) => answerVerdict(answers.find((answer) => answer.questionId === id)));
  assert.deepEqual(verdicts, ['correct', 'incorrect', 'correct', 'incorrect', 'unanswered', 'incorrect']);

  const count = (verdict) => verdicts.filter((value) => value === verdict).length;
  assert.deepEqual(
    {
      correctAnswersCount: count('correct'),
      incorrectAnswersCount: count('incorrect'),
      unansweredCount: count('unanswered'),
      totalQuestions: verdicts.length,
    },
    results
  );

  // An unanswered question is never shown as incorrect
  assert.equal(answerVerdict(undefined), 'unanswered');
  assert.equal(answerVerdict({ questionId: 15, selectedAnswerIds: [], isCorrect: false }), 'unanswered');
  assert.equal(answerVerdict({ questionId: 14, textAnswer: '  ' }), 'unanswered');
  // Selected answers for highlighting
  assert.deepEqual(apiSelectedIds(answers[1]), [201, 202]);
  assert.deepEqual(apiSelectedIds(answers[0]), [101]);
  assert.deepEqual(apiSelectedIds(undefined), []);
});

test('switching between French and English keeps the selection and the verdict', () => {
  for (const question of [single, multi3]) {
    const fr = optionsIn(question, 'fr');
    const en = optionsIn(question, 'en');
    // Same answers, same order, same ids and correct flags; only the texts change
    assert.deepEqual(en.map(({ id, isCorrect }) => ({ id, isCorrect })), fr.map(({ id, isCorrect }) => ({ id, isCorrect })));
    assert.notDeepEqual(en.map((option) => option.text), fr.map((option) => option.text));
  }

  // Options selected in French, submitted after switching to English (and the reverse)
  const partialFr = submitted(multi3, ['201', '202'], 'fr');
  const partialEn = submitted(multi3, ['201', '202'], 'en');
  assert.equal(partialFr.isCorrect, false);
  assert.equal(partialEn.isCorrect, false);
  assert.deepEqual(submitPayloadFor('MULTIPLE_CHOICE', 12, partialEn), submitPayloadFor('MULTIPLE_CHOICE', 12, partialFr));
  assert.equal(submitted(multi3, ['203', '202', '201'], 'en').isCorrect, true);
  assert.equal(submitted(single, ['101'], 'en').isCorrect, true);

  // A question without a full English version stays in French with the same ids
  const noEnglish = localizeQuestion(multi2, 'en');
  assert.equal(noEnglish.displayedLanguage, 'fr');
  assert.deepEqual(noEnglish.answers.map((answer) => answer.id), [301, 302, 303]);
});

test('analytics shows the results-screen numbers of each session', () => {
  // A session as GET /quiz-sessions/type/:type returns it
  const session = {
    id: 7,
    title: 'Cardio',
    type: 'PRACTICE',
    status: 'COMPLETED',
    score: 44.44,
    totalScore20: 8.89,
    correctAnswersCount: 2,
    incorrectAnswersCount: 3,
    unansweredCount: 1,
    totalQuestions: 6,
  };
  assert.deepEqual(analyticsStatsFrom(session), {
    totalQuestions: 6,
    answeredCorrect: 2,
    answeredWrong: 3,
    unanswered: 1,
    accuracy: '44.44%',
    scoreOutOf20: 8.89,
  });

  // A session nobody has answered yet
  assert.deepEqual(analyticsStatsFrom({ score: 0, totalQuestions: 3, correctAnswersCount: 0, incorrectAnswersCount: 0, unansweredCount: 3, totalScore20: 0 }), {
    totalQuestions: 3,
    answeredCorrect: 0,
    answeredWrong: 0,
    unanswered: 3,
    accuracy: '0%',
    scoreOutOf20: 0,
  });
});
