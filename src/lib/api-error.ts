/**
 * Human-readable message for anything a failed API call can throw:
 * - the apiClient rejection `{ success: false, error, statusCode, details? }`,
 * - an Axios error (`error.response.data` holds the backend body),
 * - a backend error body `{ success: false, error: { message, details } }`,
 * - an Error, a string, or any object with a `message`.
 * Validation details from the backend (`details.errors` / `details.fieldErrors` / Zod issues)
 * are appended when the message does not already contain them.
 */

type FieldIssue = { field?: unknown; path?: unknown; message?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function issueList(details: unknown): FieldIssue[] {
  if (Array.isArray(details)) return details.filter(isRecord) as FieldIssue[];
  if (!isRecord(details)) return [];
  for (const key of ['errors', 'fieldErrors', 'issues']) {
    const list = details[key];
    if (Array.isArray(list)) return list.filter(isRecord) as FieldIssue[];
  }
  return [];
}

/** "field: message; field: message" from backend validation details, or '' when there are none. */
export function formatValidationDetails(details: unknown): string {
  return issueList(details)
    .map((issue) => {
      const field = nonEmpty(issue.field)
        ? issue.field
        : Array.isArray(issue.path) ? issue.path.join('.') : '';
      const message = nonEmpty(issue.message) ? issue.message : '';
      if (!message) return '';
      return field && field !== 'root' ? `${field}: ${message}` : message;
    })
    .filter(Boolean)
    .join('; ');
}

/** Message and details from a backend body: { error: string | { message, details } } or { message }. */
function fromBody(body: unknown): { message?: string; details?: unknown } {
  if (nonEmpty(body)) return { message: body };
  if (!isRecord(body)) return {};
  const error = body.error;
  if (nonEmpty(error)) return { message: error, details: body.details };
  if (isRecord(error)) {
    return {
      message: nonEmpty(error.message) ? error.message : undefined,
      details: error.details ?? body.details,
    };
  }
  return {
    message: nonEmpty(body.message) ? body.message : nonEmpty(body.detail) ? body.detail : undefined,
    details: body.details,
  };
}

function withDetails(message: string | undefined, details: unknown): string | undefined {
  const formatted = formatValidationDetails(details);
  if (!formatted) return message;
  if (!message) return formatted;
  // The backend's own validation message often already lists the fields
  if (message.includes(formatted) || formatted.split('; ').every((part) => message.includes(part))) {
    return message;
  }
  return `${message}: ${formatted}`;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (nonEmpty(error)) return error;
  if (!isRecord(error)) return fallback;

  // Axios error with a response body
  const response = error.response;
  if (isRecord(response) && response.data !== undefined) {
    const { message, details } = fromBody(response.data);
    const text = withDetails(message, details);
    if (text) return text;
  }

  // apiClient rejection ({ success: false, error: string, details? }) or a raw backend body
  const { message, details } = fromBody(error);
  const text = withDetails(message, details);
  if (text) return text;

  if (error instanceof Error && nonEmpty(error.message)) return error.message;
  return fallback;
}
