export const KDS_ACCESS_BLOCKED_MESSAGE =
  'Access blocked. You do not have permission for this action.';

type KdsAction = 'proceed' | 'cancel' | 'complete' | 'load';

const ACTION_LABEL: Record<KdsAction, string> = {
  proceed: 'send orders to the kitchen',
  cancel: 'cancel orders',
  complete: 'mark orders complete',
  load: 'view KDS orders',
};

function messageFromBody(error: unknown, status: number, action: KdsAction): string {
  if (status === 403) {
    if (typeof error === 'string' && /access blocked/i.test(error)) {
      return error;
    }
    return `Access blocked. You do not have permission to ${ACTION_LABEL[action]}.`;
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Request failed';
}

/** Parse a failed `fetch` response for KDS actions. */
export async function kdsFetchErrorMessage(
  res: Response,
  action: KdsAction
): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: unknown };
  return messageFromBody(body.error, res.status, action);
}

/** Parse axios (or similar) errors for KDS actions. */
export function kdsAxiosErrorMessage(
  err: unknown,
  action: KdsAction,
  fallback?: string
): string {
  const ax = err as {
    response?: { status?: number; data?: { error?: unknown } };
  };
  const status = ax.response?.status;
  const dataError = ax.response?.data?.error;
  if (status != null) {
    return messageFromBody(dataError, status, action);
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback ?? 'Request failed';
}
