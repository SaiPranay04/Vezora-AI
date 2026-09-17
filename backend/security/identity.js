import { AsyncLocalStorage } from 'node:async_hooks';
export const identities = new AsyncLocalStorage();
export function identity() {
  const value = identities.getStore();
  if (!value?.userId || !value?.sessionId) throw new Error('Authenticated session required');
  return value;
}
