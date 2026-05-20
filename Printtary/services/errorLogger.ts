import { getApiBaseUrl } from './apiConfig';

type ClientUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export function reportClientError(input: {
  message: string;
  stack?: string;
  path?: string;
  severity?: 'info' | 'warning' | 'error' | 'fatal';
  metadata?: unknown;
  user?: ClientUser;
}) {
  return fetch(`${getApiBaseUrl()}/errors/client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'customer_app',
      severity: input.severity ?? 'error',
      message: input.message,
      stack: input.stack,
      path: input.path,
      metadata: input.metadata,
      user: input.user,
    }),
  }).catch(() => undefined);
}
