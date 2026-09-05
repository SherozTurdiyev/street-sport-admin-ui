import { Alert, Card, Descriptions, Skeleton } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { displayPhone } from '@/shared/format/phone';
import { formatDate } from '@/shared/format/time';
import { useOrganization } from './hooks';
import { CashThresholdCard } from './CashThresholdCard';

const NONE = '—';

export function OrganizationPage() {
  const { data, isPending, error } = useOrganization();

  if (error)
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  if (isPending) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card title={data.name}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Telefon">
            {displayPhone(data.phone)}
          </Descriptions.Item>
          <Descriptions.Item label="Manzil">
            {data.address ?? NONE}
          </Descriptions.Item>
          <Descriptions.Item label="Vaqt mintaqasi">
            {data.timezone}
          </Descriptions.Item>
          <Descriptions.Item label="Valyuta">{data.currency}</Descriptions.Item>
          <Descriptions.Item label="Obuna">
            {data.subscriptionStatus}
          </Descriptions.Item>
          <Descriptions.Item label="Obuna tugaydi">
            {formatDate(data.subscriptionEndsAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <CashThresholdCard value={data.cashMismatchThreshold} />
    </div>
  );
}
