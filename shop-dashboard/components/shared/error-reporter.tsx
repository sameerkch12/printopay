'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/api';
import { TOKEN_KEY } from '@/lib/constants';

function sendError(error: unknown, metadata?: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) ?? undefined : undefined;

  reportClientError({
    message,
    stack,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    severity: 'error',
    metadata,
  }, token).catch(() => undefined);
}

export function ErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      sendError(event.error ?? event.message, {
        type: 'window.error',
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      sendError(event.reason, { type: 'unhandledrejection' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
