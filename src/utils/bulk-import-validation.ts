import { BulkImportFile, ImportQuestion, ValidationResult, ValidationError } from '@/types/question-import';

/**
 * Validates a single JSON file for bulk import
 */
export async function validateBulkImportFile(file: BulkImportFile): Promise<{
  isValid: boolean;
  validationResult: ValidationResult;
  parsedQuestions?: ImportQuestion[];
}> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let questions: ImportQuestion[] = [];
  let questionCount = 0;

  try {
    // Read file content
    const fileContent = await readFileAsText(file.file);
    
    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch (parseError) {
      errors.push({
        field: 'file',
        message: `Invalid JSON format in file "${file.filename}"`
      });
      return {
        isValid: false,
        validationResult: { isValid: false, errors, warnings, questionCount: 0 }
      };
    }

    // Handle both formats: direct array or object with questions property
    if (Array.isArray(parsed)) {
      // Format 1: Direct array of questions
      questions = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
      // Format 2: Object with questions array property
      questions = parsed.questions;
    } else {
      errors.push({
        field: 'root',
        message: `File "${file.filename}" must contain either a JSON array of questions or an object with a "questions" array property`
      });
      return {
        isValid: false,
        validationResult: { isValid: false, errors, warnings, questionCount: 0 }
      };
    }

    questionCount = questions.length;

    // Check if questions array is empty
    if (questionCount === 0) {
      errors.push({
        field: 'questions',
        message: `File "${file.filename}" contains no questions`
      });
      return {
        isValid: false,
        validationResult: { isValid: false, errors, warnings, questionCount: 0 }
      };
    }

    // Validate each question
    questions.forEach((question, questionIndex) => {
      validateQuestion(question, questionIndex, file.filename, errors, warnings);
    });

    // Check if exam year is missing
    if (!file.examYear) {
      errors.push({
        field: 'examYear',
        message: `Exam year not detected for file "${file.filename}". Please set it manually.`
      });
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      validationResult: { isValid, errors, warnings, questionCount },
      parsedQuestions: isValid ? questions : undefined
    };

  } catch (error) {
    errors.push({
      field: 'file',
      message: `Error reading file "${file.filename}": ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    return {
      isValid: false,
      validationResult: { isValid: false, errors, warnings, questionCount: 0 }
    };
  }
}

/**
 * Validates a single question object
 */
function validateQuestion(
  question: any,
  questionIndex: number,
  filename: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const questionPrefix = `Question ${questionIndex + 1} in "${filename}"`;

  // Check required fields
  if (!question.questionText || typeof question.questionText !== 'string') {
    errors.push({
      field: 'questionText',
      message: `${questionPrefix}: questionText is required and must be a string`,
      questionIndex
    });
  }

  if (!question.questionType || !['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question.questionType)) {
    errors.push({
      field: 'questionType',
      message: `${questionPrefix}: questionType must be either "SINGLE_CHOICE" or "MULTIPLE_CHOICE"`,
      questionIndex
    });
  }

  if (!Array.isArray(question.answers)) {
    errors.push({
      field: 'answers',
      message: `${questionPrefix}: answers must be an array`,
      questionIndex
    });
    return; // Can't validate answers if it's not an array
  }

  // Validate answers
  if (question.answers.length < 2) {
    errors.push({
      field: 'answers',
      message: `${questionPrefix}: must have at least 2 answers`,
      questionIndex
    });
  }

  let correctAnswerCount = 0;
  question.answers.forEach((answer: any, answerIndex: number) => {
    const answerPrefix = `${questionPrefix}, Answer ${answerIndex + 1}`;

    if (!answer.answerText || typeof answer.answerText !== 'string') {
      errors.push({
        field: 'answerText',
        message: `${answerPrefix}: answerText is required and must be a string`,
        questionIndex,
        answerIndex
      });
    }

    if (typeof answer.isCorrect !== 'boolean') {
      errors.push({
        field: 'isCorrect',
        message: `${answerPrefix}: isCorrect must be a boolean`,
        questionIndex,
        answerIndex
      });
    } else if (answer.isCorrect) {
      correctAnswerCount++;
    }

    // explanation is optional but should be string if provided
    if (answer.explanation !== undefined && typeof answer.explanation !== 'string') {
      warnings.push({
        field: 'explanation',
        message: `${answerPrefix}: explanation should be a string if provided`,
        questionIndex,
        answerIndex
      });
    }
  });

  // Validate correct answer count based on question type
  if (question.questionType === 'SINGLE_CHOICE' && correctAnswerCount !== 1) {
    errors.push({
      field: 'answers',
      message: `${questionPrefix}: SINGLE_CHOICE questions must have exactly 1 correct answer, found ${correctAnswerCount}`,
      questionIndex
    });
  } else if (question.questionType === 'MULTIPLE_CHOICE' && correctAnswerCount < 1) {
    errors.push({
      field: 'answers',
      message: `${questionPrefix}: MULTIPLE_CHOICE questions must have at least 1 correct answer`,
      questionIndex
    });
  }

  // Check explanation field (optional)
  if (question.explanation !== undefined && typeof question.explanation !== 'string') {
    warnings.push({
      field: 'explanation',
      message: `${questionPrefix}: explanation should be a string if provided`,
      questionIndex
    });
  }
}

/**
 * Validates all files in a bulk import
 */
export async function validateAllFiles(files: BulkImportFile[]): Promise<BulkImportFile[]> {
  const validatedFiles: BulkImportFile[] = [];

  for (const file of files) {
    const updatedFile = { ...file, status: 'validating' as const };
    
    try {
      const validation = await validateBulkImportFile(file);
      
      validatedFiles.push({
        ...updatedFile,
        isValid: validation.isValid,
        validationResult: validation.validationResult,
        parsedQuestions: validation.parsedQuestions,
        status: validation.isValid ? 'valid' : 'invalid'
      });
    } catch (error) {
      validatedFiles.push({
        ...updatedFile,
        isValid: false,
        status: 'invalid',
        error: error instanceof Error ? error.message : 'Validation failed',
        validationResult: {
          isValid: false,
          errors: [{
            field: 'file',
            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          warnings: [],
          questionCount: 0
        }
      });
    }
  }

  return validatedFiles;
}

/**
 * Checks if all files are valid and ready for import
 */
export function areAllFilesValid(files: BulkImportFile[]): boolean {
  return files.length > 0 && files.every(file => 
    file.isValid && 
    file.examYear !== undefined && 
    file.parsedQuestions && 
    file.parsedQuestions.length > 0
  );
}

/**
 * Gets summary of validation results
 */
export function getValidationSummary(files: BulkImportFile[]): {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  totalQuestions: number;
  filesWithoutYear: number;
} {
  const totalFiles = files.length;
  const validFiles = files.filter(f => f.isValid).length;
  const invalidFiles = files.filter(f => !f.isValid).length;
  const totalQuestions = files.reduce((sum, f) => sum + (f.validationResult?.questionCount || 0), 0);
  const filesWithoutYear = files.filter(f => !f.examYear).length;

  return {
    totalFiles,
    validFiles,
    invalidFiles,
    totalQuestions,
    filesWithoutYear
  };
}

/**
 * Helper function to read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}
