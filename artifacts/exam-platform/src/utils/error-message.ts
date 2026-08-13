import axios, { type AxiosError } from 'axios';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Some fields are invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
};

type FetchApiError = Error & {
  name: 'ApiError';
  status: number;
  data: unknown;
  headers?: Headers;
};

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== 'string') return undefined;
  const trimmed = candidate.trim();
  return trimmed === '' ? undefined : trimmed;
}

function extractValidationMessages(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;

  for (const key of ['validation', 'issues'] as const) {
    const items = (data as Record<string, unknown>)[key];
    if (!Array.isArray(items)) continue;

    const messages = items
      .map((item) => {
        if (!item || typeof item !== 'object') return undefined;
        return getStringField(item, 'message');
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join('. ');
    }
  }

  return undefined;
}

/** Pull a user-facing message from an API error response body. */
export function extractMessageFromBody(data: unknown): string | undefined {
  const validationMessage = extractValidationMessages(data);
  if (validationMessage) return validationMessage;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed ? sanitizeErrorMessage(trimmed) : undefined;
  }

  if (!data || typeof data !== 'object') return undefined;

  const title = getStringField(data, 'title');
  const detail = getStringField(data, 'detail');
  const message =
    getStringField(data, 'message') ??
    getStringField(data, 'error_description') ??
    getStringField(data, 'error');

  if (title && detail) return `${title}: ${detail}`;
  if (detail) return detail;
  if (message) return message;
  if (title) return title;

  return undefined;
}

const STACK_TRACE_PATTERN = /\bat\s+.+\(.+\:\d+\:\d+\)/;
const FILE_LINE_PATTERN = /\.(?:ts|tsx|js|jsx|mjs|cjs)\:\d+/i;
const HTTP_PREFIX_PATTERN = /^HTTP \d{3}(?:\s+[A-Za-z ]+)?\:\s*/;

function isTechnicalMessage(message: string): boolean {
  if (STACK_TRACE_PATTERN.test(message)) return true;
  if (FILE_LINE_PATTERN.test(message)) return true;
  if (message.includes('\n    at ')) return true;
  return false;
}

/** Strip HTTP prefixes, stack traces, and other non-user-facing noise. */
export function sanitizeErrorMessage(message: string): string {
  let text = message.trim().replace(HTTP_PREFIX_PATTERN, '');

  if (text.includes('\n')) {
    const firstLine = text.split('\n')[0]?.trim() ?? '';
    text = isTechnicalMessage(firstLine) ? '' : firstLine;
  }

  text = text.replace(/^Error:\s*/, '').trim();

  if (!text || isTechnicalMessage(text)) {
    return DEFAULT_MESSAGE;
  }

  return text;
}

function isFetchApiError(err: unknown): err is FetchApiError {
  return (
    err instanceof Error &&
    err.name === 'ApiError' &&
    'status' in err &&
    typeof (err as FetchApiError).status === 'number'
  );
}

function messageForStatus(status: number, fallback = DEFAULT_MESSAGE): string {
  return STATUS_MESSAGES[status] ?? fallback;
}

function getHeader(headers: unknown, name: string): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined;
  }
  if (!headers || typeof headers !== 'object') return undefined;

  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function formatRetryDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** Build a clear rate-limit toast message, including retry timing when available. */
export function formatRateLimitMessage(data: unknown, headers?: unknown): string {
  const retryAfterHeader = getHeader(headers, 'retry-after');
  if (retryAfterHeader) {
    const seconds = Number.parseInt(retryAfterHeader, 10);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return `You're sending requests too quickly. Please wait ${formatRetryDuration(seconds)} before trying again.`;
    }
  }

  const retryAfter =
    getStringField(data, 'retryAfter') ??
    getStringField(data, 'after');
  if (retryAfter) {
    return `You're sending requests too quickly. Please wait ${retryAfter} before trying again.`;
  }

  if (data && typeof data === 'object' && 'expiresIn' in data) {
    const expiresIn = Number((data as Record<string, unknown>).expiresIn);
    if (!Number.isNaN(expiresIn) && expiresIn > 0) {
      const seconds = Math.ceil(expiresIn / 1000);
      return `You're sending requests too quickly. Please wait ${formatRetryDuration(seconds)} before trying again.`;
    }
  }

  const fromBody = extractMessageFromBody(data);
  if (fromBody && !/^too many requests$/i.test(fromBody)) {
    const legacyMatch = fromBody.match(/retry in (.+)$/i);
    if (legacyMatch?.[1]) {
      return `You're sending requests too quickly. Please wait ${legacyMatch[1]} before trying again.`;
    }
    return fromBody;
  }

  return STATUS_MESSAGES[429] ?? DEFAULT_MESSAGE;
}

/** Convert any thrown value into a short, user-friendly toast message. */
export function getErrorMessage(err: unknown, fallback = DEFAULT_MESSAGE): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: string; message?: string; requestId?: string }>;
    const status = axiosErr.response?.status ?? 0;

    if (status === 429) {
      return formatRateLimitMessage(axiosErr.response?.data, axiosErr.response?.headers);
    }

    const fromBody = extractMessageFromBody(axiosErr.response?.data);

    if (fromBody) return sanitizeErrorMessage(fromBody);
    if (status > 0) return messageForStatus(status, fallback);

    const networkMessage = axiosErr.message?.trim();
    if (networkMessage && !isTechnicalMessage(networkMessage)) {
      return sanitizeErrorMessage(networkMessage);
    }

    return fallback;
  }

  if (isFetchApiError(err)) {
    if (err.status === 429) {
      return formatRateLimitMessage(err.data, err.headers);
    }

    const fromBody = extractMessageFromBody(err.data);
    if (fromBody) return sanitizeErrorMessage(fromBody);
    if (err.status > 0) return messageForStatus(err.status, fallback);
    return sanitizeErrorMessage(err.message) || fallback;
  }

  if (err instanceof Error) {
    return sanitizeErrorMessage(err.message) || fallback;
  }

  return fallback;
}
