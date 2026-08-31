import { useSyncExternalStore } from 'react';
import { Alert } from 'antd';
import {
  subscribeSubscription,
  subscriptionMessage,
} from '@/shared/api/subscription';

export function SubscriptionBanner() {
  const text = useSyncExternalStore(subscribeSubscription, subscriptionMessage);
  if (text === null) return null;

  // Matn backenddan keladi: to'lov shartlari o'zgarsa, xabar ham
  // frontendga tegmasdan o'zgaradi.
  return <Alert banner type="warning" showIcon message={text} />;
}
