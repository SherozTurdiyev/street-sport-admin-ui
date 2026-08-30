/**
 * Obuna tugagani BUTUN ilovaga tegishli, shuning uchun holat react-query
 * keshida emas, alohida kichik do'konda: uni axios interceptor'i
 * o'rnatadi, React esa `useSyncExternalStore` orqali o'qiydi.
 *
 * Sababi: 402 istalgan so'rovdan kelishi mumkin va uni ushlagan komponent
 * bannerni ko'rsatadigan komponent bo'lishi shart emas.
 */
type Listener = () => void;

let message: string | null = null;
const listeners = new Set<Listener>();

function set(next: string | null): void {
  if (next === message) return;
  message = next;
  for (const listener of listeners) listener();
}

export function markSubscriptionExpired(text: string): void {
  set(text);
}

export function clearSubscriptionExpired(): void {
  set(null);
}

export function subscriptionMessage(): string | null {
  return message;
}

export function subscribeSubscription(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
